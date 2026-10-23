import json
import sqlite3
import zipfile

import pandas as pd
import pytest

from veil.sensitivity import outcome, rollup
from veil import sensitivity
from cube_builders import veil_comparison


def test_race_rules_keep_ties_and_mixed_stops_distinct():
    stops = pd.DataFrame({"n_black": [0, 1, 2, 2, 1], "party_size": [1, 2, 3, 2, 1]})
    assert outcome(stops, "any_black").tolist() == [0, 1, 1, 1, 1]
    assert outcome(stops, "majority_black").tolist() == [0, 0, 1, 1, 1]
    assert outcome(stops, "all_black").tolist() == [0, 0, 0, 1, 1]


def test_rollup_does_not_discard_other_races_or_children_before_counting():
    df = pd.DataFrame({
        "datetimeoccur": ["2025-06-01T23:00:00Z"] * 3, "location": ["A"] * 3,
        "ts_local": [pd.Timestamp("2025-06-01 19:00")] * 3,
        "districtoccur": [2.] * 3, "psa": [1.] * 3, "assigned_unit": ["2ND"] * 3,
        "objectid": [1, 2, 3], "race": ["Black - Non-Latino", "White - Non-Latino", "Asian"],
        "age": [25, 30, 16], "gender": ["Male", "Female", "Male"], "mvc_code": ["NA", "", ""],
    })
    stop = rollup(df).iloc[0]
    assert stop.party_size == 3
    assert stop.n_black == stop.n_white == 1
    assert stop.complete_adult == 0
    assert stop.is_mvc == 1  # Literal NA remains a recorded code.
    assert stop.police_area == "02-1"


@pytest.mark.parametrize("last_dt,expected", [
    ("2026-07-04T10:00:00Z", 2025),
    ("2027-01-01T03:00:00Z", 2025),  # Still December 31 locally.
    ("2027-01-01T06:00:00Z", 2026),
])
def test_comparison_year_ceiling_comes_from_local_archive_date(tmp_path, last_dt, expected):
    archive = tmp_path / "backup.zip"
    with zipfile.ZipFile(archive, "w") as zf:
        zf.writestr("csvs/car_ped_stops/summary.json", json.dumps({"last_dt": last_dt}))
    assert sensitivity.archive_end_year(archive) == expected


def test_each_sensitivity_uses_its_occupancy_and_code_rule(monkeypatch):
    base = pd.DataFrame({
        "party_size": [1, 1, 2, 3, 2], "n_black": [1, 0, 1, 2, 2],
        "has_mvc": [1, 0, 0, 1, 1],
    })
    monkeypatch.setattr(sensitivity, "prepare_sample", lambda stops, universe, year: base.copy())
    samples = []

    def fit(sample, outcome_key, period_key):
        samples.append(sample.copy())
        return {"converged": True, "n": len(sample)}

    monkeypatch.setattr(sensitivity, "fit_group_darkness_difference", fit)
    fits = list(sensitivity.fit_specs(base, ["black_white"]))
    assert len(fits) == 8
    assert [f["result"]["n"] for f in fits] == [1, 2, 3, 5, 3, 5, 3, 5]
    # A mixed 50/50 stop survives the majority specification as outcome zero.
    assert samples[5].outcome.tolist() == [1, 0, 0, 1, 1]
    assert samples[7].outcome.tolist() == [1, 0, 0, 0, 1]
    assert fits[5]["half_black_stops"] == 1
    assert fits[1]["key"] == sensitivity.MAIN_KEY


def test_cube_builder_uses_archive_metadata_and_selects_no_code_main(monkeypatch):
    with sqlite3.connect(":memory:") as conn:
        pd.DataFrame({"party_size": [1]}).to_sql("car_ped_stops_veil_comparison", conn)
        pd.DataFrame([{"end_year": 2026, "source_archive": "future.zip"}]).to_sql("veil_comparison_metadata", conn)
        main = {"converged": True, "n": 123}
        fits = [{"key": sensitivity.MAIN_KEY, "result": main},
                {"key": "black_white/sole/any_black/mvc", "result": {"n": 100}}]

        def fit_specs(stops, universes, *, end_year):
            assert universes == ["black_white", "all_races"]
            assert end_year == 2026
            assert stops.party_size.tolist() == [1]
            return iter(fits)

        monkeypatch.setattr(veil_comparison, "fit_specs", fit_specs)
        cube, extra = veil_comparison.build(conn)
    assert cube["main"] == main
    assert cube["sensitivity"] == fits
    assert cube["years"][-1] == 2026
    assert 2020 not in cube["years"]
    assert cube["window_end"] == "2026-12-31"
    assert cube["source_archive"] == "future.zip"
    assert extra == {}

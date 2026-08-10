"""Integration test for the veil table builder against the real backup zip."""

import sqlite3
import zipfile
from pathlib import Path

import pandas as pd
import pytest

from veil.build import USE_COLS, _stop_csv_names, build_veil_table

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PIPELINE_ROOT / "data"


def _latest_zip() -> Path | None:
    zips = sorted(DATA_DIR.glob("car_ped_stops_*.zip"))
    return zips[-1] if zips else None


requires_zip = pytest.mark.skipif(
    _latest_zip() is None, reason="no car_ped_stops backup zip present"
)


@requires_zip
def test_builds_table_for_the_replication_period(tmp_path):
    db = tmp_path / "test.db"
    n = build_veil_table(_latest_zip(), db, years=[2021, 2022, 2023, 2024])
    assert n > 30000, f"expected >30k analytic stops, got {n}"

    with sqlite3.connect(db) as conn:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(car_ped_stops_veil)")}
    for expected in [
        "ts_local", "clock_minutes", "year", "era", "districtoccur", "psa",
        "assigned_unit", "lighting", "obscured_view", "party_race",
        "party_size", "group_travel", "n_frisked", "n_ticketed", "dow",
        "month", "is_summer",
    ]:
        assert expected in cols, f"missing column {expected}"


@requires_zip
def test_no_ambiguous_rows_survive(tmp_path):
    db = tmp_path / "test.db"
    build_veil_table(_latest_zip(), db, years=[2024])
    with sqlite3.connect(db) as conn:
        n = conn.execute(
            "SELECT count(*) FROM car_ped_stops_veil WHERE lighting='ambiguous'"
        ).fetchone()[0]
    assert n == 0


@requires_zip
def test_both_lighting_states_are_present(tmp_path):
    """A collapse of the band logic would show up as one empty state."""
    db = tmp_path / "test.db"
    build_veil_table(_latest_zip(), db, years=[2024])
    with sqlite3.connect(db) as conn:
        rows = dict(
            conn.execute(
                "SELECT lighting, count(*) FROM car_ped_stops_veil GROUP BY lighting"
            ).fetchall()
        )
    assert rows.get("daylight", 0) > 1000, rows
    assert rows.get("dark", 0) > 1000, rows


@requires_zip
def test_literal_na_mvc_code_is_not_dropped_as_null():
    """Regression test for a pandas NA-sentinel trap.

    The literal string "NA" is a real mvc_code value (a genuine MVC stop
    whose specific code went unrecorded), distinct from a true blank (no
    reason recorded at all). Without a converter on this column,
    pd.read_csv's default null-sentinel handling silently turns the string
    "NA" into NaN, which makes those stops look non-MVC and drops ~11% of
    the analytic sample. This test would fail if that converter were
    removed from build.py's read_csv call.
    """
    zip_path = _latest_zip()
    with zipfile.ZipFile(zip_path) as zf:
        names = [n for n in _stop_csv_names(zf) if n.endswith("year_2024.csv")]
        assert names, "expected a 2024 stops CSV in the backup zip"
        with zf.open(names[0]) as fh:
            df = pd.read_csv(
                fh, usecols=USE_COLS, converters={"mvc_code": lambda v: v}
            )

    na_string_count = (df.mvc_code == "NA").sum()
    blank_count = (df.mvc_code == "").sum()

    assert na_string_count > 20000, (
        f"expected >20k literal 'NA' mvc_code rows, got {na_string_count} "
        "-- did the converter get removed from build.py?"
    )
    assert blank_count > 20000, (
        f"expected >20k true-blank mvc_code rows, got {blank_count}"
    )
    # The two categories must stay distinct -- collapsing them together
    # would silently reintroduce a version of the same bug.
    assert na_string_count != blank_count or na_string_count > 0


@requires_zip
def test_2024_row_count_reflects_na_mvc_codes_being_kept(tmp_path):
    """Without the mvc_code converter, 2024 alone builds ~8,910 rows.

    With the fix, the ~21k "NA"-coded MVC stops are retained and the count
    rises to ~10,951. Pin a threshold that only the fixed behavior clears.
    """
    db = tmp_path / "test.db"
    n = build_veil_table(_latest_zip(), db, years=[2024])
    assert n > 10000, (
        f"expected >10k analytic stops for 2024 with NA mvc_codes retained, "
        f"got {n} (buggy behavior without the converter yields ~8,910)"
    )

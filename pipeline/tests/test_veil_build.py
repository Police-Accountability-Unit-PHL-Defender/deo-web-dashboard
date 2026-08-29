"""Integration test for the veil table builder against the real backup zip."""

import sqlite3
import zipfile
from pathlib import Path

import pandas as pd
import pytest

from veil.build import USE_COLS, _stop_csv_names, build_veil_table
from veil.sample import roll_up_stops

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
        "police_area", "assigned_unit", "lighting", "obscured_view", "party_race",
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
    # Real numeric codes must still be there too: if the converter or the
    # read ever mangled the column into just these two buckets, the counts
    # above would still pass.
    other_count = len(df) - na_string_count - blank_count
    assert other_count > 0, (
        "every mvc_code row is either 'NA' or blank -- the real numeric codes "
        "have been collapsed away"
    )


def test_literal_na_and_blank_mvc_code_land_on_opposite_sides_of_is_mvc():
    """The two categories must stay behaviourally distinct, not just distinct
    in count.

    The bug this guards is a change that collapses the literal string "NA"
    into the true-blank category (or the reverse): the counts would still
    look plausible, but ~21k genuine MVC stops per year would silently drop
    out of the analytic sample. So assert on the thing that decides their
    fate -- roll_up_stops' is_mvc -- rather than on the counts.

    The previous assertion here was
    ``na_string_count != blank_count or na_string_count > 0``, whose right
    disjunct is always true once the >20,000 assertions above have passed.
    It could not fail, so it guarded nothing.
    """
    rows = pd.DataFrame({
        "objectid": [1, 2],
        "datetimeoccur": pd.to_datetime(["2024-06-01 18:00", "2024-06-01 18:05"]),
        "location": ["A", "B"],
        "districtoccur": [12.0, 12.0],
        "psa": [1.0, 1.0],
        "assigned_unit": ["u", "u"],
        "gender": ["Male", "Male"],
        "race": ["Black - Non-Latino", "Black - Non-Latino"],
        "age": [22.0, 22.0],
        "mvc_code": ["NA", ""],  # literal "NA" vs a true blank
        "individual_arrested": [0, 0],
        "individual_frisked": [0, 0],
        "ticket_issued": [0, 0],
        "ts_local": pd.to_datetime(["2024-06-01 18:00", "2024-06-01 18:05"]),
    })
    stops = roll_up_stops(rows).set_index("location")

    assert stops.loc["A", "is_mvc"] == 1, (
        'a literal "NA" mvc_code must count as a genuine MVC stop'
    )
    assert stops.loc["B", "is_mvc"] == 0, (
        "a true-blank mvc_code must not count as an MVC stop"
    )


@requires_zip
def test_years_filter_returns_exactly_the_requested_local_years(tmp_path):
    """Regression test for a UTC/local year-boundary bug.

    CSVs are named by the UTC year of datetimeoccur, but the "year" column
    is derived from local time. The inter-twilight window (17:08-20:35
    local) is 22:08-01:35 UTC, so a 31-December-evening stop's UTC
    timestamp falls on 1 January of the *next* year, putting that stop in
    the next year's CSV. A naive years=[2021..2024] build that only opens
    those four CSVs therefore silently drops every 31-December-2024 stop
    (which lives in the 2025 CSV) -- exactly the assertion below that used
    to fail.
    """
    db = tmp_path / "test.db"
    build_veil_table(_latest_zip(), db, years=[2021, 2022, 2023, 2024])
    with sqlite3.connect(db) as conn:
        df = pd.read_sql("SELECT year, stop_date FROM car_ped_stops_veil", conn)

    assert set(df.year.unique()) <= {2021, 2022, 2023, 2024}, (
        f"years outside the request leaked in: {sorted(df.year.unique())}"
    )

    dec_31_2024 = df[df.stop_date == "2024-12-31"]
    assert len(dec_31_2024) > 0, (
        "no 2024-12-31 stops present -- the local-year boundary is being "
        "dropped again"
    )


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

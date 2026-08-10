"""Integration test for the veil table builder against the real backup zip."""

import os
import sqlite3
from pathlib import Path

import pytest

from veil.build import build_veil_table

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

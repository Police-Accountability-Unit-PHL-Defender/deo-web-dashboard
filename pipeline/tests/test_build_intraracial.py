"""Tests for the intraracial stop table.

Sole-occupant stops only, retaining the occupant's age, gender and race --
which the existing car_ped_stops_veil table discards at roll-up.
"""

import sqlite3
from pathlib import Path

import pandas as pd
import pytest

from veil.build_intraracial import TABLE_INTRARACIAL, build_intraracial_table

REPO = Path(__file__).resolve().parents[1]
ZIP = REPO / "data" / "car_ped_stops_2026-07-20T03_45_06.zip"


@pytest.fixture(scope="module")
def built(tmp_path_factory):
    if not ZIP.exists():
        pytest.skip(f"{ZIP} not present")
    db = tmp_path_factory.mktemp("db") / "test.db"
    n = build_intraracial_table(ZIP, db)
    with sqlite3.connect(db) as conn:
        df = pd.read_sql(f"SELECT * FROM {TABLE_INTRARACIAL}", conn)
    return n, df


def test_writes_rows(built):
    n, df = built
    assert n > 0 and len(df) == n


def test_retains_age_gender_and_race(built):
    # The whole point of this table: the columns the existing one drops.
    _, df = built
    for col in ("age", "gender", "race"):
        assert col in df.columns, col
        assert df[col].notna().any(), f"{col} is entirely null"


def test_no_stop_appears_twice(built):
    # One row per stop. `.any()`, not `.all()` -- `.all()` would only fail if
    # EVERY row were a duplicate, which is never true and tests nothing.
    _, df = built
    assert not df.duplicated(subset=["ts_local", "location"]).any()


def test_ages_are_plausible_adult_and_juvenile_mix(built):
    _, df = built
    assert df.age.min() >= 0
    assert df.age.max() < 120
    assert (df.age >= 30).any(), "no older drivers -- the roll-up is over-filtering"
    assert (df.gender.str.lower() == "female").any(), "no women -- over-filtering"


def test_carries_lighting_and_police_area(built):
    _, df = built
    assert set(df.lighting.unique()) <= {"daylight", "dark", "ambiguous"}
    assert df.police_area.str.contains("-").all()


def test_is_mvc_carries_both_values(built):
    # Restrictions downstream filter on it. A column that is constantly 0 or
    # constantly 1 means the source column name changed and the derivation
    # silently collapsed -- `<= {0, 1}` would not catch that, so assert both
    # values actually occur.
    _, df = built
    assert set(df.is_mvc.unique()) == {0, 1}

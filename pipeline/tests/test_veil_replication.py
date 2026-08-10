"""Pin the published quantities from Hannon & Biddle (2026).

Tolerances are wide (10%) because OpenDataPhilly revises records and our
backup postdates the authors' download by years. They are tight enough to
catch a structural break -- a bad dedup key, a dropped restriction, a
lighting inversion -- which is the point.
"""

import sqlite3
from pathlib import Path

import pandas as pd
import pytest

from veil.build import build_veil_table

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
REPLICATION_YEARS = [2021, 2022, 2023, 2024]


def _latest_zip() -> Path | None:
    zips = sorted((PIPELINE_ROOT / "data").glob("car_ped_stops_*.zip"))
    return zips[-1] if zips else None


pytestmark = pytest.mark.skipif(
    _latest_zip() is None, reason="no car_ped_stops backup zip present"
)


@pytest.fixture(scope="module")
def sample(tmp_path_factory) -> pd.DataFrame:
    db = tmp_path_factory.mktemp("veil") / "replication.db"
    build_veil_table(_latest_zip(), db, years=REPLICATION_YEARS)
    with sqlite3.connect(db) as conn:
        return pd.read_sql("SELECT * FROM car_ped_stops_veil", conn)


def assert_close(actual, expected, tol=0.10, label=""):
    lo, hi = expected * (1 - tol), expected * (1 + tol)
    assert lo <= actual <= hi, f"{label}: {actual} outside [{lo:.0f}, {hi:.0f}] (paper: {expected})"


def test_table_1_sample_size(sample):
    assert_close(len(sample), 37168, label="Table 1 stops")


def test_table_1_by_race(sample):
    counts = sample.party_race.value_counts()
    assert_close(counts["Black - Non-Latino"], 31738, label="Black-party stops")
    assert_close(counts["White - Non-Latino"], 5430, label="White-party stops")


def test_figure_2_motorist_counts(sample):
    by_race = sample.groupby("party_race").party_size.sum()
    assert_close(by_race["Black - Non-Latino"], 36121, label="Black motorists")
    assert_close(by_race["White - Non-Latino"], 5542, label="White motorists")


def test_table_2_solo_and_group(sample):
    black = sample[sample.party_race == "Black - Non-Latino"]
    assert_close((black.group_travel == 0).sum(), 27056, label="solo")
    assert_close((black.group_travel == 1).sum(), 4682, tol=0.15, label="group")


def test_figure_3_percent_motorists_in_multi_occupant_cars(sample):
    """Per motorist, not per stop -- this is the 'five times' headline."""
    for race, expected in [("Black - Non-Latino", 25.1), ("White - Non-Latino", 4.6)]:
        sub = sample[sample.party_race == race]
        pct = 100 * sub[sub.group_travel == 1].party_size.sum() / sub.party_size.sum()
        assert abs(pct - expected) < 3.0, f"{race}: {pct:.1f}% vs paper {expected}%"


def test_figure_4_frisk_and_ticket_rates(sample):
    """Per occupant, not per stop."""
    black = sample[sample.party_race == "Black - Non-Latino"]
    solo, group = black[black.group_travel == 0], black[black.group_travel == 1]
    solo_frisk = 100 * solo.n_frisked.sum() / solo.party_size.sum()
    group_frisk = 100 * group.n_frisked.sum() / group.party_size.sum()
    assert abs(solo_frisk - 7.1) < 2.0, f"solo frisk {solo_frisk:.1f}%"
    assert abs(group_frisk - 19.5) < 3.0, f"group frisk {group_frisk:.1f}%"
    assert group_frisk > 2 * solo_frisk, "group frisk rate should be far higher"


def test_lighting_is_roughly_balanced(sample):
    """The paper reports the window splits its sample about evenly."""
    share_dark = sample.obscured_view.mean()
    assert 0.35 < share_dark < 0.65, share_dark

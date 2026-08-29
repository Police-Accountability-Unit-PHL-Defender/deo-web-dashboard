"""Sample-construction tests, built on small synthetic frames.

The dedup test is the important one: deduplicating on demographics rather
than row identity silently halved multi-occupant parties during
exploration and produced a plausible but wrong result.
"""

import datetime as dt

import pandas as pd
import pytest

import numpy as np

from veil.sample import (
    _first_non_null,
    apply_paper_restrictions,
    classify_lighting,
    dedupe_people,
    roll_up_stops,
)
from veil.sun import load_sun_times


def person(objectid, when, location="100 BLOCK MAIN ST", race="Black - Non-Latino",
           gender="Male", age=22, mvc_code="3112", arrested=0, frisked=0, ticket=0):
    return {
        "objectid": objectid,
        "datetimeoccur": pd.Timestamp(when),
        "ts_local": pd.Timestamp(when),
        "location": location,
        "districtoccur": "18",
        "psa": "1",
        "assigned_unit": "18TH DISTRICT",
        "race": race,
        "gender": gender,
        "age": age,
        "mvc_code": mvc_code,
        "individual_arrested": arrested,
        "individual_frisked": frisked,
        "ticket_issued": ticket,
    }


def test_dedupe_keeps_two_identical_looking_occupants():
    """Two 22-year-old Black men in one car are two people, not a duplicate."""
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00"),
        person(2, "2024-06-01 19:00"),
    ])
    assert len(dedupe_people(df)) == 2


def test_dedupe_drops_a_genuinely_repeated_row():
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00"),
        person(1, "2024-06-01 19:00"),
    ])
    assert len(dedupe_people(df)) == 1


def test_first_non_null_returns_none_for_all_null_group():
    """An object-dtype Series of only NaNs has nothing to pick."""
    assert _first_non_null(pd.Series([np.nan, np.nan], dtype=object)) is None


def test_first_non_null_skips_nan_mixed_with_a_string():
    """This is the regression case: plain ``min`` raises TypeError here
    because the Series mixes ``str`` and float ``NaN`` -- exactly what a
    stop's occupant rows look like when this column is populated for some
    people and missing for others."""
    assert _first_non_null(pd.Series(["18TH DISTRICT", np.nan], dtype=object)) == "18TH DISTRICT"
    assert _first_non_null(pd.Series([np.nan, "18TH DISTRICT"], dtype=object)) == "18TH DISTRICT"


def test_first_non_null_picks_deterministically_among_several_values():
    """With more than one real value present, the choice must be stable
    (alphabetically smallest), not order-dependent."""
    assert _first_non_null(pd.Series(["22ND DISTRICT", "6TH DISTRICT", np.nan], dtype=object)) == "22ND DISTRICT"
    assert _first_non_null(pd.Series(["6TH DISTRICT", "22ND DISTRICT", np.nan], dtype=object)) == "22ND DISTRICT"


def test_roll_up_counts_party_size():
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00"),
        person(2, "2024-06-01 19:00"),
        person(3, "2024-06-01 19:30"),
    ])
    stops = roll_up_stops(df)
    assert len(stops) == 2
    assert sorted(stops.party_size.tolist()) == [1, 2]


def test_roll_up_flags_mixed_race_party():
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00"),
        person(2, "2024-06-01 19:00", race="White - Non-Latino"),
    ])
    stops = roll_up_stops(df)
    assert stops.iloc[0].n_races == 2


def test_roll_up_flags_party_outside_the_age_band():
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00", age=22),
        person(2, "2024-06-01 19:00", age=41),
    ])
    stops = roll_up_stops(df)
    assert stops.iloc[0].all_young_men == 0


def test_roll_up_sums_frisks_and_tickets():
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00", frisked=1, ticket=0),
        person(2, "2024-06-01 19:00", frisked=1, ticket=1),
    ])
    stops = roll_up_stops(df)
    assert stops.iloc[0].n_frisked == 2
    assert stops.iloc[0].n_ticketed == 1


def test_lighting_classification():
    sun = load_sun_times()
    # 2024-06-01: sunset ~20:28, dusk ~21:00. 2024-12-01: sunset ~16:35.
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00"),   # well before sunset -> daylight
        person(2, "2024-06-01 20:40"),   # between sunset and dusk -> ambiguous
        person(3, "2024-12-01 19:00"),   # well after dusk -> dark
    ])
    stops = classify_lighting(roll_up_stops(df), sun)
    assert stops.sort_values("ts_local").lighting.tolist() == [
        "daylight", "ambiguous", "dark",
    ]


def test_clock_minutes():
    sun = load_sun_times()
    df = pd.DataFrame([person(1, "2024-06-01 19:15")])
    stops = classify_lighting(roll_up_stops(df), sun)
    assert stops.iloc[0].clock_minutes == 19 * 60 + 15


@pytest.mark.parametrize(
    "kwargs,reason",
    [
        ({"mvc_code": None}, "not an MVC stop"),
        ({"arrested": 1}, "involved an arrest"),
        ({"age": 41}, "outside the 18-29 band"),
        ({"gender": "Female"}, "not all men"),
        ({"race": "Asian"}, "not Black or White"),
    ],
)
def test_restrictions_exclude(kwargs, reason):
    sun = load_sun_times()
    df = pd.DataFrame([person(1, "2024-06-01 19:00", **kwargs)])
    stops = apply_paper_restrictions(classify_lighting(roll_up_stops(df), sun))
    assert len(stops) == 0, f"should have been excluded: {reason}"


def test_restrictions_keep_a_clean_stop():
    sun = load_sun_times()
    df = pd.DataFrame([person(1, "2024-06-01 19:00")])
    stops = apply_paper_restrictions(classify_lighting(roll_up_stops(df), sun))
    assert len(stops) == 1


def test_restrictions_drop_the_ambiguous_band():
    sun = load_sun_times()
    df = pd.DataFrame([person(1, "2024-06-01 20:40")])
    stops = apply_paper_restrictions(classify_lighting(roll_up_stops(df), sun))
    assert len(stops) == 0


def test_restrictions_drop_stops_outside_the_window():
    sun = load_sun_times()
    df = pd.DataFrame([person(1, "2024-06-01 14:00")])
    stops = apply_paper_restrictions(classify_lighting(roll_up_stops(df), sun))
    assert len(stops) == 0

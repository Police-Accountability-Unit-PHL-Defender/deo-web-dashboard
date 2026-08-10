"""Build the veil-of-darkness analytic sample from person-level stop rows.

Follows the sample restrictions in Hannon & Biddle (2026). See
docs/superpowers/specs/2026-08-09-veil-of-darkness-design.md.

Two rules are load-bearing and easy to get wrong:

1. Deduplication keys on ``objectid``. Two 22-year-old Black men in one car
   are two people; deduping on demographics destroys exactly the
   multi-occupant parties this analysis is about.
2. No driver is ever identified. The homogeneous-party restriction makes it
   unnecessary -- every occupant is a young man of the same race -- and the
   source data has no reliable driver indicator.
"""

import datetime as dt

import pandas as pd

WINDOW_START = dt.time(17, 8)
WINDOW_END = dt.time(20, 35)
DRIVING_EQUALITY_DATE = pd.Timestamp("2022-03-03")
STUDY_RACES = ("Black - Non-Latino", "White - Non-Latino")
YOUNG_MIN, YOUNG_MAX = 18, 29


def dedupe_people(df: pd.DataFrame) -> pd.DataFrame:
    """Restriction 6: drop exact duplicate records, keyed on row identity."""
    return df.drop_duplicates(subset=["objectid"], keep="first")


def roll_up_stops(df: pd.DataFrame) -> pd.DataFrame:
    """Collapse person rows into one row per stop, keyed on (time, location)."""
    df = df.copy()
    df["_is_young_man"] = (
        (df.gender == "Male") & df.age.between(YOUNG_MIN, YOUNG_MAX)
    ).astype(int)
    df["_complete"] = (
        df.race.notna() & df.gender.notna() & df.age.notna()
    ).astype(int)
    df["_is_mvc"] = (df.mvc_code.notna() & (df.mvc_code != "")).astype(int)

    grouped = df.groupby(["datetimeoccur", "location"], dropna=False)
    stops = grouped.agg(
        districtoccur=("districtoccur", "min"),
        psa=("psa", "min"),
        assigned_unit=("assigned_unit", "min"),
        ts_local=("ts_local", "max"),
        party_size=("objectid", "size"),
        n_races=("race", "nunique"),
        party_race=("race", "min"),
        all_young_men=("_is_young_man", "min"),
        complete_demographics=("_complete", "min"),
        is_mvc=("_is_mvc", "max"),
        any_arrest=("individual_arrested", "max"),
        n_frisked=("individual_frisked", "sum"),
        n_ticketed=("ticket_issued", "sum"),
    ).reset_index()
    return stops


def classify_lighting(stops: pd.DataFrame, sun: pd.DataFrame) -> pd.DataFrame:
    """Add stop_date, clock_minutes and a daylight/dark/ambiguous label."""
    stops = stops.copy()
    stops["stop_date"] = stops.ts_local.dt.date
    stops["clock_minutes"] = stops.ts_local.dt.hour * 60 + stops.ts_local.dt.minute
    merged = stops.merge(sun, on="stop_date", how="left")

    # Compare wall-clock times on the stop's own date.
    sunset = merged.sunset_local.dt.hour * 60 + merged.sunset_local.dt.minute
    dusk = merged.dusk_local.dt.hour * 60 + merged.dusk_local.dt.minute
    merged["lighting"] = "ambiguous"
    merged.loc[merged.clock_minutes < sunset, "lighting"] = "daylight"
    merged.loc[merged.clock_minutes >= dusk, "lighting"] = "dark"
    return merged.drop(columns=["sunset_local", "dusk_local"])


def apply_paper_restrictions(stops: pd.DataFrame) -> pd.DataFrame:
    """Restrictions 2, 3, 4, 5, 7, 8 and 9 from the spec."""
    window_start = WINDOW_START.hour * 60 + WINDOW_START.minute
    window_end = WINDOW_END.hour * 60 + WINDOW_END.minute
    keep = (
        (stops.is_mvc == 1)
        & (stops.all_young_men == 1)
        & (stops.complete_demographics == 1)
        & (stops.n_races == 1)
        & (stops.party_race.isin(STUDY_RACES))
        & (stops.any_arrest == 0)
        & stops.clock_minutes.between(window_start, window_end)
        & (stops.lighting != "ambiguous")
    )
    out = stops[keep].copy()
    out["obscured_view"] = (out.lighting == "dark").astype(int)
    out["group_travel"] = (out.party_size >= 2).astype(int)
    out["era"] = (out.ts_local >= DRIVING_EQUALITY_DATE).map(
        {True: "post_deo", False: "pre_deo"}
    )
    out["year"] = out.ts_local.dt.year
    out["dow"] = out.ts_local.dt.dayofweek
    out["month"] = out.ts_local.dt.month
    out["is_summer"] = out.month.isin([6, 7, 8]).astype(int)
    return out

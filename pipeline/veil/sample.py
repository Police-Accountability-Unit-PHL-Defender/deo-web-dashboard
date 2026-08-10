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

# The inter-twilight window, taken verbatim from Hannon & Biddle (2026).
#
# These are DELIBERATELY the paper's numbers, not ours. `veil/sun.py`'s
# `inter_twilight_window` derives the same window from the committed
# Philadelphia sun-times table and returns 17:05-20:33 -- the earliest civil
# dusk and the latest sunset across the study period, computed from astral
# (see tests/test_veil_sun.py::test_inter_twilight_window). That is
# 3 minutes wider at the start and 2 narrower at the end than the published
# window, most likely because the authors used a different solar-position
# source, horizon/elevation assumption or rounding rule.
#
# The paper's values win here because this page's job is to REPRODUCE the
# published analysis: the sample must be the authors' sample, so a reader
# comparing our counts against Table 1 is comparing like with like. Our own
# derivation is kept, and unit-tested in tests/test_veil_sun.py, as an
# independent sanity check that the published window is plausible -- if the
# two ever diverged by more than a few minutes, that would signal a real
# problem with the sun-times data rather than a rounding difference. Do not
# "fix" these constants to match sun.py.
WINDOW_START = dt.time(17, 8)
WINDOW_END = dt.time(20, 35)
DRIVING_EQUALITY_DATE = pd.Timestamp("2022-03-03")
STUDY_RACES = ("Black - Non-Latino", "White - Non-Latino")
YOUNG_MIN, YOUNG_MAX = 18, 29


def dedupe_people(df: pd.DataFrame) -> pd.DataFrame:
    """Restriction 6: drop exact duplicate records, keyed on row identity."""
    return df.drop_duplicates(subset=["objectid"], keep="first")


def _first_non_null(s: pd.Series):
    """Like ``min`` but skips NaN instead of choking on mixed str/float dtype.

    A stop's occupant rows sometimes have this column populated for some
    people and missing (NaN) for others. ``Series.min()`` on an
    object-dtype column containing both strings and float NaNs raises
    ``TypeError`` in current pandas -- it does not silently skip the NaNs
    the way numeric ``min`` does. Dropping the nulls first restores the
    intended "pick whichever value is present" behavior.
    """
    s = s.dropna()
    return s.min() if len(s) else None


def int_code(value) -> str:
    """Render a numeric-looking geographic code as a bare integer string.

    ``districtoccur`` and ``psa`` arrive from the CSV as float64: pandas
    infers a numeric dtype and reads the zero-padded text "02" as 2.0, and
    SQLite then stores the column REAL. Stringifying naively therefore
    yields "2.0", not "2". Round-tripping through int first restores the
    code, and callers zero-pad the district separately.
    """
    if value is None or pd.isna(value):
        return ""
    try:
        return str(int(float(value)))
    except (TypeError, ValueError):
        return str(value).strip()


def police_area_key(district, psa) -> str:
    """Globally unique police-service-area label, e.g. "02-1".

    PPD numbers police service areas 1-4 (plus a 0 bucket) *within* each
    district, so ``psa`` alone has only five distinct values across the
    whole city: PSA 2 of the 12th District (Southwest) and PSA 2 of the 7th
    (Far Northeast) are both "2". Using ``psa`` on its own as a location
    control therefore pools unrelated neighbourhoods and controls for
    almost nothing. The district-qualified pair is the real area -- 66
    combinations in the analytic sample -- and because a PSA nests inside
    exactly one district, this key subsumes the district as well.

    The "DD-P" shape matches ``cube_builders/stops.py::_location_key``, so
    a veil-page area label reads the same way as a stops-page one ('12-2').
    """
    d = int_code(district)
    return f"{d.zfill(2) if d else ''}-{int_code(psa)}"


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
        districtoccur=("districtoccur", _first_non_null),
        psa=("psa", _first_non_null),
        assigned_unit=("assigned_unit", _first_non_null),
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
    # The location control the models actually use. Built here, once, so the
    # column is carried into the table and every downstream consumer shares
    # one definition of "area".
    stops["police_area"] = [
        police_area_key(d, p) for d, p in zip(stops.districtoccur, stops.psa)
    ]
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

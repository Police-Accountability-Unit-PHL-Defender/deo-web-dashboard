"""Sample restrictions and outcomes for Hannon & Biddle (2025).

Hannon & Biddle (2025), American Journal of Criminal Justice 50:1081-1090,
doi.org/10.1007/s12103-025-09879-8 -- *Unequal Policing of Black Motorists in
Black Communities by Age and Gender*. Unlike the 2026 group-travel paper
reproduced elsewhere in this package, this is an intraracial question: among
stops of Black motorists, does daylight change the age and gender of who
gets pulled over.

Input: `car_ped_stops_veil_intraracial` (built by `veil.build_intraracial`),
one row per sole-occupant stop, deliberately unfiltered. Every restriction
applied here is stated in the paper -- none is invented.
"""

import pandas as pd

from veil.sample import int_code
from veil.seasonality import daylight_proportion, quadratic_weights
from veil.sun import inter_twilight_window

# Hannon & Biddle (2025), p.1083: Philadelphia's residential majority-Black
# police districts, named explicitly in the paper. Hardcoded on purpose --
# deriving this list from census data would be a different, silently
# drifting definition, and the paper's sample must match the paper's list.
DISTRICTS = ("12", "14", "16", "18", "19", "22", "35", "39")

# The paper's study window: January 2022 through August 2025.
WINDOW = ("2022-01-01", "2025-08-31")

# The paper's race restriction. Matches the convention already used by
# veil.sample.STUDY_RACES, which separates "Black - Non-Latino" from
# "Black - Latino" as distinct categories in this source data.
BLACK_RACE = "Black - Non-Latino"

YOUNG_MIN, YOUNG_MAX = 18, 29

OUTCOMES = (
    "is_young",
    "is_male",
    "young_male",
    "young_female",
    "older_male",
    "older_female",
)


def _district_code(value) -> str:
    """Normalise districtoccur to a zero-padded string, e.g. 18.0 -> "18"."""
    code = int_code(value)
    return code.zfill(2) if code else ""


def build_sample(stops: pd.DataFrame, sun: pd.DataFrame) -> pd.DataFrame:
    """Apply the 2025 paper's restrictions and derive its six outcomes.

    Restrictions, in order: district in DISTRICTS; ts_local within WINDOW;
    race is Black; age >= 18 (age present); gender present and one of
    Male/Female; is_mvc == 1; lighting != "ambiguous"; clock_minutes within
    the sample's own inter-twilight window. The sole-occupant restriction
    already happened upstream in veil.build_intraracial.

    A null/blank gender or a null age is dropped explicitly rather than
    left to fall through comparison semantics: `gender == "Male"` on a null
    silently evaluates False, which would count a missing gender as Female
    -- and two of the six outcomes here are female categories, one of them
    the paper's headline inverse finding (30+ & female). So nulls are
    excluded up front, never allowed to become a data point.
    """
    stops = stops.copy()
    stops["_district"] = stops.districtoccur.map(_district_code)

    # `car_ped_stops_veil_intraracial` stores ts_local as sqlite TEXT, same as
    # stop_date (already coerced below). A plain `pd.read_sql(...)` with no
    # `parse_dates` -- the obvious, and the way Task 4's cube builder reads
    # this table -- hands us ts_local as Python str, and comparing a str
    # against window_start_ts/window_end_ts raises TypeError. Coerce
    # unconditionally so build_sample is correct regardless of how the
    # caller loaded the frame; pd.to_datetime on an already-Timestamp column
    # (as the unit tests pass in) is a no-op.
    stops["ts_local"] = pd.to_datetime(stops.ts_local)

    window_start_ts = pd.Timestamp(WINDOW[0])
    window_end_ts = pd.Timestamp(WINDOW[1]) + pd.Timedelta(days=1)  # exclusive

    # The sun frame the paper/Task 1 fixtures use keys on "date"; the real
    # committed table (veil.sun.load_sun_times) keys on "stop_date". Accept
    # either without silently guessing: normalise "date" to "stop_date" only
    # when the real column isn't already present.
    sun = sun.copy()
    if "stop_date" not in sun.columns and "date" in sun.columns:
        sun["stop_date"] = sun["date"]

    keep = (
        stops["_district"].isin(DISTRICTS)
        & stops.ts_local.ge(window_start_ts)
        & stops.ts_local.lt(window_end_ts)
        & (stops.race == BLACK_RACE)
        & stops.age.notna()
        & (stops.age >= YOUNG_MIN)
        & (stops.is_mvc == 1)
        & (stops.lighting != "ambiguous")
        & stops.gender.notna()
        & stops.gender.isin(("Male", "Female"))
    )
    out = stops[keep].copy()

    is_male = (out.gender == "Male").astype(int)
    is_young = (out.age <= YOUNG_MAX).astype(int)
    out["is_young"] = is_young
    out["is_male"] = is_male
    out["young_male"] = is_young * is_male
    out["young_female"] = is_young * (1 - is_male)
    out["older_male"] = (1 - is_young) * is_male
    out["older_female"] = (1 - is_young) * (1 - is_male)
    out["obscured_view"] = (out.lighting == "dark").astype(int)

    # The inter-twilight window is derived from the sample's own dates
    # (Jan 2022 - Aug 2025), not veil.sample's WINDOW_START/END constants,
    # which were computed for a different study period (2021-2024).
    sun_dates = pd.to_datetime(sun.stop_date)
    sun_in_window = sun[sun_dates.between(window_start_ts, pd.Timestamp(WINDOW[1]))]
    itp_start, itp_end = inter_twilight_window(sun_in_window)
    itp_start_min = itp_start.hour * 60 + itp_start.minute
    itp_end_min = itp_end.hour * 60 + itp_end.minute
    out = out[out.clock_minutes.between(itp_start_min, itp_end_min)].copy()

    p = daylight_proportion(sun_in_window, itp_start, itp_end)
    weights = quadratic_weights(p)
    out["weight"] = pd.to_datetime(out.stop_date).map(weights)

    assert out.weight.notna().all(), "a stop's date failed to join to a seasonality weight"

    return out

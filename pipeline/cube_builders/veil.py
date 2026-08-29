"""Veil-of-darkness cube builder.

Reads ``car_ped_stops_veil`` and emits a descriptive cube plus a ``models``
block holding fitted regression results.

Both ``n_stops`` and ``n_motorists`` are carried because the paper's figures
use different denominators: Tables 1-2 are per stop, Figures 2-3 per
motorist, Figure 4 per occupant. A chart that mixes them up silently
reports the wrong number -- Figure 3's headline is 25.1% per motorist but
14.2% per stop.
"""

import sqlite3

import pandas as pd

from build_districts import build as build_district_demographics

from veil.intraracial import (
    DISTRICTS,
    OUTCOMES,
    TREND_DEFAULT_EXCLUDED_YEARS,
    TREND_OUTCOMES,
    TREND_WINDOW,
    TREND_YEARS,
    WINDOW,
    build_sample,
)
from veil.models import (
    INTRARACIAL_SE_TARGETS,
    INTRARACIAL_TARGETS,
    MODEL_TARGETS,
    confidence_interval,
    fit_intraracial,
    fit_vod,
    predicted_probabilities,
)
from veil.sample import int_code
from veil.sun import load_sun_times

CUBE_VERSION = 1

DIMENSIONS = ["year", "era", "clock_bin", "lighting", "party_race", "group_travel", "district"]
MEASURES = ["n_stops", "n_motorists", "n_frisked", "n_ticketed"]

BIN_MINUTES = 15
BLACK = "Black - Non-Latino"
WHITE = "White - Non-Latino"

COMPARISON_RACES = {"black": BLACK, "white": WHITE}


def _normalize_district(d) -> str:
    """Zero-pad a district code to two digits: 2.0 -> "02", 12.0 -> "12".

    ``districtoccur`` is stored REAL in SQLite -- pandas infers a numeric
    dtype from the CSV and reads the zero-padded text "02" as 2.0 -- so a
    bare ``str()`` yields "2.0", whose ``isdigit()`` is False. An earlier
    version of this helper tested ``isdigit()`` directly on that string and
    was therefore a no-op, emitting "12.0" into the cube's `district`
    dimension where its sibling builders emit "12". Route through
    ``veil.sample.int_code`` so the float representation is stripped first.
    """
    code = int_code(d)
    return code.zfill(2) if code else ""


def _descriptive_rows(df: pd.DataFrame) -> list[list]:
    df = df.copy()
    df["clock_bin"] = (df.clock_minutes // BIN_MINUTES) * BIN_MINUTES
    df["district"] = df.districtoccur.map(_normalize_district)
    grouped = df.groupby(
        ["year", "era", "clock_bin", "lighting", "party_race", "group_travel", "district"],
        dropna=False,
    ).agg(
        n_stops=("party_size", "size"),
        n_motorists=("party_size", "sum"),
        n_frisked=("n_frisked", "sum"),
        n_ticketed=("n_ticketed", "sum"),
    ).reset_index()

    return [
        [
            int(r.year), str(r.era), int(r.clock_bin), str(r.lighting),
            str(r.party_race), int(r.group_travel), str(r.district),
            int(r.n_stops), int(r.n_motorists), int(r.n_frisked), int(r.n_ticketed),
        ]
        for r in grouped.itertuples()
    ]


def _time_rounding(df: pd.DataFrame) -> dict:
    """How heavily officers round the recorded stop time.

    The page tells readers that logged times are rounded, which is why the
    ~30-minute band between sunset and full dusk is excluded. That claim
    needs a number attached to it, and the number has to come from our own
    data rather than being asserted in the page's voice: `clock_minutes` is
    minute-level, so this cannot be recomputed from the 15-minute
    `clock_bin` dimension and has to be measured here.
    """
    minutes = df.clock_minutes
    return {
        "n": int(len(minutes)),
        "pct_multiple_of_5": float(100 * (minutes % 5 == 0).mean()),
        "pct_multiple_of_15": float(100 * (minutes % 15 == 0).mean()),
    }


def _fit_all(df: pd.DataFrame) -> dict:
    models: dict = {}

    inter = df.copy()
    # `party_is_black`, not `driver_is_black`: no driver is ever identified in
    # this sample (see veil/sample.py). Every occupant of a retained stop is a
    # young man of the same race, so the outcome is a property of the party.
    inter["party_is_black"] = (inter.party_race == BLACK).astype(int)

    black = df[df.party_race == BLACK].copy()
    black["has_black_passenger"] = black.group_travel

    white = df[df.party_race == WHITE].copy()
    white["has_white_passenger"] = white.group_travel

    jobs = [
        ("party_is_black", inter, "party_is_black"),
        ("has_black_passenger", black, "has_black_passenger"),
        ("placebo_white", white, "has_white_passenger"),
    ]
    for name, data, outcome in jobs:
        for full in (False, True):
            result = fit_vod(data, outcome=outcome, full_controls=full)
            key = f"{name}.{result['spec']}"
            result["seasonality_weight"] = False
            result["paper_coef"] = MODEL_TARGETS.get(key)
            models[key] = result
    return models


def _year_estimates(df: pd.DataFrame) -> list[dict]:
    """Fit the four mutually exclusive age/gender outcomes for every year."""
    estimates = []
    for year in TREND_YEARS:
        subset = df[df.year == year]
        for outcome in TREND_OUTCOMES:
            result = fit_intraracial(subset, outcome)
            ci_lo, ci_hi = confidence_interval(result["coef"], result["se"])
            estimates.append({
                "year": int(year),
                "outcome": outcome,
                "coef": result["coef"],
                "se": result["se"],
                "ci_lo": ci_lo,
                "ci_hi": ci_hi,
                "odds_ratio": result["odds_ratio"],
                "p_value": result["p_value"],
                "n": result["n"],
                "converged": result["converged"],
                "marginal_daylight_pct": result["marginal_daylight_pct"],
                "marginal_dark_pct": result["marginal_dark_pct"],
                "marginal_effect_pp": result["marginal_effect_pp"],
                "marginal_effect_se_pp": result["marginal_effect_se_pp"],
                "marginal_ci_lo_pp": result["marginal_ci_lo_pp"],
                "marginal_ci_hi_pp": result["marginal_ci_hi_pp"],
            })
    return estimates


def _comparison_districts() -> dict[str, tuple[str, ...]]:
    """Dashboard-wide >50% White split, derived from the committed Census input."""
    demographics = build_district_demographics()
    majority_white = tuple(sorted(k for k, v in demographics.items() if v["whiteness"] > 50))
    majority_non_white = tuple(sorted(k for k, v in demographics.items() if v["whiteness"] <= 50))
    return {"majority_white": majority_white, "majority_non_white": majority_non_white}


def _by_year(stops: pd.DataFrame, sun: pd.DataFrame) -> dict:
    """Per-calendar-year fits, for the trend chart above the lead section.

    ONE `build_sample` call over the whole TREND_WINDOW, then split by year --
    deliberately not one call per year. `build_sample` derives both the
    inter-twilight window and the seasonality weights from the window it is
    given, so per-year calls would hand each year a slightly different
    time-of-day window, and a year-over-year difference could then reflect
    that moving window rather than a change in who gets stopped.

    Only the four mutually exclusive group outcomes are fitted
    (TREND_OUTCOMES), separately for Black and White motorists in each of
    the dashboard's two district contexts: 12 years x 4 outcomes x 4 strata.

    These samples are NOT the reproduction's sample and their 2025 is a full
    calendar year where the paper's is January-August. The two must never be
    presented as the same quantity -- see the caveats on the page.
    """
    strata = []
    for district_context, districts in _comparison_districts().items():
        for race, race_value in COMPARISON_RACES.items():
            sample = build_sample(
                stops, sun, window=TREND_WINDOW,
                races=(race_value,), districts=districts,
            )
            strata.append({
                "race": race,
                "district_context": district_context,
                "districts": list(districts),
                "estimates": _year_estimates(sample),
            })

    return {
        "window": {"start": TREND_WINDOW[0], "end": TREND_WINDOW[1]},
        "years": [int(y) for y in TREND_YEARS],
        # Which years the chart shows before the reader touches anything.
        # Emitted rather than hardcoded in the page so the exclusion and its
        # reason live in one place, next to the sample that produced it.
        "default_years": [
            int(y) for y in TREND_YEARS if y not in TREND_DEFAULT_EXCLUDED_YEARS
        ],
        "strata": strata,
    }


def _intraracial(conn: sqlite3.Connection) -> dict:
    """Hannon & Biddle (2025) intraracial age/gender models and probabilities.

    Reads the dedicated `car_ped_stops_veil_intraracial` table -- a
    differently-filtered, differently-sampled table than `car_ped_stops_veil`
    above -- and must never have its rows mixed into the 2026 group-travel
    cube's `rows`/`models`/`time_rounding` keys.
    """
    stops = pd.read_sql("SELECT * FROM car_ped_stops_veil_intraracial", conn)
    sun = load_sun_times()
    df = build_sample(stops, sun)

    models = {}
    for outcome in OUTCOMES:
        result = fit_intraracial(df, outcome)
        models[outcome] = {
            "coef": result["coef"],
            "se": result["se"],
            "odds_ratio": result["odds_ratio"],
            "p_value": result["p_value"],
            "n": result["n"],
            "converged": result["converged"],
            "paper_coef": INTRARACIAL_TARGETS.get(outcome),
            "paper_se": INTRARACIAL_SE_TARGETS.get(outcome),
        }

    probabilities = []
    for group in ("young_male", "young_female", "older_male", "older_female"):
        probs = predicted_probabilities(df, group)
        probabilities.append({"group": group, "lighting": "daylight", "pct": probs["daylight"]})
        probabilities.append({"group": group, "lighting": "dark", "pct": probs["dark"]})

    return {
        "sample": {
            "n": int(len(df)),
            "window_start": WINDOW[0],
            "window_end": WINDOW[1],
            "districts": list(DISTRICTS),
        },
        "models": models,
        "probabilities": probabilities,
        # A second, wider sample over the same table: full calendar years
        # 2021-2025, fitted one year at a time. Sibling to the three keys
        # above, never merged into them.
        "by_year": _by_year(stops, sun),
    }


def build(conn: sqlite3.Connection) -> tuple[dict, dict]:
    df = pd.read_sql("SELECT * FROM car_ped_stops_veil", conn)
    if df.empty:
        raise SystemExit(
            "car_ped_stops_veil is empty or missing. Run: python -m veil.build "
            "--zip data/<backup>.zip --db data/<db>.db"
        )

    replication = df[df.year.between(2021, 2024)]
    cube = {
        "version": CUBE_VERSION,
        "dimensions": DIMENSIONS,
        "measures": MEASURES,
        "rows": _descriptive_rows(df),
        "models": _fit_all(replication),
        "time_rounding": _time_rounding(replication),
        "intraracial": _intraracial(conn),
    }
    return cube, {}

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

import numpy as np
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
    fit_district_context_moderation,
    fit_district_blackness_moderation,
    fit_intraracial,
    fit_group_darkness_difference,
    fit_pooled_race_interaction,
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


def _race_composition_year_estimates(df: pd.DataFrame) -> list[dict]:
    """Fit annual Black-share models within each age/gender group.

    Unlike ``_year_estimates``, which asks how age/gender composition changes
    within one race, these fits restrict the sample to one mutually exclusive
    age/gender group and make race the outcome. White is the reference/complement,
    so the darkness effect is the change in Black share among Black and White
    motorists in that group.
    """
    estimates = []
    for year in TREND_YEARS:
        year_sample = df[df.year == year]
        for group in TREND_OUTCOMES:
            subset = year_sample[year_sample[group] == 1].copy()
            subset["is_black"] = (subset.race == BLACK).astype(int)
            result = fit_intraracial(subset, "is_black")
            ci_lo, ci_hi = confidence_interval(result["coef"], result["se"])
            estimates.append({
                "year": int(year),
                "group": group,
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


def _overall_race_composition_year_estimates(df: pd.DataFrame) -> list[dict]:
    """Fit the same annual racial-composition measure for two lead samples.

    The page opens with a citywide overview before exposing district and
    demographic detail: first every adult Black/White motorist in the analytic
    sample, then the paper-motivated subset of men ages 18--29. Keeping both in
    one block guarantees that the lead charts share years, controls, district
    coverage, and the Black-versus-White denominator.
    """
    estimates = []
    for year in TREND_YEARS:
        year_sample = df[df.year == year]
        for sample_name, sample in (
            ("all_adults", year_sample),
            ("young_male", year_sample[year_sample.young_male == 1]),
        ):
            subset = sample.copy()
            subset["is_black"] = (subset.race == BLACK).astype(int)
            result = fit_intraracial(subset, "is_black")
            estimates.append({
                "year": int(year),
                "sample": sample_name,
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


def _pooled_race_composition(df: pd.DataFrame) -> dict:
    """One citywide adult model over the headline's default calendar years."""
    sample = df[~df.year.isin(TREND_DEFAULT_EXCLUDED_YEARS)].copy()
    sample["is_black"] = (sample.race == BLACK).astype(int)
    result = fit_intraracial(sample, "is_black")
    return {
        "years": [int(y) for y in TREND_YEARS if y not in TREND_DEFAULT_EXCLUDED_YEARS],
        "districts": sorted(sample._district.unique().tolist()),
        **{key: result[key] for key in (
            "n", "converged", "p_value", "marginal_daylight_pct",
            "marginal_dark_pct", "marginal_effect_pp", "marginal_effect_se_pp",
            "marginal_ci_lo_pp", "marginal_ci_hi_pp",
        )},
    }


# Driving Equality took effect on March 3, 2022. Split on the stop's local
# date, not its year, so January-February 2022 counts as before.
DRIVING_EQUALITY_EFFECTIVE = pd.Timestamp("2022-03-03")


def _default_year_race_sample(df: pd.DataFrame) -> pd.DataFrame:
    sample = df[~df.year.isin(TREND_DEFAULT_EXCLUDED_YEARS)].copy()
    sample["is_black"] = (sample.race == BLACK).astype(int)
    return sample


def _marginal_summary(result: dict) -> dict:
    return {key: result[key] for key in (
        "n", "converged", "p_value", "marginal_daylight_pct",
        "marginal_dark_pct", "marginal_effect_pp", "marginal_effect_se_pp",
        "marginal_ci_lo_pp", "marginal_ci_hi_pp",
    )}


def _pooled_young_men(df: pd.DataFrame) -> dict:
    """Young men's pooled race result, and whether it differs from other adults.

    ``pooled`` is the young-men counterpart of the citywide headline: the same
    years and Black-share outcome, fitted on men ages 18-29 alone. The annual
    chart shows young men below all adults in most years, but that comparison
    cannot say whether the gap is real; ``difference`` is the direct test, an
    ``obscured_view * young_male`` interaction fitted over every adult in the
    headline sample. Its comparison group is other adults, not all adults,
    because all adults include the young men themselves.
    """
    sample = _default_year_race_sample(df)
    young = sample[sample.young_male == 1]
    return {
        "years": [int(y) for y in TREND_YEARS if y not in TREND_DEFAULT_EXCLUDED_YEARS],
        "pooled": _marginal_summary(fit_intraracial(young, "is_black")),
        "difference": fit_group_darkness_difference(sample, "is_black", "young_male"),
    }


def _driving_equality_comparison(df: pd.DataFrame) -> dict:
    """After-dark change in the Black share before versus after Driving Equality.

    One model over the headline's default years with an
    ``obscured_view * after_driving_equality`` interaction. It answers whether
    the after-dark gap was different after the law took effect, not why: the
    violation-code coverage change from 2023 and the drop in nonoperational
    stops coincide with the law, and year fixed effects absorb only level
    shifts in the Black share, not changes in the darkness gap.
    """
    sample = _default_year_race_sample(df)
    sample["after_driving_equality"] = (
        pd.to_datetime(sample.ts_local) >= DRIVING_EQUALITY_EFFECTIVE
    ).astype(int)
    return {
        "effective_date": DRIVING_EQUALITY_EFFECTIVE.date().isoformat(),
        "years": [int(y) for y in TREND_YEARS if y not in TREND_DEFAULT_EXCLUDED_YEARS],
        **fit_group_darkness_difference(sample, "is_black", "after_driving_equality"),
    }


def _comparison_districts() -> dict[str, tuple[str, ...]]:
    """Dashboard-wide >50% White split, derived from the committed Census input."""
    demographics = build_district_demographics()
    majority_white = tuple(sorted(k for k, v in demographics.items() if v["whiteness"] > 50))
    majority_non_white = tuple(sorted(k for k, v in demographics.items() if v["whiteness"] <= 50))
    return {"majority_white": majority_white, "majority_non_white": majority_non_white}


def _district_blackness_bands() -> dict[str, dict]:
    """Four natural Census clusters for comparing the racial veil effect.

    The cut points sit in observed gaps: 15.9%-21.1%, 34.2%-51.2%, and
    63.7%-70.9%. The resulting groups are stable under both unweighted and
    resident-population-weighted one-dimensional clustering.
    """
    demographics = build_district_demographics()
    bands = {
        "low_black": {"districts": [], "percentages": []},
        "moderate_black": {"districts": [], "percentages": []},
        "majority_black": {"districts": [], "percentages": []},
        "supermajority_black": {"districts": [], "percentages": []},
    }
    for district, values in demographics.items():
        black_pct = 100 * values["black"] / values["total"]
        if black_pct < 18.5:
            band = "low_black"
        elif black_pct < 42.7:
            band = "moderate_black"
        elif black_pct < 67.3:
            band = "majority_black"
        else:
            band = "supermajority_black"
        bands[band]["districts"].append(district)
        bands[band]["percentages"].append(black_pct)
    for band in bands.values():
        band["districts"] = tuple(sorted(band["districts"]))
        band["min_pct"] = min(band.pop("percentages"))
        band["max_pct"] = max(
            100 * demographics[district]["black"] / demographics[district]["total"]
            for district in band["districts"]
        )
    return bands


def _weighted_quantile(values, weights, quantile: float) -> float:
    order = np.argsort(values)
    values = np.asarray(values)[order]
    weights = np.asarray(weights)[order]
    return float(values[np.searchsorted(np.cumsum(weights), quantile * weights.sum())])


def _district_context_analysis(
    conn: sqlite3.Connection,
    stops: pd.DataFrame,
    sun: pd.DataFrame,
) -> dict:
    demographics = build_district_demographics()
    districts = tuple(sorted(demographics))
    sample = build_sample(
        stops, sun, window=TREND_WINDOW, races=(BLACK, WHITE), districts=districts,
    )
    sample = sample[~sample.year.isin(TREND_DEFAULT_EXCLUDED_YEARS)].copy()
    sample["is_black"] = (sample.race == BLACK).astype(int)

    years = [y for y in TREND_YEARS if y not in TREND_DEFAULT_EXCLUDED_YEARS]
    placeholders = ",".join("?" for _ in years)
    counts = pd.read_sql(
        f"""
        SELECT districtoccur, SUM(n_stopped) AS n_stops
        FROM car_ped_stops_quarterly
        WHERE year IN ({placeholders})
        GROUP BY districtoccur
        """,
        conn,
        params=years,
    )
    stop_counts = {
        _normalize_district(row.districtoccur): float(row.n_stops)
        for row in counts.itertuples()
    }
    district_rows = []
    for district in districts:
        demo = demographics[district]
        population = float(demo["total"])
        annual_stops = stop_counts.get(district, 0.0) / len(years)
        district_rows.append({
            "district": district,
            "population": int(population),
            "whiteness": float(demo["whiteness"]),
            "stops_per_1000": float(1000 * annual_stops / population),
        })
    context = {row["district"]: row for row in district_rows}
    sample["district_whiteness_10"] = sample["_district"].map(
        lambda d: context[d]["whiteness"] / 10
    )
    sample["stops_per_1000_10"] = sample["_district"].map(
        lambda d: context[d]["stops_per_1000"] / 10
    )

    values = {
        "district_whiteness": np.array([r["whiteness"] for r in district_rows]),
        "stops_per_1000": np.array([r["stops_per_1000"] for r in district_rows]),
    }
    weights = np.array([r["population"] for r in district_rows])
    ranges = {
        key: tuple(_weighted_quantile(value, weights, q) for q in (0.25, 0.5, 0.75))
        for key, value in values.items()
    }
    effects = []
    for attribute, outcome in (
        ("race", "is_black"), ("age", "is_young"), ("gender", "is_male"),
    ):
        effects.append({
            "attribute": attribute,
            "outcome": outcome,
            **fit_district_context_moderation(sample, outcome, ranges),
        })
    return {
        "years": years,
        "districts": district_rows,
        "ranges": {
            key: {"low": vals[0], "median": vals[1], "high": vals[2]}
            for key, vals in ranges.items()
        },
        "effects": effects,
        "intensity_definition": "average annual recorded vehicle stops per 1,000 district residents",
    }


def _by_year(stops: pd.DataFrame, sun: pd.DataFrame, conn: sqlite3.Connection) -> dict:
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
    race_composition_by_blackness = []
    band_samples = []
    pooled_race_interaction = []
    attribute_comparison = []

    for blackness_band, definition in _district_blackness_bands().items():
        districts = definition["districts"]
        pooled = build_sample(
            stops, sun, window=TREND_WINDOW,
            races=(BLACK, WHITE), districts=districts,
        )
        band_samples.append(pooled)
        race_composition_by_blackness.append({
            "blackness_band": blackness_band,
            "min_pct": definition["min_pct"],
            "max_pct": definition["max_pct"],
            "districts": list(districts),
            "estimates": _race_composition_year_estimates(pooled),
        })

    all_district_sample = pd.concat(band_samples, ignore_index=True)
    race_composition_overall = _overall_race_composition_year_estimates(
        all_district_sample
    )
    demographics = build_district_demographics()
    district_blackness = {
        district: 100 * values["black"] / values["total"]
        for district, values in demographics.items()
    }
    moderation_sample = all_district_sample[
        ~all_district_sample.year.isin(TREND_DEFAULT_EXCLUDED_YEARS)
    ].copy()
    moderation_sample["is_black"] = (moderation_sample.race == BLACK).astype(int)
    # A genuine pooled citywide fit for the public headline. This is distinct
    # from averaging annual effects and from the district-context models below.
    race_composition_pooled = _pooled_race_composition(all_district_sample)
    young_men_pooled = _pooled_young_men(all_district_sample)
    driving_equality_comparison = _driving_equality_comparison(all_district_sample)
    moderation_sample["district_blackness_10"] = (
        moderation_sample["_district"].map(district_blackness) / 10
    )
    blackness_moderation = []
    for group in TREND_OUTCOMES:
        group_sample = moderation_sample[moderation_sample[group] == 1].copy()
        blackness_moderation.append({
            "group": group,
            **fit_district_blackness_moderation(
                group_sample, evaluation_pcts=[10, 20, 30, 40, 50, 60, 70, 80]
            ),
        })

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

        # The separate race fits above describe each race but cannot test
        # whether their darkness effects differ. Fit young men together over
        # the chart's default years and estimate the Black-minus-white
        # difference in after-dark changes over one common pooled population.
        pooled = build_sample(
            stops, sun, window=TREND_WINDOW,
            races=(BLACK, WHITE), districts=districts,
        )
        pooled = pooled[~pooled.year.isin(TREND_DEFAULT_EXCLUDED_YEARS)].copy()
        pooled["is_black"] = (pooled.race == BLACK).astype(int)
        pooled_race_interaction.append({
            "district_context": district_context,
            "districts": list(districts),
            "outcome": "young_male",
            **fit_pooled_race_interaction(pooled, "young_male"),
        })
        effects = []
        for attribute, outcome in (
            ("race", "is_black"),
            ("age", "is_young"),
            ("gender", "is_male"),
        ):
            result = fit_intraracial(pooled, outcome)
            effects.append({
                "attribute": attribute,
                "outcome": outcome,
                "daylight_pct": result["marginal_daylight_pct"],
                "dark_pct": result["marginal_dark_pct"],
                "effect_pp": result["marginal_effect_pp"],
                "effect_se_pp": result["marginal_effect_se_pp"],
                "effect_ci_lo_pp": result["marginal_ci_lo_pp"],
                "effect_ci_hi_pp": result["marginal_ci_hi_pp"],
                "p_value": result["p_value"],
                "n": result["n"],
                "converged": result["converged"],
            })
        attribute_comparison.append({
            "district_context": district_context,
            "districts": list(districts),
            "effects": effects,
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
        "race_composition_overall": race_composition_overall,
        "race_composition_pooled": race_composition_pooled,
        "race_composition_young_men_pooled": young_men_pooled,
        "race_composition_driving_equality": driving_equality_comparison,
        "race_composition_by_blackness": race_composition_by_blackness,
        "district_blackness_moderation": {
            "default_years": [
                int(y) for y in TREND_YEARS if y not in TREND_DEFAULT_EXCLUDED_YEARS
            ],
            "observed_min_pct": min(district_blackness.values()),
            "observed_max_pct": max(district_blackness.values()),
            "groups": blackness_moderation,
        },
        "pooled_race_interaction": pooled_race_interaction,
        "attribute_comparison": attribute_comparison,
        "district_context": _district_context_analysis(conn, stops, sun),
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
        "by_year": _by_year(stops, sun, conn),
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

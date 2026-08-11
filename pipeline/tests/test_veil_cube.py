"""Cube-shape tests for the veil builder."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

from veil.models import INTRARACIAL_SE_TARGETS, INTRARACIAL_TARGETS, MODEL_TARGETS

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = PIPELINE_ROOT / "build_cubes.py"

# How far a fitted coefficient may sit from the published one.
#
# Model 1 reproduces the paper's specification exactly (darkness + a natural
# cubic spline in clock time + day-of-week + year), so the only expected
# sources of difference are the data vintage -- our snapshot is roughly two
# years newer than the authors' and OpenDataPhilly revises records -- and the
# ~1.6% sample-count gap that follows from it. 0.015 is tight enough that a
# structural break (a dropped restriction, a flipped lighting label, a
# changed denominator) cannot hide inside it, and loose enough to absorb
# vintage drift. The largest observed Model 1 gap is 0.009.
MODEL_1_TOLERANCE = 0.015

# Model 2 gets a deliberately LOOSER bound, and the reason is honest rather
# than convenient: our Model 2 OMITS the Knode et al. (2024) seasonality
# weight that the paper applies, because the paper does not publish that
# weight's formula. It is therefore a different estimator, not the same
# estimator on slightly different data, and it has no reason to land as
# close. Everything in MODEL_1_TOLERANCE applies on top. 0.05 still rejects
# a sign flip, an order-of-magnitude error, or a collapsed control; the
# largest observed Model 2 gap is 0.010.
MODEL_2_TOLERANCE = 0.05

# Tolerance for the 2025 intraracial (Hannon & Biddle) reproduction, per plan.
INTRARACIAL_TOLERANCE = 0.08

# Tolerance for the daylight/dark probability pairs in Figure 1, in points.
INTRARACIAL_PROBABILITY_TOLERANCE = 2.5


@pytest.fixture(scope="module")
def cube(tmp_path_factory):
    out_dir = tmp_path_factory.mktemp("cubes")
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--only", "veil", "--out", str(out_dir)],
        cwd=str(PIPELINE_ROOT), capture_output=True, text=True,
    )
    assert result.returncode == 0, f"stdout={result.stdout}\nstderr={result.stderr}"
    return json.loads((out_dir / "veil.json").read_text())


def test_dimensions_and_measures(cube):
    assert cube["dimensions"] == [
        "year", "era", "clock_bin", "lighting", "party_race",
        "group_travel", "district",
    ]
    assert cube["measures"] == ["n_stops", "n_motorists", "n_frisked", "n_ticketed"]


def test_row_width_matches_header(cube):
    width = len(cube["dimensions"]) + len(cube["measures"])
    assert all(len(r) == width for r in cube["rows"])


def test_has_rows_but_stays_small(cube):
    assert 100 < len(cube["rows"]) < 100_000, len(cube["rows"])


def test_models_block_is_present_and_complete(cube):
    models = cube["models"]
    for key in [
        "party_is_black.model_1", "party_is_black.model_2",
        "has_black_passenger.model_1", "has_black_passenger.model_2",
        "placebo_white.model_1",
    ]:
        assert key in models, f"missing {key}"
        assert "coef" in models[key] and "n" in models[key]


def test_main_findings_have_the_expected_sign(cube):
    """Darkness should reduce the odds for both headline models."""
    for key in ["party_is_black.model_1", "has_black_passenger.model_1"]:
        assert cube["models"][key]["coef"] < 0, key


@pytest.mark.parametrize("key,paper_coef", sorted(MODEL_TARGETS.items()))
def test_fitted_coefficients_stay_close_to_the_published_ones(cube, key, paper_coef):
    """Pin every headline coefficient against the paper's published value.

    This guard was missing, and its absence is exactly how the page came to
    claim our coefficients land "within 0.008" of published while
    has_black_passenger.model_1 sat 0.00905 away: the gap was 0.0081 when
    Model 1 was first fitted, drifted past the claim on a later cube
    rebuild, and nothing compared a fitted number to MODEL_TARGETS. See
    MODEL_1_TOLERANCE / MODEL_2_TOLERANCE above for why the two
    specifications get different bounds.
    """
    model = cube["models"][key]
    tolerance = MODEL_1_TOLERANCE if key.endswith("model_1") else MODEL_2_TOLERANCE
    delta = abs(model["coef"] - paper_coef)
    assert delta <= tolerance, (
        f"{key}: fitted {model['coef']:.5f} vs published {paper_coef} "
        f"(delta {delta:.5f} > tolerance {tolerance})"
    )
    assert model["paper_coef"] == paper_coef, (
        f"{key}: cube's paper_coef {model['paper_coef']} disagrees with MODEL_TARGETS"
    )


def test_location_control_is_not_hollowed_out_by_collapsing(cube):
    """Model 2's area fixed effects must survive sparse-level collapsing.

    C(police_area) is only a real location control if most rows keep their
    own area. If a large share folded into OTHER the control would be
    hollow -- the same class of defect as using C(psa), which pooled 66
    real areas into 5 levels. The placebo (white-motorist) subsample is
    small enough that most of its areas do fall below the threshold, so it
    is excluded here and disclosed on the page instead.
    """
    for key in ["party_is_black.model_2", "has_black_passenger.model_2"]:
        share = cube["models"][key]["other_row_share"]["police_area"]
        assert share < 0.10, (
            f"{key}: {share:.1%} of rows landed in the OTHER area bucket -- "
            "the location control is being hollowed out by collapsing"
        )


def test_model_2_is_flagged_as_missing_the_seasonality_weight(cube):
    assert cube["models"]["party_is_black.model_2"]["seasonality_weight"] is False


def test_district_dimension_is_zero_padded_and_not_a_float_string(cube):
    """`district` must read '02'/'12', the way sibling cubes emit it.

    districtoccur is stored REAL in SQLite, so a naive str() gives '12.0'.
    The old _normalize_district tested isdigit() on that string, which is
    False for '12.0', making the helper a no-op that shipped '12.0' into
    this dimension.
    """
    idx = cube["dimensions"].index("district")
    values = sorted({r[idx] for r in cube["rows"]})
    assert values, "no district values in the cube"
    for value in values:
        assert value.isdigit() and len(value) == 2, f"malformed district {value!r}"
    assert "12" in values and "12.0" not in values, values


def test_both_lighting_states_appear(cube):
    lighting_idx = cube["dimensions"].index("lighting")
    values = {r[lighting_idx] for r in cube["rows"]}
    assert values == {"daylight", "dark"}, values


@pytest.fixture(scope="module")
def cube_outputs(cube):
    # `build()` returns (cube, scalars); the module-scoped `cube` fixture
    # above already ran the real build via subprocess, so reuse it rather
    # than building a second time.
    return cube, {}


def test_cube_carries_the_intraracial_block(cube_outputs):
    cube, _ = cube_outputs
    assert "intraracial" in cube
    block = cube["intraracial"]
    assert set(block) == {"sample", "models", "probabilities", "by_year"}


def test_intraracial_models_cover_all_six_outcomes(cube_outputs):
    cube, _ = cube_outputs
    assert set(cube["intraracial"]["models"]) == {
        "is_young", "is_male", "young_male",
        "young_female", "older_male", "older_female",
    }


def test_intraracial_probabilities_are_four_groups_times_two_lightings(cube_outputs):
    cube, _ = cube_outputs
    probs = cube["intraracial"]["probabilities"]
    assert len(probs) == 8
    assert {p["group"] for p in probs} == {
        "young_male", "young_female", "older_male", "older_female"
    }
    assert {p["lighting"] for p in probs} == {"daylight", "dark"}
    assert all(0 < p["pct"] < 100 for p in probs)


def test_intraracial_sample_records_the_papers_districts(cube_outputs):
    cube, _ = cube_outputs
    assert cube["intraracial"]["sample"]["districts"] == [
        "12", "14", "16", "18", "19", "22", "35", "39"
    ]


@pytest.mark.parametrize("outcome,paper_coef", sorted(INTRARACIAL_TARGETS.items()))
def test_intraracial_coefficients_stay_close_to_the_published_ones(cube_outputs, outcome, paper_coef):
    """Pin every intraracial coefficient against Hannon & Biddle (2025) Table 1.

    The four structural tests added alongside the intraracial block check
    which keys exist and that each probability is between 0 and 100 -- none
    of them compare a fitted number to the paper. That is exactly the gap
    that let has_black_passenger.model_1 drift 0.00905 away from
    MODEL_TARGETS while the page still claimed "within 0.008" (see
    test_fitted_coefficients_stay_close_to_the_published_ones above). This
    is the same guard for the 2025 block: without it, a quarterly cube
    rebuild could drift the reproduction away from Table 1 while the page
    goes on describing itself as a reproduction.
    """
    cube, _ = cube_outputs
    model = cube["intraracial"]["models"][outcome]
    delta = abs(model["coef"] - paper_coef)
    assert delta <= INTRARACIAL_TOLERANCE, (
        f"{outcome}: fitted {model['coef']:.5f} vs published {paper_coef} "
        f"(delta {delta:.5f} > tolerance {INTRARACIAL_TOLERANCE})"
    )
    assert model["converged"], f"{outcome}: model did not converge"


@pytest.mark.parametrize("outcome,paper_se", sorted(INTRARACIAL_SE_TARGETS.items()))
def test_intraracial_standard_errors_stay_close_to_the_published_ones(cube_outputs, outcome, paper_se):
    """Pin every intraracial standard error against Hannon & Biddle (2025) Table 1.

    SEs were the decisive evidence for using var_weights rather than
    freq_weights in fit_intraracial -- the two weighting schemes give
    near-identical coefficients but SEs an order of magnitude apart. A cube
    rebuild that silently reintroduced freq_weights would still pass every
    coefficient-only check above.
    """
    cube, _ = cube_outputs
    model = cube["intraracial"]["models"][outcome]
    delta = abs(model["se"] - paper_se)
    assert delta <= 0.01, (
        f"{outcome}: fitted se {model['se']:.5f} vs published {paper_se} "
        f"(delta {delta:.5f} > tolerance 0.01)"
    )


def test_intraracial_sample_n_matches_every_models_n(cube_outputs):
    # The page states cube["intraracial"]["sample"]["n"] as the sample the
    # coefficients come from. build_sample restricts on assigned_unit
    # presence (I7) so that no model's formula silently drops rows the
    # reported sample size still counts.
    cube, _ = cube_outputs
    sample_n = cube["intraracial"]["sample"]["n"]
    for outcome, model in cube["intraracial"]["models"].items():
        assert model["n"] == sample_n, f"{outcome}: model n={model['n']} != sample n={sample_n}"


def test_intraracial_probabilities_match_figure_1(cube_outputs):
    """Pin the four group/lighting predicted probabilities and their direction.

    A structural test asserting `0 < pct < 100` would pass even if daylight
    and dark were swapped for a group, which would invert the paper's
    finding while every number stayed "in range". The directional
    assertions here are what would actually catch that: young_male's
    daylight-exceeds-dark and older_female's dark-exceeds-daylight are the
    two facts that carry Hannon & Biddle's headline result.
    """
    cube, _ = cube_outputs
    probs = {(p["group"], p["lighting"]): p["pct"] for p in cube["intraracial"]["probabilities"]}

    expected = {
        ("young_male", "daylight"): 26.3,
        ("young_male", "dark"): 21.9,
        ("young_female", "daylight"): 9.0,
        ("young_female", "dark"): 9.4,
        ("older_male", "daylight"): 50.3,
        ("older_male", "dark"): 50.1,
        ("older_female", "daylight"): 14.9,
        ("older_female", "dark"): 18.5,
    }
    for key, paper_pct in expected.items():
        delta = abs(probs[key] - paper_pct)
        assert delta <= INTRARACIAL_PROBABILITY_TOLERANCE, (
            f"{key}: fitted {probs[key]} vs published {paper_pct} "
            f"(delta {delta:.2f} > tolerance {INTRARACIAL_PROBABILITY_TOLERANCE})"
        )

    # The paper's headline finding: young men are stopped LESS in the dark,
    # older women are stopped MORE in the dark. A swapped daylight/dark pair
    # would keep every value above inside tolerance while inverting this.
    assert probs[("young_male", "daylight")] > probs[("young_male", "dark")], (
        "young_male: daylight should exceed dark (paper's headline finding)"
    )
    assert probs[("older_female", "dark")] > probs[("older_female", "daylight")], (
        "older_female: dark should exceed daylight (paper's headline finding)"
    )


def test_existing_cube_keys_are_untouched(cube_outputs):
    # The 2026 analysis must not move because the 2025 one was added.
    cube, _ = cube_outputs
    assert set(cube["models"]) == {
        "party_is_black.model_1", "party_is_black.model_2",
        "has_black_passenger.model_1", "has_black_passenger.model_2",
        "placebo_white.model_1", "placebo_white.model_2",
    }
    assert len(cube["rows"]) > 0


# --- the year-by-year trend block ---------------------------------------


def test_by_year_covers_every_year_and_charted_outcome(cube_outputs):
    cube, _ = cube_outputs
    by_year = cube["intraracial"]["by_year"]
    assert by_year["years"] == [2021, 2022, 2023, 2024, 2025]
    assert by_year["window"] == {"start": "2021-01-01", "end": "2025-12-31"}

    seen = {(e["year"], e["outcome"]) for e in by_year["estimates"]}
    assert seen == {
        (year, outcome)
        for year in by_year["years"]
        for outcome in ("young_male", "young_female", "older_male", "older_female")
    }


def test_by_year_estimates_carry_a_bracketing_interval(cube_outputs):
    cube, _ = cube_outputs
    for e in cube["intraracial"]["by_year"]["estimates"]:
        label = f"{e['year']}/{e['outcome']}"
        assert e["converged"], label
        assert e["ci_lo"] < e["coef"] < e["ci_hi"], label
        assert e["n"] > 0, label


def test_by_year_reproduces_the_headline_effects_in_every_year(cube_outputs):
    """The point of the chart: neither headline finding rests on one year.

    Young men are stopped LESS once officers cannot see in; older women MORE.
    If a year ever flipped sign, the trend section's prose would be wrong.
    """
    cube, _ = cube_outputs
    by_outcome = {}
    for e in cube["intraracial"]["by_year"]["estimates"]:
        by_outcome.setdefault(e["outcome"], []).append(e)

    for e in by_outcome["young_male"]:
        assert e["ci_hi"] < 0, f"{e['year']} young_male interval reaches zero"
    for e in by_outcome["older_female"]:
        assert e["ci_lo"] > 0, f"{e['year']} older_female interval reaches zero"


def test_by_year_does_not_disturb_the_paper_window_block(cube_outputs):
    """The trend block is a sibling, never a replacement.

    The two samples differ (2021-2025 full years vs Jan 2022 - Aug 2025), so
    a merge would silently restate the reproduction's figures.
    """
    cube, _ = cube_outputs
    intraracial = cube["intraracial"]
    assert intraracial["sample"]["window_start"] == "2022-01-01"
    assert intraracial["sample"]["window_end"] == "2025-08-31"
    assert set(intraracial["models"]) == set(INTRARACIAL_TARGETS)

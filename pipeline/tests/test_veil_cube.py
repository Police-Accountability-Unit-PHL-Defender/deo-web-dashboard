"""Cube-shape tests for the veil builder."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

from veil.models import MODEL_TARGETS

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

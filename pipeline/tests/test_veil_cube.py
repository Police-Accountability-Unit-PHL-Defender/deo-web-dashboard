"""Cube-shape tests for the veil builder."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = PIPELINE_ROOT / "build_cubes.py"


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
        "driver_is_black.model_1", "driver_is_black.model_2",
        "has_black_passenger.model_1", "has_black_passenger.model_2",
        "placebo_white.model_1",
    ]:
        assert key in models, f"missing {key}"
        assert "coef" in models[key] and "n" in models[key]


def test_main_findings_have_the_expected_sign(cube):
    """Darkness should reduce the odds for both headline models."""
    for key in ["driver_is_black.model_1", "has_black_passenger.model_1"]:
        assert cube["models"][key]["coef"] < 0, key


def test_model_2_is_flagged_as_missing_the_seasonality_weight(cube):
    assert cube["models"]["driver_is_black.model_2"]["seasonality_weight"] is False


def test_both_lighting_states_appear(cube):
    lighting_idx = cube["dimensions"].index("lighting")
    values = {r[lighting_idx] for r in cube["rows"]}
    assert values == {"daylight", "dark"}, values

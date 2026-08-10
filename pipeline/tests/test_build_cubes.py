"""Integration test for build_cubes.py.

Runs the script as a subprocess against the latest available DB and
verifies the resulting stops cube + scalars are well-formed.
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / "build_cubes.py"


@pytest.fixture()
def cube_outputs(tmp_path: Path) -> tuple[dict, dict]:
    out_dir = tmp_path / "cubes"
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--only", "stops", "--out", str(out_dir)],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, (
        f"build_cubes.py failed:\nstdout={result.stdout}\nstderr={result.stderr}"
    )
    cube = json.loads((out_dir / "stops.json").read_text())
    scalars = json.loads((out_dir / "scalars.json").read_text())
    return cube, scalars


def test_cube_structure(cube_outputs):
    cube, _scalars = cube_outputs
    assert cube["dimensions"] == [
        "quarter",
        "location",
        "race",
        "gender",
        "age_range",
    ]
    assert cube["measures"] == [
        "n_stopped",
        "n_searched",
        "n_frisked",
        "n_intruded",
        "n_arrested",
        "n_contraband",
        "n_people_in_stopped_vehicles",
    ]


def test_cube_has_many_rows_and_correct_width(cube_outputs):
    cube, _scalars = cube_outputs
    rows = cube["rows"]
    assert len(rows) > 1000, f"expected >1000 rows, got {len(rows)}"
    expected_width = len(cube["dimensions"]) + len(cube["measures"])
    for r in rows[:200]:
        assert len(r) == expected_width, (
            f"row width mismatch: {len(r)} != {expected_width}: {r}"
        )
    # Spot-check the tail too
    for r in rows[-50:]:
        assert len(r) == expected_width


def test_scalars_have_baselines(cube_outputs):
    _cube, scalars = cube_outputs
    expected_keys = {
        "stops_monthly_avg_2014_2018",
        "stops_monthly_avg_2019",
        "stops_monthly_avg_2020Q2_2021Q1",
    }
    assert expected_keys.issubset(scalars.keys())
    for k in expected_keys:
        assert "*" in scalars[k], f"missing citywide ('*') in {k}"
        assert scalars[k]["*"] > 0, f"citywide value not positive in {k}: {scalars[k]['*']}"

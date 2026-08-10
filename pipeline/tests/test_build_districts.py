"""Tests for build_districts.py.

The existing 21 districts must round-trip unchanged apart from the new
`black` key — this file is a published artifact, so a silent shift in any
existing value is a regression, not an update.
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / "build_districts.py"
PUBLISHED = REPO_ROOT.parent / "public" / "cubes" / "districts.json"


@pytest.fixture()
def built(tmp_path: Path) -> dict:
    out = tmp_path / "districts.json"
    subprocess.run(
        [sys.executable, str(SCRIPT), "--out", str(out)],
        check=True,
        cwd=REPO_ROOT,
    )
    return json.loads(out.read_text())


def test_covers_all_21_districts(built):
    assert len(built) == 21


def test_district_codes_are_zero_padded(built):
    assert "01" in built
    assert "1" not in built


def test_matches_the_assets_md_spot_check(built):
    # PSAs 011 + 012 sum to district 01. Recorded in ASSETS.md.
    assert built["01"]["total"] == 38405
    assert built["01"]["white"] == 20664
    assert built["01"]["whiteness"] == 53.8


def test_adds_black_population(built):
    # District 25 is 3.8% white; its Black population must be substantial.
    assert built["25"]["black"] > 0
    assert built["12"]["black"] > built["12"]["white"]


def test_black_never_exceeds_total(built):
    for code, d in built.items():
        assert d["black"] <= d["total"], code


def test_existing_published_values_are_unchanged(built):
    published = json.loads(PUBLISHED.read_text())
    for code, old in published.items():
        assert built[code]["total"] == old["total"], code
        assert built[code]["white"] == old["white"], code
        assert built[code]["whiteness"] == old["whiteness"], code

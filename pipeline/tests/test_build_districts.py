"""Tests for build_districts.py.

The existing 21 districts must round-trip unchanged apart from the new
`black` key — this file is a published artifact, so a silent shift in any
existing value is a regression, not an update.

`tests/fixtures/districts_hand_maintained.json` is a pinned snapshot of the
old, hand-maintained public/cubes/districts.json (from commit 72e6440, the
last version not produced by this script). It is the durable anchor for
`test_existing_published_values_are_unchanged`. It must NOT be regenerated
from build_districts.py output — comparing the script's output against
itself would make that test pass trivially regardless of correctness. It
has no `black` key (that field didn't exist in the hand-maintained file),
so the test only compares `total`, `white`, and `whiteness`.
"""

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / "build_districts.py"
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "districts_hand_maintained.json"

_spec = importlib.util.spec_from_file_location("build_districts", SCRIPT)
build_districts = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(build_districts)


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
    pinned = json.loads(FIXTURE.read_text())
    for code, old in pinned.items():
        assert built[code]["total"] == old["total"], code
        assert built[code]["white"] == old["white"], code
        assert built[code]["whiteness"] == old["whiteness"], code


def test_unmatched_psa_raises_instead_of_silently_undercounting(tmp_path):
    # A PSA_NUM present in the population CSV but absent from the crosswalk
    # must fail the build loudly, not silently drop that population.
    psa_csv = tmp_path / "police_service_area.csv"
    geo_csv = tmp_path / "police_geographies.csv"

    psa_csv.write_text(
        "PSA_NUM,total,hispanic_or_latino,white,black,american_indian,asian,unknown\n"
        "011,29949,2007,13930,7520,38,5362,1092\n"
        "999,100,0,50,50,0,0,0\n"
    )
    geo_csv.write_text(
        "full_psa_num,psa,district,division\n"
        "011,1,01,SPD\n"
    )

    with pytest.raises(ValueError, match="999"):
        build_districts.build(psa_csv=psa_csv, geo_csv=geo_csv)

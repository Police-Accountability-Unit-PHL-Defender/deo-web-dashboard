"""Builds public/cubes/districts.json from the 2020 Census PSA table.

districts.json is per-district resident demographics, used by the reasons and
neighborhoods pages to split districts into majority-white and majority-non-
white, and to express stop rates per resident.

This is static census data — it does not change on a quarterly data update.
The script exists so the artifact is reproducible rather than hand-maintained.

Usage:
    uv run python build_districts.py [--out PATH]
"""

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent
PSA_CSV = REPO_ROOT / "data" / "demographics" / "police_service_area.csv"
GEO_CSV = REPO_ROOT / "data" / "demographics" / "police_geographies.csv"
DEFAULT_OUT = REPO_ROOT.parent / "public" / "cubes" / "districts.json"

FIELDS = ("total", "white", "black")


def build() -> dict:
    psa_to_district = {}
    with GEO_CSV.open() as fh:
        for row in csv.DictReader(fh):
            psa_to_district[row["full_psa_num"]] = row["district"]

    totals = defaultdict(lambda: dict.fromkeys(FIELDS, 0))
    with PSA_CSV.open() as fh:
        for row in csv.DictReader(fh):
            district = psa_to_district.get(row["PSA_NUM"])
            if district is None:
                continue
            code = district.zfill(2)
            for field in FIELDS:
                totals[code][field] += int(row[field])

    out = {}
    for code in sorted(totals):
        d = totals[code]
        out[code] = {
            "total": d["total"],
            "white": d["white"],
            "black": d["black"],
            "whiteness": round(100 * d["white"] / d["total"], 1),
        }
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(build(), indent=2) + "\n")
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()

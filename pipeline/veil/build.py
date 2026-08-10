"""Build the car_ped_stops_veil table from a backup zip.

Standalone on purpose: re-runnable without the 20-40 minute full DB
rebuild, and isolated from update_db.py's CSV-name dispatch.

Usage:
    python -m veil.build --zip data/car_ped_stops_<ts>.zip --db data/open_data_philly_<date>.db
"""

import argparse
import re
import sqlite3
import zipfile
from contextlib import closing
from pathlib import Path

import pandas as pd

from veil.sample import (
    apply_paper_restrictions,
    classify_lighting,
    dedupe_people,
    roll_up_stops,
)
from veil.sun import load_sun_times

TABLE = "car_ped_stops_veil"

USE_COLS = [
    "objectid", "datetimeoccur", "location", "districtoccur", "psa",
    "assigned_unit", "gender", "race", "age", "mvc_code",
    "individual_arrested", "individual_frisked", "ticket_issued",
]

OUT_COLS = [
    "ts_local", "stop_date", "clock_minutes", "year", "dow", "month",
    "is_summer", "era", "districtoccur", "psa", "assigned_unit",
    "lighting", "obscured_view", "party_race", "party_size", "group_travel",
    "n_frisked", "n_ticketed",
]


def _year_of(name: str) -> int | None:
    m = re.search(r"year_(\d{4})\.csv$", name)
    return int(m.group(1)) if m else None


def _stop_csv_names(zf: zipfile.ZipFile) -> list[str]:
    return [
        n for n in zf.namelist()
        if "car_ped_stops/" in n and n.endswith(".csv") and _year_of(n) is not None
    ]


def build_veil_table(zip_path: Path, db_path: Path, years: list[int] | None = None) -> int:
    sun = load_sun_times()
    frames = []

    with zipfile.ZipFile(zip_path) as zf:
        for name in sorted(_stop_csv_names(zf)):
            year = _year_of(name)
            if years is not None and year not in years:
                continue
            with zf.open(name) as fh:
                # Non-MVC rows are kept through the rollup and dropped by
                # apply_paper_restrictions, which needs them to decide is_mvc.
                #
                # mvc_code needs a converter: the literal string "NA" is a
                # real value in this column, meaning "genuine MVC stop whose
                # specific code went unrecorded" (stoptype='vehicle',
                # mvc_reason='Other'). It is NOT the same as a true blank
                # (no reason recorded at all). pandas' default NA-sentinel
                # handling treats the string "NA" as null and silently
                # coerces it to NaN, which makes is_mvc come out False and
                # drops ~11% of the analytic sample. The converter bypasses
                # that sentinel handling for this column only, so "NA"
                # survives as a string. Do not "clean this up" by removing
                # the converter.
                df = pd.read_csv(
                    fh,
                    usecols=USE_COLS,
                    low_memory=False,
                    converters={"mvc_code": lambda v: v},
                )
            df["datetimeoccur"] = pd.to_datetime(df.datetimeoccur, utc=True)
            df["ts_local"] = (
                df.datetimeoccur.dt.tz_convert("America/New_York").dt.tz_localize(None)
            )
            df = dedupe_people(df)
            stops = classify_lighting(roll_up_stops(df), sun)
            frames.append(apply_paper_restrictions(stops))
            print(f"  {name}: {len(frames[-1])} analytic stops")

    out = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=OUT_COLS)
    out = out[OUT_COLS]
    out["ts_local"] = out.ts_local.astype(str)
    out["stop_date"] = out.stop_date.astype(str)

    with closing(sqlite3.connect(str(db_path))) as conn:
        with conn:
            out.to_sql(TABLE, conn, if_exists="replace", index=False)
    return len(out)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", type=Path, required=True)
    parser.add_argument("--db", type=Path, required=True)
    parser.add_argument(
        "--years", type=str, default=None,
        help="Comma-separated years to include (default: all in the zip)",
    )
    args = parser.parse_args()
    years = [int(y) for y in args.years.split(",")] if args.years else None
    n = build_veil_table(args.zip, args.db, years)
    print(f"wrote {n} rows to {TABLE} in {args.db}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

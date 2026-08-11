"""Build the car_ped_stops_veil_intraracial table from a backup zip.

Sole-occupant stops only. The existing `car_ped_stops_veil` table (see
`veil/build.py`) discards driver age and gender at `roll_up_stops`, before
any filter runs, so it cannot serve an analysis of the age/gender spread.
This module makes an independent pass over the same zip, grouping person
rows by (datetimeoccur, location) and keeping only groups of exactly one
occupant -- that person is unambiguously the driver.

Standalone and re-runnable, mirroring veil/build.py's structure. Does not
modify roll_up_stops, OUT_COLS, apply_paper_restrictions, build_veil_table
or the existing car_ped_stops_veil table.

Usage:
    python -m veil.build_intraracial --zip data/car_ped_stops_<ts>.zip --db data/open_data_philly_<date>.db
"""

import argparse
import sqlite3
import zipfile
from contextlib import closing
from pathlib import Path

import pandas as pd

from veil.build import _stop_csv_names, _year_of
from veil.sample import classify_lighting, dedupe_people, police_area_key
from veil.sun import load_sun_times

TABLE_INTRARACIAL = "car_ped_stops_veil_intraracial"

USE_COLS = [
    "objectid", "datetimeoccur", "location", "districtoccur", "psa",
    "assigned_unit", "race", "age", "gender", "mvc_code",
]

OUT_COLS = [
    "ts_local", "stop_date", "location", "clock_minutes", "year", "dow",
    "month", "is_summer", "districtoccur", "psa", "police_area",
    "assigned_unit", "lighting", "race", "age", "gender", "is_mvc",
]

YEARS = list(range(2021, 2027))


def _roll_up_sole_occupants(df: pd.DataFrame) -> pd.DataFrame:
    """Collapse person rows into one row per stop, keeping only sole occupants.

    Groups on (datetimeoccur, location) as roll_up_stops does. A group of
    exactly one person row means that person is unambiguously the stop's
    sole occupant -- their age, gender and race carry straight through.
    """
    df = df.copy()
    df["_is_mvc"] = (df.mvc_code.notna() & (df.mvc_code != "")).astype(int)

    grouped = df.groupby(["datetimeoccur", "location"], dropna=False)
    party_size = grouped["objectid"].transform("size")
    sole = df[party_size == 1].copy()

    sole = sole.rename(columns={"_is_mvc": "is_mvc"})
    return sole[[
        "datetimeoccur", "location", "districtoccur", "psa", "assigned_unit",
        "race", "age", "gender", "is_mvc", "ts_local",
    ]]


def build_intraracial_table(zip_path: Path, db_path: Path) -> int:
    sun = load_sun_times()
    frames = []

    with zipfile.ZipFile(zip_path) as zf:
        for name in sorted(_stop_csv_names(zf)):
            year = _year_of(name)
            if year not in YEARS:
                continue
            with zf.open(name) as fh:
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
            stops = _roll_up_sole_occupants(df)
            stops = classify_lighting(stops, sun)
            stops["police_area"] = [
                police_area_key(d, p)
                for d, p in zip(stops.districtoccur, stops.psa)
            ]
            stops["year"] = stops.ts_local.dt.year
            stops["dow"] = stops.ts_local.dt.dayofweek
            stops["month"] = stops.ts_local.dt.month
            stops["is_summer"] = stops.month.isin([6, 7, 8]).astype(int)
            frames.append(stops)
            print(f"  {name}: {len(stops)} sole-occupant stops")

    out = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=OUT_COLS)
    out = out[OUT_COLS]
    out["ts_local"] = out.ts_local.astype(str)
    out["stop_date"] = out.stop_date.astype(str)

    with closing(sqlite3.connect(str(db_path))) as conn:
        with conn:
            out.to_sql(TABLE_INTRARACIAL, conn, if_exists="replace", index=False)
    return len(out)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", type=Path, required=True)
    parser.add_argument("--db", type=Path, required=True)
    args = parser.parse_args()
    n = build_intraracial_table(args.zip, args.db)
    print(f"wrote {n} rows to {TABLE_INTRARACIAL} in {args.db}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

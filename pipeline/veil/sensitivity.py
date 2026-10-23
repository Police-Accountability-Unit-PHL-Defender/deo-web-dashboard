"""Prepare the main pre/post comparison and MVC/occupancy sensitivity fits.

Run from pipeline: python -m veil.sensitivity --zip data/<backup>.zip
Groups recorded people on (UTC timestamp, location), as the existing pipeline
does. Recorded occupants are not a verified census of people in the vehicle.
"""
import argparse
import json
import pickle
import sqlite3
import zipfile
from pathlib import Path

import pandas as pd

from veil.build import _stop_csv_names
from veil.intraracial import build_sample
from veil.models import fit_group_darkness_difference
from veil.sample import dedupe_people, classify_lighting, police_area_key
from veil.sun import load_sun_times

BLACK = "Black - Non-Latino"
WHITE = "White - Non-Latino"
DISTRICTS = tuple(f"{i:02}" for i in (1, 2, 3, 5, 6, 7, 8, 9, 12, 14, 15, 16, 17, 18, 19, 22, 24, 25, 26, 35, 39))
COLS = ["objectid", "datetimeoccur", "location", "stoptype", "districtoccur", "psa", "assigned_unit", "race", "age", "gender", "mvc_code"]


def rollup(df):
    """Keep counts before restricting race/age, so excluded people cannot vanish."""
    df = df.copy()
    df["n_black"] = (df.race == BLACK).astype(int)
    df["n_white"] = (df.race == WHITE).astype(int)
    df["complete_adult"] = (df.age.ge(18) & df.gender.isin(["Male", "Female"]) & df.race.notna()).astype(int)
    df["is_mvc"] = (df.mvc_code.notna() & df.mvc_code.ne("")).astype(int)
    # A high sentinel lets groupby.min choose the same lexicographically first
    # non-null unit as the published rollup without a Python call per stop.
    df["assigned_unit"] = df.assigned_unit.fillna("\uffff")
    out = df.groupby(["datetimeoccur", "location"], dropna=False).agg(
        ts_local=("ts_local", "first"), districtoccur=("districtoccur", "min"),
        psa=("psa", "min"), assigned_unit=("assigned_unit", "min"),
        party_size=("objectid", "size"), n_black=("n_black", "sum"), n_white=("n_white", "sum"),
        complete_adult=("complete_adult", "min"), is_mvc=("is_mvc", "max"),
        age=("age", "first"), gender=("gender", "first"),
    ).reset_index()
    out["assigned_unit"] = out.assigned_unit.replace("\uffff", None)
    out["police_area"] = [police_area_key(d, p) for d, p in zip(out.districtoccur, out.psa)]
    return out


def archive_end_year(zip_path):
    """Last full local calendar year supported by the archive, not today's clock."""
    with zipfile.ZipFile(zip_path) as zf:
        name = next(n for n in zf.namelist() if n.endswith("car_ped_stops/summary.json"))
        last = pd.Timestamp(json.loads(zf.read(name))["last_dt"]).tz_convert("America/New_York")
    return last.year - 1


def extract(zip_path):
    end_year = archive_end_year(zip_path)
    frames = []
    with zipfile.ZipFile(zip_path) as zf:
        for name in sorted(_stop_csv_names(zf)):
            with zf.open(name) as f:
                df = pd.read_csv(f, usecols=COLS, converters={"mvc_code": lambda v: v}, low_memory=False)
            # Without the MVC gate, explicitly exclude pedestrian stops.
            df = dedupe_people(df[df.stoptype == "vehicle"])
            df["datetimeoccur"] = pd.to_datetime(df.datetimeoccur, utc=True)
            df["ts_local"] = df.datetimeoccur.dt.tz_convert("America/New_York").dt.tz_localize(None)
            # Retain all rows in a stop before deciding whether its occupants qualify.
            minute = df.ts_local.dt.hour * 60 + df.ts_local.dt.minute
            df = df[minute.between(16 * 60, 22 * 60) & df.ts_local.dt.year.between(2014, end_year)]
            frames.append(rollup(df))
            print(f"Read {name}: {len(frames[-1]):,} evening vehicle stops", flush=True)
    stops = pd.concat(frames, ignore_index=True)
    assert not stops.duplicated(["datetimeoccur", "location"]).any()
    stops = classify_lighting(stops, load_sun_times())
    stops["year"] = stops.ts_local.dt.year
    stops["dow"] = stops.ts_local.dt.dayofweek
    stops["is_summer"] = stops.ts_local.dt.month.isin([6, 7, 8]).astype(int)
    return stops


def outcome(stops, rule):
    if rule == "any_black":
        return stops.n_black.gt(0).astype(int)
    if rule == "majority_black":
        # Exactly half is NOT a majority; retained as outcome 0.
        return (2 * stops.n_black > stops.party_size).astype(int)
    if rule == "all_black":
        return stops.n_black.eq(stops.party_size).astype(int)
    raise ValueError(rule)


COMPARISONS = [("sole", "any_black"), ("all_occupancies", "any_black"),
               ("all_occupancies", "majority_black"), ("all_occupancies", "all_black")]
MAIN_KEY = "black_white/sole/any_black/all_vehicle"


def prepare_sample(stops, universe, end_year):
    base = stops[stops.complete_adult.eq(1)].copy()
    if universe == "black_white":
        base = base[base.n_black.add(base.n_white).eq(base.party_size)].copy()
    # build_sample provides the exact same time window, geography, controls,
    # and seasonality weights. Outcome is overwritten below; MVC filtering
    # is deliberately postponed so both variants share one preparation.
    base["has_mvc"] = base.is_mvc
    base["is_mvc"] = 1
    base["race"] = BLACK
    base = build_sample(base, load_sun_times(), window=("2014-01-01", f"{end_year}-12-31"), races=(BLACK, WHITE), districts=DISTRICTS)
    base = base[base.year.ne(2020)].copy()
    base["after_driving_equality"] = base.ts_local.ge(pd.Timestamp("2022-03-03")).astype(int)
    return base


def fit_specs(stops, universes, comparisons=COMPARISONS, end_year=2025, done=()):
    for universe in universes:
        base = prepare_sample(stops, universe, end_year)
        for occupancy, rule in comparisons:
            for require_mvc in (True, False):
                sample = base.copy()
                if occupancy == "sole":
                    sample = sample[sample.party_size.eq(1)].copy()
                if require_mvc:
                    sample = sample[sample.has_mvc.eq(1)].copy()
                sample["outcome"] = outcome(sample, rule)
                key = f"{universe}/{occupancy}/{rule}/{'mvc' if require_mvc else 'all_vehicle'}"
                if key in done:
                    continue
                print(f"Fitting {key}: {len(sample):,} stops", flush=True)
                result = fit_group_darkness_difference(sample, "outcome", "after_driving_equality")
                if not result.get("converged"):
                    raise RuntimeError(f"{key}: {result}")
                yield {"key": key, "universe": universe, "occupancy": occupancy,
                                "rule": rule, "require_mvc": require_mvc,
                                "multi_person_stops": int(sample.party_size.gt(1).sum()),
                                "half_black_stops": int((2 * sample.n_black == sample.party_size).sum()),
                                "result": result}


def comparison_bundle(results, end_year, source_archive):
    main = next(r["result"] for r in results if r["key"] == MAIN_KEY)
    return {"version": 1, "main": main, "sensitivity": results,
            "years": [y for y in range(2014, end_year + 1) if y != 2020],
            "excluded_years": [2020], "effective_date": "2022-03-03",
            "window_start": "2014-01-01", "window_end": f"{end_year}-12-31",
            "black_definition": BLACK, "source_archive": source_archive}


def build_table(zip_path, db_path):
    stops = extract(zip_path)
    stops["ts_local"] = stops.ts_local.astype(str)
    stops["datetimeoccur"] = stops.datetimeoccur.astype(str)
    with sqlite3.connect(db_path) as conn:
        stops.to_sql("car_ped_stops_veil_comparison", conn, if_exists="replace", index=False)
        pd.DataFrame([{"end_year": archive_end_year(zip_path), "source_archive": zip_path.name}]).to_sql(
            "veil_comparison_metadata", conn, if_exists="replace", index=False)
    return len(stops)


def run(stops, out_path, all_races=False, universe=None, rule=None, end_year=2025):
    results = json.loads(out_path.read_text())["results"] if out_path.exists() else []
    done = {r["key"] for r in results}
    comparisons = [(o, r) for o, r in COMPARISONS if not rule or r == rule]
    universes = [universe] if universe else (["black_white", "all_races"] if all_races else ["black_white"])
    for result in fit_specs(stops, universes, comparisons, end_year, done):
        results.append(result)
        out_path.write_text(json.dumps({"years": [y for y in range(2014, end_year + 1) if y != 2020], "results": results}, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", type=Path, required=True)
    parser.add_argument("--db", type=Path, help="Build the comparison table for quarterly cube refreshes")
    parser.add_argument("--cache", type=Path, default=Path("/tmp/deo-veil-sensitivity.pkl"))
    parser.add_argument("--out", type=Path, default=Path("../reports/veil-sensitivity.json"))
    parser.add_argument("--all-races", action="store_true")
    parser.add_argument("--universe", choices=("black_white", "all_races"))
    parser.add_argument("--rule", choices=("any_black", "majority_black", "all_black"))
    args = parser.parse_args()
    if args.db:
        build_table(args.zip, args.db)
        return
    fingerprint = (str(args.zip.resolve()), args.zip.stat().st_size, args.zip.stat().st_mtime_ns)
    cached = pickle.loads(args.cache.read_bytes()) if args.cache.exists() else None
    if cached and cached[0] == fingerprint:
        stops = cached[1]
    else:
        stops = extract(args.zip)
        args.cache.write_bytes(pickle.dumps((fingerprint, stops)))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    run(stops, args.out, all_races=args.all_races, universe=args.universe, rule=args.rule, end_year=archive_end_year(args.zip))


if __name__ == "__main__":
    main()

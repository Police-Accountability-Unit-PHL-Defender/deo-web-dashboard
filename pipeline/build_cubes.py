#!/usr/bin/env python3
"""Build static JSON cubes from the open-data-philly SQLite database.

Usage:
    python build_cubes.py [--db PATH] [--out PATH] [--only TOPIC[,TOPIC...]]

If --db is not provided, the most recently-modified
pipeline/data/open_data_philly_*.db file is used.

Default --out is public/cubes, alongside the dashboard's other static
assets.

Each topic builder writes one cube file (e.g. ``stops.json``) and may
contribute to ``scalars.json``. Scalars from existing topics are
preserved on merge.
"""

import argparse
import glob
import json
import os
import sys
import sqlite3
from pathlib import Path


HERE = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = HERE / "data"
DEFAULT_OUT_DIR = HERE.parent / "public" / "cubes"


def discover_latest_db(data_dir: Path) -> Path:
    candidates = sorted(
        glob.glob(str(data_dir / "open_data_philly_*.db")),
        key=os.path.getmtime,
        reverse=True,
    )
    if not candidates:
        raise SystemExit(
            f"No open_data_philly_*.db found in {data_dir}. "
            "Pass --db to point at one explicitly."
        )
    return Path(candidates[0])


def merge_scalars(out_path: Path, new_scalars: dict) -> dict:
    """Merge scalar keys from this run with any existing scalars.json.

    Existing keys not produced by this run are preserved so multiple
    topic builders can contribute scalars independently.
    """
    existing: dict = {}
    if out_path.exists():
        try:
            existing = json.loads(out_path.read_text())
        except Exception:
            existing = {}
    # Shallow-merge at top level: new wins for overlapping keys.
    merged = dict(existing)
    merged.update(new_scalars)
    return merged


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument(
        "--only",
        type=str,
        default=None,
        help="Comma-separated list of topics to build (default: all known)",
    )
    args = parser.parse_args(argv)

    db_path = args.db if args.db else discover_latest_db(DEFAULT_DATA_DIR)
    if not db_path.exists():
        raise SystemExit(f"DB not found: {db_path}")

    out_dir: Path = args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    # Import here so missing optional deps don't break --help.
    from cube_builders import stops as stops_builder
    from cube_builders import reasons as reasons_builder
    from cube_builders import safety as safety_builder

    BUILDERS = {
        "stops": stops_builder.build,
        "reasons": reasons_builder.build,
        "safety": safety_builder.build,
    }

    requested = (
        [t.strip() for t in args.only.split(",") if t.strip()]
        if args.only
        else list(BUILDERS.keys())
    )
    unknown = [t for t in requested if t not in BUILDERS]
    if unknown:
        raise SystemExit(f"Unknown topic(s): {unknown}. Known: {list(BUILDERS)}")

    print(f"DB:  {db_path}", file=sys.stderr)
    print(f"OUT: {out_dir}", file=sys.stderr)
    print(f"TOPICS: {requested}", file=sys.stderr)

    scalars_path = out_dir / "scalars.json"
    all_new_scalars: dict = {}

    with sqlite3.connect(str(db_path)) as conn:
        for topic in requested:
            print(f"-- building {topic} --", file=sys.stderr)
            cube, topic_scalars = BUILDERS[topic](conn)
            cube_path = out_dir / f"{topic}.json"
            cube_path.write_text(json.dumps(cube, separators=(",", ":")))
            print(
                f"  wrote {cube_path} ({len(cube.get('rows', []))} rows, "
                f"{cube_path.stat().st_size} bytes)",
                file=sys.stderr,
            )
            if topic_scalars:
                all_new_scalars.update(topic_scalars)

    if all_new_scalars:
        merged = merge_scalars(scalars_path, all_new_scalars)
        scalars_path.write_text(json.dumps(merged, separators=(",", ":")))
        print(
            f"  wrote {scalars_path} (keys: {list(merged.keys())})",
            file=sys.stderr,
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())

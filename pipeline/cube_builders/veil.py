"""Veil-of-darkness cube builder.

Reads ``car_ped_stops_veil`` and emits a descriptive cube plus a ``models``
block holding fitted regression results.

Both ``n_stops`` and ``n_motorists`` are carried because the paper's figures
use different denominators: Tables 1-2 are per stop, Figures 2-3 per
motorist, Figure 4 per occupant. A chart that mixes them up silently
reports the wrong number -- Figure 3's headline is 25.1% per motorist but
14.2% per stop.
"""

import sqlite3

import pandas as pd

from veil.models import MODEL_TARGETS, fit_vod

CUBE_VERSION = 1

DIMENSIONS = ["year", "era", "clock_bin", "lighting", "party_race", "group_travel", "district"]
MEASURES = ["n_stops", "n_motorists", "n_frisked", "n_ticketed"]

BIN_MINUTES = 15
BLACK = "Black - Non-Latino"
WHITE = "White - Non-Latino"


def _normalize_district(d) -> str:
    if d is None:
        return ""
    s = str(d).strip()
    return "0" + s if s.isdigit() and len(s) == 1 else s


def _descriptive_rows(df: pd.DataFrame) -> list[list]:
    df = df.copy()
    df["clock_bin"] = (df.clock_minutes // BIN_MINUTES) * BIN_MINUTES
    df["district"] = df.districtoccur.map(_normalize_district)
    grouped = df.groupby(
        ["year", "era", "clock_bin", "lighting", "party_race", "group_travel", "district"],
        dropna=False,
    ).agg(
        n_stops=("party_size", "size"),
        n_motorists=("party_size", "sum"),
        n_frisked=("n_frisked", "sum"),
        n_ticketed=("n_ticketed", "sum"),
    ).reset_index()

    return [
        [
            int(r.year), str(r.era), int(r.clock_bin), str(r.lighting),
            str(r.party_race), int(r.group_travel), str(r.district),
            int(r.n_stops), int(r.n_motorists), int(r.n_frisked), int(r.n_ticketed),
        ]
        for r in grouped.itertuples()
    ]


def _fit_all(df: pd.DataFrame) -> dict:
    models: dict = {}

    inter = df.copy()
    inter["driver_is_black"] = (inter.party_race == BLACK).astype(int)

    black = df[df.party_race == BLACK].copy()
    black["has_black_passenger"] = black.group_travel

    white = df[df.party_race == WHITE].copy()
    white["has_white_passenger"] = white.group_travel

    jobs = [
        ("driver_is_black", inter, "driver_is_black"),
        ("has_black_passenger", black, "has_black_passenger"),
        ("placebo_white", white, "has_white_passenger"),
    ]
    for name, data, outcome in jobs:
        for full in (False, True):
            result = fit_vod(data, outcome=outcome, full_controls=full)
            key = f"{name}.{result['spec']}"
            result["seasonality_weight"] = False
            result["paper_coef"] = MODEL_TARGETS.get(key)
            models[key] = result
    return models


def build(conn: sqlite3.Connection) -> tuple[dict, dict]:
    df = pd.read_sql("SELECT * FROM car_ped_stops_veil", conn)
    if df.empty:
        raise SystemExit(
            "car_ped_stops_veil is empty or missing. Run: python -m veil.build "
            "--zip data/<backup>.zip --db data/<db>.db"
        )

    replication = df[df.year.between(2021, 2024)]
    cube = {
        "version": CUBE_VERSION,
        "dimensions": DIMENSIONS,
        "measures": MEASURES,
        "rows": _descriptive_rows(df),
        "models": _fit_all(replication),
    }
    return cube, {}

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

from veil.intraracial import DISTRICTS, OUTCOMES, WINDOW, build_sample
from veil.models import MODEL_TARGETS, fit_intraracial, fit_vod, predicted_probabilities
from veil.sample import int_code
from veil.sun import load_sun_times

CUBE_VERSION = 1

DIMENSIONS = ["year", "era", "clock_bin", "lighting", "party_race", "group_travel", "district"]
MEASURES = ["n_stops", "n_motorists", "n_frisked", "n_ticketed"]

BIN_MINUTES = 15
BLACK = "Black - Non-Latino"
WHITE = "White - Non-Latino"


def _normalize_district(d) -> str:
    """Zero-pad a district code to two digits: 2.0 -> "02", 12.0 -> "12".

    ``districtoccur`` is stored REAL in SQLite -- pandas infers a numeric
    dtype from the CSV and reads the zero-padded text "02" as 2.0 -- so a
    bare ``str()`` yields "2.0", whose ``isdigit()`` is False. An earlier
    version of this helper tested ``isdigit()`` directly on that string and
    was therefore a no-op, emitting "12.0" into the cube's `district`
    dimension where its sibling builders emit "12". Route through
    ``veil.sample.int_code`` so the float representation is stripped first.
    """
    code = int_code(d)
    return code.zfill(2) if code else ""


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


def _time_rounding(df: pd.DataFrame) -> dict:
    """How heavily officers round the recorded stop time.

    The page tells readers that logged times are rounded, which is why the
    ~30-minute band between sunset and full dusk is excluded. That claim
    needs a number attached to it, and the number has to come from our own
    data rather than being asserted in the page's voice: `clock_minutes` is
    minute-level, so this cannot be recomputed from the 15-minute
    `clock_bin` dimension and has to be measured here.
    """
    minutes = df.clock_minutes
    return {
        "n": int(len(minutes)),
        "pct_multiple_of_5": float(100 * (minutes % 5 == 0).mean()),
        "pct_multiple_of_15": float(100 * (minutes % 15 == 0).mean()),
    }


def _fit_all(df: pd.DataFrame) -> dict:
    models: dict = {}

    inter = df.copy()
    # `party_is_black`, not `driver_is_black`: no driver is ever identified in
    # this sample (see veil/sample.py). Every occupant of a retained stop is a
    # young man of the same race, so the outcome is a property of the party.
    inter["party_is_black"] = (inter.party_race == BLACK).astype(int)

    black = df[df.party_race == BLACK].copy()
    black["has_black_passenger"] = black.group_travel

    white = df[df.party_race == WHITE].copy()
    white["has_white_passenger"] = white.group_travel

    jobs = [
        ("party_is_black", inter, "party_is_black"),
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


def _intraracial(conn: sqlite3.Connection) -> dict:
    """Hannon & Biddle (2025) intraracial age/gender models and probabilities.

    Reads the dedicated `car_ped_stops_veil_intraracial` table -- a
    differently-filtered, differently-sampled table than `car_ped_stops_veil`
    above -- and must never have its rows mixed into the 2026 group-travel
    cube's `rows`/`models`/`time_rounding` keys.
    """
    stops = pd.read_sql("SELECT * FROM car_ped_stops_veil_intraracial", conn)
    sun = load_sun_times()
    df = build_sample(stops, sun)

    models = {}
    for outcome in OUTCOMES:
        result = fit_intraracial(df, outcome)
        models[outcome] = {
            "coef": result["coef"],
            "se": result["se"],
            "odds_ratio": result["odds_ratio"],
            "p_value": result["p_value"],
            "n": result["n"],
            "converged": result["converged"],
        }

    probabilities = []
    for group in ("young_male", "young_female", "older_male", "older_female"):
        probs = predicted_probabilities(df, group)
        probabilities.append({"group": group, "lighting": "daylight", "pct": probs["daylight"]})
        probabilities.append({"group": group, "lighting": "dark", "pct": probs["dark"]})

    return {
        "sample": {
            "n": int(len(df)),
            "window_start": WINDOW[0],
            "window_end": WINDOW[1],
            "districts": list(DISTRICTS),
        },
        "models": models,
        "probabilities": probabilities,
    }


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
        "time_rounding": _time_rounding(replication),
        "intraracial": _intraracial(conn),
    }
    return cube, {}

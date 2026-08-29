"""Safety cube builder.

Emits ``safety.json`` covering three FastAPI endpoints:

- ``/safety/safety-num-accidents``: HIN-aggregated counts per
  (quarter, year, location), where ``location`` is
  ``"<district>-<psa>"``. Backed by ``car_ped_stops_hin_pct``.
- ``/safety/safety-hin-map``: a flat list of GeoJSON features
  combining 2025 HIN road geometry (LineString / MultiLineString)
  with a 1000-row random sample of stops as Point features.
- ``/safety/safety-shootings-vs-stops-maps``: two pre-computed
  district-level feature collections — one for the 2018→2019 surge
  comparison, one for the before/after-DEO comparison. Surge stop
  totals are pre-computed too so the page can render the text
  sentences without recomputing.

No scalars are produced by this builder.
"""

import json
import sqlite3
from collections import defaultdict
from pathlib import Path


CUBE_VERSION = 1

HIN_DIMENSIONS = ["quarter", "year", "location"]
HIN_MEASURES = ["n_stopped_locatable_on_hin", "n_stopped_locatable"]

# Year ranges (inclusive) used by the surge maps. Mirror the values
# hard-coded in the (now-retired) Dash HIN surge map page.
SURGE_START_QUARTERS = ("2018-Q1", "2018-Q2", "2018-Q3", "2018-Q4")
SURGE_END_QUARTERS = ("2019-Q1", "2019-Q2", "2019-Q3", "2019-Q4")
DEO_START_QUARTERS = ("2021-Q1", "2021-Q2", "2021-Q3", "2021-Q4")
DEO_END_QUARTERS = ("2022-Q2", "2022-Q3", "2022-Q4", "2023-Q1")

SURGE_TITLE = (
    "Districts with Largest % Increases in Traffic Stops vs. "
    "Districts with Largest % Decreases in Shootings"
)
DEO_TITLE = (
    "Before and After Driving Equality: Districts with Largest % "
    "Decreases in Traffic Stops vs. Districts with Largest % "
    "Increases in Shootings"
)


def _normalize_district(d) -> str:
    if d is None:
        return ""
    s = str(d).strip()
    if s.isdigit() and len(s) == 1:
        return "0" + s
    return s


def _rank_str(x: float) -> str:
    int_x = int(x)
    last_digit = int(str(int_x)[-1])
    if last_digit == 1:
        suffix = "st"
    elif last_digit == 2:
        suffix = "nd"
    elif last_digit == 3:
        suffix = "rd"
    else:
        suffix = "th"
    if int_x in (11, 12, 13):
        suffix = "th"
    return f"{int_x}{suffix}"


def _build_hin_cube(conn: sqlite3.Connection) -> dict:
    cur = conn.cursor()
    cur.execute(
        """
        SELECT districtoccur, psa, quarter, year,
               n_stopped_locatable_on_hin, n_stopped_locatable
        FROM car_ped_stops_hin_pct
        """
    )
    rows: list[list] = []
    for districtoccur, psa, quarter, year, on_hin, total in cur.fetchall():
        d = _normalize_district(districtoccur)
        p = "" if psa is None else str(psa).strip()
        loc = f"{d}-{p}"
        rows.append(
            [
                quarter,
                int(year) if year is not None else None,
                loc,
                int(on_hin) if on_hin is not None else 0,
                int(total) if total is not None else 0,
            ]
        )
    return {
        "version": CUBE_VERSION,
        "dimensions": HIN_DIMENSIONS,
        "measures": HIN_MEASURES,
        "rows": rows,
    }


def _build_hin_map_features(conn: sqlite3.Connection, maps_dir: Path) -> tuple[list, str]:
    """Build the flat HIN-map feature list (roads + sampled points).

    Returns (features, year_string). ``year_string`` is the
    comma-joined list of distinct years present in the sample (the
    FastAPI endpoint embeds this in the map title).
    """
    # HIN road geometry: 2025 layer.
    hin_geo_path = maps_dir / "hin_2025.geojson"
    hin_geo = json.loads(hin_geo_path.read_text())
    road_features = list(hin_geo.get("features", []))

    cur = conn.cursor()
    cur.execute(
        """
        SELECT stops_objectid, lng, lat, location, distance_from_hin,
               year, nearest_objectid, stname, on_hin
        FROM car_ped_stops_hin_random_sample
        """
    )
    point_features: list = []
    years: list[int] = []
    for (
        stops_objectid,
        lng,
        lat,
        location,
        distance_from_hin,
        year,
        nearest_objectid,
        stname,
        on_hin,
    ) in cur.fetchall():
        is_on_hin = bool(on_hin)
        name = "Traffic stop on the HIN" if is_on_hin else "Traffic stop not on the HIN"
        if year is not None:
            yi = int(year)
            if yi not in years:
                years.append(yi)
        point_features.append(
            {
                "type": "Feature",
                "properties": {
                    "name": name,
                    "hover_text": name,
                    "stops_objectid": stops_objectid,
                    "location": location,
                    "stname": stname,
                    "on_hin": is_on_hin,
                    "year": int(year) if year is not None else None,
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat],
                },
            }
        )
    year_str = ",".join(f"{y}" for y in years)
    return road_features + point_features, year_str


def _compute_district_sums(conn: sqlite3.Connection, quarters: tuple[str, ...]):
    """Sum n_stopped per district for the given quarters from car_ped_stops_quarterly."""
    placeholders = ",".join("?" for _ in quarters)
    cur = conn.cursor()
    cur.execute(
        f"""
        SELECT districtoccur, SUM(n_stopped) AS n_stopped
        FROM car_ped_stops_quarterly
        WHERE quarter IN ({placeholders})
        GROUP BY districtoccur
        """,
        list(quarters),
    )
    out: dict[str, int] = {}
    for d, n in cur.fetchall():
        out[_normalize_district(d)] = int(n or 0)
    return out


def _compute_shootings_sums(conn: sqlite3.Connection, quarters: tuple[str, ...]):
    placeholders = ",".join("?" for _ in quarters)
    cur = conn.cursor()
    cur.execute(
        f"""
        SELECT districtoccur, SUM(n_shootings) AS n_shootings
        FROM shootings
        WHERE quarter IN ({placeholders})
        GROUP BY districtoccur
        """,
        list(quarters),
    )
    out: dict[str, int] = {}
    for d, n in cur.fetchall():
        out[_normalize_district(d)] = int(n or 0)
    return out


def _build_shootings_vs_stops_map(
    conn: sqlite3.Connection,
    maps_dir: Path,
    start_quarters: tuple[str, ...],
    end_quarters: tuple[str, ...],
    title: str,
    decrease_col: str,
    increase_col: str,
) -> dict:
    """Produce one of the two shootings-vs-stops feature collections.

    Mirrors ``shootings_vs_stops_map`` from the FastAPI code:
    computes pct_change for n_stopped + n_shootings per district,
    ranks them, picks the top-5 increase / top-5 decrease districts
    (10 districts total; one district can appear in both lists),
    builds a hovertext string per district, and returns one feature
    per selected district with the district geometry from
    ``police_districts.geojson``.

    Also returns the total ``n_stopped`` across all (non-airport)
    districts in the start and end windows — the page uses these
    for the "X% increase / Y stops more" sentence under each map.
    """
    stops_start = _compute_district_sums(conn, start_quarters)
    stops_end = _compute_district_sums(conn, end_quarters)
    shoot_start = _compute_shootings_sums(conn, start_quarters)
    shoot_end = _compute_shootings_sums(conn, end_quarters)

    districts = set(stops_start) | set(stops_end)
    # District 77 is the airport — has no shooting data; the FastAPI
    # endpoint drops it before computing ranks.
    districts.discard("77")

    rows = []
    for d in districts:
        n_stopped_start = stops_start.get(d, 0)
        n_stopped_end = stops_end.get(d, 0)
        n_shoot_start = shoot_start.get(d, 0)
        n_shoot_end = shoot_end.get(d, 0)
        pct_change_n_stopped = (
            100 * (n_stopped_end - n_stopped_start) / n_stopped_start
            if n_stopped_start
            else None
        )
        pct_change_n_shootings = (
            100 * (n_shoot_end - n_shoot_start) / n_shoot_start
            if n_shoot_start
            else None
        )
        rows.append(
            {
                "districtoccur": d,
                "n_stopped_start": n_stopped_start,
                "n_stopped_end": n_stopped_end,
                "n_shootings_start": n_shoot_start,
                "n_shootings_end": n_shoot_end,
                "pct_change_n_stopped": pct_change_n_stopped,
                "pct_change_n_shootings": pct_change_n_shootings,
            }
        )

    # Apply pandas-style rank() semantics to mirror the FastAPI code.
    def _rank(rows, key, ascending: bool, method: str):
        # method='min': all ties get the lowest rank in the group.
        # method='max': all ties get the highest rank in the group.
        # Filter out None values; rows without a pct_change get None rank.
        valued = [r for r in rows if r[key] is not None]
        sorted_vals = sorted(
            valued, key=lambda r: r[key], reverse=not ascending
        )
        # Assign rank with ties.
        ranks: dict[int, float] = {}
        i = 0
        n = len(sorted_vals)
        while i < n:
            j = i
            while j + 1 < n and sorted_vals[j + 1][key] == sorted_vals[i][key]:
                j += 1
            # Positions are i..j inclusive (0-indexed); ranks are 1-indexed.
            min_rank = i + 1
            max_rank = j + 1
            assigned = min_rank if method == "min" else max_rank
            for k in range(i, j + 1):
                ranks[id(sorted_vals[k])] = assigned
            i = j + 1
        return ranks

    increase_key = f"pct_change_{increase_col}"
    decrease_key = f"pct_change_{decrease_col}"
    ranked_increase = _rank(rows, increase_key, ascending=False, method="min")
    ranked_decrease = _rank(rows, decrease_key, ascending=True, method="max")
    for r in rows:
        r[f"ranked_{increase_col}_increase"] = ranked_increase.get(id(r))
        r[f"ranked_{decrease_col}_decrease"] = ranked_decrease.get(id(r))
        r["is_top_5_increase"] = (
            r[f"ranked_{increase_col}_increase"] is not None
            and r[f"ranked_{increase_col}_increase"] <= 5
        )
        r["is_top_5_decrease"] = (
            r[f"ranked_{decrease_col}_decrease"] is not None
            and r[f"ranked_{decrease_col}_decrease"] <= 5
        )

    # Pick top-5 increase + top-5 decrease (one district may overlap).
    increase_district_set = {
        r["districtoccur"] for r in rows if r["is_top_5_increase"]
    }
    decrease_district_set = {
        r["districtoccur"] for r in rows if r["is_top_5_decrease"]
    }
    selected_districts = increase_district_set | decrease_district_set
    rows_by_district = {r["districtoccur"]: r for r in rows}

    increase_noun = "traffic stops" if increase_col == "n_stopped" else "shootings"
    decrease_noun = "traffic stops" if decrease_col == "n_stopped" else "shootings"
    increase_is_stopped = increase_col == "n_stopped"
    increase_is_shootings = increase_col == "n_shootings"

    def _hovertext(row: dict) -> str:
        pct_change_for_increase = row[increase_key]
        pct_change_for_decrease = row[decrease_key]
        increase_rank_str = _rank_str(row[f"ranked_{increase_col}_increase"])
        decrease_rank_str = _rank_str(row[f"ranked_{decrease_col}_decrease"])
        ic_str = "decrease" if pct_change_for_increase < 0 else "increase"
        dc_str = "decrease" if pct_change_for_decrease < 0 else "increase"
        increase_sentence = (
            f"<b>{abs(pct_change_for_increase):.1f}% {ic_str} in {increase_noun}"
        )
        decrease_sentence = (
            f"<b>{abs(pct_change_for_decrease):.1f}% {dc_str} in {decrease_noun}"
        )
        if row["is_top_5_increase"]:
            increase_sentence += f" ({increase_rank_str} largest)"
        if row["is_top_5_decrease"]:
            decrease_sentence += f" ({decrease_rank_str} largest)"
        first = increase_sentence if increase_is_stopped else decrease_sentence
        second = increase_sentence if increase_is_shootings else decrease_sentence
        return f"<b>District {row['districtoccur']}<br>" + "<br>".join(
            [first, second]
        )

    # Load district geojson and pick only selected districts.
    districts_geo = json.loads((maps_dir / "police_districts.geojson").read_text())
    features = []
    for feat in districts_geo["features"]:
        dist_numc = feat["properties"]["DIST_NUMC"]
        if dist_numc not in selected_districts:
            continue
        row = rows_by_district[dist_numc]
        new_feat = json.loads(json.dumps(feat))  # deep copy
        new_feat["properties"][f"is_top_{decrease_col}_change"] = row["is_top_5_decrease"]
        new_feat["properties"][f"is_top_{increase_col}_change"] = row["is_top_5_increase"]
        new_feat["properties"]["hovertext"] = _hovertext(row)
        features.append(new_feat)

    # Totals across all kept districts (matches df_pct_change.sum() in FastAPI;
    # excludes district 77 and any districts with no n_stopped data).
    n_stopped_start_total = sum(r["n_stopped_start"] for r in rows)
    n_stopped_end_total = sum(r["n_stopped_end"] for r in rows)

    return {
        "title": title,
        "features": features,
        "n_stopped_start": n_stopped_start_total,
        "n_stopped_end": n_stopped_end_total,
    }


def build(conn: sqlite3.Connection) -> tuple[dict, dict]:
    maps_dir = Path(__file__).resolve().parent.parent / "maps"

    hin_cube = _build_hin_cube(conn)
    hin_map_features, hin_year_str = _build_hin_map_features(conn, maps_dir)
    hin_map_title = (
        f"Random Sample of 1,000 PPD Traffic Stops in {hin_year_str} "
        "Mapped on HIN Roads"
    )

    surge_map = _build_shootings_vs_stops_map(
        conn,
        maps_dir,
        SURGE_START_QUARTERS,
        SURGE_END_QUARTERS,
        SURGE_TITLE,
        decrease_col="n_shootings",
        increase_col="n_stopped",
    )
    deo_map = _build_shootings_vs_stops_map(
        conn,
        maps_dir,
        DEO_START_QUARTERS,
        DEO_END_QUARTERS,
        DEO_TITLE,
        decrease_col="n_stopped",
        increase_col="n_shootings",
    )

    cube = {
        "version": CUBE_VERSION,
        "hin": hin_cube,
        "hin_map": {
            "title": hin_map_title,
            "features": hin_map_features,
        },
        "shootings_vs_stops": {
            "surge": surge_map,
            "deo": deo_map,
        },
    }
    return cube, {}

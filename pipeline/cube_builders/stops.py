"""Stops cube builder.

Reads ``car_ped_stops_quarterly`` and emits a cube grouped by
``[quarter, location, race, gender, age_range]`` with measures
``[n_stopped, n_searched, n_frisked, n_intruded, n_arrested,
n_contraband, n_people_in_stopped_vehicles]``.

``location`` is rendered at PSA granularity as ``"<districtoccur>-<psa>"``.

Also produces fixed-window monthly-average scalars for citywide,
each division, each district, and each PSA.
"""

import sqlite3
from collections import defaultdict
from typing import Iterable


CUBE_VERSION = 1

DIMENSIONS = ["quarter", "location", "race", "gender", "age_range"]
MEASURES = [
    "n_stopped",
    "n_searched",
    "n_frisked",
    "n_intruded",
    "n_arrested",
    "n_contraband",
    "n_people_in_stopped_vehicles",
]

DIVISION_MAP = {
    "SPD": ["01", "03", "17"],
    "NEPD": ["02", "07", "08", "15", "25"],
    "NWPD": ["05", "14", "35", "39"],
    "CPD": ["06", "09", "22"],
    "SWPD": ["12", "16", "18", "19"],
    "EPD": ["24", "25", "26"],
}

# Fixed scalar windows: (label, start_quarter_inclusive, end_quarter_inclusive, n_months)
SCALAR_WINDOWS = [
    ("stops_monthly_avg_2014_2018", "2014-Q1", "2018-Q4", 60),
    ("stops_monthly_avg_2019", "2019-Q1", "2019-Q4", 12),
    ("stops_monthly_avg_2020Q2_2021Q1", "2020-Q2", "2021-Q1", 12),
]


def _normalize_district(d: str | None) -> str:
    """Pad single-digit district codes with a leading zero."""
    if d is None:
        return ""
    s = str(d).strip()
    if s.isdigit() and len(s) == 1:
        return "0" + s
    return s


def _location_key(district: str, psa: str | None) -> str:
    d = _normalize_district(district)
    p = "" if psa is None else str(psa).strip()
    return f"{d}-{p}"


def build(conn: sqlite3.Connection) -> tuple[dict, dict]:
    """Build the stops cube and scalars.

    Returns (cube_dict, scalars_dict). The scalars dict has top-level
    keys for each window, each mapping ``location -> monthly_avg``.
    """
    cur = conn.cursor()

    # Aggregate at the cube grain. Group in SQL for speed.
    select_measures = ", ".join(f"SUM({m}) AS {m}" for m in MEASURES)
    cur.execute(
        f"""
        SELECT districtoccur, psa, quarter, Race, Gender, "Age Range",
               {select_measures}
        FROM car_ped_stops_quarterly
        GROUP BY districtoccur, psa, quarter, Race, Gender, "Age Range"
        """
    )

    rows: list[list] = []
    # Track which districts/PSAs we've seen for scalar location enumeration.
    seen_psa_locations: set[str] = set()
    seen_districts: set[str] = set()
    # For scalars: location -> window_label -> sum(n_stopped)
    scalar_sums: dict[str, dict[str, int]] = defaultdict(
        lambda: {w[0]: 0 for w in SCALAR_WINDOWS}
    )
    citywide_sums: dict[str, int] = {w[0]: 0 for w in SCALAR_WINDOWS}

    window_ranges = {label: (start, end) for label, start, end, _n in SCALAR_WINDOWS}

    for row in cur.fetchall():
        districtoccur, psa, quarter, race, gender, age_range, *measure_vals = row
        district = _normalize_district(districtoccur)
        psa_str = "" if psa is None else str(psa).strip()
        loc = f"{district}-{psa_str}"

        seen_psa_locations.add(loc)
        seen_districts.add(district)

        # Normalize None measures to 0 ints
        m_vals = [int(v) if v is not None else 0 for v in measure_vals]
        rows.append([quarter, loc, race, gender, age_range, *m_vals])

        # Scalar accumulation - only n_stopped is used per spec
        n_stopped = m_vals[0]
        if n_stopped:
            for label, (start_q, end_q) in window_ranges.items():
                if quarter is not None and start_q <= quarter <= end_q:
                    scalar_sums[loc][label] += n_stopped
                    citywide_sums[label] += n_stopped

    # District-level sums = sum across PSAs in that district
    district_sums: dict[str, dict[str, int]] = defaultdict(
        lambda: {w[0]: 0 for w in SCALAR_WINDOWS}
    )
    for loc, win_map in scalar_sums.items():
        d = loc.split("-", 1)[0]
        for label, v in win_map.items():
            district_sums[d][label] += v

    # Division sums
    division_sums: dict[str, dict[str, int]] = {
        div: {w[0]: 0 for w in SCALAR_WINDOWS} for div in DIVISION_MAP
    }
    for div, districts in DIVISION_MAP.items():
        for d in districts:
            if d in district_sums:
                for label, v in district_sums[d].items():
                    division_sums[div][label] += v

    # Build scalars output: each window label -> {location: monthly_avg}
    window_months = {label: n for label, _s, _e, n in SCALAR_WINDOWS}
    scalars: dict[str, dict[str, float]] = {label: {} for label, *_ in SCALAR_WINDOWS}

    for label, _start, _end, n_months in SCALAR_WINDOWS:
        # Citywide
        scalars[label]["*"] = citywide_sums[label] / n_months
        # Divisions
        for div in DIVISION_MAP:
            scalars[label][div] = division_sums[div][label] / n_months
        # Districts
        for d in sorted(seen_districts):
            if not d:
                continue
            scalars[label][d] = district_sums[d][label] / n_months
        # PSAs
        for loc in sorted(seen_psa_locations):
            scalars[label][loc] = scalar_sums[loc][label] / n_months

    cube = {
        "version": CUBE_VERSION,
        "dimensions": DIMENSIONS,
        "measures": MEASURES,
        "rows": rows,
    }
    return cube, scalars

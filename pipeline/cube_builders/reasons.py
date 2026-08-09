"""Reasons cube builder.

Reads ``car_ped_stops_quarterly_reason`` and emits a cube grouped by
``[quarter, location, race, violation_category]`` with the single measure
``[n_stopped]``.

``location`` is rendered at district granularity as the 2-digit district code
(e.g. ``"22"``). The reasons page only ever groups by district — never by PSA
— and never reads gender, age_range, or any measure other than ``n_stopped``,
so dropping those dimensions and measures cuts the cube ~30x without losing
information needed by the page. See the original schema in git history if a
future question needs the finer-grained data.

No scalars are emitted by this builder.
"""

import sqlite3


CUBE_VERSION = 2

DIMENSIONS = [
    "quarter",
    "location",
    "race",
    "violation_category",
]
MEASURES = ["n_stopped"]


def _normalize_district(d: str | None) -> str:
    if d is None:
        return ""
    s = str(d).strip()
    if s.isdigit() and len(s) == 1:
        return "0" + s
    return s


def build(conn: sqlite3.Connection) -> tuple[dict, dict]:
    cur = conn.cursor()
    cur.execute(
        """
        SELECT districtoccur, quarter, Race, violation_category,
               SUM(n_stopped) AS n_stopped
        FROM car_ped_stops_quarterly_reason
        GROUP BY districtoccur, quarter, Race, violation_category
        """
    )

    rows: list[list] = []
    for districtoccur, quarter, race, violation_category, n_stopped in cur.fetchall():
        district = _normalize_district(districtoccur)
        rows.append([
            quarter,
            district,
            race,
            violation_category,
            int(n_stopped) if n_stopped is not None else 0,
        ])

    cube = {
        "version": CUBE_VERSION,
        "dimensions": DIMENSIONS,
        "measures": MEASURES,
        "rows": rows,
    }
    return cube, {}

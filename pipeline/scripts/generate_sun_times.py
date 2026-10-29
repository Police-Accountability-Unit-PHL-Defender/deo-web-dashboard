#!/usr/bin/env python3
"""Generate Philadelphia sunset / civil dusk times and write them to CSV.

Run once (or when extending the year range); the CSV is committed and the
pipeline reads only that. Keeping this out of the runtime path means the
build cannot silently drift with an astral upgrade, and the values are
reviewable in a diff.

Usage:
    python scripts/generate_sun_times.py
"""

import csv
import datetime as dt
from pathlib import Path
from zoneinfo import ZoneInfo

from astral import LocationInfo
from astral.sun import sun

TZ = ZoneInfo("America/New_York")
PHILADELPHIA = LocationInfo("Philadelphia", "USA", "America/New_York", 39.9526, -75.1652)
START_YEAR = 2014
END_YEAR = 2030
OUT = Path(__file__).resolve().parents[1] / "data" / "philadelphia_sun_times.csv"


def main() -> None:
    rows = []
    day = dt.date(START_YEAR, 1, 1)
    end = dt.date(END_YEAR, 12, 31)
    while day <= end:
        s = sun(PHILADELPHIA.observer, date=day, tzinfo=TZ)
        rows.append(
            {
                "stop_date": day.isoformat(),
                # Naive local wall-clock times; the stop data is compared in
                # local time and never crosses a DST boundary inside the window.
                "sunset_local": s["sunset"].replace(tzinfo=None).isoformat(sep=" "),
                "dusk_local": s["dusk"].replace(tzinfo=None).isoformat(sep=" "),
            }
        )
        day += dt.timedelta(days=1)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["stop_date", "sunset_local", "dusk_local"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {len(rows)} rows to {OUT}")


if __name__ == "__main__":
    main()

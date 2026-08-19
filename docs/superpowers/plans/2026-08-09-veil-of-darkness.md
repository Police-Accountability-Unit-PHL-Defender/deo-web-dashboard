# Veil-of-Darkness Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an unlinked `/veil-of-darkness` page replicating Hannon & Biddle (2026) on Philadelphia stop data, with the analysis computed at build time into a static cube.

**Architecture:** A new `pipeline/veil/` package reads raw person-level stop CSVs, rolls them into stops, applies the paper's sample restrictions, and writes a `car_ped_stops_veil` table into the existing SQLite DB. A new cube builder reads that table, fits quasi-binomial logistic models with `statsmodels`, and emits `public/cubes/veil.json` containing both descriptive rows and fitted model results. A Nuxt page renders it. Nothing is computed in the browser.

**Tech Stack:** Python 3.10+, pandas, statsmodels, astral (dev-only), pytest, SQLite, Nuxt 3, Vue 3, vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-09-veil-of-darkness-design.md`. Read it before starting.
- **Inter-twilight window: 17:08–20:35** (the paper's). Our independently-derived value is 17:05–20:33; use the paper's for the replication.
- **Deduplicate person rows on `objectid` only.** Never on demographic columns — that collapses two same-age same-race occupants of one car and destroys ~26% of multi-occupant parties.
- **Never identify a driver.** The homogeneous-party restriction makes it unnecessary. Do not use `min(id)` or the existing rollup at `pipeline/update_db_models.py:399`.
- **Party grouping key is `(datetimeoccur, location)`** — exact strings, no normalization.
- Driving Equality effective date: **2022-03-03**.
- Replication period: **2021–2024**. "Young" is **age 18–29 inclusive**.
- Every chart states its denominator: tables are per stop, Figures 2/3 per motorist, Figure 4 per occupant.
- Run pipeline tests with `cd pipeline && python -m pytest tests/ -v`. Run dashboard tests with `npm test`.
- Commit after every task.

---

### Task 1: Sun times

**Files:**
- Create: `pipeline/scripts/generate_sun_times.py`
- Create: `pipeline/data/philadelphia_sun_times.csv` (generated, committed)
- Create: `pipeline/veil/__init__.py`
- Create: `pipeline/veil/sun.py`
- Test: `pipeline/tests/test_veil_sun.py`
- Modify: `pipeline/pyproject.toml`

**Interfaces:**
- Consumes: nothing.
- Produces: `load_sun_times(path: Path | None = None) -> pd.DataFrame` with columns `stop_date` (`datetime.date`), `sunset_local` (`pd.Timestamp`, naive local), `dusk_local` (same). Also `inter_twilight_window(df) -> tuple[datetime.time, datetime.time]` returning `(earliest_dusk_time, latest_sunset_time)`.

- [ ] **Step 1: Add astral as a dev dependency**

In `pipeline/pyproject.toml`, change the `dev` group:

```toml
[dependency-groups]
dev = ["pytest>=8.0", "astral>=3.2"]
```

`astral` is used only by the one-off generator script. The pipeline itself reads the committed CSV, so it stays out of runtime dependencies.

- [ ] **Step 2: Write the generator script**

Create `pipeline/scripts/generate_sun_times.py`:

```python
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
```

`astral`'s `dusk` is civil dusk (6° depression) by default, which is what the paper's `suncalc` usage means.

- [ ] **Step 3: Generate the CSV**

Run: `cd pipeline && python scripts/generate_sun_times.py`
Expected: `wrote 6210 rows to .../data/philadelphia_sun_times.csv`

- [ ] **Step 4: Write the failing test**

Create `pipeline/tests/test_veil_sun.py`:

```python
"""Sun-time tests.

This component silently produced a 12-hour error during exploration (the
J2000 epoch is noon, not midnight), so the known-good values below are
pinned against published Philadelphia almanac times.
"""

import datetime as dt

import pytest

from veil.sun import inter_twilight_window, load_sun_times


@pytest.fixture(scope="module")
def sun_df():
    return load_sun_times()


@pytest.mark.parametrize(
    "date,expected_sunset",
    [
        (dt.date(2025, 6, 21), dt.time(20, 32)),
        (dt.date(2025, 12, 21), dt.time(16, 38)),
        (dt.date(2025, 3, 20), dt.time(19, 12)),
        (dt.date(2025, 11, 2), dt.time(16, 57)),
    ],
)
def test_sunset_matches_almanac(sun_df, date, expected_sunset):
    row = sun_df[sun_df.stop_date == date].iloc[0]
    actual = row.sunset_local.time()
    minutes = abs(
        (actual.hour * 60 + actual.minute) - (expected_sunset.hour * 60 + expected_sunset.minute)
    )
    assert minutes <= 2, f"{date}: got {actual}, expected ~{expected_sunset}"


def test_dusk_is_after_sunset_by_about_half_an_hour(sun_df):
    delta = (sun_df.dusk_local - sun_df.sunset_local).dt.total_seconds() / 60
    assert delta.min() > 20, f"min gap {delta.min()} min"
    assert delta.max() < 45, f"max gap {delta.max()} min"


def test_inter_twilight_window(sun_df):
    earliest_dusk, latest_sunset = inter_twilight_window(sun_df)
    assert earliest_dusk == dt.time(17, 5), earliest_dusk
    assert latest_sunset == dt.time(20, 33), latest_sunset


def test_covers_the_data_range(sun_df):
    assert sun_df.stop_date.min() <= dt.date(2014, 1, 1)
    assert sun_df.stop_date.max() >= dt.date(2026, 12, 31)
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd pipeline && python -m pytest tests/test_veil_sun.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'veil'`

- [ ] **Step 6: Write the loader**

Create `pipeline/veil/__init__.py` (empty file).

Create `pipeline/veil/sun.py`:

```python
"""Load committed Philadelphia sun times and derive the inter-twilight window.

The window is the interval between the earliest civil dusk and the latest
sunset across the year -- the only span in which a given clock time is
sometimes light and sometimes dark. That overlap is what the
veil-of-darkness test compares.
"""

import datetime as dt
from pathlib import Path

import pandas as pd

DEFAULT_PATH = Path(__file__).resolve().parents[1] / "data" / "philadelphia_sun_times.csv"


def load_sun_times(path: Path | None = None) -> pd.DataFrame:
    df = pd.read_csv(path or DEFAULT_PATH)
    df["stop_date"] = pd.to_datetime(df["stop_date"]).dt.date
    df["sunset_local"] = pd.to_datetime(df["sunset_local"])
    df["dusk_local"] = pd.to_datetime(df["dusk_local"])
    return df


def inter_twilight_window(df: pd.DataFrame) -> tuple[dt.time, dt.time]:
    """Return (earliest civil dusk, latest sunset), truncated to the minute."""
    earliest_dusk = df.dusk_local.dt.time.min()
    latest_sunset = df.sunset_local.dt.time.max()
    return (
        dt.time(earliest_dusk.hour, earliest_dusk.minute),
        dt.time(latest_sunset.hour, latest_sunset.minute),
    )
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd pipeline && python -m pytest tests/test_veil_sun.py -v`
Expected: PASS (7 tests)

- [ ] **Step 8: Commit**

```bash
git add pipeline/pyproject.toml pipeline/scripts/generate_sun_times.py \
        pipeline/data/philadelphia_sun_times.csv pipeline/veil/ \
        pipeline/tests/test_veil_sun.py
git commit -m "feat(veil): committed Philadelphia sun times and window derivation"
```

---

### Task 2: Stop rollup and sample restrictions

**Files:**
- Create: `pipeline/veil/sample.py`
- Test: `pipeline/tests/test_veil_sample.py`

**Interfaces:**
- Consumes: `load_sun_times`, `inter_twilight_window` from `veil.sun`.
- Produces:
  - `dedupe_people(df: pd.DataFrame) -> pd.DataFrame` — drops duplicate `objectid` rows.
  - `roll_up_stops(df: pd.DataFrame) -> pd.DataFrame` — person rows to one row per stop. Output columns: `datetimeoccur, location, districtoccur, psa, assigned_unit, ts_local, party_size, party_race, n_races, all_young_men, complete_demographics, is_mvc, any_arrest, n_frisked, n_ticketed`.
  - `classify_lighting(stops: pd.DataFrame, sun: pd.DataFrame) -> pd.DataFrame` — adds `lighting` (`"daylight"`/`"dark"`/`"ambiguous"`), `clock_minutes`, `stop_date`.
  - `apply_paper_restrictions(stops: pd.DataFrame) -> pd.DataFrame` — applies restrictions 2–7 and 9 and returns the analytic sample.

- [ ] **Step 1: Write the failing tests**

Create `pipeline/tests/test_veil_sample.py`:

```python
"""Sample-construction tests, built on small synthetic frames.

The dedup test is the important one: deduplicating on demographics rather
than row identity silently halved multi-occupant parties during
exploration and produced a plausible but wrong result.
"""

import datetime as dt

import pandas as pd
import pytest

from veil.sample import (
    apply_paper_restrictions,
    classify_lighting,
    dedupe_people,
    roll_up_stops,
)
from veil.sun import load_sun_times


def person(objectid, when, location="100 BLOCK MAIN ST", race="Black - Non-Latino",
           gender="Male", age=22, mvc_code="3112", arrested=0, frisked=0, ticket=0):
    return {
        "objectid": objectid,
        "datetimeoccur": pd.Timestamp(when),
        "ts_local": pd.Timestamp(when),
        "location": location,
        "districtoccur": "18",
        "psa": "1",
        "assigned_unit": "18TH DISTRICT",
        "race": race,
        "gender": gender,
        "age": age,
        "mvc_code": mvc_code,
        "individual_arrested": arrested,
        "individual_frisked": frisked,
        "ticket_issued": ticket,
    }


def test_dedupe_keeps_two_identical_looking_occupants():
    """Two 22-year-old Black men in one car are two people, not a duplicate."""
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00"),
        person(2, "2024-06-01 19:00"),
    ])
    assert len(dedupe_people(df)) == 2


def test_dedupe_drops_a_genuinely_repeated_row():
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00"),
        person(1, "2024-06-01 19:00"),
    ])
    assert len(dedupe_people(df)) == 1


def test_roll_up_counts_party_size():
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00"),
        person(2, "2024-06-01 19:00"),
        person(3, "2024-06-01 19:30"),
    ])
    stops = roll_up_stops(df)
    assert len(stops) == 2
    assert sorted(stops.party_size.tolist()) == [1, 2]


def test_roll_up_flags_mixed_race_party():
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00"),
        person(2, "2024-06-01 19:00", race="White - Non-Latino"),
    ])
    stops = roll_up_stops(df)
    assert stops.iloc[0].n_races == 2


def test_roll_up_flags_party_outside_the_age_band():
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00", age=22),
        person(2, "2024-06-01 19:00", age=41),
    ])
    stops = roll_up_stops(df)
    assert stops.iloc[0].all_young_men == 0


def test_roll_up_sums_frisks_and_tickets():
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00", frisked=1, ticket=0),
        person(2, "2024-06-01 19:00", frisked=1, ticket=1),
    ])
    stops = roll_up_stops(df)
    assert stops.iloc[0].n_frisked == 2
    assert stops.iloc[0].n_ticketed == 1


def test_lighting_classification():
    sun = load_sun_times()
    # 2024-06-01: sunset ~20:28, dusk ~21:00. 2024-12-01: sunset ~16:35.
    df = pd.DataFrame([
        person(1, "2024-06-01 19:00"),   # well before sunset -> daylight
        person(2, "2024-06-01 20:40"),   # between sunset and dusk -> ambiguous
        person(3, "2024-12-01 19:00"),   # well after dusk -> dark
    ])
    stops = classify_lighting(roll_up_stops(df), sun)
    assert stops.sort_values("ts_local").lighting.tolist() == [
        "daylight", "ambiguous", "dark",
    ]


def test_clock_minutes():
    sun = load_sun_times()
    df = pd.DataFrame([person(1, "2024-06-01 19:15")])
    stops = classify_lighting(roll_up_stops(df), sun)
    assert stops.iloc[0].clock_minutes == 19 * 60 + 15


@pytest.mark.parametrize(
    "kwargs,reason",
    [
        ({"mvc_code": None}, "not an MVC stop"),
        ({"arrested": 1}, "involved an arrest"),
        ({"age": 41}, "outside the 18-29 band"),
        ({"gender": "Female"}, "not all men"),
        ({"race": "Asian"}, "not Black or White"),
    ],
)
def test_restrictions_exclude(kwargs, reason):
    sun = load_sun_times()
    df = pd.DataFrame([person(1, "2024-06-01 19:00", **kwargs)])
    stops = apply_paper_restrictions(classify_lighting(roll_up_stops(df), sun))
    assert len(stops) == 0, f"should have been excluded: {reason}"


def test_restrictions_keep_a_clean_stop():
    sun = load_sun_times()
    df = pd.DataFrame([person(1, "2024-06-01 19:00")])
    stops = apply_paper_restrictions(classify_lighting(roll_up_stops(df), sun))
    assert len(stops) == 1


def test_restrictions_drop_the_ambiguous_band():
    sun = load_sun_times()
    df = pd.DataFrame([person(1, "2024-06-01 20:40")])
    stops = apply_paper_restrictions(classify_lighting(roll_up_stops(df), sun))
    assert len(stops) == 0


def test_restrictions_drop_stops_outside_the_window():
    sun = load_sun_times()
    df = pd.DataFrame([person(1, "2024-06-01 14:00")])
    stops = apply_paper_restrictions(classify_lighting(roll_up_stops(df), sun))
    assert len(stops) == 0
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd pipeline && python -m pytest tests/test_veil_sample.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'veil.sample'`

- [ ] **Step 3: Write the implementation**

Create `pipeline/veil/sample.py`:

```python
"""Build the veil-of-darkness analytic sample from person-level stop rows.

Follows the sample restrictions in Hannon & Biddle (2026). See
docs/superpowers/specs/2026-08-09-veil-of-darkness-design.md.

Two rules are load-bearing and easy to get wrong:

1. Deduplication keys on ``objectid``. Two 22-year-old Black men in one car
   are two people; deduping on demographics destroys exactly the
   multi-occupant parties this analysis is about.
2. No driver is ever identified. The homogeneous-party restriction makes it
   unnecessary -- every occupant is a young man of the same race -- and the
   source data has no reliable driver indicator.
"""

import datetime as dt

import pandas as pd

WINDOW_START = dt.time(17, 8)
WINDOW_END = dt.time(20, 35)
DRIVING_EQUALITY_DATE = pd.Timestamp("2022-03-03")
STUDY_RACES = ("Black - Non-Latino", "White - Non-Latino")
YOUNG_MIN, YOUNG_MAX = 18, 29


def dedupe_people(df: pd.DataFrame) -> pd.DataFrame:
    """Restriction 6: drop exact duplicate records, keyed on row identity."""
    return df.drop_duplicates(subset=["objectid"], keep="first")


def roll_up_stops(df: pd.DataFrame) -> pd.DataFrame:
    """Collapse person rows into one row per stop, keyed on (time, location)."""
    df = df.copy()
    df["_is_young_man"] = (
        (df.gender == "Male") & df.age.between(YOUNG_MIN, YOUNG_MAX)
    ).astype(int)
    df["_complete"] = (
        df.race.notna() & df.gender.notna() & df.age.notna()
    ).astype(int)
    df["_is_mvc"] = (df.mvc_code.notna() & (df.mvc_code != "")).astype(int)

    grouped = df.groupby(["datetimeoccur", "location"], dropna=False)
    stops = grouped.agg(
        districtoccur=("districtoccur", "min"),
        psa=("psa", "min"),
        assigned_unit=("assigned_unit", "min"),
        ts_local=("ts_local", "max"),
        party_size=("objectid", "size"),
        n_races=("race", "nunique"),
        party_race=("race", "min"),
        all_young_men=("_is_young_man", "min"),
        complete_demographics=("_complete", "min"),
        is_mvc=("_is_mvc", "max"),
        any_arrest=("individual_arrested", "max"),
        n_frisked=("individual_frisked", "sum"),
        n_ticketed=("ticket_issued", "sum"),
    ).reset_index()
    return stops


def classify_lighting(stops: pd.DataFrame, sun: pd.DataFrame) -> pd.DataFrame:
    """Add stop_date, clock_minutes and a daylight/dark/ambiguous label."""
    stops = stops.copy()
    stops["stop_date"] = stops.ts_local.dt.date
    stops["clock_minutes"] = stops.ts_local.dt.hour * 60 + stops.ts_local.dt.minute
    merged = stops.merge(sun, on="stop_date", how="left")

    # Compare wall-clock times on the stop's own date.
    sunset = merged.sunset_local.dt.hour * 60 + merged.sunset_local.dt.minute
    dusk = merged.dusk_local.dt.hour * 60 + merged.dusk_local.dt.minute
    merged["lighting"] = "ambiguous"
    merged.loc[merged.clock_minutes < sunset, "lighting"] = "daylight"
    merged.loc[merged.clock_minutes >= dusk, "lighting"] = "dark"
    return merged.drop(columns=["sunset_local", "dusk_local"])


def apply_paper_restrictions(stops: pd.DataFrame) -> pd.DataFrame:
    """Restrictions 2, 3, 4, 5, 7, 8 and 9 from the spec."""
    window_start = WINDOW_START.hour * 60 + WINDOW_START.minute
    window_end = WINDOW_END.hour * 60 + WINDOW_END.minute
    keep = (
        (stops.is_mvc == 1)
        & (stops.all_young_men == 1)
        & (stops.complete_demographics == 1)
        & (stops.n_races == 1)
        & (stops.party_race.isin(STUDY_RACES))
        & (stops.any_arrest == 0)
        & stops.clock_minutes.between(window_start, window_end)
        & (stops.lighting != "ambiguous")
    )
    out = stops[keep].copy()
    out["obscured_view"] = (out.lighting == "dark").astype(int)
    out["group_travel"] = (out.party_size >= 2).astype(int)
    out["era"] = (out.ts_local >= DRIVING_EQUALITY_DATE).map(
        {True: "post_deo", False: "pre_deo"}
    )
    out["year"] = out.ts_local.dt.year
    out["dow"] = out.ts_local.dt.dayofweek
    out["month"] = out.ts_local.dt.month
    out["is_summer"] = out.month.isin([6, 7, 8]).astype(int)
    return out
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd pipeline && python -m pytest tests/test_veil_sample.py -v`
Expected: PASS (16 tests)

- [ ] **Step 5: Commit**

```bash
git add pipeline/veil/sample.py pipeline/tests/test_veil_sample.py
git commit -m "feat(veil): stop rollup, lighting classification and sample restrictions"
```

---

### Task 3: Build the `car_ped_stops_veil` table from the backup zip

**Files:**
- Create: `pipeline/veil/build.py`
- Test: `pipeline/tests/test_veil_build.py`

**Interfaces:**
- Consumes: `dedupe_people`, `roll_up_stops`, `classify_lighting`, `apply_paper_restrictions` from `veil.sample`; `load_sun_times` from `veil.sun`.
- Produces: `build_veil_table(zip_path: Path, db_path: Path, years: list[int] | None = None) -> int` returning the row count written. Writes SQLite table `car_ped_stops_veil`. Also a CLI: `python -m veil.build --zip PATH --db PATH`.

Deliberately a standalone entry point rather than a hook inside `update_db.py`'s existing zip dispatch. That dispatch is fragile (see `AGENTS.md` on CSV naming drift) and this analysis needs to be re-runnable on its own during iteration.

- [ ] **Step 1: Write the failing test**

Create `pipeline/tests/test_veil_build.py`:

```python
"""Integration test for the veil table builder against the real backup zip."""

import os
import sqlite3
from pathlib import Path

import pytest

from veil.build import build_veil_table

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PIPELINE_ROOT / "data"


def _latest_zip() -> Path | None:
    zips = sorted(DATA_DIR.glob("car_ped_stops_*.zip"))
    return zips[-1] if zips else None


requires_zip = pytest.mark.skipif(
    _latest_zip() is None, reason="no car_ped_stops backup zip present"
)


@requires_zip
def test_builds_table_for_the_replication_period(tmp_path):
    db = tmp_path / "test.db"
    n = build_veil_table(_latest_zip(), db, years=[2021, 2022, 2023, 2024])
    assert n > 30000, f"expected >30k analytic stops, got {n}"

    with sqlite3.connect(db) as conn:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(car_ped_stops_veil)")}
    for expected in [
        "ts_local", "clock_minutes", "year", "era", "districtoccur", "psa",
        "assigned_unit", "lighting", "obscured_view", "party_race",
        "party_size", "group_travel", "n_frisked", "n_ticketed", "dow",
        "month", "is_summer",
    ]:
        assert expected in cols, f"missing column {expected}"


@requires_zip
def test_no_ambiguous_rows_survive(tmp_path):
    db = tmp_path / "test.db"
    build_veil_table(_latest_zip(), db, years=[2024])
    with sqlite3.connect(db) as conn:
        n = conn.execute(
            "SELECT count(*) FROM car_ped_stops_veil WHERE lighting='ambiguous'"
        ).fetchone()[0]
    assert n == 0


@requires_zip
def test_both_lighting_states_are_present(tmp_path):
    """A collapse of the band logic would show up as one empty state."""
    db = tmp_path / "test.db"
    build_veil_table(_latest_zip(), db, years=[2024])
    with sqlite3.connect(db) as conn:
        rows = dict(
            conn.execute(
                "SELECT lighting, count(*) FROM car_ped_stops_veil GROUP BY lighting"
            ).fetchall()
        )
    assert rows.get("daylight", 0) > 1000, rows
    assert rows.get("dark", 0) > 1000, rows
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd pipeline && python -m pytest tests/test_veil_build.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'veil.build'`

- [ ] **Step 3: Write the builder**

Create `pipeline/veil/build.py`:

```python
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
                df = pd.read_csv(fh, usecols=USE_COLS, low_memory=False)
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

    with sqlite3.connect(str(db_path)) as conn:
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd pipeline && python -m pytest tests/test_veil_build.py -v`
Expected: PASS (3 tests). Takes several minutes — it reads four years of CSV.

- [ ] **Step 5: Commit**

```bash
git add pipeline/veil/build.py pipeline/tests/test_veil_build.py
git commit -m "feat(veil): build car_ped_stops_veil table from the backup zip"
```

---

### Task 4: Replication regression test

**Files:**
- Test: `pipeline/tests/test_veil_replication.py`

**Interfaces:**
- Consumes: `build_veil_table` from `veil.build`.
- Produces: nothing consumed downstream. This is the test that catches a future pipeline change silently breaking the analysis.

- [ ] **Step 1: Write the test**

Create `pipeline/tests/test_veil_replication.py`:

```python
"""Pin the published quantities from Hannon & Biddle (2026).

Tolerances are wide (10%) because OpenDataPhilly revises records and our
backup postdates the authors' download by years. They are tight enough to
catch a structural break -- a bad dedup key, a dropped restriction, a
lighting inversion -- which is the point.
"""

import sqlite3
from pathlib import Path

import pandas as pd
import pytest

from veil.build import build_veil_table

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
REPLICATION_YEARS = [2021, 2022, 2023, 2024]


def _latest_zip() -> Path | None:
    zips = sorted((PIPELINE_ROOT / "data").glob("car_ped_stops_*.zip"))
    return zips[-1] if zips else None


pytestmark = pytest.mark.skipif(
    _latest_zip() is None, reason="no car_ped_stops backup zip present"
)


@pytest.fixture(scope="module")
def sample(tmp_path_factory) -> pd.DataFrame:
    db = tmp_path_factory.mktemp("veil") / "replication.db"
    build_veil_table(_latest_zip(), db, years=REPLICATION_YEARS)
    with sqlite3.connect(db) as conn:
        return pd.read_sql("SELECT * FROM car_ped_stops_veil", conn)


def assert_close(actual, expected, tol=0.10, label=""):
    lo, hi = expected * (1 - tol), expected * (1 + tol)
    assert lo <= actual <= hi, f"{label}: {actual} outside [{lo:.0f}, {hi:.0f}] (paper: {expected})"


def test_table_1_sample_size(sample):
    assert_close(len(sample), 37168, label="Table 1 stops")


def test_table_1_by_race(sample):
    counts = sample.party_race.value_counts()
    assert_close(counts["Black - Non-Latino"], 31738, label="Black-party stops")
    assert_close(counts["White - Non-Latino"], 5430, label="White-party stops")


def test_figure_2_motorist_counts(sample):
    by_race = sample.groupby("party_race").party_size.sum()
    assert_close(by_race["Black - Non-Latino"], 36121, label="Black motorists")
    assert_close(by_race["White - Non-Latino"], 5542, label="White motorists")


def test_table_2_solo_and_group(sample):
    black = sample[sample.party_race == "Black - Non-Latino"]
    assert_close((black.group_travel == 0).sum(), 27056, label="solo")
    assert_close((black.group_travel == 1).sum(), 4682, tol=0.15, label="group")


def test_figure_3_percent_motorists_in_multi_occupant_cars(sample):
    """Per motorist, not per stop -- this is the 'five times' headline."""
    for race, expected in [("Black - Non-Latino", 25.1), ("White - Non-Latino", 4.6)]:
        sub = sample[sample.party_race == race]
        pct = 100 * sub[sub.group_travel == 1].party_size.sum() / sub.party_size.sum()
        assert abs(pct - expected) < 3.0, f"{race}: {pct:.1f}% vs paper {expected}%"


def test_figure_4_frisk_and_ticket_rates(sample):
    """Per occupant, not per stop."""
    black = sample[sample.party_race == "Black - Non-Latino"]
    solo, group = black[black.group_travel == 0], black[black.group_travel == 1]
    solo_frisk = 100 * solo.n_frisked.sum() / solo.party_size.sum()
    group_frisk = 100 * group.n_frisked.sum() / group.party_size.sum()
    assert abs(solo_frisk - 7.1) < 2.0, f"solo frisk {solo_frisk:.1f}%"
    assert abs(group_frisk - 19.5) < 3.0, f"group frisk {group_frisk:.1f}%"
    assert group_frisk > 2 * solo_frisk, "group frisk rate should be far higher"


def test_lighting_is_roughly_balanced(sample):
    """The paper reports the window splits its sample about evenly."""
    share_dark = sample.obscured_view.mean()
    assert 0.35 < share_dark < 0.65, share_dark
```

- [ ] **Step 2: Run the test**

Run: `cd pipeline && python -m pytest tests/test_veil_replication.py -v`
Expected: PASS (7 tests). If any fail, the sample construction is wrong — fix Task 2/3 before continuing.

- [ ] **Step 3: Commit**

```bash
git add pipeline/tests/test_veil_replication.py
git commit -m "test(veil): pin the paper's published sample counts and figure rates"
```

---

### Task 5: Quasi-binomial veil-of-darkness models

**Files:**
- Create: `pipeline/veil/models.py`
- Test: `pipeline/tests/test_veil_models.py`
- Modify: `pipeline/pyproject.toml`

**Interfaces:**
- Consumes: the analytic sample DataFrame produced by Task 2.
- Produces: `fit_vod(df: pd.DataFrame, outcome: str, full_controls: bool) -> dict` returning
  `{"coef": float, "se": float, "p": float, "n": int, "odds_ratio": float, "spec": "model_1"|"model_2", "converged": bool}`.
  Also `MODEL_TARGETS: dict[str, float]` holding the paper's published coefficients.

- [ ] **Step 1: Add modelling dependencies**

In `pipeline/pyproject.toml`, add to `dependencies`:

```toml
    "statsmodels>=0.14.1",
    "scipy>=1.10",
```

- [ ] **Step 2: Write the failing test**

Create `pipeline/tests/test_veil_models.py`:

```python
"""Model-fitting tests on synthetic data with a known planted effect."""

import numpy as np
import pandas as pd
import pytest

from veil.models import fit_vod


def synthetic(n=6000, effect=-0.5, seed=0):
    """Build a frame where darkness genuinely lowers the outcome's odds."""
    rng = np.random.default_rng(seed)
    obscured = rng.integers(0, 2, n)
    logit = 0.2 + effect * obscured
    y = rng.random(n) < 1 / (1 + np.exp(-logit))
    return pd.DataFrame({
        "outcome": y.astype(int),
        "obscured_view": obscured,
        "clock_minutes": rng.integers(1028, 1235, n),
        "dow": rng.integers(0, 7, n),
        "year": rng.choice([2021, 2022, 2023, 2024], n),
        "psa": rng.choice(["18-1", "18-2", "22-1", "22-2"], n),
        "assigned_unit": rng.choice(["A", "B", "C"], n),
        "is_summer": rng.integers(0, 2, n),
    })


def test_recovers_a_planted_negative_effect():
    result = fit_vod(synthetic(effect=-0.5), outcome="outcome", full_controls=False)
    assert result["converged"]
    assert -0.7 < result["coef"] < -0.3, result["coef"]
    assert result["p"] < 0.001


def test_finds_nothing_when_there_is_nothing():
    result = fit_vod(synthetic(effect=0.0), outcome="outcome", full_controls=False)
    assert result["p"] > 0.05, result


def test_odds_ratio_matches_the_coefficient():
    result = fit_vod(synthetic(effect=-0.5), outcome="outcome", full_controls=False)
    assert result["odds_ratio"] == pytest.approx(np.exp(result["coef"]), rel=1e-6)


def test_full_controls_spec_runs_and_is_labelled():
    result = fit_vod(synthetic(), outcome="outcome", full_controls=True)
    assert result["spec"] == "model_2"
    assert result["n"] == 6000


def test_reduced_spec_is_labelled():
    result = fit_vod(synthetic(), outcome="outcome", full_controls=False)
    assert result["spec"] == "model_1"


def test_separation_is_reported_not_raised():
    """Sparse fixed-effect cells must degrade gracefully, not explode."""
    df = synthetic(n=200)
    df["psa"] = [f"psa-{i}" for i in range(len(df))]  # one level per row
    result = fit_vod(df, outcome="outcome", full_controls=True)
    assert result["converged"] is False or result["se"] > 0
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd pipeline && python -m pytest tests/test_veil_models.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'veil.models'`

- [ ] **Step 4: Write the implementation**

Create `pipeline/veil/models.py`:

```python
"""Quasi-binomial veil-of-darkness models.

Follows Hannon & Biddle (2026) Tables 1 and 2. The key regressor is
``obscured_view`` -- darkness -- so a negative coefficient means darkness
reduces the odds of the outcome, which is the direction that indicates
visibility-dependent selection.

Model 2 omits the Knode et al. (2024) seasonality weight, whose formula is
not reproduced in the paper. Anything rendering a model_2 result must say
so.
"""

import warnings

import numpy as np
import pandas as pd
import statsmodels.api as sm
import statsmodels.formula.api as smf

# Published coefficients, for reference and for the comparison display.
MODEL_TARGETS = {
    "driver_is_black.model_1": -0.116,
    "driver_is_black.model_2": -0.188,
    "has_black_passenger.model_1": -0.242,
    "has_black_passenger.model_2": -0.269,
}

_BASE = "obscured_view + cr(clock_minutes, df=6) + C(dow) + C(year)"
_FULL = _BASE + " + C(psa) + C(assigned_unit) + C(is_summer)"


def fit_vod(df: pd.DataFrame, outcome: str, full_controls: bool) -> dict:
    """Fit one veil-of-darkness model and return its obscured-view estimate."""
    formula = f"{outcome} ~ {_FULL if full_controls else _BASE}"
    spec = "model_2" if full_controls else "model_1"
    result = {
        "spec": spec, "n": int(len(df)), "coef": float("nan"), "se": float("nan"),
        "p": float("nan"), "odds_ratio": float("nan"), "converged": False,
    }
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = smf.glm(formula, data=df, family=sm.families.Binomial())
            # scale="X2" gives quasi-binomial standard errors, adjusting for
            # under/overdispersion as the paper does.
            fit = model.fit(scale="X2")
        result.update(
            coef=float(fit.params["obscured_view"]),
            se=float(fit.bse["obscured_view"]),
            p=float(fit.pvalues["obscured_view"]),
            odds_ratio=float(np.exp(fit.params["obscured_view"])),
            n=int(fit.nobs),
            converged=bool(fit.converged),
        )
    except Exception as exc:  # separation, singular design matrix, empty cells
        result["error"] = f"{type(exc).__name__}: {exc}"
    return result
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd pipeline && python -m pytest tests/test_veil_models.py -v`
Expected: PASS (6 tests)

- [ ] **Step 6: Verify the models reproduce the paper on real data**

Run:

```bash
cd pipeline && python -c "
import sqlite3, pandas as pd, glob
from veil.build import build_veil_table
from veil.models import fit_vod, MODEL_TARGETS
from pathlib import Path
z = sorted(Path('data').glob('car_ped_stops_*.zip'))[-1]
build_veil_table(z, Path('/tmp/veil_check.db'), years=[2021,2022,2023,2024])
df = pd.read_sql('SELECT * FROM car_ped_stops_veil', sqlite3.connect('/tmp/veil_check.db'))
df['driver_is_black'] = (df.party_race=='Black - Non-Latino').astype(int)
black = df[df.party_race=='Black - Non-Latino'].rename(columns={'group_travel':'has_black_passenger'})
for name, data in [('driver_is_black', df), ('has_black_passenger', black)]:
    for full in (False, True):
        r = fit_vod(data, name, full)
        key = f\"{name}.{r['spec']}\"
        print(f\"{key:34s} coef={r['coef']:+.3f} (se {r['se']:.3f}) p={r['p']:.2g} n={r['n']} | paper {MODEL_TARGETS[key]:+.3f}\")
"
```

Expected: all four coefficients negative and significant, within roughly 0.1 of the paper's values. Model 2 will differ more than Model 1 because the seasonality weight is omitted. If a coefficient has the wrong sign, stop — the lighting classification is inverted.

- [ ] **Step 7: Commit**

```bash
git add pipeline/pyproject.toml pipeline/veil/models.py pipeline/tests/test_veil_models.py
git commit -m "feat(veil): quasi-binomial veil-of-darkness model fitting"
```

---

### Task 6: Cube builder

**Files:**
- Create: `pipeline/cube_builders/veil.py`
- Modify: `pipeline/build_cubes.py:85-93`
- Test: `pipeline/tests/test_veil_cube.py`

**Interfaces:**
- Consumes: `fit_vod`, `MODEL_TARGETS` from `veil.models`; table `car_ped_stops_veil`.
- Produces: `build(conn: sqlite3.Connection) -> tuple[dict, dict]`. The cube dict carries the standard `version`/`dimensions`/`measures`/`rows` plus an extra `models` key. Dimensions are exactly `["year", "era", "clock_bin", "lighting", "party_race", "group_travel", "district"]`; measures are exactly `["n_stops", "n_motorists", "n_frisked", "n_ticketed"]`.

- [ ] **Step 1: Write the failing test**

Create `pipeline/tests/test_veil_cube.py`:

```python
"""Cube-shape tests for the veil builder."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = PIPELINE_ROOT / "build_cubes.py"


@pytest.fixture(scope="module")
def cube(tmp_path_factory):
    out_dir = tmp_path_factory.mktemp("cubes")
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--only", "veil", "--out", str(out_dir)],
        cwd=str(PIPELINE_ROOT), capture_output=True, text=True,
    )
    assert result.returncode == 0, f"stdout={result.stdout}\nstderr={result.stderr}"
    return json.loads((out_dir / "veil.json").read_text())


def test_dimensions_and_measures(cube):
    assert cube["dimensions"] == [
        "year", "era", "clock_bin", "lighting", "party_race",
        "group_travel", "district",
    ]
    assert cube["measures"] == ["n_stops", "n_motorists", "n_frisked", "n_ticketed"]


def test_row_width_matches_header(cube):
    width = len(cube["dimensions"]) + len(cube["measures"])
    assert all(len(r) == width for r in cube["rows"])


def test_has_rows_but_stays_small(cube):
    assert 100 < len(cube["rows"]) < 100_000, len(cube["rows"])


def test_models_block_is_present_and_complete(cube):
    models = cube["models"]
    for key in [
        "driver_is_black.model_1", "driver_is_black.model_2",
        "has_black_passenger.model_1", "has_black_passenger.model_2",
        "placebo_white.model_1",
    ]:
        assert key in models, f"missing {key}"
        assert "coef" in models[key] and "n" in models[key]


def test_main_findings_have_the_expected_sign(cube):
    """Darkness should reduce the odds for both headline models."""
    for key in ["driver_is_black.model_1", "has_black_passenger.model_1"]:
        assert cube["models"][key]["coef"] < 0, key


def test_model_2_is_flagged_as_missing_the_seasonality_weight(cube):
    assert cube["models"]["driver_is_black.model_2"]["seasonality_weight"] is False


def test_both_lighting_states_appear(cube):
    lighting_idx = cube["dimensions"].index("lighting")
    values = {r[lighting_idx] for r in cube["rows"]}
    assert values == {"daylight", "dark"}, values
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd pipeline && python -m pytest tests/test_veil_cube.py -v`
Expected: FAIL — `Unknown topic(s): ['veil']`

- [ ] **Step 3: Write the cube builder**

Create `pipeline/cube_builders/veil.py`:

```python
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
```

- [ ] **Step 4: Register the builder**

In `pipeline/build_cubes.py`, extend the import block and `BUILDERS` dict (currently lines 85-93):

```python
    from cube_builders import stops as stops_builder
    from cube_builders import reasons as reasons_builder
    from cube_builders import safety as safety_builder
    from cube_builders import veil as veil_builder

    BUILDERS = {
        "stops": stops_builder.build,
        "reasons": reasons_builder.build,
        "safety": safety_builder.build,
        "veil": veil_builder.build,
    }
```

- [ ] **Step 5: Populate the veil table in the working DB**

Run (substituting the actual filenames in `pipeline/data/`):

```bash
cd pipeline && python -m veil.build \
  --zip data/car_ped_stops_2026-07-20T03_45_06.zip \
  --db data/open_data_philly_2026_07_20.db
```

Expected: `wrote <N> rows to car_ped_stops_veil`

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd pipeline && python -m pytest tests/test_veil_cube.py -v`
Expected: PASS (7 tests)

- [ ] **Step 7: Build the cube for real**

Run: `cd pipeline && python build_cubes.py --only veil`
Expected: `wrote .../public/cubes/veil.json`

- [ ] **Step 8: Commit**

```bash
git add pipeline/cube_builders/veil.py pipeline/build_cubes.py \
        pipeline/tests/test_veil_cube.py public/cubes/veil.json
git commit -m "feat(veil): cube builder emitting descriptive rows and model results"
```

---

### Task 7: Cube composable and selectors

**Files:**
- Create: `composables/useVeilCube.ts`
- Create: `utils/veil.ts`
- Test: `utils/veil.test.ts`

**Interfaces:**
- Consumes: `/cubes/veil.json`; `Cube` type from `~/utils/cube`.
- Produces:
  - `interface VeilModel { coef: number; se: number; p: number; n: number; odds_ratio: number; spec: string; converged: boolean; seasonality_weight: boolean; paper_coef: number | null }`
  - `interface VeilCube extends Cube { models: Record<string, VeilModel> }`
  - `useVeilCube()` returning `{ cube: VeilCube }`.
  - `motoristsByRace(cube, opts?)`, `pctMotoristsInGroups(cube)`, `frisksAndTickets(cube)`, `groupTravelByClockBin(cube)` — all pure, all taking a `VeilCube`.

- [ ] **Step 1: Write the failing test**

Create `utils/veil.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  frisksAndTickets,
  groupTravelByClockBin,
  motoristsByRace,
  pctMotoristsInGroups,
  type VeilCube,
} from './veil'

// dimensions: year, era, clock_bin, lighting, party_race, group_travel, district
// measures:   n_stops, n_motorists, n_frisked, n_ticketed
const cube: VeilCube = {
  version: 1,
  dimensions: ['year', 'era', 'clock_bin', 'lighting', 'party_race', 'group_travel', 'district'],
  measures: ['n_stops', 'n_motorists', 'n_frisked', 'n_ticketed'],
  rows: [
    [2023, 'post_deo', 1080, 'daylight', 'Black - Non-Latino', 0, '18', 100, 100, 10, 12],
    [2023, 'post_deo', 1080, 'dark', 'Black - Non-Latino', 1, '18', 20, 45, 9, 3],
    [2023, 'post_deo', 1095, 'daylight', 'White - Non-Latino', 0, '18', 50, 50, 2, 6],
    [2023, 'post_deo', 1095, 'dark', 'White - Non-Latino', 1, '18', 5, 11, 1, 1],
  ],
  models: {},
}

describe('motoristsByRace', () => {
  it('sums motorists, not stops', () => {
    expect(motoristsByRace(cube)).toEqual({
      'Black - Non-Latino': 145,
      'White - Non-Latino': 61,
    })
  })
})

describe('pctMotoristsInGroups', () => {
  it('uses motorists as the denominator, matching the paper figure 3', () => {
    const pct = pctMotoristsInGroups(cube)
    expect(pct['Black - Non-Latino']).toBeCloseTo((45 / 145) * 100, 5)
    expect(pct['White - Non-Latino']).toBeCloseTo((11 / 61) * 100, 5)
  })
})

describe('frisksAndTickets', () => {
  it('reports per-occupant rates split by solo and group', () => {
    const r = frisksAndTickets(cube, 'Black - Non-Latino')
    expect(r.solo.friskRate).toBeCloseTo(10, 5)
    expect(r.solo.ticketRate).toBeCloseTo(12, 5)
    expect(r.group.friskRate).toBeCloseTo((9 / 45) * 100, 5)
    expect(r.group.ticketRate).toBeCloseTo((3 / 45) * 100, 5)
  })
})

describe('groupTravelByClockBin', () => {
  it('splits group-travel share by lighting within each bin', () => {
    const series = groupTravelByClockBin(cube, 'Black - Non-Latino')
    expect(series).toEqual([
      { clockBin: 1080, lighting: 'daylight', pctGroupStops: 0 },
      { clockBin: 1080, lighting: 'dark', pctGroupStops: 100 },
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- utils/veil.test.ts`
Expected: FAIL — cannot resolve `./veil`

- [ ] **Step 3: Write the helpers**

Create `utils/veil.ts`:

```ts
/**
 * Helpers for the veil-of-darkness cube.
 *
 * Denominators differ per figure and mixing them up silently reports the
 * wrong number. The paper's headline "five times more likely" (25.1% vs
 * 4.6%) is per motorist; the same quantity per stop is 14.2% vs 2.6%.
 * Function names here say which denominator they use.
 */
import type { Cube } from '~/utils/cube'

export interface VeilModel {
  coef: number
  se: number
  p: number
  n: number
  odds_ratio: number
  spec: string
  converged: boolean
  seasonality_weight: boolean
  paper_coef: number | null
}

export interface VeilCube extends Cube {
  models: Record<string, VeilModel>
}

type Row = Array<string | number | null>

function column(cube: VeilCube, name: string): number {
  const dim = cube.dimensions.indexOf(name)
  if (dim >= 0) return dim
  const measure = cube.measures.indexOf(name)
  if (measure < 0) throw new Error(`unknown cube column: ${name}`)
  return cube.dimensions.length + measure
}

function sumBy(
  cube: VeilCube,
  measure: string,
  predicate: (get: (name: string) => string | number | null) => boolean,
): number {
  const idx = column(cube, measure)
  let total = 0
  for (const row of cube.rows as Row[]) {
    const get = (name: string) => row[column(cube, name)]
    if (predicate(get)) total += Number(row[idx] ?? 0)
  }
  return total
}

const RACES = ['Black - Non-Latino', 'White - Non-Latino'] as const

/** Total young male motorists stopped, by race. Paper figure 2. */
export function motoristsByRace(cube: VeilCube): Record<string, number> {
  const out: Record<string, number> = {}
  for (const race of RACES) {
    out[race] = sumBy(cube, 'n_motorists', (get) => get('party_race') === race)
  }
  return out
}

/** Share of motorists who were in a multi-occupant car. Paper figure 3. */
export function pctMotoristsInGroups(cube: VeilCube): Record<string, number> {
  const out: Record<string, number> = {}
  for (const race of RACES) {
    const all = sumBy(cube, 'n_motorists', (get) => get('party_race') === race)
    const grouped = sumBy(
      cube,
      'n_motorists',
      (get) => get('party_race') === race && Number(get('group_travel')) === 1,
    )
    out[race] = all === 0 ? 0 : (grouped / all) * 100
  }
  return out
}

/** Per-occupant frisk and ticket rates, solo vs group. Paper figure 4. */
export function frisksAndTickets(cube: VeilCube, race: string) {
  const bucket = (grouped: 0 | 1) => {
    const match = (get: (n: string) => string | number | null) =>
      get('party_race') === race && Number(get('group_travel')) === grouped
    const motorists = sumBy(cube, 'n_motorists', match)
    return {
      motorists,
      friskRate: motorists === 0 ? 0 : (sumBy(cube, 'n_frisked', match) / motorists) * 100,
      ticketRate: motorists === 0 ? 0 : (sumBy(cube, 'n_ticketed', match) / motorists) * 100,
    }
  }
  return { solo: bucket(0), group: bucket(1) }
}

export interface ClockBinPoint {
  clockBin: number
  lighting: string
  pctGroupStops: number
}

/**
 * Share of stops that are group-travel, per clock-time bin and lighting
 * state. Per stop, not per motorist: this mirrors the regression outcome.
 * The gap between the two lines at the same clock time is the veil-of-
 * darkness contrast made visible.
 */
export function groupTravelByClockBin(cube: VeilCube, race: string): ClockBinPoint[] {
  const points = new Map<string, { total: number; grouped: number; bin: number; light: string }>()
  const binIdx = column(cube, 'clock_bin')
  const lightIdx = column(cube, 'lighting')
  const raceIdx = column(cube, 'party_race')
  const groupIdx = column(cube, 'group_travel')
  const stopsIdx = column(cube, 'n_stops')

  for (const row of cube.rows as Row[]) {
    if (row[raceIdx] !== race) continue
    const bin = Number(row[binIdx])
    const light = String(row[lightIdx])
    const key = `${bin}|${light}`
    const entry = points.get(key) ?? { total: 0, grouped: 0, bin, light }
    const n = Number(row[stopsIdx] ?? 0)
    entry.total += n
    if (Number(row[groupIdx]) === 1) entry.grouped += n
    points.set(key, entry)
  }

  return [...points.values()]
    .sort((a, b) => a.bin - b.bin || a.light.localeCompare(b.light))
    .map((e) => ({
      clockBin: e.bin,
      lighting: e.light,
      pctGroupStops: e.total === 0 ? 0 : (e.grouped / e.total) * 100,
    }))
}
```

- [ ] **Step 4: Write the composable**

Create `composables/useVeilCube.ts`:

```ts
/**
 * Fetch the veil-of-darkness cube (static JSON, shipped from `public/cubes`).
 *
 * Unlike the other cubes this one carries an extra `models` block holding
 * fitted regression results computed at build time.
 */
import type { VeilCube } from '~/utils/veil'

export function useVeilCube() {
  return useAsyncData<VeilCube>(
    'veil-cube',
    () => $fetch<VeilCube>('/cubes/veil.json'),
    { server: false, lazy: true },
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- utils/veil.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add utils/veil.ts utils/veil.test.ts composables/useVeilCube.ts
git commit -m "feat(veil): cube composable and denominator-explicit selectors"
```

---

### Task 8: The page

**Files:**
- Create: `pages/veil-of-darkness.vue`

**Interfaces:**
- Consumes: `useVeilCube`, and every selector from `utils/veil.ts`.
- Produces: the route `/veil-of-darkness`. Not added to `components/layout/Header.vue` or `Footer.vue`.

Follow the existing page structure in `pages/reasons.vue`: `LayoutPageHeader`, then `main.layout-container`, `QuestionHeader`/`Answer`/`AnswerText` blocks, `Graph` for charts. Match its Tailwind class conventions rather than inventing new ones.

- [ ] **Step 1: Create the page skeleton with the first three charts**

Create `pages/veil-of-darkness.vue`. Structure, in order:

1. `LayoutPageHeader` with header text "Are young Black men traveling together targeted for traffic stops?"
2. An intro `section` explaining the veil-of-darkness idea in two short paragraphs: officers can see who is in a car in daylight but not after dark; carpooling habits do not change at dusk but visibility does; so comparing stops just before and just after dark isolates what officers could see.
3. **Chart 1 — motorists stopped by race.** Data: `motoristsByRace(cube)`. Caption states the denominator: "young male motorists stopped, 2021–2024, 5:08pm–8:35pm". Immediately below it, an `AnswerText` carrying the paper's own caveat: this gap is not by itself evidence of bias — police deployment decisions driven by perceived crime-control needs ("neighbourhood profiling") likely explain much of it. **Do NOT write "the charts that follow control for location" — that claim was in an earlier draft of this plan and it is false.** Charts 2–4 are raw pooled shares and Model 1 has no location term; only Model 2 does. The defence against neighbourhood profiling for the headline result is that the headline comparison is within race, not any control. See the retraction note in the spec's "What the page must say".
4. **Chart 2 — share of motorists in multi-occupant cars, by race.** Data: `pctMotoristsInGroups(cube)`. Caption must say **per motorist**, and note that the same quantity per stop is materially lower.
5. **Chart 3 — frisk and ticket rates, solo vs group, Black motorists.** Data: `frisksAndTickets(cube, 'Black - Non-Latino')`. Four bars. Caption says **per occupant**. This is the page's most striking result: traveling with another young Black man nearly triples the frisk rate while lowering the chance of a ticket for the violation that supposedly justified the stop.

Use `<script setup lang="ts">` with `const { data: cube } = useVeilCube()` and computed properties per chart, guarded with `v-if="cube"`.

- [ ] **Step 2: Verify the page renders**

Run: `npm run dev`, then open `http://localhost:3000/veil-of-darkness`.
Expected: three charts with data. Confirm chart 1 shows roughly 36,000 vs 5,500 and chart 3 shows roughly 7% vs 20% frisk rates. If charts are empty, check the browser console — the cube is fetched client-side.

- [ ] **Step 3: Commit**

```bash
git add pages/veil-of-darkness.vue
git commit -m "feat(veil): page with descriptive charts"
```

- [ ] **Step 4: Add chart 4 — the veil itself**

Add a section rendering `groupTravelByClockBin(cube, 'Black - Non-Latino')` as two lines (daylight, dark) against `clockBin`, x-axis labelled in clock time (`1080` → `6:00pm`). Caption explains the identifying variation directly: at 7:15pm it is light in June and dark in December, and the gap between the lines at the same clock time is what the test rests on. Note this chart is **per stop**.

- [ ] **Step 5: Add chart 5 — model results**

Render `cube.models['has_black_passenger.model_1']` and `['driver_is_black.model_1']` as odds ratios with confidence intervals derived from `coef ± 1.96 * se`, alongside `paper_coef` for comparison. Include `placebo_white.model_1` and state plainly that it is not significant, and that a null placebo is part of the evidence.

Where any `model_2` result is shown, render the omission notice: this specification omits the Knode et al. (2024) seasonality weight, whose formula is not published in the paper.

- [ ] **Step 6: Add the caveats section**

A closing `section` covering, each in a sentence or two:

- Effects are modest in odds terms — a 17–24% change. The frisk-rate gap is the large effect; the veil-of-darkness coefficients are the clean one.
- The test is deliberately conservative: artificial lighting, car profiling and segregation all shrink the daylight/darkness contrast, and existing research suggests Black drivers drive *more* carefully in high visibility. It understates.
- Segregation strains cross-race comparison — only 5% of stops of young Black men occur in majority-White districts, which is why the intra-racial test matters.
- Stop times are rounded: 55% fall on a multiple of five minutes, 22% on a quarter hour. Near the dusk boundary that misclassifies lighting, which is why the ~30-minute sunset-to-dusk band is dropped.
- Sample and method: link the paper by DOI (`https://doi.org/10.21428/cb6ab371.f1d81a4b`) and credit Hannon & Biddle (2026).

- [ ] **Step 7: Verify and commit**

Run: `npm run dev` and re-check the page.
Expected: five charts and the caveats section.

```bash
git add pages/veil-of-darkness.vue
git commit -m "feat(veil): veil contrast chart, model results and caveats"
```

---

### Task 9: End-to-end coverage

**Files:**
- Modify: `e2e/config.mjs`

**Interfaces:**
- Consumes: the built page.
- Produces: `/veil-of-darkness` covered by `npm run e2e:checks`.

- [ ] **Step 1: Read the existing config**

Run: `cat e2e/config.mjs`

Identify how routes and their invariant checks are declared. Follow that shape exactly — do not invent a new one.

- [ ] **Step 2: Add the route with invariant checks**

Add a `veil` entry following the file's existing structure, asserting:

- the page renders without console errors
- chart 1's Black-motorist figure is between 30,000 and 45,000
- chart 3's group frisk rate is at least double the solo frisk rate
- the string "Hannon" appears (the attribution survived)

Do **not** add a production-parity check — the page does not exist in production, so a parity diff would fail by construction.

- [ ] **Step 3: Run the checks**

Run: `npm run e2e:checks`
Expected: PASS, including the new route. Requires `agent-browser` (`npm i -g agent-browser`).

- [ ] **Step 4: Commit**

```bash
git add e2e/config.mjs
git commit -m "test(veil): cover the veil-of-darkness route in e2e checks"
```

---

## Deferred to Phase 2

Recorded in the spec, not in this plan: extending beyond 2021–2024 with a `darkness × era` interaction, implementing the Knode et al. (2024) seasonality weight, ordinal dose-response modelling of party size, time-heaping sensitivity, location-key normalization, and folding the page into site navigation.

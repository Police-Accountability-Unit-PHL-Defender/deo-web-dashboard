# Driving Equality dashboard — working notes

Three repos, one pipeline:

```
Open Data Philly (phl.carto.com)
        │  monthly GitHub Action, 20th of the month
        ▼
odp-data-backups ──> car_ped_stops_<timestamp>.zip ──> Google Drive
        │                                                   │  (download by hand)
        │  uses PyPI: open-data-philly-downloader            ▼
        │                                    deo-backend/deo_backend/data/
        │                                                   │
        │                            update_db.py ──> open_data_philly_<date>.db
        │                                                   │
        │                            build_cubes.py ──> deo-web-dashboard/public/cubes/*.json
        │                                                   ▼
        │                                    Nuxt static site (Vercel)
```

The live site is **https://driving-equality.phillydefenders.org** — note the
**s** in `phillydefenders`. `phillydefender.org` (no s) is a parked
domain-for-sale page and is not ours.

---

## Updating the data (the common task)

This is a quarterly job: publish the quarter that just ended.

### 1. Get the backup zip

The monthly Action uploads `car_ped_stops_<timestamp>.zip` to a Google Drive
folder owned by the Police Accountability Unit. There is **no public source** —
the repo is private and publishes no releases — so someone with Drive access
has to download it and drop it in `deo-backend/deo_backend/data/`.

Pick a zip dated *after* the quarter you want to publish. To publish 2026-Q2
you need a zip from July 2026 or later.

### 2. Point the backend at it

```
deo-backend/deo_backend/env.py  →  ZIP_FILENAME = "car_ped_stops_2026-07-20T03_45_06.zip"
```

Keep the `:` → `_` form used in the existing value.

### 3. Build the database

```bash
cd deo-backend
poetry run python deo_backend/update_db/update_db.py
```

The most recent quarter is inferred from `summary.json` inside the zip (the
last full quarter before `last_dt`); it prints `Using 2026-Q2`. If that is
wrong, pass `--most-recent-quarter-override 2026-Q2`.

This takes ~20-40 minutes — it reads roughly 2 GB of CSV.

Two things that have bitten us here:

- **CSV names change between backup versions.** Files used to be
  `car_ped_stops_year_2022.csv`; since the 2026-07-20 backup they carry the
  split column too (`car_ped_stops_datetimeoccur_year_2022.csv`). Table
  dispatch matches on the containing directory and the 2022 `mvc_code`
  override matches on year, so both layouts work — but if a future backup
  changes shape again, that is where to look (`update_db/models.py`,
  `csv_year()` and `csv_dir`).
- **The README seed check in `deo-backend/README.md` is stale.** It expects
  1,916,962; the real value has been 2,043,22x for a long time. A mismatch
  there is not evidence of a problem.

### 4. Build the cubes

```bash
poetry run python build_cubes.py                 # all topics
poetry run python build_cubes.py --only stops    # while iterating
```

`--db` must name a file in `deo_backend/data/`; it is exported as
`DB_FILENAME` so every builder, including snapshot (which resolves the
database itself at import time), reads the same one.

### 5. Verify before publishing

```bash
cd ../deo-web-dashboard
npm run e2e:checks          # invariants on the new build
```

Then compare against production — see **Checking a build against live** below.
Expect the newly added quarter to differ and nothing else.

### 6. Commit

Commit the cubes in `deo-web-dashboard` and push; Vercel redeploys. The
`env.py` change belongs in `deo-backend`.

---

## Checking a build against live

`deo-web-dashboard/e2e/` renders every page in a real browser — necessary,
because cube data is fetched client-side and the shipped HTML is nearly empty —
and diffs the visible text against production.

```bash
npm run e2e -- --quarter 2026-Q1 --cubes /path/to/previous/cubes   # full parity
npm run e2e:checks                                                 # invariants only
npm run e2e -- --only stops,safety                                 # narrow
npm run e2e -- --skip-build                                        # reuse .output/public
```

Requires `agent-browser` (`npm i -g agent-browser`).

**Why `--quarter` matters.** `mostRecentQuarter` comes from today's date, not
from the data. If your local build has newer data than production, every page
differs on date ranges and the diff tells you nothing. Pin the local build to
the quarter production was built from, and point `--cubes` at cubes built from
that same vintage; then any difference is a *code* change, which is what you
want to see. Rebuild the old cubes with:

```bash
cd deo-backend
poetry run python build_cubes.py --db deo_backend/data/<older>.db --out /tmp/old-cubes
```

`--cubes` is swapped into the build output, never into `public/`, so a parity
run leaves no stale data in the source tree.

**Adding checks.** `e2e/config.mjs` holds `PAGES` (routes diffed against live)
and `CHECKS` (assertions about the local build alone). Use a check for anything
a diff cannot catch — an invariant that would be equally wrong on both sides.
Return a string, not `false`, so the failure explains itself. After adding one,
break the thing it guards and confirm it fails; a check that has never failed
has not been tested.

---

## Data caveats worth knowing

**Row order used to be load-bearing.** The pipeline picks each stop's driver as
the first CSV row for that stop. Carto returns rows in arbitrary order unless
asked otherwise, so two backups of *identical* records produced different
demographic splits. Comparing the 2026-04-20 and 2026-07-20 backups: every
2014-2025 record was byte-identical, yet 4,837 quarter/district/demographic
cells moved, and the published "29 fewer white drivers stopped in the year
after Driving Equality" became 16. Fixed by ordering on `cartodb_id` in
`open-data-philly-downloader` (≥0.1.1) and in `pau_odp_backups/hin.py`. If
historical numbers shift again after a rebuild, check that the backup was
produced with those versions before believing the data changed.

**Late-reported stops are real.** ODP backfills. March 2026 gained 53 records
between the April and July backups. Small movements in the most recent two or
three quarters are expected; movements in 2019 are not.

**The HIN map sample is 1,000 points** chosen by `md5(cartodb_id)` — stable for
a given `sample_year`, so the map no longer churns each backup.

**Charts key data by their axis label.** `Graph.vue` reads each row's x value as
`d[axisProperties.x]`, so the axis title *is* the data key. Renaming a label
without renaming the key silently produces an empty chart. `stops.vue` and
`safety.vue` show the correct pattern.

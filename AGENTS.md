# Driving Equality dashboard — working notes

Three repos, one pipeline:

```
Open Data Philly (phl.carto.com)
        │  monthly GitHub Action, 20th of the month
        ▼
odp-data-backups ──> car_ped_stops_<timestamp>.zip ──> Google Drive
        │                                                   │  (download by hand)
        │  uses PyPI: open-data-philly-downloader            ▼
        │                                    deo-web-dashboard/pipeline/data/
        │                                                   │
        │                            update_db.py ──> open_data_philly_<date>.db
        │                                                   │
        │                            build_cubes.py ──> deo-web-dashboard/public/cubes/*.json
        │                                                   ▼
        │                                    Nuxt static site (Vercel)
```

(Archival note: this pipeline used to run out of a separate `deo-backend`
repo, which also hosted a retired Plotly Dash app and FastAPI service. It was
consolidated into `deo-web-dashboard/pipeline/` in 2026-08; `deo-backend` is
now kept read-only for history.)

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
has to download it and drop it in `deo-web-dashboard/pipeline/data/`.

Pick a zip dated *after* the quarter you want to publish. To publish 2026-Q2
you need a zip from July 2026 or later.

### 2-4. Build

```bash
cd deo-web-dashboard
npm run update-data -- --zip car_ped_stops_2026-10-20T03_45_06.zip
```

Runs zip → SQLite → cubes, reports what moved versus the published cubes, and
runs the e2e checks. Takes ~30 minutes, almost all of it stage 1.

Requires [uv](https://docs.astral.sh/uv/). The pipeline lives in `pipeline/`;
`pipeline/ASSETS.md` records where every static input came from.

The most recent quarter is inferred from `summary.json` inside the zip (the
last full quarter before `last_dt`).

**If that inferred quarter is wrong**, `pipeline/update_db.py` still has a
`--most-recent-quarter-override` flag. This bypasses `npm run update-data`
entirely — run stage 1 directly instead:

```bash
cd pipeline
uv run python update_db.py --zip car_ped_stops_2026-10-20T03_45_06.zip --most-recent-quarter-override 2026-Q2
```

Then pick back up at stage 2 (`build_cubes.py`) by hand, or point
`update-data.mjs` at the resulting `.db` if you'd rather resume there.

One thing that has bitten us here:

- **CSV names change between backup versions.** Files used to be
  `car_ped_stops_year_2022.csv`; since the 2026-07-20 backup they carry the
  split column too (`car_ped_stops_datetimeoccur_year_2022.csv`). Table
  dispatch matches on the containing directory and the 2022 `mvc_code`
  override matches on year, so both layouts work — but if a future backup
  changes shape again, that is where to look (`pipeline/update_db_models.py`,
  `csv_year()` and the `csv_dir` property).

### 5. Verify before publishing

`npm run update-data` already runs the e2e checks as its last stage. Also
compare against production — see **Checking a build against live** below.
Expect the newly added quarter to differ and nothing else.

### 6. Commit

Commit the cubes in `deo-web-dashboard` and push; Vercel redeploys.

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
cd pipeline
uv run python build_cubes.py --db data/<older>.db --out /tmp/old-cubes
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

**Whether a year is complete comes from the cube, never from the clock.**
`mostRecentQuarter` is derived from today's date (see "Why `--quarter` matters"
above), so it cannot tell you whether the data for a year actually arrived. Use
`completeYears()` in `utils/cube.ts`: a year is complete only when all four of
its quarters are present in the cube. `mostRecentQuarter` still *caps* which
year may be published, which is what keeps `--quarter` pinning meaningful — the
two are a floor and a ceiling, not alternatives. Trusting the clock alone means
that one missed quarterly refresh across a year boundary silently publishes a
half-year as a settled one: the partial-year dash disappears from the trend
chart and the Neighborhoods sentence recomputes on six months of stops, with
every test and e2e check still green. Both `operationalShareByYear` and
`majorityWhiteDisparity` have tests pinning this exact scenario; don't
"simplify" them back.

**`None` is not missing data.** In `reasons.json`, `violation_category` of
`None` means no MVC code was recorded — but PPD stopped coding tint stops in
2023, so `Tint` falls to zero while `None` absorbs the same volume. Both `None`
and `Other` are non-operational stops and belong in the denominator, out of the
numerator. Filtering either one out inflates the operational share, most of all
for Black drivers, who carry the largest share of them. This has been
"corrected" by mistake before; `utils/reasons.test.ts` guards it.

---

## Working on this repo without fooling yourself

Three traps have each cost real time here. All three produce *plausible wrong
answers* rather than errors, which is what makes them expensive.

**A stale `.output/` will lie to you.** `npm run generate` writes into
`.output/public`, and `e2e/parity.mjs --skip-build` reads whatever is there. If
a build failed, or you served the directory while a build was still writing it,
the harness tests a half-written bundle and reports missing charts and missing
sentences. This has twice looked exactly like a code regression — once
convincingly enough that a good commit was reverted on the strength of a
"bisect" that had really only proven a rebuild happened.

So: **never believe a surprising e2e result without a clean rebuild first.**

```bash
rm -rf .output && npm run generate && node e2e/parity.mjs --checks-only --skip-build
```

Two contributing causes worth knowing. A stray `nuxt dev` left running by
another session shares `.nuxt` and races `nuxt generate`, which makes builds
fail intermittently — check `pgrep -fl "nuxt dev"` when exit codes start
alternating. And starting a static server on `.output/public` before the build
finishes serves a partial bundle; build first, serve second.

**Commit before you instrument.** Debug counters get removed with
`git checkout -- <file>`, which also discards every other uncommitted change in
that file. Two batches of finished work were lost this way. Commit the real
change, then add instrumentation on top.

**Unit tests do not cover the built site.** Every published-number bug found
here was invisible to `vitest` and visible on the rendered page: a chart whose
data key stopped matching its axis label renders empty rather than throwing, and
`v-if` on a computed that returns `null` removes a section silently. Run the e2e
checks against a build after any change to `utils/cube.ts`, `Graph.vue`, or a
page computed.

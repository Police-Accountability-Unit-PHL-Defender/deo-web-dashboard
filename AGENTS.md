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
two are a floor and a ceiling, not alternatives.

`operationalShareByYear` is the live consumer, and it does not drop short years
— it draws them. The series runs 2022 through the pinned quarter's year, and any
year the cube is missing quarters for is flagged `incomplete`, which makes
LineGraph dash the segment into it and the hover read "(partial year)". The
current trailing point is 2026, on Q1 and Q2 only.

The hazard is unchanged and the flag is now the whole of the protection: one
missed quarterly refresh across a year boundary would otherwise put a half-year
on the chart as a settled point, with every test and e2e check still green. So
`incomplete` must keep coming from `completeYears()`, never from the clock — if
the clock runs ahead of the data, the year is still short and must still dash.
The tests pin exactly that, including a case where the clock is pinned past a
half-populated year and the point must appear dashed rather than solid. Do not
"simplify" them back, and do not restore the old behaviour of hiding partial
years: the dashed point is the requested design, the flag is what makes it
honest.

`mostRecentQuarter` remains the ceiling. Pinning back with `--quarter` drops
later years outright rather than dashing them, and quarters past the pin are not
counted inside the trailing year either — otherwise a pinned build's last point
would drift as new data landed, and the e2e parity comparison would be
meaningless.

The Neighborhoods disparity sentence used to share this hazard, choosing a
"most recent complete year" itself. Since 2026-08 it takes the quarter range
from the page's selectors instead, so there is no year for it to get wrong — if
you ever give it back a self-chosen period, the clock trap returns with it.

**Every Reasons chart divides by stops that name a reason.** Two categories
name none. `None` means no MVC code was recorded at all. `Other` means a code
was recorded that says nothing in particular. Every question on the page is
framed "when Philadelphia police gave a reason", so both are out of every
denominator — `CATEGORIES_WITHOUT_A_REASON` in `utils/reasons.ts` is the single
definition, and all four charts go through it.

Neither is missing data, and that is the point. PPD stopped coding tint stops in
2023, so `Tint` falls to zero while `None` absorbs almost the same volume,
growing from 7,691 stops in 2022 to 28,518 in 2025; `Other` grew from 3,838 to
18,967 over the same period. Those are real nonoperational stops, and Black
drivers carry the largest share of them, so excluding them lifts every race and
narrows every gap. Know the size of it before touching either rule:

- **`operationalShareByRace`** (2025): Black 44.8% → 63.6%, White 63.8% → 76.9%,
  and the White-Black gap 19.0 → 13.3 points.
- **`operationalShareByYear`**: the series went 50.8/65.0/64.5/59.0 with both in
  to 52.9/70.0/70.9/67.6 with both out, steepening the 2022→2025 rise from +2.5
  points (original all-stops denominator) to +14.7.

A good part of that steepening is tint stops leaving the denominator rather than
enforcement shifting. Putting either category back is a change to a published
claim, not a cleanup. `utils/reasons.test.ts` pins the rules and the figures;
the e2e check guards the headings, which state the denominator in words.

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

## Load-bearing details that look removable

Each of these reads like tidy-up bait. All three are the reason an interaction
is fast instead of freezing the page for a second.

**The cubes are deliberately not reactive.** Each cube composable wraps its
fetched payload in `markRaw`. Without it Vue installs reactive proxies over the
whole structure — 138,773 rows of five dimensions and seven measures for the
stops cube — and every dependency-tracking pass over that costs more than the
aggregation it guards. Restoring reactivity took a Neighborhoods map click from
53ms to 985ms, 950ms of it blocking the main thread. Nothing mutates a cube;
pages only read from them, so there is nothing for Vue to track. This looks like
a stray import to tidy up. It is load-bearing.

**`utils/cube.ts` keeps each cube twice.** The rows as shipped, plus a columnar
form built once and cached on a `WeakMap`: every dimension dictionary-encoded to
integer codes, measures as `Float64Array`s, rows bucketed by district. A filter
compiles to one allow-list per dimension, so "is this location in the selection"
is answered once per distinct value rather than once per row. That is why the
aggregations look indirect — the indirection is the point, and the old row-scan
version blocked for 1.7s on a single toggle. `utils/cube.test.ts` pins the
results; if you rewrite the internals, those tests are the contract.

**Interaction budgets fail the e2e run.** `e2e/config.mjs` has an `INTERACTIONS`
list that drives a real toggle and a real map click and asserts how long the
main thread was blocked, not how long the interaction took. A page can finish in
300ms having been frozen for 250 of them, and freezing is what users report —
the Source link on this site looked broken for months for exactly that reason;
it was fine, the thread was busy. Budgets sit at 100ms against a measured 0ms.

`LOAD_BUDGETS` covers the other half, and the two are not interchangeable. The
interaction observer is installed only after the page has settled, deliberately,
so that load work is not charged to a click — which leaves first render
unmeasured, and first render is where a cube that lost its `markRaw` actually
costs you. Removing it from `useStopsCube` alone takes the stops page from 91ms
of blocking on load to 761ms. The map-click budget does catch that one too, at
251ms — but snapshot goes from 93ms to 694ms and has no interaction to drive at
all, so on that page the load budget is the only thing standing there. The load
signal is also the louder of the two by a factor of three, which matters when
the question is whether anyone believes the number.

Those budgets are the one set of numbers here that are not measured against
zero: fetching, decoding and aggregating a cube before first paint genuinely
costs 90-190ms on the bigger pages. They were set from three runs of a release
build with about half again as headroom. If a page gets legitimately slower,
move its budget in the commit that slows it and say why. Raising one quietly to
turn a run green is worse than deleting it, because it still reads as coverage.

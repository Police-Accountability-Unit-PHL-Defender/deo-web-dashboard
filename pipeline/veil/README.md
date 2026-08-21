# veil — the veil-of-darkness analysis

Reproduces Hannon & Biddle (2026), ["Are Young Black Men Traveling Together
Targeted for Traffic Stops?"](https://doi.org/10.21428/cb6ab371.f1d81a4b)
(CrimRxiv, Villanova), against our copy of the OpenDataPhilly stop data, and
publishes the result at `/veil-of-darkness`.

The page is **unlinked** — not in the header or footer — pending a decision about
whether it folds into `/stops` or `/neighborhoods`.

## The idea in one paragraph

An officer can see who is in a car in daylight and much less after dark. People's
travel habits don't change at dusk, but visibility does. So comparing stops just
before nightfall with stops just after, at the same clock time, isolates the part
of the stop decision that depends on what the officer could see. The paper applies
this twice: the traditional inter-racial version (is the party more likely to be
Black in daylight?) and a novel intra-racial version (among stops of young Black
men, is the car more likely to hold two or more of them in daylight?). The second
is the paper's contribution, and the one this page leads with.

## Re-running it

Two steps, both from `pipeline/`. The first is slow; the second needs the first.

```bash
# ~7 minutes: reads every year of stop CSVs out of the backup zip and writes
# the stop-level analytic table into the SQLite DB.
python -m veil.build --zip data/car_ped_stops_<timestamp>.zip \
                     --db  data/open_data_philly_<date>.db

# Fits the models and writes public/cubes/veil.json
python build_cubes.py --only veil
```

`veil.build` is a standalone entry point on purpose — it is re-runnable without
the 20-40 minute full `update_db.py` rebuild, and it stays clear of that script's
CSV-name dispatch. Pass `--years 2021,2022,2023,2024` to build just the paper's
window while iterating; it reads the neighbouring years too and then filters on
**local** year (see caveat 4 in `AGENTS.md`).

## Files

| File | Does |
|---|---|
| `sun.py` | Loads `data/philadelphia_sun_times.csv`; derives the inter-twilight window |
| `sample.py` | Stop rollup, lighting classification, the paper's sample restrictions |
| `build.py` | Reads the backup zip, writes table `car_ped_stops_veil` |
| `models.py` | Quasi-binomial GLMs, sparse-level collapsing, the degeneracy guard |
| `../cube_builders/veil.py` | Emits `public/cubes/veil.json` — descriptive rows plus fitted models |
| `../scripts/generate_sun_times.py` | Dev-only; regenerates the committed sun-times CSV |

Frontend: `utils/veil.ts` (selectors), `composables/useVeilCube.ts`,
`pages/veil-of-darkness.vue`.

Sun times are **committed as a CSV** rather than computed at build time, so the
values are reviewable in a diff and cannot drift with an `astral` upgrade. `astral`
is a dev dependency only. Regenerate only to extend the year range past 2030.

## The sample

Per the paper's Data and Methods section, in this order:

1. Vehicle stops, 2021–2024
2. Motor-vehicle-code violations only (`mvc_code` present — see caveat 2 in `AGENTS.md`)
3. Party is exclusively men aged 18–29
4. Party is racially homogeneous, Black or White
5. No arrest
6. No exact duplicate records (keyed on `objectid`)
7. Complete demographics
8. Within the inter-twilight window, 17:08–20:35
9. Excluding the ~30-minute sunset-to-dusk band

Window note: the paper reports 17:08–20:35. Our own derivation from Philadelphia
solar geometry gives 17:05–20:33, and `sun.inter_twilight_window()` returns that.
Both numbers are correct and the three-minute gap is deliberate — the constants in
`sample.py` use the paper's values so our sample matches theirs, while the derived
function exists to prove the paper's window is reconstructible from its
description. Do not "reconcile" them.

## Two rules that are load-bearing

**Dedup on `objectid` only.** Never on demographic columns. Two 22-year-old Black
men in one car are two people; deduping on `(datetime, location, race, gender, age)`
collapses them and destroys ~26% of exactly the multi-occupant parties this study
measures. This shipped once and produced a plausible, wrong result.

**Never identify a driver.** The paper is explicit that the data has no reliable
driver indicator, and the homogeneous-party restriction makes it unnecessary. This
analysis deliberately does **not** use the `min(id)`-is-the-driver assumption that
`update_db_models.py` relies on (and which `AGENTS.md` records as having been
row-order-dependent). The column is `party_race`, not `driver_race`.

## Denominators

The paper's figures use three different denominators, and conflating them changes a
headline figure by nearly a factor of two — the multi-occupant share is 27.2% per
motorist and 14.2% per stop. So the cube carries both `n_stops` and `n_motorists`,
and every selector name says which it uses:

| Selector | Denominator | Mirrors |
|---|---|---|
| `motoristsByRace` | per motorist | Figure 2 |
| `pctMotoristsInGroups` | per motorist | Figure 3 |
| `frisksAndTickets` | per occupant | Figure 4 |
| `groupTravelByClockBin` | per stop | the regression outcome |

Do not "simplify" these to share one denominator. Every chart on the page states
its denominator in its caption, and tests pin each one.

The cube spans 2014–2026 but every published figure is 2021–2024. Callers **must**
apply `restrictToYears(cube, REPLICATION_YEARS.from, REPLICATION_YEARS.to)` once
and pass the result to every selector. Forgetting it pools thirteen years under the
paper's labels and looks entirely normal.

## The models

Quasi-binomial logistic regression. The key regressor is `obscured_view`
(darkness), so **published coefficients are negative** — darkness reduces the odds
of the outcome. A positive coefficient means something is inverted.

| | Model 1 | Model 2 |
|---|---|---|
| `obscured_view` | ✓ | ✓ |
| Natural spline of clock minute, 6 df, centred | ✓ | ✓ |
| Day of week, year | ✓ | ✓ |
| Police area, assigned unit, summer | — | ✓ |
| Knode et al. (2024) seasonality weight | — | **omitted, see below** |

Reproduction as of the 2026-07-20 export:

| Outcome | Model 1 | paper | Model 2 | paper |
|---|---|---|---|---|
| `party_is_black` | −0.1163 | −0.116 | −0.1780 | −0.188 |
| `has_black_passenger` | −0.2330 | −0.242 | −0.2691 | −0.269 |
| `placebo_white` | +0.0366 n.s. | n.s. | +0.2394 n.s. | n.s. |

### Deviations, both disclosed on the page

**Model 2 omits the seasonality weight.** The paper describes a Knode et al. (2024)
quadratic kernel weighting dates whose inter-twilight interval mixes daylight and
darkness evenly, but does not publish the formula. Implementing it needs that paper.
Until then Model 2 is a partial reproduction and the page says so wherever a Model 2
number appears.

**Sparse fixed-effect levels are collapsed** at `_MIN_UNIT_COUNT = 100` stops.
Without this, `C(assigned_unit)` had 19 of 53 levels with a zero cell against the
outcome — quasi-complete separation — and statsmodels returned a coefficient of
−3.6e14 while reporting `converged: True`. The estimate is insensitive to the
threshold across 20–500 stops, which is the evidence that the choice isn't doing
analytical work. About 1–3% of rows land in the residual bucket for the two
substantive fits; `placebo_white.model_2` is 39.7%, so that row's location control
is genuinely hollow and both the page and the table say so.

### The degeneracy guard

`fit_vod` refuses to report an implausible estimate as a success: past `|10|` on the
log-odds scale it flips `converged` to `False`, sets `degenerate: True`, and keeps
the numbers for inspection. This exists because statsmodels reported −3.6e14 as
converged and nothing downstream questioned it. Do not remove it; a test pins that
it trips.

## Tests

`cd pipeline && python -m pytest tests/ -v` (66) · `npm test` (54) ·
`npm run e2e:checks` (11 routes)

The load-bearing one is `tests/test_veil_replication.py`, which pins the paper's
published counts and figure rates so a pipeline change cannot silently break the
reproduction. Tolerances are wide enough to absorb data-vintage drift and tight
enough to catch a structural break; `test_veil_cube.py` additionally pins every
fitted coefficient against `MODEL_TARGETS`.

Two things about this suite are worth knowing:

- **Two of these guards originally could not fail.** A lighting test whose band
  admitted both the correct value (46% dark) and a full inversion (54%), and an
  e2e console-error check whose parser could never populate its list. Both are
  fixed and both have been *observed failing* against the defect they guard, per
  the rule in `AGENTS.md`. Hold new guards to the same standard.
- **13 tests skip when the backup zip is absent**, so on CI or a fresh clone the
  replication gate evaporates behind a green suite. A run is only meaningful if it
  reports 0 skipped.

## Follow-ups

Known and deliberately deferred:

- **`npm run e2e:checks` is not idempotent** — a second consecutive run fails
  unless `.nuxt` is cleared (not just `.output`). Pre-existing, not from this
  feature, and it will mislead the next person into thinking the harness is broken.
- **`components/ui/Tooltip.vue` renders a `<div>`**, which the HTML parser hoists
  out of an enclosing `<p>`, causing hydration mismatches. `veil-of-darkness.vue`
  works around it with commented `<div>`s; `reasons.vue` only avoids it by accident
  (its Tooltip paragraphs sit behind client-only `v-if`s). Fixing the component is
  site-wide and needs its own parity run.
- **The design doc's warning block quotes a pass count from the day it was
  written.** Read any test count in the spec or the plan as a timestamp, not as a
  target -- the suite has grown several times over since, and this note has
  already been wrong twice by trying to track it.
- **The cube's `era` and `district` dimensions have no consumer** — they exist for
  the Phase 2 pre/post Driving Equality extension.

## Phase 2, per the spec

Extending beyond 2021–2024 with a `darkness × era` interaction (two separately
fitted models cannot support a claim that the eras differ); implementing the Knode
weight; ordinal dose-response on party size; and a time-heaping sensitivity check.
Page language stays at "no longer detectable", never "eliminated".

## Reading

- Design: `docs/superpowers/specs/2026-08-09-veil-of-darkness-design.md`
- Plan: `docs/superpowers/plans/2026-08-09-veil-of-darkness.md`
- Methods note for the paper's authors, covering the side-by-side comparison with
  both papers, every deliberate deviation, what the source data hides, what is
  still unguarded, and the open questions:
  `docs/veil-of-darkness-methods-note.md`. It is in the repo on purpose — the
  earlier note lived outside it, went stale against the year-by-year section, and
  the pointer here said "ask Steve for it".

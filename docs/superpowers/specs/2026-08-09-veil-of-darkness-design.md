# Veil-of-darkness and group-travel analysis

Design doc — 2026-08-09

## What this is

A new dashboard page replicating Hannon & Biddle (2026), ["Are Young Black Men
Traveling Together Targeted for Traffic Stops?"](https://doi.org/10.21428/cb6ab371.f1d81a4b)
(CrimRxiv, Villanova University), against Philadelphia's open stop data, then
extending it beyond the paper's 2021–2024 window.

The paper applies the veil-of-darkness (VOD) test two ways:

- **Inter-racial (traditional)** — among stops of young men, is the party more
  likely to be Black when daylight lets an officer see into the car?
- **Intra-racial (novel)** — among stops of young *Black* men, is the car more
  likely to hold two or more of them in daylight?

The second is the paper's contribution. A raw disparity in group travel has an
innocent explanation — maybe Black and White Philadelphians carpool at different
rates — but carpooling does not change at dusk while officer visibility does.
The paper also notes ACS commuting data puts carpooling at ~14% for both groups.

**Phase 1** replicates the paper. **Phase 2** extends and hardens. The page ships
at an unlinked URL, `/veil-of-darkness`, absent from nav; it will likely be
folded into `/stops` or `/neighborhoods` later. Unlinked is not private — the
route is statically generated and publicly fetchable.

## Replication status: confirmed

Prototyped against the raw 2021–2024 CSVs. Every published quantity reproduces
within a few percent:

| Quantity | Ours | Paper |
|---|---|---|
| Table 1 stops | 36,699 | 37,168 |
| — Black-party stops | 31,317 | 31,738 |
| — White-party stops | 5,382 | 5,430 |
| Fig 2 young Black male motorists | 36,905 | 36,121 |
| Fig 2 young White male motorists | 5,532 | 5,542 |
| Table 2 solo | 26,856 | 27,056 |
| Table 2 group | 4,461 | 4,682 |
| Fig 3 % Black motorists in multi-occupant cars | 27.2% | 25.1% |
| Fig 3 % White motorists in multi-occupant cars | 5.2% | 4.6% |
| Fig 4 frisk rate, solo | 7.2% | 7.1% |
| Fig 4 frisk rate, group | 19.9% | 19.5% |

Residual differences are expected: OpenDataPhilly revises records, and their
download and our 2026-07 backup are years apart.

The independently-derived inter-twilight window also matches. Computing
Philadelphia solar geometry gives **17:05–20:33**; the paper reports
**17:08–20:35**.

## Data and methods

### Sample restrictions

Applied in this order, following the paper's §Data and Methods:

1. Vehicle stops only, 2021–2024 (Phase 1) — PPD investigatory stop data.
2. Stops based on **motor vehicle code violations**, i.e. `mvc_code` is
   non-null. Excludes "vehicle involved in crime" and "vehicle matches flash
   information" — 'must stop' rather than 'could stop' situations. Including
   them would bias toward the null.
3. Party is **exclusively men aged 18–29**, drivers and passengers alike.
4. Party is **racially homogeneous**, and that race is Black or White
   (Philadelphia's two largest categories).
5. **No arrest.** ~2.5% of stops involve one; excluded to focus on discretionary
   action rather than compelled action.
6. **No exact duplicate records** (~1.7% of rows).
7. **No missing** driver or passenger characteristics (<1%).
8. Within the **inter-twilight window, 17:08–20:35**.
9. **Excluding the ~30-minute sunset-to-dusk span**, which is neither definite
   daylight nor definite darkness.

### "Traveling together" is INFERRED, not recorded

This is the page's central construct and it is **derived, not observed**. The
source data has one row per person and no vehicle or incident identifier that
groups occupants. We infer a party by grouping person rows on
`(datetimeoccur, location)` — same timestamp to the minute, same recorded
location string — and treat a group of 2+ as travelling together. Nothing in
the data says those people were in one car.

The failure mode is **over-merging**: two separate stops made at the same
minute at the same intersection become one multi-occupant "party", inflating
group travel. That is the direction that would manufacture this page's
headline, so it was measured rather than assumed. Over the 2021–2024
person rows (deduped on `objectid`):

| Quantity | Value |
|---|---|
| Groups with more than one row | 74,307 |
| …that disagree on `vehicle_year`/`vehicle_make`/`vehicle_model` | **717 (0.96%)** |
| …that disagree on `districtoccur` | **16** |

So under 1% of inferred parties show any sign of being two different vehicles,
and district disagreement is negligible. Note this is a *lower* bound on
over-merging (two occupants of genuinely different cars of the same make and
model would not register), and an *upper* bound is not available. It bounds the
risk well below the effect sizes reported, but the construct remains an
inference and the page must not describe it as recorded fact.

Reproduce with the query in this section's history — group the 2021–2024 CSVs
on `(datetimeoccur, location)` after `drop_duplicates(subset=['objectid'])` and
count `nunique > 1` per vehicle column.

### Three traps found while prototyping

**Deduplication must key on row identity, not demographics.** Deduping on
`(datetimeoccur, location, race, gender, age)` collapses two 22-year-old Black
men in one car into a single person — silently destroying ~26% of exactly the
multi-occupant parties the study is about. It must key on `objectid`. This
produced a plausible-looking but wrong result before it was caught.

**We do not need to identify the driver.** The paper is explicit: "for
multi-occupant vehicle stops, we do not have a reliable indicator of who is in
the driver position." The homogeneous-party restriction makes the question moot
— everyone in the car is a young man of the same race. This analysis therefore
does **not** depend on the existing pipeline's `min(id)`-is-the-driver
assumption at `pipeline/update_db_models.py:399`, which has never been
validated. Do not reintroduce that dependency.

**The literal string "NA" is a real `mvc_code` value, not a null.** It means a
genuine motor-vehicle-code stop whose specific code went unrecorded
(`stoptype='vehicle'`, `mvc_reason='Other'`) — a distinct category from a true
blank, which carries no reason at all (21,134 vs. 21,593 rows in 2024 alone).
`pd.read_csv` treats the string `"NA"` as a default null sentinel and silently
coerces it to `NaN`, which makes those stops look non-MVC and drops ~11% of
the analytic sample — enough to fail replication against the paper's published
totals. The fix is a converter on that column
(`converters={"mvc_code": lambda v: v}`) that bypasses pandas' sentinel
handling. This was caught only by independent verification against a DuckDB
count, not by review of the code itself.

### Denominators differ per figure, and must be labelled

This caused a wrong reading during exploration and will mislead readers too:

- **Tables 1 and 2** are per **stop**.
- **Figures 2 and 3** are per **motorist**. Figure 3's headline 25.1% vs 4.6% —
  the "about five times more likely" claim, actually 5.5× — is the share of
  young *men* who were in multi-occupant cars, not the share of stops. Per stop
  the same quantity is 14.2% vs 2.6%.
- **Figure 4** frisk and ticket rates are per **occupant**.

Every chart on the page states its denominator.

### Models

Quasi-binomial logistic regression, to adjust for under/overdispersion. The key
regressor is **"Obscured View"** — darkness — so coefficients are negative.
Two specifications, both reported:

| | Model 1 | Model 2 |
|---|---|---|
| Obscured view | ✓ | ✓ |
| Natural spline of clock minute, 6 df | ✓ | ✓ |
| Day of week, year | ✓ | ✓ |
| PSA (65; **district-qualified**, see below), assigned unit (54), summer (Jun–Aug) | — | ✓ |
| Seasonality weight | — | ✓ |

Published coefficients to reproduce:

- **Table 1** (party is Black): −.116 (.032) and −.188 (.046). The full model
  means darkness cuts the odds the party is Black by ~17%.
- **Table 2** (Black party has 2+): −.242 (.035) and −.269 (.044). Darkness cuts
  the odds of a group by ~24%.

Our data supports the controls: 66 distinct district-PSA combinations against
their 65, and `assigned_unit` is present.

**The location control must be keyed on `(districtoccur, psa)`, never on `psa`
alone.** PPD numbers police service areas 1–4 (plus a 0 bucket) *within* each
district, so the `psa` column holds only **five** distinct values across the
whole city: PSA 2 of the 12th District (Southwest) and PSA 2 of the 7th (Far
Northeast) are both `2`. `C(psa)` is therefore four dummies standing in for 66
real areas — a location control that controls for almost nothing, and the exact
defect the retraction note below records the page having claimed its way around
once already. It shipped once and was caught in final review.

`veil/sample.py::police_area_key` builds the correct key and
`roll_up_stops` writes it to the `police_area` column; `veil/models.py` uses
`C(police_area)` in Model 2. Two details are load-bearing:

- `districtoccur` and `psa` are **REAL in SQLite** — pandas infers a numeric
  dtype at `read_csv` and reads the zero-padded text `"02"` as `2.0` — so both
  must be cast through `int` before stringifying, and the district zero-padded
  to two digits. The key is `"02-1"`, matching
  `cube_builders/stops.py::_location_key`, not `"2.0-1.0"`. The same trap made
  the veil cube's `district` dimension ship `"12.0"`: its `_normalize_district`
  tested `str(2.0).isdigit()`, which is `False`, so the helper was a no-op.
- `districtoccur` is deliberately **not** a separate model term. A PSA nests
  inside exactly one district, so district dummies are a linear combination of
  the area dummies; adding both is rank-deficient without adding information.

**Sparse-level collapsing interacts with this.** Areas with fewer than 100
stops fold into a single `OTHER` level to avoid quasi-complete separation. That
is only acceptable while `OTHER` stays small in **rows**, not levels, so every
model_2 fit reports `other_row_share`. Measured on 2021–2024: 0.9% (party is
Black) and 3.1% (Black party has 2+) — the control is real. The **white-motorist
placebo is the exception at 39.7%**, because ~5,400 stops spread over 66 areas
leave most areas below the threshold. That row's location control is largely
hollow; the page says so explicitly rather than presenting it as
location-adjusted. `tests/test_veil_cube.py` asserts the headline shares stay
under 10%.

**Known unknown — the seasonality weight.** Model 2 applies a weight from Knode
et al. (2024), a quadratic kernel giving more weight to dates whose
inter-twilight interval mixes daylight and darkness evenly. The formula is not
reproduced in this paper. Phase 1 implements **Model 1 exactly** — it is fully
specified — and Model 2 **without** the weight, labelled as such. Implementing
the weight requires reading Knode et al. (2024) and is deferred.

`statsmodels` GLM with a binomial family and `scale='X2'` gives the
quasi-binomial standard errors.

### Placebo

The paper tried the intra-racial model on young White male parties and found
nothing significant under any specification. We reproduce that and report it —
a null placebo is evidence, and its absence would undercut the main result.
Expect convergence trouble from sparse fixed-effect cells at this sample size;
fall back to a reduced spec and record which was used.

## Architecture

### The constraint

Existing SQLite tables are quarterly aggregates with no time-of-day and no party
composition. Nothing in the current DB can support this. It needs a new stage in
`pipeline/update_db_models.py` reading raw person-level CSVs.

### New table `car_ped_stops_veil`

One row per stop meeting restrictions 1–4 and 8, with the exclusion flags kept
as columns rather than pre-applied, so the page can show how each restriction
changes the sample:

```
ts_local, clock_minutes, stop_date, dow, month, year, era,
district, psa, police_area, assigned_unit, lighting, party_race, party_size,
n_frisked, n_ticketed, any_arrest, is_mvc, complete_demographics
```

`lighting` ∈ {`daylight`, `dark`, `ambiguous`}. `era` splits on the Driving
Equality effective date, 2022-03-03.

### Sun times

Generate sunset and civil dusk for Philadelphia 2014–2030 once with `astral`,
and **commit the result as a CSV** the pipeline reads. No new runtime
dependency, deterministic, reviewable in a diff. A hand-rolled solar routine
cost real time to a silent 12-hour epoch bug during exploration; there is no
reason to ship one. The paper used R's `suncalc` for the same purpose.

### New cube builder `pipeline/cube_builders/veil.py`

Follows the existing `(cube, scalars)` contract.

- **Descriptive cube** — `[year, era, clock_bin, lighting, party_race,
  group_travel, district]`, measures `n_stops`, `n_motorists`, `n_frisked`,
  `n_ticketed`. `clock_bin` is a 15-minute bucket (14 across the window) and is
  what charts 4–5 plot against. Carrying both `n_stops` and `n_motorists` is
  what lets each chart state its own denominator.
- **Scalars** — coefficients, standard errors, quasi-binomial p-values and N for
  Models 1 and 2, both tables, the placebo, and the era extension.

Models are fit at build time, so the page is fully static. Adds `statsmodels`
and `scipy` to `pipeline/pyproject.toml`, which currently carries only pandas.

### New page `pages/veil-of-darkness.vue`

Descriptive first. Five charts, the first three mirroring the paper's:

1. **Young male motorists stopped, Black vs White** — 36,905 vs 5,532, a 6.5×
   gap. Paired with the paper's own caveat that deployment decisions, not just
   driver behaviour, drive this.
2. **Share of young male motorists in multi-occupant cars, by race** — 27.2% vs
   5.2%. The headline disparity.
3. **Frisk and ticket rates, solo vs. group** — 7.2%→19.9% frisked, 11.1%→7.4%
   ticketed. The most striking chart on the page: travelling with another young
   Black man nearly triples the frisk rate while *lowering* the odds of a ticket
   for the violation that supposedly justified the stop.
4. **The veil itself** — share of stops that are group-travel by clock-time bin,
   as two lines, daylight and dark. This is the identifying variation made
   visible: at 7:15pm it is light in June and dark in December, and the gap
   between the lines at the same clock time is what the test rests on.
5. **Extension** — Model 2's odds ratio by era, pre and post Driving Equality.

Charts 1–4 are counts from the descriptive cube. Only chart 5 shows model
output.

## What the page must say

- **Effects are modest in odds terms.** A 17–24% change in odds. The frisk-rate
  gap in chart 3 is the large effect; the VOD coefficients are the *clean* one.
- **VOD is deliberately conservative.** As the paper notes, artificial lighting,
  car profiling and segregation all shrink the daylight/darkness contrast, and
  Black drivers appear to drive *more* carefully in high visibility. The test
  understates.
- **Chart 1 is not itself evidence of bias.** The paper says so plainly:
  deployment decisions driven by perceived crime control needs — "neighbourhood
  profiling" — likely explain much of that 6.5× gap.

  **RETRACTED (do not reinstate):** this bullet previously ended "It is context
  for the charts that follow, which do control for location." That was false,
  and it propagated from here into the plan, the task brief and the shipped
  page, surviving three reviews because each review checked the code against
  this spec. Charts 2–4 are raw pooled shares with no controls at all, and
  Model 1 has no location term (`obscured_view + cr(clock_minutes) + C(dow) +
  C(year)`). Only **Model 2** controls for location. What actually defuses
  neighbourhood profiling for the page's headline result is that the headline
  comparison is *within* race — young Black men against young Black men — not
  any control. Say that instead.
- **Segregation strains cross-race comparison.** Compute this figure from our
  own data; do not quote a number here. Measured on the 2021–2024 sample,
  **6.95%** of stops of young Black men happened in a majority-white district
  (`whiteness > 50` in `public/cubes/districts.json`, the dashboard-wide rule).
  The page derives it at render time via
  `utils/veil.ts::pctStopsInMajorityWhiteDistricts`, so it cannot drift. An
  earlier draft of this spec asserted "5%" with no source and no computation
  anywhere in the branch. This is why the paper's intra-racial test matters: it
  holds race constant and asks only about visibility.
- **Times are rounded.** Also compute, don't quote. Measured on the same
  sample: **50.7%** of stops fall on a multiple of 5 minutes and **19.8%** on a
  quarter hour (chance would give 20% and 6.7%). An earlier draft asserted
  "55%" and "22%" with no source. The pipeline emits these in the cube's
  `time_rounding` block because the `clock_bin` dimension is 15-minute and
  cannot recover them. Near the dusk boundary this rounding misclassifies
  lighting non-randomly; dropping the ambiguous band is the mitigation.
- **Model 2 omits the published seasonality weight.** Say so where it is shown.

## Testing

- Unit tests for the lighting classifier against known Philadelphia solar dates
  (2025-06-21 sunset 20:32, 2025-12-21 16:38, 2025-03-20 19:12). This component
  already produced one silent 12-hour error; it gets direct tests.
- A test that the window derived from the committed sun-times CSV is 17:05–20:33.
- **Regression tests pinning the replication table above** — sample counts and
  Figure 3/4 rates for 2021–2024 within tolerance of the published values. This
  is the test that catches a future pipeline change silently breaking the
  analysis.
- A test that deduplication preserves two same-age same-race occupants of one
  vehicle. This is the trap that already bit once.
- A test that `ambiguous` is non-empty — zero would mean the band logic
  collapsed silently.
- Cube-shape tests matching existing builders' conventions.
- **A test comparing every fitted coefficient to `MODEL_TARGETS`.** Without it
  nothing connects a fitted number to a published one, and the page's accuracy
  claim silently went stale (see the C2 entry in the SDD ledger:
  `has_black_passenger.model_1` drifted to 0.00905 from published while the page
  said "within 0.008"). Model 1 gets the tighter tolerance (0.015) because it
  reproduces the paper's specification exactly and only the data vintage
  differs. Model 2 gets a looser one (0.05) because it **omits the seasonality
  weight** and is therefore a different estimator, not the same estimator on
  different data. State both tolerances and the reason in the test.
- **A test that Model 2's location control is not hollowed out by sparse-level
  collapsing** — `other_row_share['police_area']` under 10% for the two
  headline fits.
- Add the route to `e2e/` for `npm run e2e:checks`, including the
  leaked-identifier check: the page interpolates ~30 `toFixed()` results into
  prose, so a selector returning `undefined` would print that word inside a
  published statistical claim.

### ⚠ The replication gate evaporates without the backup zip

`tests/test_veil_replication.py` (13 assertions) and most of
`tests/test_veil_build.py` carry
`pytest.mark.skipif(_latest_zip() is None)`. `pipeline/data/*.zip` is **not
committed**. So on CI, in a container, or on a fresh clone, the entire
replication gate **silently skips and the suite still reports green** — every
published figure on this page would be unguarded while looking fully tested.

Until this is fixed, "pytest passed" is only meaningful evidence when the run
also reports **59 passed with 0 skipped** and the zip was present. Check the
skip count, not just the failure count.

Phase 2 fix: assert the zip's presence when an explicit
`VEIL_REQUIRE_REPLICATION_DATA=1` (or CI marker) is set, so CI fails loudly
instead of skipping, and document how CI obtains the backup. The documented
warning above is the Phase 1 mitigation.

## Phase 2 — deferred

- **Extend beyond 2021–2024** to the full 2014–2026 range, and test the Driving
  Equality effect with a `darkness × era` interaction. Two separately-fit models
  cannot support a claim that the eras differ; only the interaction can. Page
  language stays at "no longer detectable," never "eliminated."
- **Implement the Knode et al. (2024) seasonality weight** for a complete
  Model 2.
- **Dose-response.** The paper's abstract argues the effect scales with the
  number of young Black men present, beyond a present/absent dichotomy. Worth
  modelling party size ordinally.
- **Time-heaping sensitivity** — refit with a wider excluded band.
- **Location key normalization** — `5700 BLOCK Baltimore Ave` vs
  `BALTIMORE AVE` vs `BALTIMORE`. Measured during exploration: normalizing moves
  the multi-occupant rate by 0.05pp (14.09%→14.14%), so it is **not** required
  here. It remains a correctness issue for anything counting distinct locations.
- **`AGENTS.md` is stale** — documents `deo-backend`, archived in the 2026-08
  consolidation. Unrelated but adjacent.

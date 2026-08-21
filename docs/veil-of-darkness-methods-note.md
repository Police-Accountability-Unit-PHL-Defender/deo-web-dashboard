# Veil-of-Darkness Methods Note

A reproduction of two Hannon & Biddle papers against Philadelphia's open traffic-stop
data, prepared for review with the authors.

This note is the single source for how the reproduction compares to the published
work: what matches, where we deviated and why, what we found in the source data, what
is still unguarded, and what we would like to ask. It is assembled from the design
spec, the implementation plan, the pinned targets in `pipeline/veil/models.py`, and the
test suite; where those disagreed with the code, the code won and the document was
corrected.

Everything below refers to the page at `/veil-of-darkness`, built by
`pipeline/veil/` and `pipeline/cube_builders/veil.py`.

---

## 1. What is being reproduced

Two separate papers, two separate questions, two separate samples. The page presents
them in this order, and they must not be read as one analysis.

**Study 1 — intraracial (leads the page).** Hannon & Biddle (2025), *Unequal Policing
of Black Motorists in Black Communities by Age and Gender*, American Journal of
Criminal Justice 50:1081–1090, [doi:10.1007/s12103-025-09879-8](https://doi.org/10.1007/s12103-025-09879-8).
Among stops of Black motorists in Philadelphia's residential majority-Black police
districts, does darkness change the age and gender of who gets pulled over? Window
January 2022 – August 2025. Districts 12, 14, 16, 18, 19, 22, 35, 39 — hardcoded from
the paper's own list rather than derived from census data, so the sample matches the
paper's rather than a silently drifting definition of its own.

**Study 2 — group travel.** Hannon & Biddle (2026), *Are Young Black Men Traveling
Together Targeted for Traffic Stops?*, CrimRxiv / Villanova University,
[doi:10.21428/cb6ab371.f1d81a4b](https://doi.org/10.21428/cb6ab371.f1d81a4b). Window
2021–2024. Are young Black men travelling together stopped disproportionately when
police can see who is in the car?

Both use the veil-of-darkness design: compare who gets stopped during the
inter-twilight window in daylight versus after dark, on the reasoning that darkness
obscures the occupants while everything else about the time of day stays fixed.

**Our inter-twilight window is derived independently** from Philadelphia solar
geometry rather than taken from the paper, as a check on the implementation. It lands
at **17:05–20:33** against the paper's **17:08–20:35**.

---

## 2. Replication status

### Study 2 — group travel (2021–2024)

Every published quantity reproduces within a few percent. Residual differences are
expected: OpenDataPhilly revises records, and the paper's download and our 2026-07
backup are years apart.

| Quantity | Ours | Paper |
|---|---:|---:|
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

Model coefficients, quasi-binomial, published values from the paper:

| Model | Ours | Paper | Odds ratio | p | n |
|---|---:|---:|---:|---:|---:|
| Party is Black, model 1 | −0.116 | −0.116 | 0.890 | 3.6 × 10⁻⁴ | 36,587 |
| Party is Black, model 2 | −0.178 | −0.188 | 0.837 | 6.2 × 10⁻⁵ | 36,583 |
| Has Black passenger, model 1 | −0.233 | −0.242 | 0.792 | 8.4 × 10⁻¹¹ | 31,209 |
| Has Black passenger, model 2 | −0.269 | −0.269 | 0.764 | 3.8 × 10⁻¹⁰ | 31,205 |

A negative coefficient means darkness *reduces* the odds of the outcome — the
direction that indicates visibility-dependent selection.

**Placebo.** The paper tried the same design on young White male parties and found
nothing significant under any specification. We reproduce that null, and report it,
because its absence would undercut the main result.

| Placebo (White parties) | Coefficient | Odds ratio | p | n |
|---|---:|---:|---:|---:|
| Model 1 | +0.037 | 1.037 | 0.85 | 5,378 |
| Model 2 | +0.239 | 1.271 | 0.29 | 5,378 |

### Study 1 — intraracial (2022–2025)

Published sample is 76,274 stops; ours is **75,879**, 0.5% below. Coefficients are the
paper's Table 1 "Dark Out" column, with standard errors alongside — the SEs were the
decisive evidence for using `var_weights` rather than `freq_weights` in the weighted
fit.

| Outcome | Our coef | Paper coef | Our SE | Paper SE |
|---|---:|---:|---:|---:|
| Driver is young | −0.174 | −0.17 | 0.021 | 0.02 |
| Driver is male | −0.221 | −0.21 | 0.021 | 0.02 |
| Young and male | −0.242 | −0.23 | 0.023 | 0.02 |
| Young and female (n.s.) | +0.054 | +0.05 | 0.031 | 0.03 |
| Older and male (n.s.) | −0.006 | −0.01 | 0.020 | 0.02 |
| Older and female | +0.261 | +0.25 | 0.025 | 0.02 |

Both non-significant results in the paper are non-significant here too, in the same
direction.

---

## 3. Deliberate deviations

Each of these is a place where we knowingly did something other than what the paper
describes. None is an accident, and each is here to be argued with.

**"Travelling together" is inferred, not recorded.** This is Study 2's central
construct and the source data does not contain it. There is one row per person and no
vehicle or incident identifier grouping occupants. We infer a party by grouping person
rows on `(datetimeoccur, location)` — same timestamp to the minute, same recorded
location string — and treat 2+ as travelling together. Nothing in the data says those
people were in one car.

The failure mode is over-merging: two separate stops at the same minute at the same
intersection become one multi-occupant party, inflating group travel. That is the
direction that would manufacture the headline, so it was measured rather than assumed,
over the 2021–2024 person rows deduplicated on `objectid`:

| Quantity | Value |
|---|---:|
| Groups with more than one row | 74,307 |
| …disagreeing on `vehicle_year` / `make` / `model` | **717 (0.96%)** |
| …disagreeing on `districtoccur` | **16** |

Under 1% of inferred parties show any sign of being two different vehicles. This is a
*lower* bound — two occupants of genuinely different cars of the same make and model
would not register — and no upper bound is available. It bounds the risk well below the
reported effect sizes, but the construct remains an inference, and the page does not
describe it as recorded fact.

**No driver is ever identified.** The paper is explicit that the data has no reliable
indicator of who is in the driver position, and the homogeneous-party restriction makes
the question moot: everyone in the car is a young man of the same race. The outcome is
therefore "the party police stopped was Black rather than white", and the variable is
named `party_is_black`, not `driver_is_black`. This deliberately avoids the existing
pipeline's unvalidated `min(id)`-is-the-driver assumption
(`pipeline/update_db_models.py:399`).

**Study 1's restriction 5 is a proxy.** The paper restricts to MVC-initiated stops,
"excluding 'vehicle involved in crime' and 'vehicle matches flash information'". We
implement "has an MVC code" instead. Applying the paper's exact exclusion was measured
and moves our sample *further* from the published 76,274 — about −1.2% away, versus
−0.49% under the proxy — which is evidence the proxy is the right implementation here.
An `mvc_reason == "Police Investigation"` category exists in the source data (4,445
rows, 2022–2025) and is not excluded by the proxy. **This is a question for the
authors, not a settled choice.**

**The location control is `C(police_area)`, not `C(psa)`.** PPD numbers service areas
1–4 *within each district*, so the raw `psa` field takes only five distinct values
city-wide; `C(psa)` would pool PSA 2 of the 12th District in Southwest with PSA 2 of
the 7th in the Far Northeast — four dummies standing in for 66 real areas. We use the
district-qualified key (`"02-1"`). `districtoccur` is deliberately *not* a second term:
a PSA nests inside exactly one district, so district dummies are a linear combination
of area dummies and adding both makes the design rank-deficient without adding
information.

**Model 2 lacks the Knode seasonality weight; Study 1's models have it.** The 2026
paper specifies the Knode et al. (2024) weight but does not publish its formula. We
obtained the formula from Knode, Wolfe & Carter (2024), Criminology 62(3), 364–375,
supplemental S.2, and applied it to the Study 1 intraracial models. It is **not**
retrofitted onto Study 2's Model 2, so those figures predate it and still lack the
weight. Anything rendering a model 2 result says so. Retrofitting is a live choice:
it would improve the model and reduce fidelity to the paper being replicated.

One note on the weight's implementation: the supplemental's prose says the daylight
proportion `p` is measured "in a day", but the authors report 25,926 stops carrying a
weight of exactly zero — impossible for a whole-day proportion at Philadelphia's
latitude, and routine for one scoped to the inter-twilight window (every December
date). We measure `p` within the window.

**Sparse fixed-effect levels are collapsed.** Officer-assignment levels with fewer
than 100 stops fold into an `OTHER` bucket. In the model 2 fits this collapses 38, 44,
and 65 units respectively. Without it the fits do not survive (see §5).

---

## 4. The one extension beyond both papers

Everything above reproduces the papers. The section at the top of the page does not,
and it is the part most in need of the authors' eyes.

**What it is.** Study 1's intraracial specification, refit **one calendar year at a
time**, across **2014–2025** — twelve separate fits. The published paper's own window
is January 2022 – August 2025, so 2014–2021 lies entirely outside it. The default view
omits 2020; every year is selectable.

Per-year results for the young-male outcome, the paper's headline:

| Year | Coefficient | SE | n |
|---|---:|---:|---:|
| 2014 | −0.388 | 0.049 | 17,558 |
| 2015 | −0.329 | 0.043 | 24,580 |
| 2016 | −0.268 | 0.039 | 28,586 |
| 2017 | −0.191 | 0.039 | 29,341 |
| 2018 | −0.243 | 0.037 | 30,504 |
| 2019 | −0.239 | 0.033 | 40,795 |
| 2020 | −0.321 | 0.048 | 15,954 |
| 2021 | −0.270 | 0.049 | 14,584 |
| 2022 | −0.237 | 0.047 | 17,706 |
| 2023 | −0.320 | 0.047 | 16,298 |
| 2024 | −0.186 | 0.042 | 23,240 |
| 2025 | −0.191 | 0.039 | 28,448 |

**What it can and cannot support.** Each year is an independent fit sharing the
specification, the seasonality weighting, and one inter-twilight window. The effect is
detectable across the series and the estimates move around, but **separately fitted
models cannot support a claim that two periods differ from one another.** Only a
`darkness × era` interaction can, and that is deliberately not implemented. The page's
language is held to "no longer detectable", never "eliminated", and it does not assert
a trend. The 2020 and 2021 fits rest on the smallest samples in the series, during a
period when stop volumes collapsed.

This is the section with no counterpart in either paper, and the one we would most like
reviewed before it is published.

---

## 5. What we found in the source data

Five of these produce output that looks entirely reasonable and is wrong. None crashes
or fails a test. They apply to any analysis of these CSVs.

**`datetimeoccur` is UTC.** Values look like `2025-01-10T03:10:00Z`. Anything keyed on
time of day is off by four or five hours if this is missed — which, for a
daylight/darkness design, *inverts* the result rather than degrading it.

**The literal string `"NA"` is a real `mvc_code` value, not a null.** It means a genuine
MVC stop whose specific code went unrecorded (`stoptype='vehicle'`,
`mvc_reason='Other'`) — a distinct category from a true blank carrying no reason at all:
21,134 versus 21,593 rows in 2024 alone. `pandas.read_csv` treats `"NA"` as a default
null sentinel and silently coerces it, which makes those stops look non-MVC and drops
about 11% of the analytic sample — enough on its own to fail replication against the
published totals. R's `read.csv` has the same default. The fix is a converter that
bypasses sentinel handling. **This was caught only because an exploratory DuckDB query,
which preserves the string, disagreed with pandas by 3,600 stops on identical input.**

**Deduplication must key on row identity, not demographics.** Deduplicating on
`(datetimeoccur, location, race, gender, age)` collapses two 22-year-old Black men in
one car into a single person, destroying roughly 26% of exactly the multi-occupant
parties Study 2 is about. It must key on `objectid`. This produced a plausible-looking
but wrong result before it was caught.

**`psa` alone does not identify a service area.** Five distinct values city-wide for 66
real areas; the unique beat is `(districtoccur, psa)`. Also, `districtoccur` reads as
REAL out of SQLite (`'02'` inferred as `2.0`), so a `.isdigit()` check silently does
nothing unless it is cast to int first.

**The export is partitioned by UTC year; the analytic year is local.** Because evening
windows straddle the UTC date boundary, every 31 December evening sits in the following
year's file. A year-restricted extract loses stops at the end of its range and gains
them from before the start — under 0.1% for a narrow evening window, but systematic at
both ends. We read the neighbouring years and filter on local year afterwards.

**Denominators differ per figure and must be labelled.** This caused a wrong reading
during our own exploration:

- Tables 1 and 2 are per **stop**.
- Figures 2 and 3 are per **motorist**. Figure 3's headline 25.1% versus 4.6% — the
  "about five times more likely" claim, actually 5.5× — is the share of young *men* in
  multi-occupant cars, not the share of stops. Per stop, the same quantity is 14.2%
  versus 2.6%.
- Figure 4's frisk and ticket rates are per **occupant**.

Every chart on the page states its own denominator.

---

## 6. Known gaps and limitations

Stated plainly, including the ones that weaken the evidence.

**The replication gate evaporates without the backup data.** `test_veil_replication.py`
(13 assertions) and most of `test_veil_build.py` skip when `pipeline/data/*.zip` is
absent, and that zip is not committed. On CI, in a container, or on a fresh clone the
entire replication gate **silently skips and the suite still reports green** — every
published figure would be unguarded while looking fully tested. "pytest passed" is only
meaningful evidence when the run also reports zero skips with the zip present. Check the
skip count, not the failure count. This is the most serious open item here.

**statsmodels reported a coefficient of −3.6 × 10¹⁴ as a converged fit.** Quasi-complete
separation across 53 officer-assignment levels, 19 of them with zero cells, raised as
success. Now guarded, with the guard demonstrated to trip rather than assumed to work.

**The spline needed re-parameterising to converge.** `cr(clock_minutes, df=6)` plus an
intercept is rank-deficient by one column, so IRLS's absolute deviance-change tolerance
is never satisfied even while the estimate is stable — the model looks unconverged when
it is merely redundant. `constraints="center"` keeps it a natural cubic spline as
specified while removing the redundancy.

**Location keys are not normalised.** `5700 BLOCK Baltimore Ave`, `BALTIMORE AVE` and
`BALTIMORE` are distinct strings. Measured during exploration: normalising moves the
multi-occupant rate by 0.05pp (14.09% → 14.14%), so it is not required for these
figures. It remains a correctness issue for anything counting distinct locations.

**Model 2 still lacks the Knode weight** (see §3).

**Deferred by design:** the `darkness × era` interaction, ordinal dose-response on party
size (the 2026 abstract argues the effect scales with the number of young Black men
present, beyond present/absent), and a time-heaping sensitivity refit with a wider
excluded band. The cube carries unused `era` and `district` dimensions for the first of
these.

---

## 7. Questions for the authors

1. **The Knode weight formula.** The 2026 paper specifies the weight but does not
   publish the formula. We reconstructed it from Knode et al. (2024) supplemental S.2
   and scoped `p` to the inter-twilight window on the evidence of the 25,926 zero
   weights. Is that the scoping you used?

2. **Figure 3's denominator.** We read the 25.1% / 4.6% figures as per motorist rather
   than per stop, which changes the comparison substantially (per stop: 14.2% / 2.6%).
   Is that reading correct?

3. **How the PSA control was keyed.** Raw `psa` holds only five distinct values
   city-wide because PPD numbers service areas within each district. Did the published
   models control on the district-qualified area, or on the raw field?

4. **Study 1's restriction 5.** We use "has an MVC code" as a proxy for
   "MVC-initiated, excluding vehicle-involved-in-crime and flash-information stops",
   because the exact restriction moves our n further from your published 76,274. Does
   the proxy match your intent, and how did you treat the `Police Investigation`
   category?

---

## 8. Reproducing this

```
pipeline/veil/sun.py               solar geometry, inter-twilight window
pipeline/veil/sample.py            Study 2 sample restrictions and outcomes
pipeline/veil/intraracial.py       Study 1 restrictions and outcomes
pipeline/veil/seasonality.py       Knode et al. (2024) weights
pipeline/veil/models.py            fits, pinned published targets, guards
pipeline/veil/build_intraracial.py per-year fits for the trend section
pipeline/cube_builders/veil.py     cube emitted to public/cubes/veil.json
pages/veil-of-darkness.vue         the page
utils/veil.ts                      selectors, all denominators explicit
```

Tests: `pipeline/tests/test_veil_replication.py` pins the published figures,
`test_intraracial.py` pins Study 1's coefficients and standard errors,
`test_veil_models.py` pins Study 2's. `utils/veil.test.ts` covers the page-side
selectors. Read §6 on the skip behaviour before trusting a green run.

Design and plan: `docs/superpowers/specs/2026-08-09-veil-of-darkness-design.md`,
`docs/superpowers/plans/2026-08-09-veil-of-darkness.md`.

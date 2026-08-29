import { completeYears, groupTupleSum, VIOLATION_CATEGORIES_OPERATIONAL, type Cube } from './cube'

/** Driving Equality took effect 2022-03-03; the trend series starts there. */
const FIRST_TREND_YEAR = 2022

const RACE_ORDER = ['Asian', 'Black', 'Latino', 'White', 'All Other Races'] as const

/**
 * Categories that carry no actual reason for the stop.
 *
 * `None` means no MVC code was recorded at all. `Other` means a code was
 * recorded that names nothing in particular. Every question on the Reasons page
 * is framed "when Philadelphia police gave a reason", so neither belongs in a
 * denominator — including them would count stops whose reason is unknown as
 * though a reason had been given.
 *
 * The two reason-comparison charts at the top of the page drop the same two,
 * for the separate reason that neither is a meaningful bar. The whole page
 * therefore divides by the same thing.
 */
export const CATEGORIES_WITHOUT_A_REASON = new Set(['None', 'Other'])

export interface OperationalShare {
  race: string
  pct: number
}

export function operationalShareByRace(cube: Cube, year: number): OperationalShare[] {
  const filterOpts = {
    startQuarter: `${year}-Q1`,
    endQuarter: `${year}-Q4`,
  }

  // Denominator: stops that name a reason — see CATEGORIES_WITHOUT_A_REASON.
  //
  // This is not free, and the cost falls unevenly, which is why it is a
  // published claim rather than a tidy-up. `None` is not missing data: PPD
  // stopped coding tint stops in 2023, so those real nonoperational stops moved
  // into `None`, and Black drivers carry the largest share of both it and
  // `Other`. Dropping them lifts every race and narrows the gap — 2025 Black
  // 44.8% -> 63.6%, White 63.8% -> 76.9%, White-Black 19.0pt -> 13.3pt.
  // reasons.test.ts pins the rule and the figures.
  //
  // One pass, not three. "Every category except these two" is not expressible
  // in the cube filter, and doing it as total-minus-excluded cost a second full
  // scan — enough on its own to put this page's first render over its load
  // budget. Grouping by the pair and bucketing here reads the rows once.
  const operational = new Set(VIOLATION_CATEGORIES_OPERATIONAL)
  const totals = new Map<string, { op: number; withReason: number }>()

  for (const { keys, value } of groupTupleSum(cube, ['race', 'violation_category'], 'n_stopped', filterOpts)) {
    const [race, violationCategory] = keys
    if (CATEGORIES_WITHOUT_A_REASON.has(violationCategory)) continue
    const bucket = totals.get(race) ?? { op: 0, withReason: 0 }
    bucket.withReason += value
    if (operational.has(violationCategory)) bucket.op += value
    totals.set(race, bucket)
  }

  return RACE_ORDER.filter((r) => totals.has(r)).map((race) => {
    const { op, withReason } = totals.get(race)!
    return { race, pct: withReason ? Math.round((1000 * op) / withReason) / 10 : 0 }
  })
}

export interface YearShare {
  year: number
  operational: number
  nonOperational: number
  incomplete: boolean
}

/**
 * Share of traffic stops made for operational violations, by calendar year.
 *
 * Denominator is stops that name a reason — see CATEGORIES_WITHOUT_A_REASON.
 * `None` and `Other` are both excluded.
 *
 * A year is `incomplete` when the cube does not yet contain all four of its
 * quarters — a fact about the data, not the wall clock. `mostRecentQuarter`
 * (clock-derived; see plugins/mostRecentQuarter.js) is used only to cap which
 * years may be treated as complete, so that the e2e parity harness's
 * `--quarter` pin stays meaningful: a year the pinned quarter hasn't reached
 * yet is never called complete even if a fuller cube happens to contain it.
 */
export function operationalShareByYear(cube: Cube, mostRecentQuarter: string): YearShare[] {
  const operational = new Set(VIOLATION_CATEGORIES_OPERATIONAL)
  const totals = new Map<number, { op: number; withReason: number }>()

  for (const { keys, value } of groupTupleSum(cube, ['quarter', 'violation_category'], 'n_stopped')) {
    const [quarter, violationCategory] = keys
    // Same denominator as operationalShareByRace above and as the two
    // reason-comparison charts: stops that name a reason. Excluding `Other`
    // alongside `None` moved this series from 50.8/65.0/64.5/59.0 to
    // 52.9/70.0/70.9/67.6 and steepened the 2022->2025 rise from +8.2 to
    // +14.7 points.
    if (CATEGORIES_WITHOUT_A_REASON.has(violationCategory)) continue
    // Nothing past the pinned quarter counts. Without this the trailing
    // partial point would move as new data landed even when `--quarter` was
    // pinned, which is exactly what pinning exists to prevent.
    if (quarter > mostRecentQuarter) continue
    const year = Number(quarter.slice(0, 4))
    const bucket = totals.get(year) ?? { op: 0, withReason: 0 }
    bucket.withReason += value
    if (operational.has(violationCategory)) bucket.op += value
    totals.set(year, bucket)
  }

  // Driving Equality took effect in March 2022, so the series starts there.
  //
  // The series runs to the pinned quarter's year and no further: pinning back
  // with `--quarter` must drop later years outright, or the e2e parity harness
  // cannot compare a local build against production.
  //
  // Within that range a year is published whether or not the cube holds all
  // four of its quarters, but a year the cube is missing quarters for is
  // flagged `incomplete`, which is what makes LineGraph dash the segment into
  // it and the hover read "(partial year)". Completeness is read from the cube
  // via completeYears, never inferred from the clock — if the clock runs a
  // quarter ahead of the data, the year is still short and still dashes. The
  // failure being guarded is a half-year drawn as a settled point; drawing it
  // as visibly provisional is the whole point of the dashed segment.
  const complete = completeYears(cube)
  const trailingYear = Number(mostRecentQuarter.slice(0, 4))

  return [...totals.keys()]
    .filter((year) => year >= FIRST_TREND_YEAR && year <= trailingYear)
    .sort((a, b) => a - b)
    .map((year) => {
      const { op, withReason } = totals.get(year)!
      const pct = withReason ? Math.round((1000 * op) / withReason) / 10 : 0
      return {
        year,
        operational: pct,
        nonOperational: Math.round((100 - pct) * 10) / 10,
        incomplete: !complete.has(year),
      }
    })
}

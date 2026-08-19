import { completeYears, groupTupleSum, VIOLATION_CATEGORIES_OPERATIONAL, type Cube } from './cube'

/** Driving Equality took effect 2022-03-03; the trend series starts there. */
const FIRST_TREND_YEAR = 2022

const RACE_ORDER = ['Asian', 'Black', 'Latino', 'White', 'All Other Races'] as const

export interface OperationalShare {
  race: string
  pct: number
}

export function operationalShareByRace(cube: Cube, year: number): OperationalShare[] {
  const filterOpts = {
    startQuarter: `${year}-Q1`,
    endQuarter: `${year}-Q4`,
  }

  // Denominator: stops carrying a recorded violation_category. `None` means no
  // MVC code was recorded, so it is excluded — this chart is framed "when
  // Philadelphia police gave a reason", the same rule as operationalShareByYear
  // below. `Other` IS a recorded reason and stays in: non-operational, in the
  // denominator but not the numerator.
  //
  // This is not free, and the cost falls unevenly. `None` is not missing data:
  // PPD stopped coding tint stops in 2023, so those real nonoperational stops
  // moved into `None`, and Black drivers carry the largest share of them.
  // Excluding them lifts every race and narrows the gap — 2025 Black 44.8% ->
  // 54.5%, White-Black 19.0pt -> 16.7pt. Putting `None` back is a change to a
  // published claim, not a cleanup; reasons.test.ts pins both the rule and the
  // figures.
  //
  // Note the two reason-comparison charts at the top of the page drop `Other`
  // as well, because there each category is its own bar and `Other` is not a
  // meaningful one. Here the categories are aggregated, so it stays.
  //
  // One pass, not three. Selecting "every category except None" is not
  // expressible in the cube filter, and doing it as total-minus-None cost a
  // second full scan — enough to put this page's first render over its load
  // budget on its own. Grouping by the pair and bucketing here reads the rows
  // once, the same shape operationalShareByYear uses.
  const operational = new Set(VIOLATION_CATEGORIES_OPERATIONAL)
  const totals = new Map<string, { op: number; withReason: number }>()

  for (const { keys, value } of groupTupleSum(cube, ['race', 'violation_category'], 'n_stopped', filterOpts)) {
    const [race, violationCategory] = keys
    if (violationCategory === 'None') continue
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
 * Denominator is every stop. See the note in reasons.test.ts for why `None`
 * and `Other` stay in: they are non-operational stops, not missing data.
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
    // This chart is framed "when Philadelphia police gave a reason", so the
    // denominator is stops carrying a recorded category. `None` means no MVC
    // code was recorded, so it is excluded here — unlike
    // `operationalShareByRace`, which is framed "out of all traffic stops" and
    // keeps it in. `Other` IS a recorded reason and stays in the denominator.
    if (violationCategory === 'None') continue
    const year = Number(quarter.slice(0, 4))
    const bucket = totals.get(year) ?? { op: 0, withReason: 0 }
    bucket.withReason += value
    if (operational.has(violationCategory)) bucket.op += value
    totals.set(year, bucket)
  }

  // Driving Equality took effect in March 2022, so the series starts there.
  // The upper bound is the last year the cube holds all four quarters for, and
  // moves on its own as data arrives — completeness is a fact about the cube,
  // never about the clock (see completeYears).
  const complete = completeYears(cube)
  const trailingYear = Number(mostRecentQuarter.slice(0, 4))
  const capYear = mostRecentQuarter.endsWith('Q4') ? trailingYear : trailingYear - 1

  return [...totals.keys()]
    .filter((year) => year >= FIRST_TREND_YEAR && year <= capYear && complete.has(year))
    .sort((a, b) => a - b)
    .map((year) => {
      const { op, withReason } = totals.get(year)!
      const pct = withReason ? Math.round((1000 * op) / withReason) / 10 : 0
      return {
        year,
        operational: pct,
        nonOperational: Math.round((100 - pct) * 10) / 10,
        // Every year in this series is complete by construction; the field
        // stays because LineGraph reads it to dash a provisional segment.
        incomplete: false,
      }
    })
}

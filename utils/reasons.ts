import { groupSum, VIOLATION_CATEGORIES_OPERATIONAL, type Cube } from './cube'

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

  // Denominator: every stop, including those whose violation_category is
  // `None` or `Other`. Both are non-operational and so belong in the
  // denominator but not the numerator. `None` in particular is not missing
  // data — see the note in reasons.test.ts. Do not "align" this with the
  // reason-comparison charts, which drop both categories because they plot
  // one bar per category; here the categories are being aggregated, and
  // dropping them would inflate the operational share.
  const stopsByRace = new Map(
    groupSum(cube, 'race', 'n_stopped', filterOpts).map((g) => [g.key, g.value]),
  )

  const opStopsByRace = new Map(
    groupSum(cube, 'race', 'n_stopped', {
      ...filterOpts,
      violationCategory: VIOLATION_CATEGORIES_OPERATIONAL,
    }).map((g) => [g.key, g.value]),
  )

  return RACE_ORDER.filter((r) => stopsByRace.has(r)).map((race) => {
    const total = stopsByRace.get(race) ?? 0
    const op = opStopsByRace.get(race) ?? 0
    return { race, pct: total ? Math.round((1000 * op) / total) / 10 : 0 }
  })
}

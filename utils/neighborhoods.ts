import { completeYears, sumMeasure, type Cube } from './cube'
import type { DistrictsDemographics } from '~/composables/useDistrictsDemographics'

export interface DisparityRatio {
  year: number
  ratio: number
  blackStops: number
  whiteStops: number
  districts: string[]
}

/**
 * How much more often Black drivers are stopped than white drivers, per
 * resident, across majority-white police districts.
 *
 * The denominator is residents, not drivers. Many drivers stopped in districts
 * 06 and 09 (Center City) do not live there, which inflates both rates in ways
 * that need not cancel. This is the measure the snapshot page already uses when
 * comparing stops to population, so the site stays internally consistent.
 */
export function majorityWhiteDisparity(
  cube: Cube,
  demographics: DistrictsDemographics,
  mostRecentQuarter: string,
): DisparityRatio | null {
  const districts = Object.entries(demographics)
    .filter(([, d]) => (d?.whiteness ?? 0) > 50)
    .map(([code]) => code)
    .sort()
  if (!districts.length) return null

  const blackPop = districts.reduce((s, d) => s + (demographics[d].black ?? 0), 0)
  const whitePop = districts.reduce((s, d) => s + (demographics[d].white ?? 0), 0)
  if (!blackPop || !whitePop) return null

  // Most recent *complete* calendar year: completeness is a fact about the
  // cube (does it have all four quarters for that year?), not the wall
  // clock. `mostRecentQuarter` only caps which year may be published, so the
  // e2e parity harness's `--quarter` pin keeps meaning: we never publish a
  // year the pinned quarter hasn't reached, even if a fuller cube already
  // contains it.
  const complete = completeYears(cube)
  const trailingYear = Number(mostRecentQuarter.slice(0, 4))
  const capYear = mostRecentQuarter.endsWith('Q4') ? trailingYear : trailingYear - 1
  const candidateYears = [...complete].filter((y) => y <= capYear).sort((a, b) => b - a)
  const year = candidateYears[0]
  if (year === undefined) return null

  const stopsFor = (race: string) =>
    districts.reduce(
      (sum, district) =>
        sum +
        sumMeasure(cube, 'n_stopped', {
          location: `${district}*`,
          race,
          startQuarter: `${year}-Q1`,
          endQuarter: `${year}-Q4`,
        }),
      0,
    )

  const blackStops = stopsFor('Black')
  const whiteStops = stopsFor('White')
  if (!whiteStops) return null

  const ratio = (blackStops / blackPop) / (whiteStops / whitePop)
  if (!Number.isFinite(ratio)) return null

  return { year, ratio: Math.round(ratio * 10) / 10, blackStops, whiteStops, districts }
}

import { completeYears, groupTupleMeasures, pct, sumMeasure, type Cube } from './cube'
import type { DistrictsDemographics } from '~/composables/useDistrictsDemographics'

export interface DisparityRatio {
  ratio: number
  blackStops: number
  whiteStops: number
  districts: string[]
}

/** Annual rates are ratios of stop counts, never averages of quarterly rates. */
export function intrusionHitRatesByYear(cube: Cube, location: string, startQuarter: string, endQuarter: string) {
  const filters = { location, startQuarter, endQuarter, race: ['Black', 'White'] }
  const empty = () => ({ intrusions: 0, contraband: 0, arrests: 0, stops: 0, allArrests: 0 })
  const totals = new Map<string, ReturnType<typeof empty>>()
  const fields = { n_intruded: 'intrusions', n_contraband: 'contraband', n_arrested_intruded: 'arrests', n_stopped: 'stops', n_arrested: 'allArrests' } as const
  let lastYear = 0
  for (const { keys: [quarter, race], measures } of groupTupleMeasures(cube, ['quarter', 'race'], Object.keys(fields), filters)) {
    const year = Number(quarter.slice(0, 4))
    lastYear = Math.max(lastYear, year)
    const key = `${year}:${race}`
    const total = totals.get(key) ?? empty()
    for (const [measure, field] of Object.entries(fields)) total[field] += measures[measure]
    totals.set(key, total)
  }
  const complete = completeYears(cube)
  const points = []
  for (let year = Number(startQuarter.slice(0, 4)); year <= lastYear; year++) {
    const incomplete = !complete.has(year) || startQuarter > `${year}-Q1` || endQuarter < `${year}-Q4`
    for (const race of ['Black', 'White']) {
      const total = totals.get(`${year}:${race}`) ?? empty()
      points.push({ year, race, incomplete, ...total,
        contrabandRate: total.intrusions ? pct(total.contraband, total.intrusions) : null,
        arrestRate: total.intrusions ? pct(total.arrests, total.intrusions) : null,
        allStopsArrestRate: total.stops ? pct(total.allArrests, total.stops) : null,
      })
    }
  }
  return points
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
  startQuarter: string,
  endQuarter: string,
): DisparityRatio | null {
  const districts = Object.entries(demographics)
    .filter(([, d]) => (d?.whiteness ?? 0) > 50)
    .map(([code]) => code)
    .sort()
  if (!districts.length) return null

  const blackPop = districts.reduce((s, d) => s + (demographics[d].black ?? 0), 0)
  const whitePop = districts.reduce((s, d) => s + (demographics[d].white ?? 0), 0)
  if (!blackPop || !whitePop) return null

  // The range comes from the page's quarter selectors, so the sentence moves
  // with the charts above it. There is no year for this function to choose,
  // and so no way for a clock-derived year to disagree with the cube.
  const stopsFor = (race: string) =>
    districts.reduce(
      (sum, district) =>
        sum +
        sumMeasure(cube, 'n_stopped', {
          location: `${district}*`,
          race,
          startQuarter,
          endQuarter,
        }),
      0,
    )

  const blackStops = stopsFor('Black')
  const whiteStops = stopsFor('White')
  if (!whiteStops) return null

  const ratio = (blackStops / blackPop) / (whiteStops / whitePop)
  if (!Number.isFinite(ratio)) return null

  return { ratio: Math.round(ratio * 10) / 10, blackStops, whiteStops, districts }
}

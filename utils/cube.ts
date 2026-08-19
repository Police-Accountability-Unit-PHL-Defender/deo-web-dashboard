/**
 * Cube helpers for the static DEO data cubes.
 *
 * A cube is a small dictionary of column-oriented metadata plus a list
 * of row tuples. Each row is `[...dimensions, ...measures]` in the
 * order declared by `dimensions` / `measures`.
 *
 * Filtering and grouping are done in JS; cubes are small enough
 * (~100k rows) that linear scans are fast.
 */

export interface Cube {
  version: number
  dimensions: string[]
  measures: string[]
  rows: Array<Array<string | number | null>>
}

export interface Scalars {
  [windowOrKey: string]: { [location: string]: number }
}

/**
 * Map from "division" labels to the list of zero-padded district codes
 * they contain. Must be kept in sync with cube_builders/stops.py.
 */
export const DIVISION_MAP: Record<string, string[]> = {
  SPD: ['01', '03', '17'],
  NEPD: ['02', '07', '08', '15', '25'],
  NWPD: ['05', '14', '35', '39'],
  CPD: ['06', '09', '22'],
  SWPD: ['12', '16', '18', '19'],
  EPD: ['24', '25', '26'],
}

/** Pad a single-digit district to two digits to match cube convention. */
function padDistrict(d: string): string {
  return d.length === 1 && /^\d$/.test(d) ? '0' + d : d
}

/**
 * Build a predicate that decides whether a row's `location` value
 * (e.g. "22-1") belongs to the user's location selection.
 *
 *  - `"*"`               → every location matches
 *  - division key e.g. `"SPD"` → any PSA whose district is in the division
 *  - bare 2-digit district `"22"` → any PSA whose district matches
 *  - full PSA `"22-1"`        → exact equality
 */
export function locationPredicate(location: string): (loc: string) => boolean {
  if (!location || location === '*') return () => true

  if (location in DIVISION_MAP) {
    const districts = new Set(DIVISION_MAP[location])
    return (loc: string) => {
      const d = loc.split('-', 1)[0]
      return districts.has(d)
    }
  }

  // Bare district code (e.g. "22", "9", or "22*" from getLocationParam)
  const districtMatch = /^(\d{1,2})\*?$/.exec(location)
  if (districtMatch) {
    const d = padDistrict(districtMatch[1])
    const prefix = d + '-'
    return (loc: string) => loc.startsWith(prefix)
  }

  // Full PSA (or other exact string)
  return (loc: string) => loc === location
}

export interface CubeFilterOpts {
  location?: string
  startQuarter?: string
  endQuarter?: string
  race?: string | string[]
  gender?: string | string[]
  ageRange?: string | string[]
  violationCategory?: string | string[]
  /** Match rows whose `location`'s district is in this set (raw 2-digit codes). */
  districtIn?: string[] | Set<string>
}

// Mirrors deo_backend/models.py constants.
export const VIOLATION_CATEGORIES_OPERATIONAL = [
  'Failure to Obey Traffic Sign/Light',
  'Improper Pass, Lane, One Way',
  'Improper Turn/Signal',
  'Red Light/Stop Sign/Yield',
  'Speeding/Reckless/Careless Driving',
]
export const VIOLATION_CATEGORIES_DEO_IMPACTED = [
  'Display License Plate',
  'Inspection/Emission Sticker',
  'Lights',
  'Registration',
  'Windshield Obstruction',
]

function asSet(v: string | string[] | undefined): Set<string> | null {
  if (v === undefined) return null
  if (Array.isArray(v)) {
    if (v.length === 0) return null
    return new Set(v)
  }
  return new Set([v])
}

interface CompiledFilter {
  qIdx: number
  locIdx: number
  raceIdx: number
  genderIdx: number
  ageIdx: number
  violationIdx: number
  locPred: (loc: string) => boolean
  startQuarter?: string
  endQuarter?: string
  raceSet: Set<string> | null
  genderSet: Set<string> | null
  ageSet: Set<string> | null
  violationSet: Set<string> | null
  districtSet: Set<string> | null
}

function compileFilter(cube: Cube, opts: CubeFilterOpts): CompiledFilter {
  const qIdx = cube.dimensions.indexOf('quarter')
  const locIdx = cube.dimensions.indexOf('location')
  const raceIdx = cube.dimensions.indexOf('race')
  const genderIdx = cube.dimensions.indexOf('gender')
  const ageIdx = cube.dimensions.indexOf('age_range')
  const violationIdx = cube.dimensions.indexOf('violation_category')
  const districtSet =
    opts.districtIn === undefined
      ? null
      : opts.districtIn instanceof Set
        ? opts.districtIn
        : new Set(opts.districtIn)
  return {
    qIdx,
    locIdx,
    raceIdx,
    genderIdx,
    ageIdx,
    violationIdx,
    locPred: locationPredicate(opts.location ?? '*'),
    startQuarter: opts.startQuarter,
    endQuarter: opts.endQuarter,
    raceSet: asSet(opts.race),
    genderSet: asSet(opts.gender),
    ageSet: asSet(opts.ageRange),
    violationSet: asSet(opts.violationCategory),
    districtSet,
  }
}

function rowPasses(row: Array<string | number | null>, f: CompiledFilter): boolean {
  if (f.locIdx >= 0) {
    const loc = row[f.locIdx]
    if (typeof loc !== 'string' || !f.locPred(loc)) return false
  }
  if (f.qIdx >= 0 && (f.startQuarter || f.endQuarter)) {
    const q = row[f.qIdx]
    if (typeof q !== 'string') return false
    if (f.startQuarter && q < f.startQuarter) return false
    if (f.endQuarter && q > f.endQuarter) return false
  }
  if (f.raceSet && f.raceIdx >= 0) {
    const v = row[f.raceIdx]
    if (typeof v !== 'string' || !f.raceSet.has(v)) return false
  }
  if (f.genderSet && f.genderIdx >= 0) {
    const v = row[f.genderIdx]
    if (typeof v !== 'string' || !f.genderSet.has(v)) return false
  }
  if (f.ageSet && f.ageIdx >= 0) {
    const v = row[f.ageIdx]
    if (typeof v !== 'string' || !f.ageSet.has(v)) return false
  }
  if (f.violationSet && f.violationIdx >= 0) {
    const v = row[f.violationIdx]
    if (typeof v !== 'string' || !f.violationSet.has(v)) return false
  }
  if (f.districtSet && f.locIdx >= 0) {
    const loc = row[f.locIdx]
    if (typeof loc !== 'string') return false
    const d = loc.split('-', 1)[0]
    if (!f.districtSet.has(d)) return false
  }
  return true
}

/** Sum a measure across all rows that pass the optional filter. */
export function sumMeasure(
  cube: Cube,
  measure: string,
  opts: CubeFilterOpts = {},
): number {
  const measureIdx = cube.dimensions.length + cube.measures.indexOf(measure)
  if (cube.measures.indexOf(measure) === -1) {
    throw new Error(`Unknown measure: ${measure}`)
  }
  const f = compileFilter(cube, opts)
  let total = 0
  for (const row of cube.rows) {
    if (!rowPasses(row, f)) continue
    const v = row[measureIdx]
    if (typeof v === 'number') total += v
  }
  return total
}

/**
 * Group rows by a single dimension and sum the measure. Returned
 * entries are sorted by key (ascending) for stable display.
 */
export function groupSum(
  cube: Cube,
  groupBy: string,
  measure: string,
  opts: CubeFilterOpts = {},
): Array<{ key: string; value: number }> {
  const groupIdx = cube.dimensions.indexOf(groupBy)
  if (groupIdx === -1) throw new Error(`Unknown dimension: ${groupBy}`)
  const measureIdx = cube.dimensions.length + cube.measures.indexOf(measure)
  if (cube.measures.indexOf(measure) === -1) {
    throw new Error(`Unknown measure: ${measure}`)
  }
  const f = compileFilter(cube, opts)
  const acc = new Map<string, number>()
  for (const row of cube.rows) {
    if (!rowPasses(row, f)) continue
    const key = String(row[groupIdx] ?? '')
    const v = row[measureIdx]
    if (typeof v !== 'number') continue
    acc.set(key, (acc.get(key) ?? 0) + v)
  }
  return Array.from(acc, ([key, value]) => ({ key, value })).sort((a, b) =>
    a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
  )
}

/**
 * Group by a tuple of dimensions and sum the measure. Results are
 * sorted by `value` descending (useful for "top N" displays).
 */
export function groupTupleSum(
  cube: Cube,
  groupBy: string[],
  measure: string,
  opts: CubeFilterOpts = {},
): Array<{ keys: string[]; value: number }> {
  const groupIdxs = groupBy.map((g) => {
    const i = cube.dimensions.indexOf(g)
    if (i === -1) throw new Error(`Unknown dimension: ${g}`)
    return i
  })
  const measureIdx = cube.dimensions.length + cube.measures.indexOf(measure)
  if (cube.measures.indexOf(measure) === -1) {
    throw new Error(`Unknown measure: ${measure}`)
  }
  const f = compileFilter(cube, opts)
  const acc = new Map<string, { keys: string[]; value: number }>()
  for (const row of cube.rows) {
    if (!rowPasses(row, f)) continue
    const keys = groupIdxs.map((i) => String(row[i] ?? ''))
    const k = keys.join('')
    const v = row[measureIdx]
    if (typeof v !== 'number') continue
    const cur = acc.get(k)
    if (cur) cur.value += v
    else acc.set(k, { keys, value: v })
  }
  return Array.from(acc.values()).sort((a, b) => b.value - a.value)
}

// -----------------------------------------------------------------
// Shared figure-shape interfaces (used by downstream chart helpers).
// These intentionally mirror the FastAPI response shape so existing
// chart components can be reused with minimal churn.
// -----------------------------------------------------------------

export interface FigurePoint {
  x: string | number
  y: number
  label?: string
  [key: string]: unknown
}

export interface FigureShape {
  data: FigurePoint[]
  title?: string
  description?: string
  x_axis_label?: string
  y_axis_label?: string
  [key: string]: unknown
}

export interface OldEndpointShape {
  figure?: FigureShape
  text?: string
  scalar?: number
  [key: string]: unknown
}

// -----------------------------------------------------------------
// Derived helpers used by neighborhood/by-district aggregations.
// -----------------------------------------------------------------

/**
 * Extract the district (zero-padded 2-digit string) from a cube
 * `location` value like `"22-1"`. Returns the empty string when the
 * input is not a valid `district-psa` token.
 */
export function locationDistrict(loc: string): string {
  if (typeof loc !== 'string') return ''
  const i = loc.indexOf('-')
  return i < 0 ? loc : loc.slice(0, i)
}

/**
 * Which calendar years are fully populated in this cube, i.e. have all
 * four quarters present as distinct `quarter` dimension values.
 *
 * This is a property of the data, not of the wall clock: a year with
 * fewer than four quarters in the cube is incomplete regardless of what
 * `mostRecentQuarter` (which is derived from `new Date()`, see
 * plugins/mostRecentQuarter.js) claims. Callers that also need to cap
 * "most recent" by a pinned quarter (for the e2e parity harness) should
 * combine this with that separately.
 */
export function completeYears(cube: Cube): Set<number> {
  const quarterIdx = cube.dimensions.indexOf('quarter')
  if (quarterIdx === -1) throw new Error('cube missing quarter dimension')
  const quartersByYear = new Map<number, Set<string>>()
  for (const row of cube.rows) {
    const quarter = String(row[quarterIdx] ?? '')
    if (!quarter) continue
    const year = Number(quarter.slice(0, 4))
    const set = quartersByYear.get(year) ?? new Set<string>()
    set.add(quarter)
    quartersByYear.set(year, set)
  }
  const complete = new Set<number>()
  for (const [year, quarters] of quartersByYear) {
    if (quarters.size === 4) complete.add(year)
  }
  return complete
}

/**
 * Group rows by district and sum a measure. Identical semantics to
 * `groupSum(cube, 'districtoccur', ...)` from the old FastAPI code,
 * but driven by the cube's `location` dimension.
 *
 * Results are sorted by district code (ascending) for stable display.
 */
export function groupSumByDistrict(
  cube: Cube,
  measure: string,
  opts: CubeFilterOpts = {},
): Array<{ district: string; value: number }> {
  const locIdx = cube.dimensions.indexOf('location')
  if (locIdx === -1) throw new Error('cube missing location dimension')
  const measureIdx = cube.dimensions.length + cube.measures.indexOf(measure)
  if (cube.measures.indexOf(measure) === -1) {
    throw new Error(`Unknown measure: ${measure}`)
  }
  const f = compileFilter(cube, opts)
  const acc = new Map<string, number>()
  for (const row of cube.rows) {
    if (!rowPasses(row, f)) continue
    const loc = row[locIdx]
    if (typeof loc !== 'string') continue
    const d = locationDistrict(loc)
    if (!d) continue
    const v = row[measureIdx]
    if (typeof v !== 'number') continue
    acc.set(d, (acc.get(d) ?? 0) + v)
  }
  return Array.from(acc, ([district, value]) => ({ district, value })).sort(
    (a, b) => (a.district < b.district ? -1 : a.district > b.district ? 1 : 0),
  )
}

/**
 * Sum every numeric measure in the cube per district, in one pass.
 * Returns one entry per district present after filtering, with all
 * measures populated (zero where no matching rows exist).
 */
export function groupAllMeasuresByDistrict(
  cube: Cube,
  opts: CubeFilterOpts = {},
): Array<{ district: string; measures: Record<string, number> }> {
  const locIdx = cube.dimensions.indexOf('location')
  if (locIdx === -1) throw new Error('cube missing location dimension')
  const dimsLen = cube.dimensions.length
  const f = compileFilter(cube, opts)
  const acc = new Map<string, Record<string, number>>()
  for (const row of cube.rows) {
    if (!rowPasses(row, f)) continue
    const loc = row[locIdx]
    if (typeof loc !== 'string') continue
    const d = locationDistrict(loc)
    if (!d) continue
    let bucket = acc.get(d)
    if (!bucket) {
      bucket = {}
      for (const m of cube.measures) bucket[m] = 0
      acc.set(d, bucket)
    }
    for (let i = 0; i < cube.measures.length; i++) {
      const v = row[dimsLen + i]
      if (typeof v === 'number') bucket[cube.measures[i]] += v
    }
  }
  return Array.from(acc, ([district, measures]) => ({ district, measures })).sort(
    (a, b) => (a.district < b.district ? -1 : a.district > b.district ? 1 : 0),
  )
}

/**
 * Safe percentage: 100 * numerator / denominator, rounded to one
 * decimal. Returns 0 when the denominator is 0.
 */
export function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Math.round((1000 * numerator) / denominator) / 10
}

/**
 * Compute an ordinary-least-squares trendline (a + b*x) for the
 * given (x, y) pairs. `x` values can be strings (e.g. district codes)
 * — they are coerced to numbers when possible, otherwise ignored.
 *
 * Returns `null` when there are fewer than 2 finite (x, y) pairs.
 */
export function olsTrendline(
  pairs: Array<{ x: string | number; y: number }>,
): { slope: number; intercept: number; predict: (x: number) => number } | null {
  const xs: number[] = []
  const ys: number[] = []
  for (const { x, y } of pairs) {
    const xn = typeof x === 'number' ? x : Number(x)
    if (!Number.isFinite(xn) || !Number.isFinite(y)) continue
    xs.push(xn)
    ys.push(y)
  }
  if (xs.length < 2) return null
  const n = xs.length
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  if (den === 0) return null
  const slope = num / den
  const intercept = my - slope * mx
  return { slope, intercept, predict: (x: number) => slope * x + intercept }
}

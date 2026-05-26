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
}

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
  locPred: (loc: string) => boolean
  startQuarter?: string
  endQuarter?: string
  raceSet: Set<string> | null
  genderSet: Set<string> | null
  ageSet: Set<string> | null
}

function compileFilter(cube: Cube, opts: CubeFilterOpts): CompiledFilter {
  const qIdx = cube.dimensions.indexOf('quarter')
  const locIdx = cube.dimensions.indexOf('location')
  const raceIdx = cube.dimensions.indexOf('race')
  const genderIdx = cube.dimensions.indexOf('gender')
  const ageIdx = cube.dimensions.indexOf('age_range')
  return {
    qIdx,
    locIdx,
    raceIdx,
    genderIdx,
    ageIdx,
    locPred: locationPredicate(opts.location ?? '*'),
    startQuarter: opts.startQuarter,
    endQuarter: opts.endQuarter,
    raceSet: asSet(opts.race),
    genderSet: asSet(opts.gender),
    ageSet: asSet(opts.ageRange),
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

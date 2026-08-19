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

/**
 * Rows bucketed by district code, built once per cube and cached.
 *
 * Every user interaction re-runs several cube queries, and each one used to
 * scan all ~139k rows of the stops cube. That blocked the main thread for
 * well over a second per click, which is why map clicks, the demographic
 * toggle and even the Source link felt frozen.
 *
 * The bucket for a district is a SUPERSET of the rows any location filter
 * targeting that district can match — `rowPasses` still does the real
 * filtering — so narrowing to it cannot change a result.
 */
const districtIndexCache = new WeakMap<Cube, Map<string, Array<Array<string | number | null>>>>()

function districtIndex(cube: Cube): Map<string, Array<Array<string | number | null>>> {
  const cached = districtIndexCache.get(cube)
  if (cached) return cached
  const index = new Map<string, Array<Array<string | number | null>>>()
  const locIdx = cube.dimensions.indexOf('location')
  if (locIdx !== -1) {
    for (const row of cube.rows) {
      const loc = row[locIdx]
      if (typeof loc !== 'string') continue
      const d = loc.split('-', 1)[0]
      let bucket = index.get(d)
      if (!bucket) {
        bucket = []
        index.set(d, bucket)
      }
      bucket.push(row)
    }
  }
  districtIndexCache.set(cube, index)
  return index
}

/**
 * The district codes a filter can possibly match, or null when it could match
 * any district (in which case the caller scans every row).
 */
function targetDistricts(cube: Cube, opts: CubeFilterOpts): string[] | null {
  if (cube.dimensions.indexOf('location') === -1) return null

  const fromDistrictIn =
    opts.districtIn === undefined
      ? null
      : Array.from(opts.districtIn instanceof Set ? opts.districtIn : opts.districtIn)

  const location = opts.location
  let fromLocation: string[] | null = null
  if (location && location !== '*') {
    if (location in DIVISION_MAP) {
      fromLocation = DIVISION_MAP[location]
    } else {
      const districtMatch = /^(\d{1,2})\*?$/.exec(location)
      if (districtMatch) {
        fromLocation = [padDistrict(districtMatch[1])]
      } else {
        const psaMatch = /^(\d{1,2})-/.exec(location)
        if (psaMatch) fromLocation = [padDistrict(psaMatch[1])]
      }
    }
  }

  if (fromLocation && fromDistrictIn) {
    const allowed = new Set(fromDistrictIn.map(padDistrict))
    return fromLocation.filter((d) => allowed.has(d))
  }
  if (fromLocation) return fromLocation
  if (fromDistrictIn) return fromDistrictIn.map(padDistrict)
  return null
}

/**
 * The rows a query needs to examine: the whole cube, or just the buckets for
 * the districts the filter can reach.
 */
const candidateCache = new WeakMap<Cube, Map<string, Array<Array<string | number | null>>>>()

function candidateRows(cube: Cube, opts: CubeFilterOpts): Array<Array<string | number | null>> {
  const districts = targetDistricts(cube, opts)
  if (districts === null) return cube.rows
  const index = districtIndex(cube)
  if (districts.length === 1) return index.get(districts[0]) ?? []

  // Multi-district selections (divisions, districtIn) need the buckets
  // joined. Memoise the joined array per district set: the pages issue the
  // same selection from several computeds on every interaction, and rebuilding
  // it each time cost more than the full scan it replaced.
  const key = districts.slice().sort().join(',')
  let perCube = candidateCache.get(cube)
  if (!perCube) {
    perCube = new Map()
    candidateCache.set(cube, perCube)
  }
  const cached = perCube.get(key)
  if (cached) return cached
  const out: Array<Array<string | number | null>> = []
  for (const d of districts) {
    const bucket = index.get(d)
    if (bucket) for (const row of bucket) out.push(row)
  }
  perCube.set(key, out)
  return out
}

/**
 * Columnar form of a cube, built once and cached.
 *
 * Rows arrive as arrays of strings and numbers. Filtering them means a string
 * comparison or Set lookup per row per dimension, and grouping allocates a
 * Map entry per distinct key — for the 138,773-row stops cube that showed up
 * as ~700ms of scan time and ~600ms of GC per interaction.
 *
 * Dictionary-encoding each dimension turns those per-row string operations
 * into integer array reads. The expensive part of a filter (does this location
 * belong to the selection? is this quarter in range?) is then evaluated once
 * per DISTINCT value — 65 locations, ~50 quarters — instead of once per row.
 */
interface ColumnarCube {
  n: number
  /** Per dimension: the distinct values, and a code per row. */
  names: Array<Array<string | number | null>>
  codes: Int32Array[]
  /** Per measure: values by row. */
  values: Float64Array[]
  /**
   * Per measure: which rows actually held a number, or null when every row
   * did. A non-numeric cell used to make the row invisible to grouping, so a
   * group with no numeric values was absent rather than zero. No published
   * cube has one today, but the mask keeps that behaviour exact if one appears.
   */
  present: Array<Uint8Array | null>
  /** District code per row, plus row indices grouped by district. */
  districtName: string[]
  rowsByDistrict: Map<string, Int32Array>
  allRows: Int32Array
}

const columnarCache = new WeakMap<Cube, ColumnarCube>()

function columnar(cube: Cube): ColumnarCube {
  const cached = columnarCache.get(cube)
  if (cached) return cached

  const nd = cube.dimensions.length
  const nm = cube.measures.length
  const n = cube.rows.length

  const names: Array<Array<string | number | null>> = []
  const lookups: Array<Map<string | number | null, number>> = []
  const codes: Int32Array[] = []
  for (let d = 0; d < nd; d += 1) {
    names.push([])
    lookups.push(new Map())
    codes.push(new Int32Array(n))
  }
  const values: Float64Array[] = []
  const presentRaw: Uint8Array[] = []
  const anyMissing = new Array<boolean>(nm).fill(false)
  for (let m = 0; m < nm; m += 1) {
    values.push(new Float64Array(n))
    presentRaw.push(new Uint8Array(n))
  }

  const locIdx = cube.dimensions.indexOf('location')
  const districtName: string[] = []
  const districtRows = new Map<string, number[]>()

  for (let i = 0; i < n; i += 1) {
    const row = cube.rows[i]
    for (let d = 0; d < nd; d += 1) {
      const raw = row[d]
      let code = lookups[d].get(raw)
      if (code === undefined) {
        code = names[d].push(raw) - 1
        lookups[d].set(raw, code)
      }
      codes[d][i] = code
    }
    for (let m = 0; m < nm; m += 1) {
      const v = row[nd + m]
      const isNum = typeof v === 'number'
      values[m][i] = isNum ? v : 0
      presentRaw[m][i] = isNum ? 1 : 0
      if (!isNum) anyMissing[m] = true
    }
    if (locIdx !== -1) {
      const loc = row[locIdx]
      const dist = typeof loc === 'string' ? loc.split('-', 1)[0] : ''
      districtName.push(dist)
      let bucket = districtRows.get(dist)
      if (!bucket) {
        bucket = []
        districtRows.set(dist, bucket)
      }
      bucket.push(i)
    } else {
      districtName.push('')
    }
  }

  const rowsByDistrict = new Map<string, Int32Array>()
  for (const [dist, idxs] of districtRows) rowsByDistrict.set(dist, Int32Array.from(idxs))

  const allRows = new Int32Array(n)
  for (let i = 0; i < n; i += 1) allRows[i] = i

  const present = presentRaw.map((mask, m) => (anyMissing[m] ? mask : null))
  const built: ColumnarCube = { n, names, codes, values, present, districtName, rowsByDistrict, allRows }
  columnarCache.set(cube, built)
  return built
}

/**
 * A filter reduced to per-dimension allow-lists over dictionary codes.
 *
 * Each entry is a Uint8Array indexed by code: 1 if a row holding that value
 * passes. Building it costs one pass over each dimension's DISTINCT values,
 * after which testing a row is an array read.
 */
interface CodeFilter {
  allow: Array<Uint8Array | null>
  rows: Int32Array
}

function compileCodeFilter(cube: Cube, opts: CubeFilterOpts): CodeFilter {
  const col = columnar(cube)
  const allow: Array<Uint8Array | null> = cube.dimensions.map(() => null)

  const dimAllow = (dim: string, ok: (value: string | number | null) => boolean) => {
    const d = cube.dimensions.indexOf(dim)
    if (d === -1) return
    const names = col.names[d]
    const mask = new Uint8Array(names.length)
    for (let c = 0; c < names.length; c += 1) mask[c] = ok(names[c]) ? 1 : 0
    const existing = allow[d]
    if (existing) {
      for (let c = 0; c < mask.length; c += 1) mask[c] = mask[c] && existing[c] ? 1 : 0
    }
    allow[d] = mask
  }

  if (opts.location && opts.location !== '*') {
    const pred = locationPredicate(opts.location)
    dimAllow('location', (v) => typeof v === 'string' && pred(v))
  }
  if (opts.startQuarter || opts.endQuarter) {
    const start = opts.startQuarter
    const end = opts.endQuarter
    dimAllow('quarter', (v) => {
      if (typeof v !== 'string') return false
      if (start && v < start) return false
      if (end && v > end) return false
      return true
    })
  }
  const setFor = (v: string | string[] | undefined) => asSet(v)
  const race = setFor(opts.race)
  if (race) dimAllow('race', (v) => typeof v === 'string' && race.has(v))
  const gender = setFor(opts.gender)
  if (gender) dimAllow('gender', (v) => typeof v === 'string' && gender.has(v))
  const age = setFor(opts.ageRange)
  if (age) dimAllow('age_range', (v) => typeof v === 'string' && age.has(v))
  const violation = setFor(opts.violationCategory)
  if (violation) dimAllow('violation_category', (v) => typeof v === 'string' && violation.has(v))
  if (opts.districtIn !== undefined) {
    const set = opts.districtIn instanceof Set ? opts.districtIn : new Set(opts.districtIn)
    dimAllow('location', (v) => typeof v === 'string' && set.has(v.split('-', 1)[0]))
  }

  return { allow, rows: candidateIndices(cube, opts) }
}

/** Row indices a query must examine, narrowed by district where possible. */
function candidateIndices(cube: Cube, opts: CubeFilterOpts): Int32Array {
  const col = columnar(cube)
  const districts = targetDistricts(cube, opts)
  if (districts === null) return col.allRows
  if (districts.length === 1) return col.rowsByDistrict.get(districts[0]) ?? new Int32Array(0)
  let total = 0
  const buckets: Int32Array[] = []
  for (const d of districts) {
    const b = col.rowsByDistrict.get(d)
    if (b) {
      buckets.push(b)
      total += b.length
    }
  }
  const out = new Int32Array(total)
  let at = 0
  for (const b of buckets) {
    out.set(b, at)
    at += b.length
  }
  return out
}

/** Whether row `i` passes every dimension allow-list. */
function passes(col: ColumnarCube, f: CodeFilter, i: number): boolean {
  const allow = f.allow
  for (let d = 0; d < allow.length; d += 1) {
    const mask = allow[d]
    if (mask !== null && !mask[col.codes[d][i]]) return false
  }
  return true
}

/** Sum a measure across all rows that pass the optional filter. */
export function sumMeasure(
  cube: Cube,
  measure: string,
  opts: CubeFilterOpts = {},
): number {
  const mi = cube.measures.indexOf(measure)
  if (mi === -1) {
    throw new Error(`Unknown measure: ${measure}`)
  }
  const col = columnar(cube)
  const f = compileCodeFilter(cube, opts)
  const vals = col.values[mi]
  const rows = f.rows
  let total = 0
  for (let k = 0; k < rows.length; k += 1) {
    const i = rows[k]
    if (passes(col, f, i)) total += vals[i]
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
  const mi = cube.measures.indexOf(measure)
  if (mi === -1) {
    throw new Error(`Unknown measure: ${measure}`)
  }
  const col = columnar(cube)
  const f = compileCodeFilter(cube, opts)
  const groupCodes = col.codes[groupIdx]
  const groupNames = col.names[groupIdx]
  const vals = col.values[mi]
  const present = col.present[mi]
  // One accumulator slot per distinct group value, so grouping is an array
  // add rather than a Map insert per row.
  const sums = new Float64Array(groupNames.length)
  const seen = new Uint8Array(groupNames.length)
  const rows = f.rows
  for (let k = 0; k < rows.length; k += 1) {
    const i = rows[k]
    if (!passes(col, f, i)) continue
    if (present !== null && !present[i]) continue
    const g = groupCodes[i]
    sums[g] += vals[i]
    seen[g] = 1
  }
  const out: Array<{ key: string; value: number }> = []
  for (let g = 0; g < groupNames.length; g += 1) {
    if (seen[g]) out.push({ key: String(groupNames[g] ?? ''), value: sums[g] })
  }
  return out.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
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
  for (const row of candidateRows(cube, opts)) {
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
  for (const row of candidateRows(cube, opts)) {
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
  for (const row of candidateRows(cube, opts)) {
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

/**
 * Map a location param to the key used by the scalars tables.
 *
 * `getLocationParam` renders a district as `"14*"`, and `locationPredicate`
 * accepts the asterisk when filtering cube rows. The scalars tables, built by
 * the pipeline, are keyed on the bare code — so a district lookup has to drop
 * it or it silently returns undefined.
 */
export function scalarsKey(location: string): string {
  const districtMatch = /^(\d{1,2})\*$/.exec(location)
  return districtMatch ? districtMatch[1] : location
}

/**
 * Helpers for the veil-of-darkness cube.
 *
 * Denominators differ per figure and mixing them up silently reports the
 * wrong number. The paper's headline "five times more likely" (25.1% vs
 * 4.6%) is per motorist; the same quantity per stop is 14.2% vs 2.6%.
 * Function names here say which denominator they use.
 *
 * None of the selectors below take a year/date range. They aggregate
 * unconditionally over every row in the `VeilCube` they're given. The
 * shipped cube spans 2014-2026, not just the paper's 2021-2024 study
 * window, so callers must call `restrictToYears(cube, REPLICATION_YEARS.from,
 * REPLICATION_YEARS.to)` once and pass the result to every selector —
 * there is no `opts` parameter on the selectors themselves.
 */
import type { Cube } from '~/utils/cube'

export interface VeilModel {
  coef: number
  se: number
  p: number
  n: number
  odds_ratio: number
  spec: string
  converged: boolean
  seasonality_weight: boolean
  paper_coef: number | null
  /**
   * Share of ROWS whose value for a collapsible fixed effect was folded
   * into the "OTHER" bucket, keyed by column (`police_area`,
   * `assigned_unit`). Only present on model_2 fits. A large share means
   * that control is hollow for that fit and must be disclosed, not shipped
   * silently.
   */
  other_row_share?: Record<string, number>
}

/**
 * How heavily officers round the recorded stop time, measured by the
 * pipeline on the replication slice. `clock_minutes` is minute-level and
 * the cube's `clock_bin` dimension is 15-minute, so these cannot be
 * recomputed from `rows` — they are carried here so the page can state a
 * measured figure instead of an unsourced one.
 */
export interface VeilTimeRounding {
  n: number
  pct_multiple_of_5: number
  pct_multiple_of_15: number
}

/**
 * One outcome's fitted intraracial (Hannon & Biddle 2025) model. Unlike
 * `VeilModel` above, there is no `spec`/`seasonality_weight` split — every
 * intraracial fit applies the full control set and the paper's seasonality
 * weight.
 */
export interface VeilIntraracialModel {
  coef: number
  se: number
  odds_ratio: number
  p_value: number
  n: number
  converged: boolean
  /** Hannon & Biddle (2025) Table 1, "Dark Out" column -- from INTRARACIAL_TARGETS. */
  paper_coef: number | null
  /** Hannon & Biddle (2025) Table 1 standard error -- from INTRARACIAL_SE_TARGETS. */
  paper_se: number | null
}

export type VeilIntraracialGroup = 'young_male' | 'young_female' | 'older_male' | 'older_female'
export type VeilIntraracialLighting = 'daylight' | 'dark'

export interface VeilIntraracialProbability {
  group: VeilIntraracialGroup
  lighting: VeilIntraracialLighting
  pct: number
}

export interface VeilIntraracialSample {
  n: number
  window_start: string
  window_end: string
  districts: string[]
}

/**
 * One outcome fitted on one calendar year, for the trend chart.
 *
 * `ci_lo`/`ci_hi` are the 95% Wald bounds the pipeline computes; the chart
 * draws them rather than recomputing from `se`, so the whiskers and any
 * table of these numbers can never disagree.
 */
export interface VeilIntraracialYearEstimate {
  year: number
  outcome: VeilIntraracialGroup
  coef: number
  se: number
  ci_lo: number
  ci_hi: number
  odds_ratio: number
  p_value: number
  n: number
  converged: boolean
}

/**
 * Year-by-year fits, a SEPARATE sample from the reproduction above.
 *
 * These are full calendar years, where `VeilIntraracialSample` covers
 * January 2022 - August 2025. 2025 therefore appears in both and means
 * something different in each; anything rendering both must say so.
 */
export interface VeilIntraracialByYear {
  window: { start: string; end: string }
  years: number[]
  estimates: VeilIntraracialYearEstimate[]
}

export interface VeilIntraracial {
  sample: VeilIntraracialSample
  models: Record<string, VeilIntraracialModel>
  probabilities: VeilIntraracialProbability[]
  by_year: VeilIntraracialByYear
}

export interface VeilCube extends Cube {
  models: Record<string, VeilModel>
  time_rounding?: VeilTimeRounding
  intraracial?: VeilIntraracial
}

type Row = Array<string | number | null>

/**
 * The paper's study window. The shipped cube spans 2014-2026 (it is
 * rebuilt from the full stops history), so every selector in this file
 * aggregates over whatever rows are in the cube it's given — callers
 * MUST restrict to this range themselves (see `restrictToYears`) before
 * calling a selector, or the numbers will not match the paper's figures.
 */
export const REPLICATION_YEARS = { from: 2021, to: 2024 } as const

/**
 * Return a new `VeilCube` whose `rows` are limited to `year` in
 * `[fromYear, toYear]` (inclusive). Does not mutate `cube`.
 * `dimensions`, `measures`, `version`, and `models` pass through
 * unchanged (`models` describes fitted regressions and isn't
 * re-derived here). Compose this once at the call site and pass the
 * result to every selector, rather than threading a year range through
 * each one individually.
 */
export function restrictToYears(cube: VeilCube, fromYear: number, toYear: number): VeilCube {
  const yearIdx = column(cube, 'year')
  return {
    ...cube,
    rows: cube.rows.filter((row) => {
      const y = Number((row as Row)[yearIdx])
      return y >= fromYear && y <= toYear
    }),
  }
}

function column(cube: VeilCube, name: string): number {
  const dim = cube.dimensions.indexOf(name)
  if (dim >= 0) return dim
  const measure = cube.measures.indexOf(name)
  if (measure < 0) throw new Error(`unknown cube column: ${name}`)
  return cube.dimensions.length + measure
}

function sumBy(
  cube: VeilCube,
  measure: string,
  predicate: (get: (name: string) => string | number | null) => boolean,
): number {
  const idx = column(cube, measure)
  let total = 0
  for (const row of cube.rows as Row[]) {
    const get = (name: string) => row[column(cube, name)]
    if (predicate(get)) total += Number(row[idx] ?? 0)
  }
  return total
}

const RACES = ['Black - Non-Latino', 'White - Non-Latino'] as const

/** Total young male motorists stopped, by race. Paper figure 2. */
export function motoristsByRace(cube: VeilCube): Record<string, number> {
  const out: Record<string, number> = {}
  for (const race of RACES) {
    out[race] = sumBy(cube, 'n_motorists', (get) => get('party_race') === race)
  }
  return out
}

/** Share of motorists who were in a multi-occupant car. Paper figure 3. */
export function pctMotoristsInGroups(cube: VeilCube): Record<string, number> {
  const out: Record<string, number> = {}
  for (const race of RACES) {
    const all = sumBy(cube, 'n_motorists', (get) => get('party_race') === race)
    const grouped = sumBy(
      cube,
      'n_motorists',
      (get) => get('party_race') === race && Number(get('group_travel')) === 1,
    )
    out[race] = all === 0 ? 0 : (grouped / all) * 100
  }
  return out
}

/** Per-occupant frisk and ticket rates, solo vs group. Paper figure 4. */
export function frisksAndTickets(cube: VeilCube, race: string) {
  const bucket = (grouped: 0 | 1) => {
    const match = (get: (n: string) => string | number | null) =>
      get('party_race') === race && Number(get('group_travel')) === grouped
    const motorists = sumBy(cube, 'n_motorists', match)
    return {
      motorists,
      friskRate: motorists === 0 ? 0 : (sumBy(cube, 'n_frisked', match) / motorists) * 100,
      ticketRate: motorists === 0 ? 0 : (sumBy(cube, 'n_ticketed', match) / motorists) * 100,
    }
  }
  return { solo: bucket(0), group: bucket(1) }
}

/**
 * The dashboard-wide definition of a majority-white police district:
 * resident whiteness above 50% in `public/cubes/districts.json`. Same rule
 * the neighborhoods page and the disparity sentence use — see
 * `pages/data.vue`'s "How does this dashboard calculate majority-white
 * districts?" entry.
 */
export const MAJORITY_WHITE_THRESHOLD = 50

/**
 * Share of stops of one race that happened in a majority-white police
 * district. Per stop.
 *
 * Depends on the cube's `district` dimension carrying zero-padded two-digit
 * codes ('02', '12') so it can be keyed against `districts.json`. Districts
 * missing from the demographics table (e.g. '77', an airport district with
 * no residents) are excluded from BOTH numerator and denominator, so the
 * result is "of stops in districts we can classify".
 */
export function pctStopsInMajorityWhiteDistricts(
  cube: VeilCube,
  race: string,
  demographics: Record<string, { whiteness: number }>,
): { pct: number; stops: number; classifiedStops: number } {
  const districtIdx = column(cube, 'district')
  const raceIdx = column(cube, 'party_race')
  const stopsIdx = column(cube, 'n_stops')

  let stops = 0
  let classified = 0
  let inMajorityWhite = 0
  for (const row of cube.rows as Row[]) {
    if (row[raceIdx] !== race) continue
    const n = Number(row[stopsIdx] ?? 0)
    stops += n
    const entry = demographics[String(row[districtIdx])]
    if (!entry) continue
    classified += n
    if (entry.whiteness > MAJORITY_WHITE_THRESHOLD) inMajorityWhite += n
  }
  return {
    pct: classified === 0 ? 0 : (inMajorityWhite / classified) * 100,
    stops,
    classifiedStops: classified,
  }
}

/** Display order for lighting states: daylight side of the veil first. */
const LIGHT_ORDER = ['daylight', 'dark']

export interface ClockBinPoint {
  clockBin: number
  lighting: string
  pctGroupStops: number
  /**
   * Stops behind `pctGroupStops` — the denominator, not a rate. The window
   * is truncated at both ends (17:08-20:35), so the first dark bin and the
   * last daylight bin rest on very few stops and their percentages swing
   * wildly. Callers plotting these points must use this to suppress thin
   * bins rather than letting one 40-stop bin set a chart's y-axis.
   */
  stops: number
}

/**
 * Share of stops that are group-travel, per clock-time bin and lighting
 * state. Per stop, not per motorist: this mirrors the regression outcome.
 * The gap between the two lines at the same clock time is the veil-of-
 * darkness contrast made visible.
 */
export function groupTravelByClockBin(cube: VeilCube, race: string): ClockBinPoint[] {
  const points = new Map<string, { total: number; grouped: number; bin: number; light: string }>()
  const binIdx = column(cube, 'clock_bin')
  const lightIdx = column(cube, 'lighting')
  const raceIdx = column(cube, 'party_race')
  const groupIdx = column(cube, 'group_travel')
  const stopsIdx = column(cube, 'n_stops')

  for (const row of cube.rows as Row[]) {
    if (row[raceIdx] !== race) continue
    const bin = Number(row[binIdx])
    const light = String(row[lightIdx])
    const key = `${bin}|${light}`
    const entry = points.get(key) ?? { total: 0, grouped: 0, bin, light }
    const n = Number(row[stopsIdx] ?? 0)
    entry.total += n
    if (Number(row[groupIdx]) === 1) entry.grouped += n
    points.set(key, entry)
  }

  return [...points.values()]
    .sort((a, b) => a.bin - b.bin || LIGHT_ORDER.indexOf(a.light) - LIGHT_ORDER.indexOf(b.light))
    .map((e) => ({
      clockBin: e.bin,
      lighting: e.light,
      pctGroupStops: e.total === 0 ? 0 : (e.grouped / e.total) * 100,
      stops: e.total,
    }))
}

/**
 * Helpers for the veil-of-darkness cube.
 *
 * Denominators differ per figure and mixing them up silently reports the
 * wrong number. The paper's headline "five times more likely" (25.1% vs
 * 4.6%) is per motorist; the same quantity per stop is 14.2% vs 2.6%.
 * Function names here say which denominator they use.
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
}

export interface VeilCube extends Cube {
  models: Record<string, VeilModel>
}

type Row = Array<string | number | null>

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

export interface ClockBinPoint {
  clockBin: number
  lighting: string
  pctGroupStops: number
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
    .sort((a, b) => a.bin - b.bin || b.light.localeCompare(a.light))
    .map((e) => ({
      clockBin: e.bin,
      lighting: e.light,
      pctGroupStops: e.total === 0 ? 0 : (e.grouped / e.total) * 100,
    }))
}

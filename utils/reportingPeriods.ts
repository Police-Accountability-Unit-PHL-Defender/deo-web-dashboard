import { completeYears, type Cube } from './cube'

/** Small build-time coverage index; the full cubes stay client-only and raw. */
export function cubeQuarters(cube: Cube): string[] {
  const index = cube.dimensions.indexOf('quarter')
  if (index < 0) throw new Error('cube missing quarter dimension')
  return [...new Set(cube.rows.map(row => String(row[index])))].sort()
}

export function reportingPeriods(quarters: string[], ceiling: string) {
  const available = [...new Set(quarters.filter(q => q <= ceiling))].sort()
  const latest = available.at(-1)
  if (!latest) throw new Error('no cube data at or before the quarter ceiling')
  // Reuse the cube completeness rule on the tiny coverage index.
  const complete = completeYears({ version: 1, dimensions: ['quarter'], measures: [], rows: available.map(q => [q]) })
  return { available, latest, completeYears: [...complete].sort((a, b) => a - b) }
}

/** Apply the calendar/pinned ceiling once, before a page aggregates the cube. */
export function capCube(cube: Cube, ceiling: string): Cube {
  const index = cube.dimensions.indexOf('quarter')
  if (index < 0) throw new Error('cube missing quarter dimension')
  if (!cube.rows.some(row => String(row[index]) > ceiling)) return cube
  return { ...cube, rows: cube.rows.filter(row => String(row[index]) <= ceiling) }
}

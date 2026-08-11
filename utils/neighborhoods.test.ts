import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { majorityWhiteDisparity } from './neighborhoods'
import type { Cube } from './cube'

const cube: Cube = JSON.parse(readFileSync('public/cubes/stops.json', 'utf8'))
const demographics = JSON.parse(readFileSync('public/cubes/districts.json', 'utf8'))

describe('majorityWhiteDisparity', () => {
  const result = majorityWhiteDisparity(cube, demographics, '2026-Q2')!

  it('selects districts over 50% white', () => {
    expect(result.districts).toEqual(['01', '03', '05', '06', '07', '08', '09', '26'])
  })

  it('uses the most recent complete calendar year', () => {
    expect(result.year).toBe(2025)
  })

  it('reproduces the published stop counts and ratio', () => {
    expect(result.blackStops).toBe(12686)
    expect(result.whiteStops).toBe(15699)
    expect(result.ratio).toBe(4.5)
  })

  it('steps back a year when the trailing year is incomplete', () => {
    expect(majorityWhiteDisparity(cube, demographics, '2025-Q4')!.year).toBe(2025)
    expect(majorityWhiteDisparity(cube, demographics, '2025-Q2')!.year).toBe(2024)
  })

  it('still publishes 2025 even when the clock is pinned past a half-populated 2026 (2026-Q4)', () => {
    // Regression for the bug where "most recent complete calendar year" was
    // read off the clock: the real cube's 2026 has only two quarters of
    // data. Pinning `mostRecentQuarter` to '2026-Q4' must not make the
    // published year 2026 (which would compute a ratio off six months of
    // data) — it must still fall back to 2025, the last year the cube
    // actually completes.
    expect(majorityWhiteDisparity(cube, demographics, '2026-Q4')!.year).toBe(2025)
  })

  it('returns null when demographics have not loaded', () => {
    expect(majorityWhiteDisparity(cube, {}, '2026-Q2')).toBeNull()
  })

  it('returns null rather than Infinity when a population is zero', () => {
    const zeroed = { '09': { total: 100, white: 90, black: 0, whiteness: 90 } }
    expect(majorityWhiteDisparity(cube, zeroed, '2026-Q2')).toBeNull()
  })
})

  it('returns null rather than Infinity when the white population is zero', () => {
    // The symmetric case to the test above. whitePop is the denominator of the
    // rate this sentence divides by, so a zero there would reach the page as
    // "Infinityx more often" -- the guard exists, but only blackPop was covered.
    const zeroed = { '09': { total: 100, white: 0, black: 90, whiteness: 90 } }
    expect(majorityWhiteDisparity(cube, zeroed, '2026-Q2')).toBeNull()
  })

  it('returns null rather than dividing by zero when no white drivers were stopped', () => {
    // Distinct from a zero population: the district qualifies and has white
    // residents, but the cube holds no white stops for the year, so whiteStops
    // is 0. Guarded separately in the implementation and previously untested.
    const noWhiteStops = { rows: [], dimensions: cube.dimensions, measures: cube.measures, version: cube.version }
    const demographics = { '09': { total: 100, white: 50, black: 40, whiteness: 50 } }
    expect(majorityWhiteDisparity(noWhiteStops as typeof cube, demographics, '2026-Q2')).toBeNull()
  })

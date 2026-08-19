import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { operationalShareByRace, operationalShareByYear } from './reasons'
import type { Cube } from './cube'

const cube: Cube = JSON.parse(readFileSync('public/cubes/reasons.json', 'utf8'))

const pctFor = (year: number, race: string) =>
  operationalShareByRace(cube, year).find((r) => r.race === race)?.pct

const pctForCube = (c: Cube, year: number, race: string) =>
  operationalShareByRace(c, year).find((r) => r.race === race)?.pct

const syntheticCube = (rows: Array<[string, string, string, string, number]>): Cube => ({
  version: 2,
  dimensions: ['quarter', 'location', 'race', 'violation_category'],
  measures: ['n_stopped'],
  rows,
})

describe('operationalShareByRace', () => {
  // `None` means the stop carries no MVC violation code. It is NOT missing
  // data: PPD has miscoded tint stops since 2023 by omitting the code, so the
  // Tint category collapses (4,589 stops in 2022-Q4 to 0 by 2025-Q4) while
  // `None` absorbs almost exactly the same volume. Tint is a non-operational
  // violation, so these stops belong in the denominator and out of the
  // numerator — which is precisely how a non-operational stop is counted.
  // Dropping them instead would inflate the operational share, most of all for
  // Black drivers, who carry the largest share of them. See reasons.vue:51 and
  // the Defender's Bailey analysis.
  it('counts stops with no violation code as non-operational, not as missing', () => {
    const c = syntheticCube([
      ['2025-Q1', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2025-Q1', '01', 'Black', 'None', 1],
    ])
    expect(pctForCube(c, 2025, 'Black')).toBe(50)
  })

  it('counts Other as non-operational too', () => {
    const c = syntheticCube([
      ['2025-Q1', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2025-Q1', '01', 'Black', 'Other', 1],
    ])
    expect(pctForCube(c, 2025, 'Black')).toBe(50)
  })

  it('sums the five operational categories into the numerator', () => {
    const c = syntheticCube([
      ['2025-Q1', '01', 'Black', 'Improper Turn/Signal', 1],
      ['2025-Q1', '01', 'Black', 'Speeding/Reckless/Careless Driving', 1],
      ['2025-Q1', '01', 'Black', 'Lights', 2],
    ])
    expect(pctForCube(c, 2025, 'Black')).toBe(50)
  })

  it('reproduces the published figures for 2025', () => {
    expect(pctFor(2025, 'Black')).toBe(44.8)
    expect(pctFor(2025, 'White')).toBe(63.8)
    expect(pctFor(2025, 'Latino')).toBe(46.2)
    expect(pctFor(2025, 'Asian')).toBe(70.5)
  })

  it('reproduces the published figures for earlier years', () => {
    expect(pctFor(2022, 'Black')).toBe(42.7)
    expect(pctFor(2022, 'White')).toBe(63.8)
    expect(pctFor(2023, 'Black')).toBe(48.8)
    expect(pctFor(2024, 'Black')).toBe(49.5)
  })

  it('confines each year to its own four quarters', () => {
    expect(pctFor(2024, 'Black')).not.toBe(pctFor(2025, 'Black'))
  })

  it('returns races in the canonical display order', () => {
    expect(operationalShareByRace(cube, 2025).map((r) => r.race)).toEqual([
      'Asian',
      'Black',
      'Latino',
      'White',
      'All Other Races',
    ])
  })
})

describe('operationalShareByYear', () => {
  const series = operationalShareByYear(cube, '2026-Q2')
  const yearOf = (y: number) => series.find((r) => r.year === y)

  it('covers every year present in the cube, in ascending order', () => {
    const years = series.map((r) => r.year)
    expect(years[0]).toBe(2014)
    expect(years).toEqual([...years].sort((a, b) => a - b))
    expect(new Set(years).size).toBe(years.length)
  })

  it('reproduces the published all-stops denominator', () => {
    expect(yearOf(2019)?.operational).toBe(26.7)
    expect(yearOf(2022)?.operational).toBe(47.0)
    expect(yearOf(2023)?.operational).toBe(53.7)
    expect(yearOf(2025)?.operational).toBe(49.5)
  })

  it('puts the crossover in 2023', () => {
    expect(yearOf(2022)!.operational).toBeLessThan(50)
    expect(yearOf(2024)!.operational).toBeGreaterThan(50)
  })

  it('flags only the trailing partial year as incomplete', () => {
    expect(yearOf(2026)?.incomplete).toBe(true)
    expect(yearOf(2025)?.incomplete).toBe(false)
    expect(series.filter((r) => r.incomplete)).toHaveLength(1)
  })

  it('flags a year as incomplete only when the cube lacks all four of its quarters, regardless of the clock', () => {
    // The real cube's trailing year (2026) has just two quarters (Q1, Q2) of
    // actual data. Completeness is a fact about the cube, not about what
    // `mostRecentQuarter` (clock-derived) claims. Pinning to '2025-Q4' must
    // not make a half-populated 2026 look complete.
    const withQ4Pin = operationalShareByYear(cube, '2025-Q4')
    expect(withQ4Pin.find((r) => r.year === 2026)?.incomplete).toBe(true)
    expect(withQ4Pin.find((r) => r.year === 2025)?.incomplete).toBe(false)
  })

  it('still flags 2026 as incomplete even when the clock is pinned past it (2026-Q4)', () => {
    // Regression for the bug where completeness was read off the clock: with
    // the cube unchanged (2026 still only has Q1 and Q2), pinning
    // `mostRecentQuarter` to '2026-Q4' must not flip 2026 to complete.
    const series2026Pin = operationalShareByYear(cube, '2026-Q4')
    expect(series2026Pin.find((r) => r.year === 2026)?.incomplete).toBe(true)
  })

  it('counts no-code and Other stops as non-operational, never dropping them', () => {
    const c: Cube = {
      version: 2,
      dimensions: ['quarter', 'location', 'race', 'violation_category'],
      measures: ['n_stopped'],
      rows: [
        ['2025-Q1', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
        ['2025-Q1', '01', 'Black', 'None', 1],
        ['2025-Q1', '01', 'Black', 'Other', 1],
        ['2025-Q1', '01', 'Black', 'Lights', 1],
      ],
    }
    expect(operationalShareByYear(c, '2025-Q4')[0].operational).toBe(25)
  })
})

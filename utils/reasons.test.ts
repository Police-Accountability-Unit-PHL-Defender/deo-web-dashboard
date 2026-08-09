import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { operationalShareByRace } from './reasons'
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

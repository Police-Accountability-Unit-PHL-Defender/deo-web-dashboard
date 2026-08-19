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
  // `None` means the stop carries no MVC violation code, so this chart drops
  // it: since 2026-08 the heading reads "when Philadelphia police gave a
  // reason", the same framing and the same rule as the trend chart above it.
  //
  // Know what that costs before touching it. `None` is not missing data — PPD
  // has miscoded tint stops since 2023 by omitting the code, so Tint collapses
  // (4,589 stops in 2022-Q4 to 0 by 2025-Q4) while `None` absorbs almost the
  // same volume. Those are real nonoperational stops, and Black drivers carry
  // the largest share of them, so excluding them raises every race's
  // operational share and narrows the disparity: 2025 Black goes 44.8% -> 54.5%
  // and the White-Black gap 19.0pt -> 16.7pt. That was a deliberate call, not a
  // cleanup. Putting `None` back is a change to a published claim.
  it('excludes stops with no violation code from the denominator', () => {
    const c = syntheticCube([
      ['2025-Q1', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2025-Q1', '01', 'Black', 'None', 1],
    ])
    // One operational stop out of one stop carrying a reason.
    expect(pctForCube(c, 2025, 'Black')).toBe(100)
  })

  // `Other` IS a recorded reason, so unlike `None` it stays in the denominator
  // — matching the trend chart, and unlike the two reason-comparison charts at
  // the top of the page, which drop it only because it is not a meaningful bar.
  it('counts Other as non-operational, keeping it in the denominator', () => {
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
    expect(pctFor(2025, 'Black')).toBe(54.5)
    expect(pctFor(2025, 'White')).toBe(71.2)
    expect(pctFor(2025, 'Latino')).toBe(56.2)
    expect(pctFor(2025, 'Asian')).toBe(75.7)
  })

  it('reproduces the published figures for earlier years', () => {
    expect(pctFor(2022, 'Black')).toBe(45.9)
    expect(pctFor(2022, 'White')).toBe(70.1)
    expect(pctFor(2023, 'Black')).toBe(60.5)
    expect(pctFor(2024, 'Black')).toBe(60.3)
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

  // This chart answers "when police gave a reason, how often was it
  // operational", so its denominator is stops WITH a recorded category —
  // `None` is excluded. That differs deliberately from
  // `operationalShareByRace` below it, which is framed "out of all traffic
  // stops" and keeps `None` in. Each chart's heading states its own
  // denominator; do not make them agree by changing one silently.
  it('starts at 2022 and covers only complete years, ascending', () => {
    const years = series.map((r) => r.year)
    expect(years[0]).toBe(2022)
    expect(years).toEqual([...years].sort((a, b) => a - b))
    expect(new Set(years).size).toBe(years.length)
    // 2026 has only Q1 and Q2 in the cube, so it must not appear.
    expect(years).not.toContain(2026)
    expect(years[years.length - 1]).toBe(2025)
  })

  it('divides by stops with a recorded reason, not by all stops', () => {
    // Same shape as the all-stops figures, recomputed without `None`.
    expect(yearOf(2022)?.operational).toBe(50.8)
    expect(yearOf(2023)?.operational).toBe(65.0)
    expect(yearOf(2024)?.operational).toBe(64.5)
    expect(yearOf(2025)?.operational).toBe(59.0)
  })

  it('excludes None from the denominator entirely', () => {
    const c = syntheticCube([
      ['2022-Q1', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2022-Q2', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2022-Q3', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2022-Q4', '01', 'Black', 'None', 99],
    ])
    // 3 operational, 99 with no reason: the 99 are not counted at all.
    expect(operationalShareByYear(c, '2022-Q4').find((r) => r.year === 2022)?.operational).toBe(100)
  })

  it('keeps Other in the denominator — it is a recorded reason', () => {
    const c = syntheticCube([
      ['2022-Q1', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2022-Q2', '01', 'Black', 'Other', 1],
      ['2022-Q3', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2022-Q4', '01', 'Black', 'Other', 1],
    ])
    expect(operationalShareByYear(c, '2022-Q4').find((r) => r.year === 2022)?.operational).toBe(50)
  })

  it('nonOperational is the remainder of the same denominator', () => {
    for (const row of series) {
      expect(Math.round((row.operational + row.nonOperational) * 10) / 10).toBe(100)
    }
  })

  it('reports no partial years, since only complete ones are included', () => {
    expect(series.every((r) => r.incomplete === false)).toBe(true)
  })

  it('does not let the clock add an incomplete year', () => {
    // 2026 has two quarters in the cube. Pinning the clock past it must not
    // pull it into the series.
    const pinnedPast = operationalShareByYear(cube, '2026-Q4')
    expect(pinnedPast.map((r) => r.year)).not.toContain(2026)
  })
})

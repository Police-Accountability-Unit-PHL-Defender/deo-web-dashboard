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

  // `Other` carries no actual reason — it is the bucket for stops whose reason
  // was recorded as nothing in particular — so a chart framed "when police gave
  // a reason" excludes it alongside `None`. Every chart on this page now agrees
  // on that denominator.
  it('excludes Other from the denominator — it is not a reason', () => {
    const c = syntheticCube([
      ['2025-Q1', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2025-Q1', '01', 'Black', 'Other', 1],
    ])
    // One operational stop out of one stop naming a reason.
    expect(pctForCube(c, 2025, 'Black')).toBe(100)
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
    expect(pctFor(2025, 'Black')).toBe(63.6)
    expect(pctFor(2025, 'White')).toBe(76.9)
    expect(pctFor(2025, 'Latino')).toBe(66.9)
    expect(pctFor(2025, 'Asian')).toBe(79.5)
  })

  it('reproduces the published figures for earlier years', () => {
    expect(pctFor(2022, 'Black')).toBe(47.7)
    expect(pctFor(2022, 'White')).toBe(73.3)
    expect(pctFor(2023, 'Black')).toBe(65.7)
    expect(pctFor(2024, 'Black')).toBe(67.0)
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
  // operational", so its denominator is stops that actually name a reason:
  // both `None` (no code recorded) and `Other` (a code meaning nothing in
  // particular) are excluded. `operationalShareByRace` below it uses the same
  // rule, as do the two reason-comparison charts at the top — one denominator
  // across the page.
  it('starts at 2022, runs to the trailing partial year, ascending', () => {
    const years = series.map((r) => r.year)
    expect(years[0]).toBe(2022)
    expect(years).toEqual([...years].sort((a, b) => a - b))
    expect(new Set(years).size).toBe(years.length)
    // 2026 holds only Q1 and Q2, and it appears — dashed, as a partial year.
    expect(years[years.length - 1]).toBe(2026)
  })

  it('divides by stops that name a reason, not by all stops', () => {
    expect(yearOf(2022)?.operational).toBe(52.9)
    expect(yearOf(2023)?.operational).toBe(70.0)
    expect(yearOf(2024)?.operational).toBe(70.9)
    expect(yearOf(2025)?.operational).toBe(67.6)
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

  it('excludes Other from the denominator — it names no reason', () => {
    const c = syntheticCube([
      ['2022-Q1', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2022-Q2', '01', 'Black', 'Other', 1],
      ['2022-Q3', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2022-Q4', '01', 'Black', 'Other', 1],
    ])
    // Two operational stops out of two that name a reason; the Other pair is
    // not counted at all.
    expect(operationalShareByYear(c, '2022-Q4').find((r) => r.year === 2022)?.operational).toBe(100)
  })

  it('nonOperational is the remainder of the same denominator', () => {
    for (const row of series) {
      expect(Math.round((row.operational + row.nonOperational) * 10) / 10).toBe(100)
    }
  })

  // The hazard these four guard is one the old series avoided by dropping
  // partial years outright: a half-year drawn as a settled point, with every
  // test still green. Showing it is now allowed; showing it *unmarked* is not.
  // `incomplete` is what makes the line dash and the hover say "(partial
  // year)", so it is the whole of the protection.
  it('flags exactly the years the cube has fewer than four quarters for', () => {
    expect(series.filter((r) => r.incomplete).map((r) => r.year)).toEqual([2026])
    for (const row of series.filter((r) => r.year <= 2025)) {
      expect(row.incomplete).toBe(false)
    }
  })

  it('publishes the partial year from the quarters it actually has', () => {
    // 2026-Q1 and Q2 only; 66.1% is that half-year, not a projection of it.
    expect(yearOf(2026)?.operational).toBe(66.1)
    expect(yearOf(2026)?.incomplete).toBe(true)
  })

  it('never lets the clock turn a partial year into a settled one', () => {
    // The clock says 2026 is over; the cube still holds two quarters. The year
    // may appear, but only ever dashed. This is the trap that let a missed
    // quarterly refresh publish six months as a full year.
    const pinnedPast = operationalShareByYear(cube, '2026-Q4')
    expect(pinnedPast.find((r) => r.year === 2026)?.incomplete).toBe(true)
  })

  it('drops years after the pinned quarter entirely', () => {
    // Pinning back to 2025-Q4 must not show 2026 at all, dashed or otherwise —
    // this is what makes `--quarter` pinning meaningful for the e2e harness.
    const pinnedBack = operationalShareByYear(cube, '2025-Q4')
    expect(pinnedBack.map((r) => r.year)).not.toContain(2026)
    expect(pinnedBack[pinnedBack.length - 1].year).toBe(2025)
    expect(pinnedBack.every((r) => r.incomplete === false)).toBe(true)
  })

  it('counts only quarters up to the pinned one within the partial year', () => {
    const c = syntheticCube([
      ['2026-Q1', '01', 'Black', 'Red Light/Stop Sign/Yield', 1],
      ['2026-Q2', '01', 'Black', 'Lights', 99],
    ])
    // Pinned at Q1: the 99 nonoperational stops in Q2 are past the pin and
    // must not drag the point down.
    const atQ1 = operationalShareByYear(c, '2026-Q1').find((r) => r.year === 2026)
    expect(atQ1?.operational).toBe(100)
    expect(atQ1?.incomplete).toBe(true)
  })
})

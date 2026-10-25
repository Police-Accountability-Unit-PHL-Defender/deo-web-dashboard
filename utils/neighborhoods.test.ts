import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { intrusionHitRatesByYear, majorityWhiteDisparity } from './neighborhoods'
import type { Cube } from './cube'

const cube: Cube = JSON.parse(readFileSync('public/cubes/stops.json', 'utf8'))
const demographics = JSON.parse(readFileSync('public/cubes/districts.json', 'utf8'))

describe('majorityWhiteDisparity', () => {
  // The sentence follows the quarter selectors on the neighborhoods page, so
  // the ratio is computed over an explicit range rather than a year this
  // function picks. There is no clock-derived year to get wrong here any more.
  const full = majorityWhiteDisparity(cube, demographics, '2014-Q1', '2026-Q2')!

  it('selects districts over 50% white', () => {
    expect(full.districts).toEqual(['01', '03', '05', '06', '07', '08', '09', '26'])
  })

  it('reproduces the published counts and ratio over the default range', () => {
    expect(full.blackStops).toBe(171564)
    expect(full.whiteStops).toBe(210982)
    expect(full.ratio).toBe(4.5)
  })

  it('recomputes for a narrower selection', () => {
    const year2025 = majorityWhiteDisparity(cube, demographics, '2025-Q1', '2025-Q4')!
    expect(year2025.blackStops).toBe(12686)
    expect(year2025.whiteStops).toBe(15699)
    expect(year2025.ratio).toBe(4.5)

    // A range where the ratio genuinely differs, so a broken range filter
    // cannot pass by coincidence.
    const firstHalf2026 = majorityWhiteDisparity(cube, demographics, '2026-Q1', '2026-Q2')!
    expect(firstHalf2026.ratio).toBe(5.5)
  })

  it('returns null when demographics have not loaded', () => {
    expect(majorityWhiteDisparity(cube, {}, '2014-Q1', '2026-Q2')).toBeNull()
  })

  it('returns null rather than Infinity when the Black population is zero', () => {
    const zeroed = { '09': { total: 100, white: 90, black: 0, whiteness: 90 } }
    expect(majorityWhiteDisparity(cube, zeroed, '2014-Q1', '2026-Q2')).toBeNull()
  })

  it('returns null rather than Infinity when the white population is zero', () => {
    // whitePop is the denominator of the rate this sentence divides by, so a
    // zero there would reach the page as "Infinityx more often".
    const zeroed = { '09': { total: 100, white: 0, black: 90, whiteness: 90 } }
    expect(majorityWhiteDisparity(cube, zeroed, '2014-Q1', '2026-Q2')).toBeNull()
  })

  it('returns null when the range contains no stops', () => {
    expect(majorityWhiteDisparity(cube, demographics, '2099-Q1', '2099-Q4')).toBeNull()
  })
})

describe('intrusionHitRatesByYear', () => {
  const annualCube: Cube = {
    version: 1,
    dimensions: ['quarter', 'location', 'race'],
    measures: ['n_stopped', 'n_intruded', 'n_contraband', 'n_arrested_intruded', 'n_arrested'],
    rows: [
      ['2024-Q1', '12-1', 'Black', 100, 10, 1, 2, 5],
      ['2024-Q2', '12-1', 'Black', 900, 90, 45, 18, 25],
      ['2024-Q3', '12-1', 'Black', 0, 0, 0, 0, 0],
      ['2024-Q4', '12-1', 'Black', 0, 0, 0, 0, 0],
      ['2024-Q1', '12-1', 'White', 100, 0, 0, 0, 10],
      ['2024-Q1', '14-1', 'Black', 100, 100, 100, 100, 100],
      ['2025-Q1', '12-1', 'Black', 200, 20, 8, 4, 8],
      ['2026-Q1', '12-1', 'Black', 50, 5, 1, 1, 2],
    ],
  }

  it('uses the correct denominators and annual count ratios rather than averaging quarterly rates', () => {
    const rows = intrusionHitRatesByYear(annualCube, '12*', '2024-Q1', '2024-Q4')
    expect(rows.find(p => p.race === 'Black')).toMatchObject({
      year: 2024, incomplete: false, contrabandRate: 46, arrestRate: 20, allStopsArrestRate: 3,
    })
    // No intrusions is undefined, whereas arrests among all stops is meaningful.
    expect(rows.find(p => p.race === 'White')).toMatchObject({ contrabandRate: null, arrestRate: null, allStopsArrestRate: 10 })
  })

  it('flags a short data year even when the selected range extends past it', () => {
    const rows = intrusionHitRatesByYear(annualCube, '12*', '2024-Q1', '2026-Q4')
    expect(rows.find(p => p.year === 2025 && p.race === 'Black')).toMatchObject({ incomplete: true, contrabandRate: 40 })
  })

  it('excludes quarters outside the selection and flags a partial first year', () => {
    const rows = intrusionHitRatesByYear(annualCube, '12*', '2024-Q2', '2025-Q1')
    expect(rows.find(p => p.year === 2024 && p.race === 'Black')).toMatchObject({ incomplete: true, contrabandRate: 50 })
    expect(rows.some(p => p.year === 2026)).toBe(false)
  })

  it('does not manufacture zero rates for a race with no denominator', () => {
    const rows = intrusionHitRatesByYear(annualCube, '12*', '2025-Q1', '2025-Q4')
    expect(rows.find(p => p.race === 'White')).toMatchObject({ contrabandRate: null, arrestRate: null, allStopsArrestRate: null })
  })
})

import { describe, expect, it } from 'vitest'
import {
  frisksAndTickets,
  groupTravelByClockBin,
  motoristsByRace,
  pctMotoristsInGroups,
  restrictToYears,
  type VeilCube,
  type VeilModel,
} from './veil'

// dimensions: year, era, clock_bin, lighting, party_race, group_travel, district
// measures:   n_stops, n_motorists, n_frisked, n_ticketed
const cube: VeilCube = {
  version: 1,
  dimensions: ['year', 'era', 'clock_bin', 'lighting', 'party_race', 'group_travel', 'district'],
  measures: ['n_stops', 'n_motorists', 'n_frisked', 'n_ticketed'],
  rows: [
    [2023, 'post_deo', 1080, 'daylight', 'Black - Non-Latino', 0, '18', 100, 100, 10, 12],
    [2023, 'post_deo', 1080, 'dark', 'Black - Non-Latino', 1, '18', 20, 45, 9, 3],
    [2023, 'post_deo', 1095, 'daylight', 'White - Non-Latino', 0, '18', 50, 50, 2, 6],
    [2023, 'post_deo', 1095, 'dark', 'White - Non-Latino', 1, '18', 5, 11, 1, 1],
  ],
  models: {},
}

describe('motoristsByRace', () => {
  it('sums motorists, not stops', () => {
    expect(motoristsByRace(cube)).toEqual({
      'Black - Non-Latino': 145,
      'White - Non-Latino': 61,
    })
  })
})

describe('pctMotoristsInGroups', () => {
  it('uses motorists as the denominator, matching the paper figure 3', () => {
    const pct = pctMotoristsInGroups(cube)
    expect(pct['Black - Non-Latino']).toBeCloseTo((45 / 145) * 100, 5)
    expect(pct['White - Non-Latino']).toBeCloseTo((11 / 61) * 100, 5)
  })
})

describe('frisksAndTickets', () => {
  it('reports per-occupant rates split by solo and group', () => {
    const r = frisksAndTickets(cube, 'Black - Non-Latino')
    expect(r.solo.friskRate).toBeCloseTo(10, 5)
    expect(r.solo.ticketRate).toBeCloseTo(12, 5)
    expect(r.group.friskRate).toBeCloseTo((9 / 45) * 100, 5)
    expect(r.group.ticketRate).toBeCloseTo((3 / 45) * 100, 5)
  })
})

describe('groupTravelByClockBin', () => {
  it('splits group-travel share by lighting within each bin', () => {
    const series = groupTravelByClockBin(cube, 'Black - Non-Latino')
    expect(series).toEqual([
      { clockBin: 1080, lighting: 'daylight', pctGroupStops: 0 },
      { clockBin: 1080, lighting: 'dark', pctGroupStops: 100 },
    ])
  })
})

describe('restrictToYears', () => {
  const sampleModel: VeilModel = {
    coef: 0.5,
    se: 0.1,
    p: 0.01,
    n: 1000,
    odds_ratio: 1.6,
    spec: 'model_1',
    converged: true,
    seasonality_weight: false,
    paper_coef: 0.4,
  }

  const multiYearCube: VeilCube = {
    version: 1,
    dimensions: ['year', 'era', 'clock_bin', 'lighting', 'party_race', 'group_travel', 'district'],
    measures: ['n_stops', 'n_motorists', 'n_frisked', 'n_ticketed'],
    rows: [
      [2020, 'pre_deo', 1080, 'daylight', 'Black - Non-Latino', 0, '18', 5, 5, 1, 1],
      [2021, 'post_deo', 1080, 'daylight', 'Black - Non-Latino', 0, '18', 100, 100, 10, 12],
      [2023, 'post_deo', 1080, 'dark', 'Black - Non-Latino', 1, '18', 20, 45, 9, 3],
      [2024, 'post_deo', 1095, 'daylight', 'White - Non-Latino', 0, '18', 50, 50, 2, 6],
      [2025, 'post_deo', 1095, 'dark', 'White - Non-Latino', 1, '18', 5, 11, 1, 1],
    ],
    models: { 'driver_is_black.model_1': sampleModel },
  }

  it('keeps only rows with year within the inclusive range', () => {
    const restricted = restrictToYears(multiYearCube, 2021, 2024)
    expect(restricted.rows).toEqual([
      [2021, 'post_deo', 1080, 'daylight', 'Black - Non-Latino', 0, '18', 100, 100, 10, 12],
      [2023, 'post_deo', 1080, 'dark', 'Black - Non-Latino', 1, '18', 20, 45, 9, 3],
      [2024, 'post_deo', 1095, 'daylight', 'White - Non-Latino', 0, '18', 50, 50, 2, 6],
    ])
  })

  it('returns a distinct object and does not mutate the input', () => {
    const originalRowsLength = multiYearCube.rows.length
    const restricted = restrictToYears(multiYearCube, 2021, 2024)
    expect(restricted).not.toBe(multiYearCube)
    expect(restricted.rows).not.toBe(multiYearCube.rows)
    expect(multiYearCube.rows.length).toBe(originalRowsLength)
  })

  it('carries models through unchanged', () => {
    const restricted = restrictToYears(multiYearCube, 2021, 2024)
    expect(restricted.models).toEqual(multiYearCube.models)
  })

  it('yields zero rows without throwing for an empty range', () => {
    const restricted = restrictToYears(multiYearCube, 1999, 2000)
    expect(restricted.rows).toEqual([])
  })

  it('composes with pctMotoristsInGroups to reproduce the paper figure (~27.2% for Black motorists)', () => {
    // Hand-built to mirror the real cube's magnitude (see task-7 report:
    // 26,761 solo + 10,020 group = 36,781 motorists, 27.24% grouped),
    // scaled down and placed both inside and outside the 2021-2024
    // window, so this test exercises restrictToYears + the selector
    // together rather than the selector alone.
    const figureCube: VeilCube = {
      version: 1,
      dimensions: ['year', 'era', 'clock_bin', 'lighting', 'party_race', 'group_travel', 'district'],
      measures: ['n_stops', 'n_motorists', 'n_frisked', 'n_ticketed'],
      rows: [
        // outside the window: must be excluded, or this would fail
        [2020, 'pre_deo', 1080, 'daylight', 'Black - Non-Latino', 0, '18', 900, 900, 0, 0],
        [2020, 'pre_deo', 1080, 'dark', 'Black - Non-Latino', 1, '18', 900, 900, 0, 0],
        // inside the window: 728 solo + 272 group = 1000, 27.2% grouped
        [2022, 'post_deo', 1080, 'daylight', 'Black - Non-Latino', 0, '18', 728, 728, 0, 0],
        [2023, 'post_deo', 1080, 'dark', 'Black - Non-Latino', 1, '18', 272, 272, 0, 0],
      ],
      models: {},
    }
    const restricted = restrictToYears(figureCube, 2021, 2024)
    const pct = pctMotoristsInGroups(restricted)
    expect(pct['Black - Non-Latino']).toBeCloseTo(27.2, 5)
  })
})

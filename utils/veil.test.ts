import { describe, expect, it } from 'vitest'
import {
  frisksAndTickets,
  groupTravelByClockBin,
  motoristsByRace,
  pctMotoristsInGroups,
  type VeilCube,
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

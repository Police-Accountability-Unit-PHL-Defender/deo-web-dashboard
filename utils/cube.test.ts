import { describe, it, expect } from 'vitest'
import {
  Cube,
  locationPredicate,
  sumMeasure,
  groupSum,
  groupTupleSum,
  locationDistrict,
  groupSumByDistrict,
  groupAllMeasuresByDistrict,
  pct,
  olsTrendline,
} from './cube'

// Tiny fixture cube. Dimensions match the real stops cube.
const fixture: Cube = {
  version: 1,
  dimensions: ['quarter', 'location', 'race', 'gender', 'age_range'],
  measures: ['n_stopped', 'n_searched'],
  rows: [
    // quarter, location, race, gender, age_range, n_stopped, n_searched
    ['2019-Q1', '22-1', 'Black', 'Male', '25-34', 10, 1],
    ['2019-Q2', '22-1', 'Black', 'Female', '25-34', 5, 0],
    ['2019-Q1', '22-2', 'White', 'Male', '35-44', 3, 0],
    ['2020-Q1', '01-1', 'Black', 'Male', '18-24', 7, 2],
    ['2020-Q1', '17-3', 'White', 'Female', '18-24', 2, 0],
  ],
}

describe('locationPredicate', () => {
  it('matches everything for "*"', () => {
    const p = locationPredicate('*')
    expect(p('22-1')).toBe(true)
    expect(p('01-1')).toBe(true)
  })
  it('matches a bare district by prefix', () => {
    const p = locationPredicate('22')
    expect(p('22-1')).toBe(true)
    expect(p('22-2')).toBe(true)
    expect(p('01-1')).toBe(false)
  })
  it('expands a division to its districts', () => {
    const p = locationPredicate('SPD') // 01, 03, 17
    expect(p('01-1')).toBe(true)
    expect(p('17-3')).toBe(true)
    expect(p('22-1')).toBe(false)
  })
  it('matches a full PSA exactly', () => {
    const p = locationPredicate('22-1')
    expect(p('22-1')).toBe(true)
    expect(p('22-2')).toBe(false)
  })
})

describe('sumMeasure', () => {
  it('sums across all rows when unfiltered', () => {
    expect(sumMeasure(fixture, 'n_stopped')).toBe(27)
  })
  it('filters by location', () => {
    expect(sumMeasure(fixture, 'n_stopped', { location: '22' })).toBe(18)
    expect(sumMeasure(fixture, 'n_stopped', { location: '22-1' })).toBe(15)
    expect(sumMeasure(fixture, 'n_stopped', { location: 'SPD' })).toBe(9)
  })
  it('filters by quarter range', () => {
    expect(
      sumMeasure(fixture, 'n_stopped', {
        startQuarter: '2019-Q1',
        endQuarter: '2019-Q4',
      }),
    ).toBe(18)
    expect(
      sumMeasure(fixture, 'n_stopped', { startQuarter: '2020-Q1' }),
    ).toBe(9)
  })
  it('filters by single race', () => {
    expect(sumMeasure(fixture, 'n_stopped', { race: 'Black' })).toBe(22)
  })
  it('filters by multiple races', () => {
    expect(
      sumMeasure(fixture, 'n_stopped', { race: ['Black', 'White'] }),
    ).toBe(27)
    expect(sumMeasure(fixture, 'n_stopped', { race: ['White'] })).toBe(5)
  })
})

describe('groupSum', () => {
  it('groups by race', () => {
    const out = groupSum(fixture, 'race', 'n_stopped')
    expect(out).toEqual([
      { key: 'Black', value: 22 },
      { key: 'White', value: 5 },
    ])
  })
  it('groups by quarter with a location filter', () => {
    const out = groupSum(fixture, 'quarter', 'n_stopped', { location: '22' })
    expect(out).toEqual([
      { key: '2019-Q1', value: 13 },
      { key: '2019-Q2', value: 5 },
    ])
  })
})

describe('groupTupleSum', () => {
  it('groups by (race, gender) sorted desc', () => {
    const out = groupTupleSum(fixture, ['race', 'gender'], 'n_stopped')
    expect(out[0]).toEqual({ keys: ['Black', 'Male'], value: 17 })
    expect(out.map((r) => r.value)).toEqual([17, 5, 3, 2])
  })
})

describe('locationDistrict', () => {
  it('extracts the district prefix', () => {
    expect(locationDistrict('22-1')).toBe('22')
    expect(locationDistrict('01-12')).toBe('01')
  })
  it('returns the value itself when there is no dash', () => {
    expect(locationDistrict('22')).toBe('22')
  })
})

describe('groupSumByDistrict', () => {
  it('sums measure per district', () => {
    const out = groupSumByDistrict(fixture, 'n_stopped')
    expect(out).toEqual([
      { district: '01', value: 7 },
      { district: '17', value: 2 },
      { district: '22', value: 18 },
    ])
  })
  it('applies filter options', () => {
    const out = groupSumByDistrict(fixture, 'n_stopped', { race: 'Black' })
    expect(out).toEqual([
      { district: '01', value: 7 },
      { district: '22', value: 15 },
    ])
  })
})

describe('groupAllMeasuresByDistrict', () => {
  it('returns every measure per district in one pass', () => {
    const out = groupAllMeasuresByDistrict(fixture)
    const byDist = Object.fromEntries(out.map((r) => [r.district, r.measures]))
    expect(byDist['22']).toEqual({ n_stopped: 18, n_searched: 1 })
    expect(byDist['01']).toEqual({ n_stopped: 7, n_searched: 2 })
    expect(byDist['17']).toEqual({ n_stopped: 2, n_searched: 0 })
  })
})

describe('pct', () => {
  it('computes safe rounded percentages', () => {
    expect(pct(1, 4)).toBe(25)
    expect(pct(1, 3)).toBe(33.3)
    expect(pct(0, 0)).toBe(0)
    expect(pct(5, 0)).toBe(0)
  })
})

describe('olsTrendline', () => {
  it('fits a straight line through y = 2x + 1', () => {
    const t = olsTrendline([
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ])!
    expect(t.slope).toBeCloseTo(2, 6)
    expect(t.intercept).toBeCloseTo(1, 6)
    expect(t.predict(10)).toBeCloseTo(21, 6)
  })
  it('returns null when there is no variance in x', () => {
    expect(
      olsTrendline([
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ]),
    ).toBeNull()
  })
})

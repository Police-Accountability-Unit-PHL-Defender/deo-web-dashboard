import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  frisksAndTickets,
  groupTravelByClockBin,
  motoristsByRace,
  pctMotoristsInGroups,
  pctStopsInMajorityWhiteDistricts,
  REPLICATION_YEARS,
  selectClockBinPairs,
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
      { clockBin: 1080, lighting: 'daylight', pctGroupStops: 0, stops: 100 },
      { clockBin: 1080, lighting: 'dark', pctGroupStops: 100, stops: 20 },
    ])
  })

  it('reports the stop count behind each point, so thin bins can be suppressed', () => {
    // n_stops, not n_motorists: the 1080/dark row is 20 stops carrying 45
    // motorists. A caller thresholding on `stops` must see 20.
    const series = groupTravelByClockBin(cube, 'Black - Non-Latino')
    expect(series.map((p) => p.stops)).toEqual([100, 20])
  })
})

describe('selectClockBinPairs', () => {
  const pt = (clockBin: number, lighting: string, stops: number, pctGroupStops: number) =>
    ({ clockBin, lighting, stops, pctGroupStops })

  it('keeps a bin only when both lighting states clear the threshold', () => {
    const sel = selectClockBinPairs([
      pt(1080, 'daylight', 500, 30),
      pt(1080, 'dark', 400, 20),
    ], 200)
    expect(sel.kept.map((b) => b[0].clockBin)).toEqual([1080])
    expect(sel.suppressed).toEqual([])
  })

  it('drops the whole bin when either side is thin, and says which side', () => {
    const sel = selectClockBinPairs([
      pt(1080, 'daylight', 500, 30),
      pt(1080, 'dark', 40, 20),
    ], 200)
    expect(sel.kept).toEqual([])
    expect(sel.suppressed).toEqual([
      { clockBin: 1080, reason: 'thin', thin: [{ lighting: 'dark', stops: 40 }] },
    ])
  })

  // The bug this closes: `every`/`some` over a one-element array made a
  // single-lighting bin look thick enough, so it drew as a lone unpaired bar,
  // counted in shownBins, and — having nothing to beat — never counted in
  // daylightHigherBins, quietly deflating the "12 of the 13 bins" sentence.
  it('drops a bin observed in only one lighting state, however thick', () => {
    const sel = selectClockBinPairs([pt(1080, 'daylight', 100000, 30)], 200)
    expect(sel.kept).toEqual([])
    expect(sel.suppressed).toEqual([
      { clockBin: 1080, reason: 'unpaired', present: ['daylight'] },
    ])
  })

  it('reports unpaired ahead of thin when a lone bar is also thin', () => {
    const sel = selectClockBinPairs([pt(1080, 'dark', 5, 30)], 200)
    expect(sel.suppressed).toEqual([
      { clockBin: 1080, reason: 'unpaired', present: ['dark'] },
    ])
  })

  it('counts only kept bins where daylight sits above dark', () => {
    const sel = selectClockBinPairs([
      pt(1080, 'daylight', 500, 30), pt(1080, 'dark', 500, 20),  // daylight higher
      pt(1095, 'daylight', 500, 10), pt(1095, 'dark', 500, 40),  // dark higher
      pt(1110, 'daylight', 500, 25), pt(1110, 'dark', 500, 25),  // equal: not higher
      pt(1125, 'daylight', 500, 90), pt(1125, 'dark', 40, 10),   // dropped, thin
    ], 200)
    expect(sel.kept.length).toBe(3)
    expect(sel.daylightHigherBins).toBe(1)
  })

  it('returns bins in ascending clock order', () => {
    const sel = selectClockBinPairs([
      pt(1110, 'daylight', 500, 30), pt(1110, 'dark', 500, 20),
      pt(1080, 'daylight', 500, 30), pt(1080, 'dark', 500, 20),
    ], 200)
    expect(sel.kept.map((b) => b[0].clockBin)).toEqual([1080, 1110])
  })

  it('is threshold-inclusive: exactly the minimum is thick enough', () => {
    const sel = selectClockBinPairs([
      pt(1080, 'daylight', 200, 30),
      pt(1080, 'dark', 200, 20),
    ], 200)
    expect(sel.kept.length).toBe(1)
  })
})

describe('pctStopsInMajorityWhiteDistricts', () => {
  // District 18 is 25.8% white, district 05 is 75.3% white in the real
  // districts.json; only the latter clears the >50% rule.
  const demographics = { '18': { whiteness: 25.8 }, '05': { whiteness: 75.3 } }

  const twoDistrictCube: VeilCube = {
    ...cube,
    rows: [
      [2023, 'post_deo', 1080, 'daylight', 'Black - Non-Latino', 0, '18', 75, 75, 0, 0],
      [2023, 'post_deo', 1080, 'daylight', 'Black - Non-Latino', 0, '05', 25, 25, 0, 0],
      [2023, 'post_deo', 1080, 'daylight', 'White - Non-Latino', 0, '05', 90, 90, 0, 0],
    ],
  }

  it('counts stops, not motorists, and only the requested race', () => {
    const r = pctStopsInMajorityWhiteDistricts(twoDistrictCube, 'Black - Non-Latino', demographics)
    expect(r.stops).toBe(100)
    expect(r.pct).toBeCloseTo(25, 5)
  })

  it('excludes districts absent from the demographics table from both sides', () => {
    // '77' is a real PPD district code with no entry in districts.json.
    const withUnknown: VeilCube = {
      ...twoDistrictCube,
      rows: [
        ...twoDistrictCube.rows,
        [2023, 'post_deo', 1080, 'daylight', 'Black - Non-Latino', 0, '77', 400, 400, 0, 0],
      ],
    }
    const r = pctStopsInMajorityWhiteDistricts(withUnknown, 'Black - Non-Latino', demographics)
    expect(r.stops).toBe(500)
    expect(r.classifiedStops).toBe(100)
    // Unchanged by the 400 unclassifiable stops, rather than diluted to 5%.
    expect(r.pct).toBeCloseTo(25, 5)
  })

  it('reads the real cube, where the district dimension must not be a float string', () => {
    const realCube: VeilCube = JSON.parse(readFileSync('public/cubes/veil.json', 'utf8'))
    const studyCube = restrictToYears(realCube, REPLICATION_YEARS.from, REPLICATION_YEARS.to)
    const real = JSON.parse(readFileSync('public/cubes/districts.json', 'utf8'))
    const r = pctStopsInMajorityWhiteDistricts(studyCube, 'Black - Non-Latino', real)
    // Every stop must be classifiable. If the cube shipped '12.0'-style
    // district codes again, none of them would key against districts.json
    // and this would collapse to 0.
    expect(r.classifiedStops).toBe(r.stops)
    expect(r.stops).toBe(31209)
    expect(r.pct).toBeCloseTo(6.95, 2)
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
    models: { 'party_is_black.model_1': sampleModel },
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

// -----------------------------------------------------------------
// Real-cube regression tests. These load the actual built cube from
// disk (mirroring utils/reasons.test.ts) and pin the published
// figures. If the Python builder ever changes a unit convention,
// introduces a bad join, or shifts a denominator, these fail — the
// synthetic-fixture tests above cannot catch that because they don't
// touch the real data.
describe('real cube (public/cubes/veil.json), restricted to the paper study window', () => {
  const realCube: VeilCube = JSON.parse(readFileSync('public/cubes/veil.json', 'utf8'))
  const studyCube = restrictToYears(realCube, REPLICATION_YEARS.from, REPLICATION_YEARS.to)

  it('reproduces the published motorist counts by race', () => {
    const counts = motoristsByRace(studyCube)
    expect(counts['Black - Non-Latino']).toBe(36781)
    expect(counts['White - Non-Latino']).toBe(5529)
  })

  it('reproduces the published group-travel share by race', () => {
    const pct = pctMotoristsInGroups(studyCube)
    expect(pct['Black - Non-Latino']).toBeCloseTo(27.24, 2)
    expect(pct['White - Non-Latino']).toBeCloseTo(5.32, 2)
  })

  it('reproduces the published frisk and ticket rates for Black motorists', () => {
    const r = frisksAndTickets(studyCube, 'Black - Non-Latino')
    expect(r.solo.friskRate).toBeCloseTo(7.14, 2)
    expect(r.solo.ticketRate).toBeCloseTo(11.07, 2)
    expect(r.group.friskRate).toBeCloseTo(19.31, 2)
    expect(r.group.ticketRate).toBeCloseTo(7.24, 2)
  })

  it('exposes stop counts that identify the two truncated clock bins', () => {
    // The sample window is 17:08-20:35, so the first dark bin and the last
    // daylight bin are clipped and rest on very few stops. The page
    // suppresses bins under 200 stops; this pins down that exactly those two
    // bins fall below it, so the threshold cannot silently start dropping
    // real signal after a cube rebuild.
    const series = groupTravelByClockBin(studyCube, 'Black - Non-Latino')
    const thin = series.filter((p) => p.stops < 200)
    expect(thin.map((p) => [p.clockBin, p.lighting])).toEqual([
      [1020, 'dark'],
      [1230, 'daylight'],
    ])
    for (const point of series) expect(point.stops).toBeGreaterThan(0)
  })

  it('carries measured stop-time rounding, which the page states instead of asserting a figure', () => {
    // These cannot be recomputed from `rows` (clock_bin is 15-minute), so if
    // the pipeline stops emitting them the page silently loses the numbers
    // behind its "recorded stop times are rounded" caveat.
    const rounding = realCube.time_rounding
    expect(rounding).toBeDefined()
    expect(rounding!.n).toBe(36587)
    // Heaping is real and large: chance alone would give 20% and 6.7%.
    expect(rounding!.pct_multiple_of_5).toBeGreaterThan(40)
    expect(rounding!.pct_multiple_of_15).toBeGreaterThan(15)
    expect(rounding!.pct_multiple_of_5).toBeGreaterThan(rounding!.pct_multiple_of_15)
  })

  it('fits the four headline models with negative coefficients, each carrying its diagnostics', () => {
    const headlineKeys = [
      'party_is_black.model_1',
      'party_is_black.model_2',
      'has_black_passenger.model_1',
      'has_black_passenger.model_2',
    ]
    for (const key of headlineKeys) {
      const model = realCube.models[key]
      expect(model, `missing model ${key}`).toBeDefined()
      expect(model.coef, `${key} coef should be negative`).toBeLessThan(0)
      expect(model).toHaveProperty('collapsed_units')
      expect(model).toHaveProperty('min_unit_count')
      expect(model).toHaveProperty('seasonality_weight')
    }
  })
})

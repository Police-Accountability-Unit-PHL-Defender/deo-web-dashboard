import { describe, expect, it } from 'vitest'
import { capCube, cubeQuarters, reportingPeriods } from './reportingPeriods'
import type { Cube } from './cube'

const quarters = ['2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2']
const cube: Cube = { version: 1, dimensions: ['location', 'quarter'], measures: ['n_stopped'],
  rows: quarters.map((q, i) => ['01-1', q, i + 1]) }

describe('published reporting periods', () => {
  it('keeps the last available quarter when a refresh is missed, even across New Year', () => {
    for (const ceiling of ['2026-Q3', '2026-Q4', '2027-Q1']) {
      expect(reportingPeriods(quarters, ceiling)).toEqual({ available: quarters, latest: '2026-Q2', completeYears: [2025] })
    }
  })
  it('caps defaults and options at a backward pin', () => {
    expect(reportingPeriods(quarters, '2026-Q1')).toEqual({
      available: quarters.slice(0, -1), latest: '2026-Q1', completeYears: [2025],
    })
    expect(reportingPeriods(quarters, '2025-Q3').completeYears).toEqual([])
  })
  it('does not treat a year with an interior missing quarter as complete', () => {
    expect(reportingPeriods(quarters.filter(q => q !== '2025-Q2'), '2027-Q1').completeYears).toEqual([])
  })
  it('advances only when the missing data arrives', () => {
    expect(reportingPeriods([...quarters, '2026-Q3'], '2026-Q3').latest).toBe('2026-Q3')
    expect(reportingPeriods([...quarters, '2026-Q3', '2026-Q4'], '2027-Q1').completeYears).toEqual([2025, 2026])
  })
  it('indexes distinct quarters by dimension name', () => {
    expect(cubeQuarters({ ...cube, rows: [...cube.rows].reverse().concat(cube.rows) })).toEqual(quarters)
  })
  it('excludes future rows from calculations without mutating the original cube', () => {
    const capped = capCube(cube, '2026-Q1')
    expect(capped.rows.reduce((sum, row) => sum + Number(row[2]), 0)).toBe(15)
    expect(cube.rows).toHaveLength(6)
    expect(cubeQuarters(capped)).toEqual(quarters.slice(0, -1))
    expect(capCube(cube, '2027-Q1')).toBe(cube)
  })
})

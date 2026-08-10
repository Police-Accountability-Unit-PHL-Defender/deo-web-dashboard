import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { majorityWhiteDisparity } from './neighborhoods'
import type { Cube } from './cube'

const cube: Cube = JSON.parse(readFileSync('public/cubes/stops.json', 'utf8'))
const demographics = JSON.parse(readFileSync('public/cubes/districts.json', 'utf8'))

describe('majorityWhiteDisparity', () => {
  const result = majorityWhiteDisparity(cube, demographics, '2026-Q2')!

  it('selects districts over 50% white', () => {
    expect(result.districts).toEqual(['01', '03', '05', '06', '07', '08', '09', '26'])
  })

  it('uses the most recent complete calendar year', () => {
    expect(result.year).toBe(2025)
  })

  it('reproduces the published stop counts and ratio', () => {
    expect(result.blackStops).toBe(12686)
    expect(result.whiteStops).toBe(15699)
    expect(result.ratio).toBe(4.5)
  })

  it('produces a finite ratio above 1', () => {
    expect(Number.isFinite(result.ratio)).toBe(true)
    expect(result.ratio).toBeGreaterThan(1)
  })

  it('steps back a year when the trailing year is incomplete', () => {
    expect(majorityWhiteDisparity(cube, demographics, '2025-Q4')!.year).toBe(2025)
    expect(majorityWhiteDisparity(cube, demographics, '2025-Q2')!.year).toBe(2024)
  })

  it('returns null when demographics have not loaded', () => {
    expect(majorityWhiteDisparity(cube, {}, '2026-Q2')).toBeNull()
  })

  it('returns null rather than Infinity when a population is zero', () => {
    const zeroed = { '09': { total: 100, white: 90, black: 0, whiteness: 90 } }
    expect(majorityWhiteDisparity(cube, zeroed, '2026-Q2')).toBeNull()
  })
})

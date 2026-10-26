import { afterEach, describe, expect, it, vi } from 'vitest'
import { Quarter } from '../utils/index'

const quarters = ['2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2']
async function initialize(pin = '', reasons = quarters) {
  const states = new Map<string, unknown>()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2027-01-15T12:00:00Z'))
  vi.stubGlobal('Quarter', Quarter)
  vi.stubGlobal('defineNuxtPlugin', callback => callback)
  vi.stubGlobal('useRuntimeConfig', () => ({ public: {
    pinnedMostRecentQuarter: pin, cubeQuarters: { stops: quarters, reasons },
  } }))
  vi.stubGlobal('useState', (key, init) => {
    if (!states.has(key)) states.set(key, init())
    return { value: states.get(key) }
  })
  const { default: plugin } = await import('./mostRecentQuarter.js')
  plugin()
  return states
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
describe('reporting-period initialization', () => {
  it('keeps the calendar ceiling but stops defaults, options and annual choices at actual data', async () => {
    const state = await initialize()
    expect(state.get('mostRecentQuarter')).toBe('2026-Q4')
    expect(state.get('latestStopsQuarter')).toBe('2026-Q2')
    expect(state.get('stopsQuarters')).toEqual(quarters)
    expect(state.get('deoYears')).toEqual([2025])
  })
  it('honors a backward pin before initializing page selections', async () => {
    const state = await initialize('2026-Q1')
    expect(state.get('mostRecentQuarter')).toBe('2026-Q1')
    expect(state.get('latestStopsQuarter')).toBe('2026-Q1')
    expect(state.get('stopsQuarters')).toEqual(quarters.slice(0, -1))
  })
  it('uses Reasons coverage for its year choices rather than the Stops vintage', async () => {
    const state = await initialize('', ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1'])
    expect(state.get('deoYears')).toEqual([2024])
    expect(state.get('latestStopsQuarter')).toBe('2026-Q2')
  })
})

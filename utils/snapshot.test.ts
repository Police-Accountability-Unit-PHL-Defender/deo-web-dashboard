import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildAnnualSummary } from './snapshot'
import { Quarter, QuarterMonths } from './index'

const cube = JSON.parse(readFileSync('public/cubes/stops.json', 'utf8'))
const Q2_2026 = new Quarter(2026, QuarterMonths['Apr-Jun'])

describe('buildAnnualSummary', () => {
  const s = buildAnnualSummary(cube, Q2_2026)

  it('reports the trailing-year total and monthly average', () => {
    expect(s.text[0]).toContain('From the start of Jul 2025 through the end of Jun 2026')
    expect(s.text[0]).toContain('<span>179,742</span>')
    expect(s.text[0]).toMatch(/<span>14,97[89]<\/span> traffic stops per month/)
  })

  it('reports the Driving Equality change', () => {
    expect(s.text[1]).toBe(
      'traffic stops decreased by <span>3.8%</span> from <span>112,281</span> stops to <span>108,013</span> stops',
    )
  })

  it('reports per-race decreases', () => {
    expect(s.text[2]).toBe(
      'In the year after Driving Equality, Philadelphia police stopped <span>6,323</span> fewer Black drivers and <span>16</span> fewer white drivers, compared to 2021.',
    )
  })

  it('reports the contraband miss rate', () => {
    expect(s.text[3]).toContain('<span>89.4%</span>')
  })

  it('orders races canonically and matches published percentages', () => {
    const stops = s.figures.barplot.data.filter((d) => d.group === '% of traffic stops')
    expect(stops.map((d) => d.Race)).toEqual(['Asian', 'Black', 'Latino', 'White', 'All Other Races'])
    expect(stops.map((d) => d['Percentage (%)'])).toEqual([2.9, 63.4, 13.1, 17.1, 3.4])
  })

  it('emits before/after DEO counts', () => {
    const before = s.figures.barplot3.data.filter((d) => d.group === '# before Driving Equality')
    expect(before.find((d) => d.Race === 'Black')?.['Number of Traffic Stops']).toBe(79789)
    expect(before.find((d) => d.Race === 'Asian')?.['Number of Traffic Stops']).toBe(2425)
  })

  it('shapes rows the way Graph.vue expects', () => {
    const row = s.figures.barplot.data[0]
    expect(Object.keys(row).sort()).toEqual(
      ['Percentage (%)', 'Race', 'annotation', 'group', 'hover_text'].sort(),
    )
    expect(row.hover_text).toEqual(['Asian', '2.9% of traffic stops'])
  })

  it('keeps a trailing .0 on whole-number hover percentages', () => {
    // Regression: hover text must be formatted like Python's `:.1f`, not a
    // plain number interpolation, so a whole-number percentage doesn't lose
    // its decimal (e.g. "68%" instead of "68.0%").
    const after = s.figures.barplot2.data.filter((d) => d.group === '% after Driving Equality')
    const black = after.find((d) => d.Race === 'Black')
    expect(black?.['Percentage (%)']).toBe(68)
    expect(black?.hover_text).toEqual(['After Driving Equality', 'Black', '68.0% of traffic stops'])
  })
})

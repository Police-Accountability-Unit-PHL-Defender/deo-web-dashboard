// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LineGraph from './LineGraph.vue'

const rows = [
  { group: 'Operational', Year: 2022, 'Percentage (%)': 47.0 },
  { group: 'Operational', Year: 2023, 'Percentage (%)': 53.7 },
  { group: 'Operational', Year: 2024, 'Percentage (%)': 54.3 },
  { group: 'Non-operational', Year: 2022, 'Percentage (%)': 53.0 },
  { group: 'Non-operational', Year: 2023, 'Percentage (%)': 46.3 },
  { group: 'Non-operational', Year: 2024, 'Percentage (%)': 45.7 },
]

const factory = (props = {}) =>
  mount(LineGraph, {
    props: {
      graphData: rows,
      axisProperties: { x: 'Year', y: 'Percentage (%)' },
      groupName: 'group',
      groupClasses: {
        Operational: 'stroke-purple fill-purple bg-purple',
        'Non-operational': 'stroke-mint fill-mint bg-mint',
      },
      chartLegend: { Operational: 'Operational violations', 'Non-operational': 'Non-operational violations' },
      yScaleDomainMax: 100,
      dashedFromX: null,
      ...props,
    },
    attachTo: document.body,
  })

describe('LineGraph', () => {
  it('draws one path per series', () => {
    const svg = factory().find('svg')
    const solid = svg.findAll('path').filter((p) => !p.attributes('stroke-dasharray'))
    // Two series, plus however many axis paths d3 leaves behind.
    expect(solid.length).toBeGreaterThanOrEqual(2)
  })

  it('applies each series its own stroke class', () => {
    const html = factory().find('svg').html()
    expect(html).toContain('stroke-purple')
    expect(html).toContain('stroke-mint')
  })

  it('draws a marker for every point', () => {
    expect(factory().findAll('circle')).toHaveLength(rows.length)
  })

  it('renders no dashed segment when dashedFromX is null', () => {
    const dashed = factory().findAll('path').filter((p) => p.attributes('stroke-dasharray'))
    expect(dashed).toHaveLength(0)
  })

  it('dashes the trailing segment of each series when dashedFromX is set', () => {
    const dashed = factory({ dashedFromX: 2024 }).findAll('path').filter((p) => p.attributes('stroke-dasharray'))
    expect(dashed).toHaveLength(2)
  })

  it('renders a legend entry per series', () => {
    const text = factory().text()
    expect(text).toContain('Operational violations')
    expect(text).toContain('Non-operational violations')
  })

  it('renders nothing rather than throwing on empty data', () => {
    expect(() => factory({ graphData: [] })).not.toThrow()
  })
})

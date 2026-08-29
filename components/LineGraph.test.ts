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

// No `attachTo: document.body` here: @vue/test-utils 2.4.x calls
// `app.onUnmount()` when `attachTo` is used, an API Vue only added in 3.4.
// This repo pins vue ^3.3.6, so passing `attachTo` throws
// `TypeError: app.onUnmount is not a function` on unpatched node_modules.
// None of the assertions below need real-document layout — they inspect the
// returned wrapper — so the option is simply omitted rather than worked
// around.
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
  })

// Series line paths carry a `stroke-*` class from `groupClasses`; d3's own
// axis machinery emits `<path class="domain">` elements that don't, so
// filtering on this class is how we isolate "our" paths from axis chrome.
const seriesPaths = (wrapper) =>
  wrapper.find('svg').findAll('path').filter((p) => /stroke-/.test(p.attributes('class') || ''))

// Pulls the (x, y) pairs out of a `d3.line()`-generated `d` attribute
// (default linear curve emits "M x,y L x,y L x,y ..."), so tests can assert
// on how many points a path actually spans, and where its endpoints sit.
const pathCoords = (d) => [...(d ?? '').matchAll(/[ML]([-\d.]+),([-\d.]+)/g)].map(([, x, y]) => [Number(x), Number(y)])

describe('LineGraph', () => {
  it('draws one path per series', () => {
    const wrapper = factory()
    // Exactly two series (Operational, Non-operational); seriesPaths already
    // excludes d3's own axis chrome (e.g. `<path class="domain">`), so this
    // asserts the real count rather than a loose lower bound.
    expect(seriesPaths(wrapper)).toHaveLength(2)
  })

  it('applies each series its own stroke class', () => {
    const html = factory().find('svg').html()
    expect(html).toContain('stroke-purple')
    expect(html).toContain('stroke-mint')
  })

  it('draws a marker for every point', () => {
    expect(factory().findAll('circle')).toHaveLength(rows.length)
  })

  it('draws a vertical interval and two caps for points carrying confidence bounds', () => {
    const withIntervals = rows.map((row) => ({
      ...row,
      ci_lo: row['Percentage (%)'] - 2,
      ci_hi: row['Percentage (%)'] + 2,
    }))
    const wrapper = factory({ graphData: withIntervals })
    expect(wrapper.findAll('line.interval')).toHaveLength(rows.length)
    expect(wrapper.findAll('line.cap-ci_lo')).toHaveLength(rows.length)
    expect(wrapper.findAll('line.cap-ci_hi')).toHaveLength(rows.length)
  })

  it('renders no dashed segment when dashedFromX is null', () => {
    const wrapper = factory()
    const paths = seriesPaths(wrapper)
    const dashed = paths.filter((p) => p.attributes('stroke-dasharray'))
    const solid = paths.filter((p) => !p.attributes('stroke-dasharray'))
    expect(dashed).toHaveLength(0)
    // Every point stays on one undivided solid path per series — nothing is
    // silently dropped by a split that shouldn't be happening.
    expect(solid).toHaveLength(2)
    for (const p of solid) {
      expect(pathCoords(p.attributes('d'))).toHaveLength(3)
    }
  })

  it('dashes the trailing segment of each series, joined at the point before the boundary, when dashedFromX is set', () => {
    const wrapper = factory({ dashedFromX: 2024 })
    const paths = seriesPaths(wrapper)
    const dashed = paths.filter((p) => p.attributes('stroke-dasharray'))
    const solid = paths.filter((p) => !p.attributes('stroke-dasharray'))
    expect(dashed).toHaveLength(2)
    expect(solid).toHaveLength(2)

    for (const cls of ['stroke-purple', 'stroke-mint']) {
      const solidPath = solid.find((p) => p.attributes('class') === cls)
      const dashedPath = dashed.find((p) => p.attributes('class') === cls)
      expect(solidPath).toBeTruthy()
      expect(dashedPath).toBeTruthy()

      const solidCoords = pathCoords(solidPath.attributes('d'))
      const dashedCoords = pathCoords(dashedPath.attributes('d'))
      // Solid spans up to but NOT including the boundary (2022, 2023);
      // dashed spans the boundary and the point before it (2023, 2024). The
      // boundary point (2024) belongs to the dashed path ONLY — if it were
      // drawn on both, the solid path would render a solid line directly
      // under the dashed one in the same colour, and a 4-4 dash over an
      // identical solid line renders as solid, hiding the partial-year cue.
      expect(solidCoords).toHaveLength(2)
      expect(dashedCoords).toHaveLength(2)
      // The dashed path's first point must be the solid path's last point,
      // so the two paths share it and the line reads continuous.
      expect(dashedCoords[0]).toEqual(solidCoords[solidCoords.length - 1])
    }
  })

  it('renders the whole series solid when dashedFromX is not present in the data', () => {
    const wrapper = factory({ dashedFromX: 9999 })
    const paths = seriesPaths(wrapper)
    const dashed = paths.filter((p) => p.attributes('stroke-dasharray'))
    const solid = paths.filter((p) => !p.attributes('stroke-dasharray'))
    expect(dashed).toHaveLength(0)
    expect(solid).toHaveLength(2)
    for (const p of solid) {
      expect(pathCoords(p.attributes('d'))).toHaveLength(3)
    }
  })

  it('dashes the entire series when dashedFromX is the first point', () => {
    const wrapper = factory({ dashedFromX: 2022 })
    const paths = seriesPaths(wrapper)
    const dashed = paths.filter((p) => p.attributes('stroke-dasharray'))
    const solid = paths.filter((p) => !p.attributes('stroke-dasharray'))
    // The first point means "everything from here on is provisional" — the
    // whole series must dash, not render solid as if it were settled.
    expect(solid).toHaveLength(0)
    expect(dashed).toHaveLength(2)
    for (const p of dashed) {
      expect(pathCoords(p.attributes('d'))).toHaveLength(3)
    }
  })

  it('renders a marker but no line path for a single-point series', () => {
    const singlePoint = [
      { group: 'Operational', Year: 2024, 'Percentage (%)': 54.3 },
      { group: 'Non-operational', Year: 2024, 'Percentage (%)': 45.7 },
    ]
    let wrapper
    expect(() => {
      wrapper = factory({ graphData: singlePoint, dashedFromX: 2024 })
    }).not.toThrow()
    expect(seriesPaths(wrapper)).toHaveLength(0)
    expect(wrapper.findAll('circle')).toHaveLength(2)
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

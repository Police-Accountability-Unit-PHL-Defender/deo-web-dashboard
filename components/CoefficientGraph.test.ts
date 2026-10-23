// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CoefficientGraph from './CoefficientGraph.vue'

// Two groups x two x-values. One group sits below zero and one above, so the
// zero line has to fall inside the plotted range rather than at an edge --
// the case `buildYScale`'s hardcoded [0, max] domain cannot represent, and
// the reason this component exists separately from LineGraph.
const estimates = [
  { x: '2024', group: 'Young man', value: -0.19, ciLo: -0.27, ciHi: -0.10 },
  { x: '2025', group: 'Young man', value: -0.19, ciLo: -0.27, ciHi: -0.11 },
  { x: '2024', group: 'Older woman', value: 0.25, ciLo: 0.16, ciHi: 0.33 },
  { x: '2025', group: 'Older woman', value: 0.17, ciLo: 0.09, ciHi: 0.24 },
]

// No `attachTo: document.body`: @vue/test-utils 2.4.x calls `app.onUnmount()`
// when it is used, an API Vue only added in 3.4, and this repo pins vue
// ^3.3.6. See the identical note in LineGraph.test.ts.
const factory = (props = {}) =>
  mount(CoefficientGraph, {
    props: {
      estimates,
      axisProperties: { x: 'Year', y: 'Effect of darkness' },
      groupClasses: {
        'Young man': 'stroke-purple fill-purple bg-purple',
        'Older woman': 'stroke-mint fill-mint bg-mint',
      },
      ...props,
    },
  })

describe('CoefficientGraph', () => {
  it('keeps compact horizontal intervals on a shared scale with zero visible', async () => {
    const wrapper = factory({ horizontal: true, estimates: [estimates[0], estimates[2]] })
    expect(Number(wrapper.find('svg').attributes('height'))).toBeLessThan(180)
    const whiskers = wrapper.findAll('.ci-whisker')
    expect(whiskers).toHaveLength(2)
    for (const whisker of whiskers) {
      expect(whisker.attributes('y1')).toBe(whisker.attributes('y2'))
      expect(Number(whisker.attributes('x1'))).toBeLessThan(Number(whisker.attributes('x2')))
    }
    const zero = Number(wrapper.find('.zero-line').attributes('x1'))
    expect(Number(whiskers[0].attributes('x2'))).toBeLessThan(zero)
    expect(Number(whiskers[1].attributes('x1'))).toBeGreaterThan(zero)
    expect(wrapper.findAll('[tabindex="0"]')).toHaveLength(2)
    await wrapper.find('[tabindex="0"]').trigger('focus')
    const tooltip = wrapper.find('.compact-tooltip')
    expect(tooltip.findAll('br')).toHaveLength(1)
    expect(tooltip.text()).toContain('−0.19 pp')
    expect(tooltip.text()).toContain('95% interval: −0.27 to −0.10')
    expect(tooltip.attributes('style')).toContain('visibility: visible')
  })

  it('draws a marker and a confidence whisker for every estimate', () => {
    const wrapper = factory()
    expect(wrapper.findAll('circle')).toHaveLength(estimates.length)
    expect(wrapper.findAll('line.ci-whisker')).toHaveLength(estimates.length)
  })

  it('draws exactly one zero reference line', () => {
    expect(factory().findAll('line.zero-line')).toHaveLength(1)
  })

  it('optionally connects estimates within each group', () => {
    expect(factory().findAll('path.estimate-line')).toHaveLength(0)
    expect(factory({ connectPoints: true }).findAll('path.estimate-line')).toHaveLength(2)
  })

  it('places the zero line inside the plotted range when estimates straddle zero', () => {
    // A zero line pinned to the top or bottom edge would read as "every
    // effect is on one side of zero", inverting the chart's whole message.
    const wrapper = factory()
    const zeroY = Number(wrapper.find('line.zero-line').attributes('y1'))
    const whiskerYs = wrapper.findAll('line.ci-whisker').flatMap((w) => [
      Number(w.attributes('y1')),
      Number(w.attributes('y2')),
    ])
    expect(zeroY).toBeGreaterThan(Math.min(...whiskerYs))
    expect(zeroY).toBeLessThan(Math.max(...whiskerYs))
  })

  it('accepts a shared y-domain so related charts use the same visual scale', () => {
    const wrapper = factory({ yDomain: [-1, 1] })
    const zeroY = Number(wrapper.find('line.zero-line').attributes('y1'))
    expect(zeroY).toBeCloseTo((75 + 320) / 2)
  })

  it('distinguishes an exceptional year without hiding its estimate or interval', () => {
    const wrapper = factory({
      connectPoints: true,
      estimates: [
        { x: '2019', group: 'Young man', value: -1, ciLo: -2, ciHi: 0 },
        { x: '2020', group: 'Young man', value: -2, ciLo: -3, ciHi: -1, caution: true },
        { x: '2021', group: 'Young man', value: -1, ciLo: -2, ciHi: 0 },
      ],
    })
    expect(wrapper.findAll('circle')).toHaveLength(3)
    expect(wrapper.findAll('.ci-whisker')).toHaveLength(3)
    expect(wrapper.findAll('circle.fill-neutral-600')).toHaveLength(1)
    expect(wrapper.findAll('path.caution-line')).toHaveLength(2)
    for (const path of wrapper.findAll('path.caution-line')) {
      expect(path.attributes('stroke-dasharray')).toBe('4 4')
    }
  })

  it('separates same-year series horizontally so their whiskers do not overlap', () => {
    // Four series at one x would otherwise draw on top of each other.
    const wrapper = factory()
    const xs = wrapper
      .findAll('line.ci-whisker')
      .map((w) => Number(w.attributes('x1')))
    expect(new Set(xs).size).toBe(estimates.length)
  })

  it('orients each whisker from its lower bound to its upper bound', () => {
    // y is inverted in SVG, so the lower bound must have the LARGER y.
    const wrapper = factory()
    for (const whisker of wrapper.findAll('line.ci-whisker')) {
      const y1 = Number(whisker.attributes('y1'))
      const y2 = Number(whisker.attributes('y2'))
      expect(y1).toBeGreaterThan(y2)
    }
  })

  it('renders nothing and does not throw when every year is deselected', () => {
    const wrapper = factory({ estimates: [] })
    expect(wrapper.findAll('circle')).toHaveLength(0)
    expect(wrapper.findAll('line.ci-whisker')).toHaveLength(0)
  })

  it('renders a legend entry per group when one is supplied', () => {
    const wrapper = factory({
      chartLegend: { 'Young man': 'Young man (18-29)', 'Older woman': 'Older woman (30+)' },
    })
    expect(wrapper.text()).toContain('Young man (18-29)')
    expect(wrapper.text()).toContain('Older woman (30+)')
  })

  it('draws an event marker between two categories only when asked', () => {
    expect(factory().findAll('.event-marker')).toHaveLength(0)
    const wrapper = factory({ marker: { after: '2024', label: 'Policy' } })
    const line = wrapper.find('.event-marker')
    const ticks = wrapper.findAll('circle').slice(0, 2).map(c => Number(c.attributes('cx')))
    expect(Number(line.attributes('x1'))).toBeGreaterThan(Math.min(...ticks))
    expect(Number(line.attributes('x1'))).toBeLessThan(Math.max(...ticks))
    expect(wrapper.find('.event-marker-label').text()).toBe('Policy')
    // An unknown or final category has no gap after it to mark.
    expect(factory({ marker: { after: '2025', label: 'x' } }).findAll('.event-marker')).toHaveLength(0)
  })

  it('can draw a level series without whiskers or a forced zero', () => {
    const levels = [
      { x: '2024', group: 'Daylight', value: 80, ciLo: 80, ciHi: 80 },
      { x: '2025', group: 'Daylight', value: 81, ciLo: 81, ciHi: 81 },
    ]
    const wrapper = factory({ estimates: levels, showIntervals: false, includeZero: false })
    expect(wrapper.findAll('circle')).toHaveLength(2)
    expect(wrapper.findAll('.ci-whisker')).toHaveLength(0)
    expect(wrapper.findAll('.zero-line')).toHaveLength(0)
    expect(wrapper.find('svg').attributes('aria-label')).not.toContain('confidence')
    // Default behaviour is unchanged: zero stays in the domain and is drawn.
    expect(factory({ estimates: levels }).findAll('.zero-line')).toHaveLength(1)
  })

  it('stacks paired series on the same x when dodge is off', () => {
    const cx = (wrapper) => wrapper.findAll('circle').filter(c => c.attributes('cy') !== undefined)
      .map(c => Number(c.attributes('cx')))
    const dodged = cx(factory())
    expect(new Set(dodged).size).toBe(4)
    const stacked = cx(factory({ dodge: false }))
    expect(new Set(stacked).size).toBe(2)
  })

  it('hovers by column with a vertical guide when columnHover is given', async () => {
    const wrapper = factory({ dodge: false, columnHover: (x, pts) => [x, `${pts.length} series`] })
    const columns = wrapper.findAll('.hover-column')
    expect(columns).toHaveLength(2)
    const guide = wrapper.find('.hover-guide')
    expect(guide.attributes('style')).toContain('hidden')
    await columns[1].trigger('mouseover')
    expect(guide.attributes('style')).toContain('visible')
    expect(Number(guide.attributes('x1'))).toBeCloseTo(Number(wrapper.findAll('circle')[1].attributes('cx')), 0)
    expect(wrapper.find('.tooltip').html()).toContain('2025<br>2 series')
    await columns[1].trigger('mouseleave')
    expect(guide.attributes('style')).toContain('hidden')
    expect(factory().findAll('.hover-column')).toHaveLength(0)
  })
})

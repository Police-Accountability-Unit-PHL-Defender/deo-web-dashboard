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
  it('draws a marker and a confidence whisker for every estimate', () => {
    const wrapper = factory()
    expect(wrapper.findAll('circle')).toHaveLength(estimates.length)
    expect(wrapper.findAll('line.ci-whisker')).toHaveLength(estimates.length)
  })

  it('draws exactly one zero reference line', () => {
    expect(factory().findAll('line.zero-line')).toHaveLength(1)
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
})

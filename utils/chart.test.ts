// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import * as d3 from 'd3'
import { applyLineBreaks, buildYScale, drawYAxis, createTooltip } from './chart'

describe('buildYScale', () => {
  it('maps zero to the bottom of the chart and the max to the top', () => {
    const y = buildYScale(80, 300, 40)
    expect(y(0)).toBe(300)
    expect(y(80)).toBe(40)
  })

  it('honours an explicit domain max over the data max', () => {
    const y = buildYScale(80, 300, 40, 100)
    expect(y(100)).toBe(40)
    expect(y(80)).toBeGreaterThan(40)
  })
})

describe('drawYAxis', () => {
  it('renders ticks and the axis label', () => {
    const svg = d3.select(document.body).append('svg')
    const y = buildYScale(100, 300, 40, 100)
    drawYAxis(svg, y, { marginLeft: 80, marginTop: 40, label: 'Percentage (%)' })
    expect(svg.selectAll('.tick').size()).toBeGreaterThan(0)
    expect(svg.text()).toContain('Percentage (%)')
  })

  // NOTE: the source code's comment above the y-axis block in Graph.vue says
  // "remove the domain line", but no `.select('.domain').remove()` call
  // actually exists (it's present, commented out, in the sibling Plot.vue).
  // The real behaviour is that the `.domain` path IS rendered. This test
  // documents that actual contract rather than the stale comment's intent —
  // asserting removal here would be an "improvement" that regresses all
  // eight charts once Graph.vue consumes this function.
  it('does not remove the domain line (matches existing Graph.vue behaviour)', () => {
    const svg = d3.select(document.body).append('svg')
    const y = buildYScale(100, 300, 40, 100)
    drawYAxis(svg, y, { marginLeft: 80, marginTop: 40, label: 'Percentage (%)' })
    expect(svg.select('.domain').empty()).toBe(false)
  })
})

describe('applyLineBreaks', () => {
  it('returns the string unchanged when it has no break marker', () => {
    expect(applyLineBreaks('Percentage (%)')).toBe('Percentage (%)')
  })

  it('inserts a literal newline for known long axis labels', () => {
    expect(applyLineBreaks('Number of Traffic Stops')).toBe('Number of\nTraffic Stops')
    expect(applyLineBreaks('Contraband Hit Rate (%)')).toBe('Contraband\nHit Rate (%)')
  })

  it('returns District unchanged', () => {
    expect(applyLineBreaks('District')).toBe('District')
  })
})

describe('createTooltip', () => {
  // NOTE: Graph.vue's real showTooltip/hideTooltip toggle CSS `visibility`,
  // not `opacity` (there is no opacity manipulation anywhere in the tooltip
  // closure). The brief's illustrative test asserted on `style.opacity`;
  // that doesn't match the real contract, so — per the same instruction
  // given for applyLineBreaks — this asserts the actual behaviour instead
  // of a value that would silently change what eight live tooltips do.
  it('shows, moves and hides without throwing', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    const tip = createTooltip(div, { width: 400, height: 300 })
    tip.show('<b>42%</b>')
    expect(div.innerHTML).toContain('42%')
    expect(div.style.visibility).toBe('visible')
    tip.hide()
    expect(div.style.visibility).toBe('hidden')
  })

  it('moves the tooltip based on the mouse position within the given size', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    const tip = createTooltip(div, { width: 400, height: 300 })
    tip.move({ offsetX: 10, offsetY: 10 })
    expect(div.style.left).toBe('10px')
    expect(div.style.top).toBe('18px')
  })

  // Pins the fix-round-1 regression: Graph.vue's real `width`/`height` are
  // NOT any container's measured client box (see the comment on
  // createTooltip in chart.ts — `width` has a `minimumContainerWidth` floor,
  // routinely 1080 on charts inside an overflow-x-auto scroller, and
  // `height` is the constant 380 regardless of how the SVG scales down).
  it('anchors using the given size for a chart much larger than a typical viewport', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    const tip = createTooltip(div, { width: 1080, height: 380 })

    tip.move({ offsetX: 200, offsetY: 100 })

    // 200 < 540 (half of 1080) and 100 < 190 (half of 380), so it must
    // anchor top-left, not flip to right/bottom.
    expect(div.style.left).toBe('200px')
    expect(div.style.top).toBe('108px')
    expect(div.style.right).toBe('initial')
    expect(div.style.bottom).toBe('initial')
  })
})

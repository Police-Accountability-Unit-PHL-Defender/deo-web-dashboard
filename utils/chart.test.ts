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
    const container = document.createElement('div')
    const div = document.createElement('div')
    container.appendChild(div)
    document.body.appendChild(container)
    const tip = createTooltip(container, div)
    tip.show('<b>42%</b>')
    expect(div.innerHTML).toContain('42%')
    expect(div.style.visibility).toBe('visible')
    tip.hide()
    expect(div.style.visibility).toBe('hidden')
  })

  it('moves the tooltip based on the mouse position within the container when no size is given', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 400 })
    Object.defineProperty(container, 'clientHeight', { value: 300 })
    const div = document.createElement('div')
    container.appendChild(div)
    document.body.appendChild(container)
    const tip = createTooltip(container, div)
    tip.move({ offsetX: 10, offsetY: 10 })
    expect(div.style.left).toBe('10px')
    expect(div.style.top).toBe('18px')
  })

  // Pins the fix-round-1 regression: Graph.vue's real `width`/`height` are
  // NOT the container's measured client box (see the comment on
  // createTooltip in chart.ts — `width` has a `minimumContainerWidth` floor,
  // routinely 1080 on charts inside an overflow-x-auto scroller, and
  // `height` is the constant 380 regardless of how the SVG scales down).
  // A container that is small (as it would be inside a horizontal scroller
  // with a wide chart) must NOT change the flip decision when an explicit
  // `size` is passed in.
  it('uses the explicit size, not the container client box, when size is provided', () => {
    const container = document.createElement('div')
    // Container is visually small (e.g. clipped by an overflow-x-auto
    // wrapper), but the chart's real width/height (from drawGraph) are large.
    Object.defineProperty(container, 'clientWidth', { value: 300 })
    Object.defineProperty(container, 'clientHeight', { value: 200 })
    const div = document.createElement('div')
    container.appendChild(div)
    document.body.appendChild(container)
    const tip = createTooltip(container, div, { width: 1080, height: 380 })

    // offsetX=600 is > container.clientWidth/2 (150) but < size.width/2 (540)
    // is false too — pick a point that only disagrees between the two: past
    // the container's half-width (150) but before the real half-width (540).
    tip.move({ offsetX: 200, offsetY: 100 })

    // Using the container's small clientWidth/clientHeight, 200 > 150 and
    // 100 < 100 is false (equal), so it would anchor differently. Using the
    // real size (1080x380), 200 < 540 and 100 < 190, so it must anchor
    // top-left, not flip to right/bottom.
    expect(div.style.left).toBe('200px')
    expect(div.style.top).toBe('108px')
    expect(div.style.right).toBe('initial')
    expect(div.style.bottom).toBe('initial')
  })
})

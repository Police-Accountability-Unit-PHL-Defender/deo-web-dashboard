<template>
  <div class="my-6 p-4 bg-[#FCFCFC] rounded-xl shadow-graph" :class="{ 'max-w-[640px] mx-auto': props.horizontal }">
    <div class="w-full text-center mt-1 font-semibold text-primary-800 max-w-[630px] mx-auto" :class="props.horizontal ? 'text-body-4' : 'text-body-2'">
      <slot></slot>
    </div>
    <div ref="container" class="relative overflow-x-auto">
      <svg class="mx-auto text-body-4" ref="graphSvg"></svg>
      <div class="tooltip text-caption" :class="{ 'compact-tooltip': props.horizontal }"></div>
    </div>
    <slot name="footer"></slot>
    <div v-if="props.chartLegend" class="text-caption pt-4 px-4 text-neutral-800 flex gap-x-8 gap-y-2 flex-wrap md:justify-center md:ml-20">
      <div v-for="(item, key) in props.chartLegend" :key="key" class="flex gap-1 items-center">
        <div :class="props.groupClasses[key]" class="w-3 h-3"></div>
        <div>{{ item }}</div>
      </div>
    </div>
  </div>
</template>
<style scope lang="scss">
  .tick line {
    @apply stroke-neutral-200;
  }
</style>
<script setup>
/**
 * A point-and-interval ("coefficient" or "forest") chart: one marker per
 * estimate with a vertical 95% confidence whisker, against a zero reference
 * line.
 *
 * Separate from LineGraph.vue rather than a flag on it for one hard reason:
 * LineGraph's y-scale comes from `buildYScale`, which hardcodes a [0, max]
 * domain and therefore cannot place a negative coefficient at all. That
 * helper is shared with Graph.vue across eight published charts, so it is
 * left alone and this component builds its own scale. `drawYAxis` and
 * `createTooltip` are reused unchanged -- both take whatever scale they are
 * handed.
 *
 * Deliberately generic: it knows nothing about veils, years or outcomes.
 * Callers map their own rows into `estimates`.
 */
import * as d3 from 'd3'
import { ref, onMounted, watch } from 'vue'
import { drawYAxis, createTooltip } from '../utils/chart'

const props = defineProps({
  /**
   * `{x, group, value, ciLo, ciHi, hoverText?}` per estimate. `x` is a
   * discrete category (a year, a district); `value` sits between `ciLo` and
   * `ciHi`.
   */
  estimates: {
    type: Array,
    required: true
  },
  /** Compact forest plot: one labeled row per estimate on a shared scale. */
  horizontal: {
    type: Boolean,
    default: false
  },
  axisProperties: {
    type: Object,
    required: true
  },
  groupClasses: {
    type: Object,
    required: false,
    default: () => ({})
  },
  chartLegend: {
    type: Object,
    required: false
  },
  connectPoints: {
    type: Boolean,
    required: false,
    default: false
  },
  yDomain: {
    type: Array,
    required: false
  },
  /** False draws points only: for a series of levels (shares) rather than
   *  estimates with intervals. */
  showIntervals: {
    type: Boolean,
    required: false,
    default: true
  },
  /**
   * `(x, pointsAtX) => string[]`: switches hovering from per-point to
   * per-column. A vertical guide follows the hovered category and one
   * tooltip describes every series there -- the right reading for paired
   * series (daylight and dark for one year), where the comparison *is* the
   * column. Points keep their SVG <title> for assistive tech.
   */
  columnHover: {
    type: Function,
    required: false
  },
  /** Series at the same x are nudged apart so overlapping whiskers stay
   *  visible. Turn off when the series are paired readings of one x (e.g.
   *  daylight and dark for one year) and a sideways offset would read as a
   *  shift in time. */
  dodge: {
    type: Boolean,
    required: false,
    default: true
  },
  /** Zero is forced into the domain so the reference line is always drawn.
   *  Turn off for a level series where zero is far outside the data. */
  includeZero: {
    type: Boolean,
    required: false,
    default: true
  },
  margin: {
    type: Object,
    required: false,
    default: () => ({ top: 75, right: 20, bottom: 60, left: 80 })
  },
  /**
   * `{after, label}`: a vertical dashed line between category `after` and
   * the next one, e.g. a policy taking effect between two years. Drawn
   * between ticks, not on one, because the event falls between estimates.
   */
  marker: {
    type: Object,
    required: false
  },
  minimumContainerWidth: {
    type: Number,
    required: false,
    default: 640
  }
})

const graphSvg = ref(null)
const container = ref(null)

onMounted(() => {
  drawGraph(props.estimates)
})

watch(() => props.estimates, (estimates) => {
  drawGraph(estimates)
}, { deep: true })

const margin = {
  top: props.margin.top ?? 75,
  right: props.margin.right ?? 20,
  bottom: props.margin.bottom ?? 60,
  left: props.margin.left ?? 80
}

const classesFor = (group, prefix) => {
  const classes = props.groupClasses[group] ?? ''
  return classes.split(/\s+/).filter((c) => c.startsWith(prefix)).join(' ')
}

const drawHorizontalGraph = (svg, estimates) => {
  const width = Math.max(container.value.clientWidth, 260)
  const top = 24
  const rowHeight = 42
  const axisY = top + estimates.length * rowHeight
  const height = axisY + 48
  const left = 64
  const right = width - 12
  const lo = d3.min(estimates, d => d.ciLo)
  const hi = d3.max(estimates, d => d.ciHi)
  const pad = (hi - lo) * 0.1 || 0.1
  const scale = d3.scaleLinear()
    .domain(props.yDomain ?? [Math.min(lo - pad, 0), Math.max(hi + pad, 0)])
    .range([left, right]).nice()

  svg.attr('width', width).attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;')
    .attr('role', 'img')
    .attr('aria-label', `${props.axisProperties.y} by ${props.axisProperties.x}. Points with 95% confidence intervals.`)

  svg.append('g').attr('transform', `translate(0,${axisY})`)
    .attr('class', 'text-caption')
    .call(d3.axisBottom(scale).ticks(width < 400 ? 3 : 5).tickSizeOuter(0))
  svg.append('text').attr('x', (left + right) / 2).attr('y', height - 4)
    .attr('text-anchor', 'middle').attr('fill', 'currentColor')
    .attr('class', 'text-caption').text(props.axisProperties.y)
  svg.append('line').attr('class', 'zero-line stroke-neutral-600')
    .attr('x1', scale(0)).attr('x2', scale(0))
    .attr('y1', top - 12).attr('y2', axisY)
    .attr('stroke-dasharray', '4 4')

  const tip = createTooltip(d3.select(container.value).select('.tooltip').node(), { width, height })
  estimates.forEach((d, i) => {
    const cy = top + i * rowHeight
    svg.append('text').attr('x', 0).attr('y', cy)
      .attr('dominant-baseline', 'middle').attr('fill', 'currentColor')
      .attr('class', 'text-caption font-semibold').text(d.x)
    const row = svg.append('g')
    row.append('line').attr('class', `ci-whisker ${classesFor(d.group, 'stroke-')}`)
      .attr('x1', scale(d.ciLo)).attr('x2', scale(d.ciHi))
      .attr('y1', cy).attr('y2', cy).attr('stroke-width', 2).attr('stroke-linecap', 'round')
    const point = row.append('circle').attr('cx', scale(d.value)).attr('cy', cy)
      .attr('r', 4).attr('class', classesFor(d.group, 'fill-'))
      .attr('stroke', '#ffffff').attr('stroke-width', 1.5)
    const description = d.hoverText?.join('\n') ?? `${d.x}: ${d.value}, 95% interval ${d.ciLo} to ${d.ciHi}`
    const signed = value => `${value < 0 ? '−' : value > 0 ? '+' : ''}${Math.abs(value).toFixed(2)}`
    const summary = `${signed(d.value)} pp<br>95% interval: ${signed(d.ciLo)} to ${signed(d.ciHi)}`
    point.append('title').text(description)
    row.append('rect').attr('x', left).attr('y', cy - 16)
      .attr('width', right - left).attr('height', 32).attr('fill', 'transparent')
      .attr('tabindex', 0).attr('role', 'img').attr('aria-label', description)
      .on('mouseover focus', () => {
        tip.show(summary)
        tip.move({ offsetX: scale(d.value), offsetY: cy })
      })
      .on('mousemove', event => tip.move(event))
      .on('mouseleave blur', () => tip.hide())
  })
}

const drawGraph = (estimates) => {
  if (!container.value) return

  const svg = d3.select(graphSvg.value)
  svg.selectAll('*').remove()

  // Guard: every category deselected. Clearing and returning leaves an empty
  // frame rather than a stale chart of the previous selection.
  if (!estimates || estimates.length === 0) return
  if (props.horizontal) {
    drawHorizontalGraph(svg, estimates)
    return
  }

  const containerWidth = container.value.clientWidth
  const width = Math.max(containerWidth, props.minimumContainerWidth ?? 640)
  const height = 380

  svg
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: none; height: auto;')
    .attr('role', 'img')
    .attr('aria-label', `${props.axisProperties.y} by ${props.axisProperties.x}.${props.showIntervals ? ' Points with 95% confidence intervals.' : ''}`)

  const xValues = [...new Set(estimates.map((d) => d.x))]
  const groups = [...new Set(estimates.map((d) => d.group))]

  const x = d3.scalePoint()
    .domain(xValues)
    .range([margin.left, width - margin.right])
    .padding(0.5)

  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .attr('class', 'text-caption')
    .call(d3.axisBottom(x).tickSizeInner(0).tickSizeOuter(0).tickPadding(12))

  svg.append('text')
    .attr('x', (width + margin.left) / 2)
    .attr('y', height - 6)
    .attr('text-anchor', 'middle')
    .attr('fill', 'currentColor')
    .attr('class', 'text-body-4 font-semibold')
    .text(props.axisProperties.x)

  // The y-domain spans the whole interval, not just the point estimates --
  // a whisker clipped by the axis would understate the uncertainty, which is
  // the one thing this chart exists to show. Zero is forced into the domain
  // so the reference line is always drawn, even if every estimate lands on
  // the same side of it.
  const lo = d3.min(estimates, (d) => props.showIntervals ? d.ciLo : d.value)
  const hi = d3.max(estimates, (d) => props.showIntervals ? d.ciHi : d.value)
  const pad = (hi - lo) * 0.1 || 0.1
  const autoDomain = props.includeZero
    ? [Math.min(lo - pad, 0), Math.max(hi + pad, 0)]
    : [lo - pad, hi + pad]
  const y = d3.scaleLinear()
    .domain(props.yDomain ?? autoDomain)
    .range([height - margin.bottom, margin.top])
    .nice()

  drawYAxis(svg, y, { marginLeft: margin.left, marginTop: margin.top, label: props.axisProperties.y })

  const [yLo, yHi] = y.domain()
  if (yLo <= 0 && yHi >= 0) svg.append('line')
    .attr('class', 'zero-line stroke-neutral-600')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', y(0))
    .attr('y2', y(0))
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4 4')

  const markerIndex = props.marker ? xValues.indexOf(props.marker.after) : -1
  if (markerIndex >= 0 && markerIndex < xValues.length - 1) {
    const mx = (x(xValues[markerIndex]) + x(xValues[markerIndex + 1])) / 2
    svg.append('line')
      .attr('class', 'event-marker stroke-neutral-800')
      .attr('x1', mx)
      .attr('x2', mx)
      .attr('y1', margin.top - 10)
      .attr('y2', height - margin.bottom)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 3')
    svg.append('text')
      .attr('class', 'event-marker-label text-caption')
      .attr('x', mx + 6)
      .attr('y', margin.top - 14)
      .attr('fill', 'currentColor')
      .text(props.marker.label)
  }

  // Dodge: without a horizontal offset every series at a given x draws on
  // exactly the same vertical line and all but the last is invisible. The
  // step is capped so the offsets stay visibly attached to their tick.
  const step = props.dodge && groups.length > 1
    ? Math.min(14, x.step() / (groups.length + 1))
    : 0
  const offsetFor = (group) =>
    (groups.indexOf(group) - (groups.length - 1) / 2) * step

  const tooltipDiv = d3.select(container.value).select('.tooltip')
  const tip = createTooltip(tooltipDiv.node(), { width, height })

  const attachTooltip = (selection, datum) => {
    selection
      .on('mouseover.tooltip', function () {
        const html = datum.hoverText
          ? datum.hoverText.join('<br>')
          : `${datum.group} ${datum.x}: ${datum.value}`
        tip.show(html)
      })
      .on('mousemove.tooltip', function (event) {
        tip.move(event)
      })
      .on('mouseleave.tooltip', function () {
        tip.hide()
      })
  }

  const marks = svg.append('g')

  if (props.connectPoints) {
    const line = d3.line()
      .defined((d) => !d.caution)
      .x((d) => x(d.x) + offsetFor(d.group))
      .y((d) => y(d.value))

    for (const group of groups) {
      const series = estimates
        .filter((d) => d.group === group)
        .sort((a, b) => xValues.indexOf(a.x) - xValues.indexOf(b.x))
      if (series.length < 2) continue
      marks.append('path')
        .datum(series)
        .attr('fill', 'none')
        .attr('class', `estimate-line ${classesFor(group, 'stroke-')}`)
        .attr('stroke-width', 2)
        .attr('d', line)

      // Keep an exceptional year visible without presenting it as an ordinary
      // segment of the trend (e.g. changed travel patterns during 2020).
      const cautionLine = d3.line()
        .x((d) => x(d.x) + offsetFor(d.group))
        .y((d) => y(d.value))
      for (let i = 1; i < series.length; i++) {
        if (!series[i - 1].caution && !series[i].caution) continue
        marks.append('path')
          .datum(series.slice(i - 1, i + 1))
          .attr('fill', 'none')
          .attr('class', 'caution-line stroke-neutral-600')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4 4')
          .attr('d', cautionLine)
      }
    }
  }

  estimates.forEach((d) => {
    const cx = x(d.x) + offsetFor(d.group)

    const whisker = props.showIntervals ? marks.append('line')
      .attr('class', `ci-whisker ${d.caution ? 'stroke-neutral-600' : classesFor(d.group, 'stroke-')}`)
      .attr('x1', cx)
      .attr('x2', cx)
      .attr('y1', y(d.ciLo))
      .attr('y2', y(d.ciHi))
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round') : null

    const marker = marks.append('circle')
      .attr('cx', cx)
      .attr('cy', y(d.value))
      .attr('r', 4)
      .attr('class', d.caution ? 'fill-neutral-600' : classesFor(d.group, 'fill-'))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)

    marker.append('title').text(d.hoverText?.join('\n') ?? `${d.group}, ${d.x}: ${d.value}`)

    if (props.columnHover) return
    if (whisker) attachTooltip(whisker, d)
    attachTooltip(marker, d)
  })

  if (props.columnHover) {
    const guide = svg.append('line')
      .attr('class', 'hover-guide stroke-neutral-600')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 3')
      .style('visibility', 'hidden')
    // Drawn after the marks so the whole column, not just the dot, is the
    // hover target. Transparent fill still receives pointer events.
    svg.append('g')
      .selectAll('rect')
      .data(xValues)
      .join('rect')
      .attr('class', 'hover-column')
      .attr('x', (v) => x(v) - x.step() / 2)
      .attr('y', margin.top)
      .attr('width', x.step())
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .on('mouseover', function (event, v) {
        const lines = props.columnHover(v, estimates.filter((d) => d.x === v))
        if (!lines || !lines.length) return
        guide.attr('x1', x(v)).attr('x2', x(v)).style('visibility', 'visible')
        tip.show(lines.join('<br>'))
      })
      .on('mousemove', function (event) { tip.move(event) })
      .on('mouseleave', function () {
        guide.style('visibility', 'hidden')
        tip.hide()
      })
  }
}
</script>

<style scoped lang="scss">
.tooltip {
  top: 0;
  left: -100000000px;
  @apply flex flex-col gap-1 absolute z-[1] p-2 bg-white border border-neutral-400 pointer-events-none box-border shadow-dropdown;
}
.compact-tooltip {
  max-width: 240px;
  font-size: 13px;
  line-height: 1.4;
}
</style>

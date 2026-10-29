<template>
  <div class="my-6 p-4 bg-[#FCFCFC] rounded-xl shadow-graph">
    <div class="w-full text-center mt-1 text-body-2 font-semibold text-primary-800 max-w-[630px] mx-auto">
      <slot></slot>
    </div>
    <div ref="container" class="relative overflow-x-auto">
      <svg class="mx-auto text-body-4" ref="graphSvg"></svg>
      <div class="tooltip text-caption"></div>
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
  margin: {
    type: Object,
    required: false,
    default: () => ({ top: 75, right: 20, bottom: 60, left: 80 })
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

const drawGraph = (estimates) => {
  if (!container.value) return

  const svg = d3.select(graphSvg.value)
  svg.selectAll('*').remove()

  // Guard: every category deselected. Clearing and returning leaves an empty
  // frame rather than a stale chart of the previous selection.
  if (!estimates || estimates.length === 0) return

  const containerWidth = container.value.clientWidth
  const width = Math.max(containerWidth, props.minimumContainerWidth ?? 640)
  const height = 380

  svg
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;')

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
  const lo = d3.min(estimates, (d) => d.ciLo)
  const hi = d3.max(estimates, (d) => d.ciHi)
  const pad = (hi - lo) * 0.1 || 0.1
  const y = d3.scaleLinear()
    .domain([Math.min(lo - pad, 0), Math.max(hi + pad, 0)])
    .range([height - margin.bottom, margin.top])
    .nice()

  drawYAxis(svg, y, { marginLeft: margin.left, marginTop: margin.top, label: props.axisProperties.y })

  svg.append('line')
    .attr('class', 'zero-line stroke-neutral-600')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', y(0))
    .attr('y2', y(0))
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4 4')

  // Dodge: without a horizontal offset every series at a given x draws on
  // exactly the same vertical line and all but the last is invisible. The
  // step is capped so the offsets stay visibly attached to their tick.
  const step = groups.length > 1
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

  estimates.forEach((d) => {
    const cx = x(d.x) + offsetFor(d.group)

    const whisker = marks.append('line')
      .attr('class', `ci-whisker ${classesFor(d.group, 'stroke-')}`)
      .attr('x1', cx)
      .attr('x2', cx)
      .attr('y1', y(d.ciLo))
      .attr('y2', y(d.ciHi))
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')

    const marker = marks.append('circle')
      .attr('cx', cx)
      .attr('cy', y(d.value))
      .attr('r', 4)
      .attr('class', classesFor(d.group, 'fill-'))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)

    attachTooltip(whisker, d)
    attachTooltip(marker, d)
  })
}
</script>

<style scoped lang="scss">
.tooltip {
  top: 0;
  left: -100000000px;
  @apply flex flex-col gap-1 absolute z-[1] p-2 bg-white border border-neutral-400 pointer-events-none box-border shadow-dropdown;
}
</style>

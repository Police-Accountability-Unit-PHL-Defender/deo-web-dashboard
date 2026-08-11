<template>
  <div class="my-6 p-4 bg-[#FCFCFC] rounded-xl shadow-graph">
    <div class="w-full text-center mt-1 text-body-2 font-semibold text-primary-800 max-w-[630px] mx-auto">
      <slot></slot>
    </div>
    <div ref="container" class="relative overflow-x-auto">
      <svg class="mx-auto text-body-4" ref="graphSvg"></svg>
      <div class="tooltip text-caption"></div>
    </div>
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
import * as d3 from 'd3'
import { ref, onMounted, watch } from 'vue'
import { buildYScale, drawYAxis, createTooltip } from '../utils/chart'

const props = defineProps({
  graphData: {
    type: Array,
    required: true
  },
  axisProperties: {
    type: Object,
    required: true
  },
  groupName: {
    type: String,
    required: false,
    default: undefined
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
  yScaleDomainMax: {
    type: Number,
    required: false,
    default: undefined
  },
  dashedFromX: {
    // `null` is not a valid member of a Vue type array -- the runtime checker
    // expects constructors. Listing it emits a dev warning; omitting it while
    // keeping `default: null` is the documented way to say "optional".
    type: [Number, String],
    required: false,
    default: null
  },
  margin: {
    type: Object,
    required: false,
    default: () => ({ top: 75, right: 0, bottom: 60, left: 80 })
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
  drawGraph(props.graphData)
})

watch(() => props.graphData, (graphData) => {
  drawGraph(graphData)
}, { deep: true })

const margin = {
  top: props.margin.top ?? 75,
  right: props.margin.right ?? 0,
  bottom: props.margin.bottom ?? 60,
  left: props.margin.left ?? 80
}

const getStrokeClass = (group) => {
  const classes = props.groupClasses[group] ?? ''
  return classes.split(/\s+/).filter((c) => c.startsWith('stroke-')).join(' ')
}

const getFillClass = (group) => {
  const classes = props.groupClasses[group] ?? ''
  return classes.split(/\s+/).filter((c) => c.startsWith('fill-')).join(' ')
}

const drawGraph = (graphData) => {
  if (!container.value) return

  // Guard: nothing to draw.
  if (!graphData || graphData.length === 0) {
    d3.select(graphSvg.value).selectAll('*').remove()
    return
  }

  const containerWidth = container.value.clientWidth
  const minContainerWidth = props.minimumContainerWidth ?? 640
  const width = Math.max(containerWidth, minContainerWidth)
  const height = 380

  const svg = d3.select(graphSvg.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;')

  // reset graph
  svg.selectAll('*').remove()

  const xValues = [...new Set(graphData.map((d) => d[props.axisProperties.x]))]

  const x = d3.scalePoint()
    .domain(xValues)
    .range([margin.left, width - margin.right])
    .padding(0.5)

  // Add the x-axis
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .attr('class', 'text-caption')
    .call(d3.axisBottom(x).tickSizeInner(0).tickSizeOuter(0).tickPadding(12))

  // Add the x-axis label
  svg.append('text')
    .attr('x', (width + margin.left) / 2)
    .attr('y', height - 6)
    .attr('text-anchor', 'middle')
    .attr('fill', 'currentColor')
    .attr('class', 'text-body-4 font-semibold')
    .text(props.axisProperties.x)

  const y = buildYScale(
    d3.max(graphData, (d) => d[props.axisProperties.y]),
    height - margin.bottom,
    margin.top,
    props.yScaleDomainMax
  )
  drawYAxis(svg, y, { marginLeft: margin.left, marginTop: margin.top, label: props.axisProperties.y })

  const tooltipDiv = d3.select(container.value).select('.tooltip')
  const tip = createTooltip(tooltipDiv.node(), { width, height })

  const attachTooltip = (selection, datum) => {
    selection
      .on('mouseover.tooltip', function () {
        const html = datum.hover_text
          ? datum.hover_text.join('<br>')
          : `${datum[props.axisProperties.x]}: ${datum[props.axisProperties.y]}%`
        tip.show(html)
      })
      .on('mousemove.tooltip', function (event) {
        tip.move(event)
      })
      .on('mouseleave.tooltip', function () {
        tip.hide()
      })
  }

  const groups = props.groupName ? d3.group(graphData, (d) => d[props.groupName]) : new Map([[undefined, graphData]])

  const line = d3.line()
    .x((d) => x(d[props.axisProperties.x]))
    .y((d) => y(d[props.axisProperties.y]))

  groups.forEach((seriesData, group) => {
    const strokeClass = getStrokeClass(group)
    const fillClass = getFillClass(group)

    // Sort series data by x position in the domain's document order.
    const sorted = [...seriesData].sort(
      (a, b) => xValues.indexOf(a[props.axisProperties.x]) - xValues.indexOf(b[props.axisProperties.x])
    )

    // A line needs at least two points; a single-point series draws its
    // marker only, with no path at all (see the branch below).
    if (sorted.length >= 2) {
      if (props.dashedFromX !== null && props.dashedFromX !== undefined) {
        const dashIndex = sorted.findIndex((d) => d[props.axisProperties.x] === props.dashedFromX)

        // Three cases for where `dashedFromX` lands in this series:
        //  - Not found at all (dashIndex === -1): no boundary to split at,
        //    so render the whole series solid — the safe fallback.
        //  - The first point (dashIndex === 0): everything in the series is
        //    "from this x onward", i.e. all of it is provisional. Dash the
        //    whole series rather than rendering it solid, which would
        //    misrepresent provisional data as settled.
        //  - Anywhere else (dashIndex > 0): solid up to but NOT including
        //    that point, plus a dashed path starting one point earlier so
        //    the two paths meet at the point before the boundary and the
        //    line reads continuous. The boundary point itself belongs to
        //    the dashed path only — if it were on both paths, the solid
        //    path would draw a solid line directly under the dashed one in
        //    the same colour, and a 4-4 dash over an identical solid line
        //    renders as solid, hiding the partial-year cue entirely.
        if (dashIndex === -1) {
          svg.append('path')
            .datum(sorted)
            .attr('fill', 'none')
            .attr('class', strokeClass)
            .attr('stroke-width', 2)
            .attr('d', line)
        } else if (dashIndex === 0) {
          svg.append('path')
            .datum(sorted)
            .attr('fill', 'none')
            .attr('class', strokeClass)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4 4')
            .attr('d', line)
        } else {
          const solidPoints = sorted.slice(0, dashIndex)
          const dashedPoints = sorted.slice(dashIndex - 1)

          svg.append('path')
            .datum(solidPoints)
            .attr('fill', 'none')
            .attr('class', strokeClass)
            .attr('stroke-width', 2)
            .attr('d', line)

          svg.append('path')
            .datum(dashedPoints)
            .attr('fill', 'none')
            .attr('class', strokeClass)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4 4')
            .attr('d', line)
        }
      } else {
        svg.append('path')
          .datum(sorted)
          .attr('fill', 'none')
          .attr('class', strokeClass)
          .attr('stroke-width', 2)
          .attr('d', line)
      }
    }

    svg.append('g')
      .selectAll('circle')
      .data(sorted)
      .join('circle')
      .attr('cx', (d) => x(d[props.axisProperties.x]))
      .attr('cy', (d) => y(d[props.axisProperties.y]))
      .attr('r', 4)
      .attr('class', fillClass)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .each(function (d) {
        attachTooltip(d3.select(this), d)
      })
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

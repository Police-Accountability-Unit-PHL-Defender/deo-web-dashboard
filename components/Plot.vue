<template>
  <div class="border my-10 p-4">
    <div class="w-full text-center max-w-[720px] mx-auto mt-4 mb-8 text-heading-5 text-primary-800">
      <slot name="title"></slot>
    </div>
    <svg class="mx-auto text-body-4" ref="graphSvg"></svg>
    <slot></slot>
  </div>
</template>
<style scope lang="scss">
  .tick line {
    @apply stroke-neutral-200;
  }
</style>
<script setup>
import * as d3 from 'd3'

const props = defineProps({
  graphData: {
    type: Array,
    required: true
  },
  axisProperties: {
    type: Object,
    required: false
  },
  groupName: {
    type: String,
    required: false,
    default: undefined,
  },
  groupClasses: {
    type: Object,
    required: false
  }
})

const graphSvg = ref(null)

const isGrouped = computed(() => {
  return props.groupName !== undefined
})

watch(() => props.graphData, (graphData) => {
  drawGraph(graphData)
}, { deep: true })

const drawGraph = (graphData) => {
  const barWidth = isGrouped.value ? 32 : 64;
  const groupBarGap = 4
  const groupWidth = barWidth * 2 + groupBarGap
  const padding = 24;
  const paddingOuter = 16;
  const paddingInnerRatio = isGrouped.value ? (padding/groupWidth) : (padding/barWidth)
  const paddingOuterRatio = isGrouped.value ? (paddingOuter/groupWidth) : (paddingOuter/barWidth)
  const height = 370;
  const marginTop = 30;
  const marginRight = 0;
  const marginBottom = 30;
  const marginLeft = 64;
  const groups = new Set(graphData.map(d => d.group))
  const width = isGrouped.value ?
    (graphData.length / groups.size) * (groupWidth + padding) - padding + (2 * paddingOuter) + marginLeft + marginRight :
    graphData.length * (barWidth + padding) - padding + (2 * paddingOuter) + marginLeft + marginRight;
  const svg = d3.select(graphSvg.value)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");
  // reset graph
  svg.selectAll("*").remove();

  const x = d3.scaleBand()
    .domain(graphData.map(d => d[props.axisProperties.x]))
    .range([marginLeft, width - marginRight])
    .paddingInner(paddingInnerRatio)
    .paddingOuter(paddingOuterRatio)
  const y = d3.scaleLinear()
    .domain([0, d3.max(graphData, (d) => d[props.axisProperties.y])])
    .range([height - marginBottom, marginTop]);

  // axes
  // Add the y-axis and label, and remove the domain line.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .attr("class", "text-body-4")
    .call(d3.axisLeft(y).tickSizeInner(-width, 0, 0).tickSizeOuter(0).tickPadding(8))
    // .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text(props.axisProperties.y));
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .attr("class", "text-body-4")
    .call(d3.axisBottom(x).tickSizeInner(0).tickSizeOuter(0).tickPadding(12));

  // bars
  if (isGrouped.value) {
    const gx = d3.scaleBand().domain(groups).rangeRound([0, groupWidth]).paddingInner(groupBarGap / groupWidth)
    svg.append("g")
      .selectAll()
      .data(d3.group(graphData, (d) => d[props.axisProperties.x]))
      .join("g")
        .attr("transform", ([xAxisProperty]) => `translate(${x(xAxisProperty)},0)`)
      .selectAll()
      .data(([, values]) => values)
      .join("rect")
        .attr("x", (d) => gx(d.group))
        .attr("y", (d) => y(d[props.axisProperties.y]))
        .attr("height", (d) => y(0) - y(d[props.axisProperties.y]))
        .attr("width", barWidth)
        .attr("class", (d) => props.groupClasses[d.group])
  } else {
    svg.append("g")
      .attr("class", "fill-primary-600")
      .selectAll()
      .data(graphData)
      .join("rect")
        .attr("x", (d) => x(d[props.axisProperties.x]))
        .attr("y", (d) => y(d[props.axisProperties.y]))
        .attr("height", (d) => y(0) - y(d[props.axisProperties.y]))
        .attr("width", x.bandwidth());
  }
  // // Create horizontal lines for each tick in the y-axis
  // svg.selectAll('.horizontal-line')
  //   .data(graphData)
  //   .enter()
  //   .append('line')
  //   .attr('class', 'horizontal-line')
  //   .attr('x1', 0)
  //   .attr('y1', d => y(d))
  //   .attr('x2', width)
  //   .attr('y2', d => y(d))
  //   .attr('stroke', 'lightgray');
}
</script>

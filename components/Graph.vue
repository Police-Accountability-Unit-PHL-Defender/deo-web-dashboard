<template>
  <div class="w-full text-center mt-12 mb-4">
    <slot name="title"></slot>
  </div>
  <svg ref="graphSvg"></svg>
</template>
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
    required: false
  },
  groupClasses: {
    type: Object,
    required: false
  }
})

const graphSvg = ref(null)

watch(() => props.graphData, (graphData) => {
  console.log('graph data changed')
  console.log(graphData)
  drawGraph(graphData)
}, { deep: true })

const drawGraph = (graphData) => {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 0;
  const marginBottom = 30;
  const marginLeft = 40;
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
    .padding(0.1)
  const y = d3.scaleLinear()
    .domain([0, d3.max(graphData, (d) => d[props.axisProperties.y])])
    .range([height - marginBottom, marginTop]);
  if (props.groupName) {
    console.log('hel')
    const groups = new Set(graphData.map(d => d.group))
    const gx = d3.scaleBand().domain(groups).rangeRound([0, x.bandwidth()]).padding(0.05)
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
        .attr("width", gx.bandwidth())
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

  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));
  // Add the y-axis and label, and remove the domain line.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
    .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text(props.axisProperties.y));
}
</script>
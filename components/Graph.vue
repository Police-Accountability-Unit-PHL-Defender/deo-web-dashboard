<template>
  <div class="border border-neutral-400 my-6 p-4">
    <div class="w-full text-center mt-1 mb-6 text-body-2 font-semibold text-primary-800">
      <slot></slot>
    </div>
    <div ref="container" class="relative">
      <svg class="mx-auto text-body-4" ref="graphSvg"></svg>
      <div class="tooltip text-caption"></div>
    </div>
    <slot name="footer"></slot>
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
const container = ref(null)

const isGrouped = computed(() => {
  return props.groupName !== undefined
})

onMounted(() => {
  drawGraph(props.graphData)
})

watch(() => props.graphData, (graphData) => {
  console.log('graph data changed')
  console.log(graphData)
  drawGraph(graphData)
}, { deep: true })

const margin = { top: 30, right: 0, bottom: 60, left: 80 }

const getGroupClass = (group) => {
  if (props.groupClasses[group]) {
    return props.groupClasses[group]
  } else {
    return 'fill-primary-600'
  }
}

const drawGraph = (graphData) => {
  let barWidth = 64;
  if (isGrouped.value) { barWidth = 32 }
  const groupBarGap = 4
  const groupWidth = barWidth * 2 + groupBarGap
  let padding = 24;
  let paddingOuter = 16;
  if (!isGrouped.value && graphData.length < 4) {
    barWidth = 128
  }
  if (!isGrouped.value && graphData.length > 12) {
    barWidth = 16
    padding = 6
    paddingOuter = 6
  }
  const paddingInnerRatio = isGrouped.value ? (padding/groupWidth) : (padding/barWidth)
  const paddingOuterRatio = isGrouped.value ? (paddingOuter/groupWidth) : (paddingOuter/barWidth)
  const height = 370;
  const groups = new Set(graphData.map(d => d.group))
  const width = isGrouped.value ?
    (graphData.length / groups.size) * (groupWidth + padding) - padding + (2 * paddingOuter) + margin.left + margin.right :
    graphData.length * (barWidth + padding) - padding + (2 * paddingOuter) + margin.left + margin.right;
  const svg = d3.select(graphSvg.value)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");
  // reset graph
  svg.selectAll("*").remove();

  const x = d3.scaleBand()
    .domain(graphData.map(d => d[props.axisProperties.x]))
    .range([margin.left, width - margin.right])
    .paddingInner(paddingInnerRatio)
    .paddingOuter(paddingOuterRatio)
  const y = d3.scaleLinear()
    .domain([0, d3.max(graphData, (d) => d[props.axisProperties.y])])
    .range([height - margin.bottom, margin.top]);

  // axes
  // Add the y-axis and label, and remove the domain line.
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .attr("class", "text-body-4")
    .call(d3.axisLeft(y).tickSizeInner(-width, 0, 0).tickSizeOuter(0).tickPadding(8))
    // .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", -margin.left)
      .attr("y", 16)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text(props.axisProperties.y));
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .attr("class", "text-body-4")
    .call(d3.axisBottom(x).tickSizeInner(0).tickSizeOuter(0).tickPadding(12))
    .selectAll(".tick text")
      .call(wrap, x.bandwidth());
  // Add the x-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 6)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("class", "text-body-4")
    .text(props.axisProperties.x);
  
  const MOUSE_POS_Y_OFFSET = 8;
  const MOUSE_POS_X_OFFSET = 0;
  const tooltipDiv = d3.select(container.value).select('.tooltip')
  const tooltip = (selectionGroup, tooltipDiv, groupWidth = 0) => {
    selectionGroup.each(function () {
      d3.select(this)
        .on("mouseover.tooltip", handleMouseover)
        .on("mousemove.tooltip", handleMousemove)
        .on("mouseleave.tooltip", handleMouseleave);
    });
    function handleMouseover() {
      // show/reveal the tooltip, set its contents,
      // style the element being hovered on
      showTooltip();
      setContents(d3.select(this).datum(), tooltipDiv);
      setStyle(d3.select(this));
    }
    function handleMousemove(event) {
      // update the tooltip's position
      const { offsetX, offsetY } = event
      // add the left & top margin values to account for the SVG g element transform
      setPosition(offsetX, offsetY);
    }
    function handleMouseleave() {
      // do things like hide the tooltip
      // reset the style of the element being hovered on
      hideTooltip();
      resetStyle(d3.select(this));
    }
    function showTooltip() {
      tooltipDiv.style("visibility", "visible");
    }
    function hideTooltip() {
      tooltipDiv.style("visibility", "hidden");
    }
    function setPosition(mouseX, mouseY) {
      tooltipDiv
        .style(
          "top",
          mouseY < height / 2 ? `${mouseY + MOUSE_POS_Y_OFFSET}px` : "initial"
        )
        .style(
          "right",
          mouseX > width / 2
            ? `${width - mouseX + MOUSE_POS_X_OFFSET + groupWidth}px`
            : "initial"
        )
        .style(
          "bottom",
          mouseY > height / 2
            ? `${height - mouseY + MOUSE_POS_Y_OFFSET}px`
            : "initial"
        )
        .style(
          "left",
          mouseX < width / 2 ? `${mouseX + MOUSE_POS_X_OFFSET + groupWidth}px` : "initial"
        );
      }
    }


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
        .attr("class", (d) => getGroupClass(d.group))
      .call(tooltip, tooltipDiv, groupWidth);
  } else {
    svg.append("g")
      .attr("class", "fill-primary-600")
      .selectAll()
      .data(graphData)
      .join("rect")
        .attr("x", (d) => x(d[props.axisProperties.x]))
        .attr("y", (d) => y(d[props.axisProperties.y]))
        .attr("height", (d) => y(0) - y(d[props.axisProperties.y]))
        .attr("width", x.bandwidth())
      .call(tooltip, tooltipDiv);
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

// source: https://observablehq.com/@clhenrick/tooltip-d3-convention
function setContents(datum, tooltipDiv) {
  // customize this function to set the tooltip's contents however you see fit
  tooltipDiv
    .selectAll("p")
    .data(datum.hover_text)
    .join("p")
    .html((d) => d);
}
function setStyle(selection) {
  selection.attr("opacity", "0.8");
}
function resetStyle(selection) {
  selection.attr("opacity", "1");
}

// modified from source: https://gist.github.com/mbostock/7555321
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null) // .append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em").text(word);
      }
      lineNumber++
    }
  });
}
</script>

<style scoped lang="scss">
.tooltip {
  top: 0;
  left: -100000000px;
  @apply flex flex-col gap-1 absolute z-[1] p-2 bg-white border border-neutral-400 pointer-events-none box-border shadow-dropdown;
}
</style>
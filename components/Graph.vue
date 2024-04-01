<template>
  <div class="border border-neutral-400 my-6 p-4">
    <div class="w-full text-center mt-1 mb-6 text-body-2 font-semibold text-primary-800 max-w-[800px] mx-auto">
      <slot></slot>
    </div>
    <div ref="container" class="relative">
      <svg class="mx-auto text-body-4" ref="graphSvg"></svg>
      <div class="tooltip text-caption"></div>
    </div>
    <slot name="footer"></slot>
    <div v-if="props.chartLegend" class="text-caption pt-4 px-4 text-neutral-800 flex gap-x-8 gap-y-2 flex-wrap md:justify-center md:ml-20">
      <div class="flex gap-1 items-center">
        <div class="bg-purple w-3 h-3"></div>
        <div>{{ chartLegend[0] }}</div>
      </div>
      <div class="flex gap-1 items-center">
        <div class="bg-mint w-3 h-3"></div>
        <div>{{ chartLegend[1] }}</div>
      </div>
      <div v-if="chartLegend.length > 2" class="flex gap-1 items-center">
        <div class="bg-yellow w-3 h-3"></div>
        <div>{{ chartLegend[2] }}</div>
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

const props = defineProps({
  graphData: {
    type: Array,
    required: true
  },
  axisProperties: {
    type: Object,
    required: false
  },
  barAnnotationProperty: {
    type: String,
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
  },
  stackName: {
    type: String,
    required: false,
    default: undefined
  },
  trendline: {
    type: Array,
    required: false
  },
  chartLegend: {
    type: Array,
    required: false,
  },
  yScaleDomainMax: {
    type: Number,
    required: false,
    default: undefined
  },
  quarterlyXAxisTicks: {
    type: Boolean,
    required: false,
  }
})

const graphSvg = ref(null)
const container = ref(null)

const isGrouped = computed(() => {
  return props.groupName !== undefined
})

const isStacked = computed(() => {
  return props.stackName !== undefined
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
    return 'fill-purple'
  }
}

const containerWidth = computed(() => {
  return container.value.clientWidth
})

const drawGraph = (graphData) => {
  const groups = new Set(graphData.map(d => d.group))
  const minContainerWidth = 640
  const width = Math.max(containerWidth.value, minContainerWidth)
  const chartWidth = width - margin.left - margin.right
  const n = !isGrouped ? graphData.length : Math.ceil(graphData.length / groups.size)
  const outerPaddingRatio = 0.2 // ratio of padding outside of bars/groups to the width of one bar/group
  const innerPaddingRatio = 0.3 // ratio of padding between bars/groups to the width of one bar/group
  const groupGapRatio = 0.1 // ratio of padding between bars within a group, to the width of one bar

  let barWidth = 1
  let groupWidth = 1
  
  if (!isGrouped.value) {
    // equation: chartWidth = n * barWidth + (n - 1) * barWidth * innerPaddingRatio + 2 * barWidth * outerPaddingRatio
    barWidth = chartWidth / (n + (n-1)*innerPaddingRatio + 2*outerPaddingRatio)
  } else {
    // equation: groupWidth = 2 * barWidth + barWidth * groupGapRatio
    // equation: chartWidth = n * groupWidth + (n - 1) * groupWidth * innerPaddingRatio + 2 * groupWidth * outerPaddingRatio
    groupWidth = chartWidth / (n + (n-1)*innerPaddingRatio + 2*outerPaddingRatio)
    barWidth = groupWidth / (groups.size + groupGapRatio)
  }
  const height = 370;
  const svg = d3.select(graphSvg.value)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");
  
  // reset graph
  svg.selectAll("*").remove();

  // if graph is stacked bar chart, then find the maximum value for each x-axis value
  let series, color, maxStackHeight
  if (props.stackName) {
    series = d3.stack()
      .keys(d3.union(graphData.map(d => d[props.stackName])))
      .value(([, group], key) => group.get(key) ? group.get(key)[props.axisProperties.y] : 0)
      (d3.index(graphData, d => d[props.axisProperties.x], d => d[props.stackName]));
    console.log(series)
    maxStackHeight = d3.max(series, (d) => d3.max(d, (d) => d[1]))
    const keys = series.map(d => d.key)
    const colors = ["#364ED7", "#644CF9", "#FEDBDB", "#88C715", "#A548DE"]
    color = d3.scaleOrdinal()
      .domain(keys)
      .range(colors)
  }

  let yScaleDomainMax = undefined
  if (props.yScaleDomainMax) {
    yScaleDomainMax = props.yScaleDomainMax
  } else if (props.stackName) {
    yScaleDomainMax = maxStackHeight
  } else {
    yScaleDomainMax = d3.max(graphData, (d) => d[props.axisProperties.y])
  }

  const x = d3.scaleBand()
    .domain(graphData.map(d => d[props.axisProperties.x]))
    .range([margin.left, width - margin.right])
    .paddingInner(innerPaddingRatio)
    .paddingOuter(outerPaddingRatio)
  const y = d3.scaleLinear()
    .domain([0, yScaleDomainMax])
    .range([height - margin.bottom, margin.top])
    .nice();

  // axes
  // Add the y-axis and label, and remove the domain line.
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .attr("class", "text-caption")
    .call(d3.axisLeft(y).tickSizeInner(-width, 0, 0).tickSizeOuter(0).tickPadding(8))
    // .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", -margin.left)
      .attr("y", 16)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .attr("class", "text-body-4")
      .text(props.axisProperties.y));
  // Add the x-axis
  const tickValues = n > 10 && props.quarterlyXAxisTicks ? x.domain().filter(function(d,i){ return !(i%8 - 4)}) : x.domain()
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .attr("class", "text-caption")
    .call(d3.axisBottom(x).tickSizeInner(0).tickSizeOuter(0).tickPadding(12).tickValues(tickValues))
    .selectAll(".tick text")
      // .call(wrap, x.bandwidth());
  // Add the x-axis label
  svg.append("text")
    .attr("x", (width + margin.left) / 2)
    .attr("y", height - 6)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("class", "text-body-4")
    .text(props.axisProperties.x);
  
  const MOUSE_POS_Y_OFFSET = 8;
  const MOUSE_POS_X_OFFSET = 0;
  const tooltipDiv = d3.select(container.value).select('.tooltip')
  const tooltip = (selectionGroup, tooltipDiv, groupWidth = 0, trendline = false, isStack = false) => {
    console.log(selectionGroup)
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
      let datum
      if (isStack) {
        datum = graphData.find(d => d[props.axisProperties.x] === d3.select(this).datum().data[0] && d[props.stackName] === d3.select(this.parentNode).datum().key)
      } else {
        datum = d3.select(this).datum()
      }
      setContents(datum, tooltipDiv);
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

  // grouped
  if (isGrouped.value) {
    const gx = d3.scaleBand().domain(groups).rangeRound([0, groupWidth]).paddingInner(groupGapRatio)
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
  } else if (isStacked.value) {
    const testFunction = (d) => {
      console.log(d)
    }
    svg.append("g")
      .selectAll("g")
      .data(series)
      .join("g")
        .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(D => D)
      .join("rect")
        .attr("x", d => x(d.data[0]))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        // .call(testFunction);
        .call(tooltip, tooltipDiv, groupWidth, false, true);
        // .call(tooltip, tooltipDiv);
  } else {
    // text above bars for baseline comparisons
    const group = svg.append("g")
      .attr("class", "fill-purple")
      .selectAll()
      .data(graphData)
      .join("g");
    group.append("rect")
      .attr("x", (d) => x(d[props.axisProperties.x]))
      .attr("y", (d) => y(d[props.axisProperties.y]))
      .attr("height", (d) => y(0) - y(d[props.axisProperties.y]))
      .attr("width", x.bandwidth())
      .call(tooltip, tooltipDiv);
    group.append("text")
      .attr("x", (d) => x(d[props.axisProperties.x]) + x.bandwidth() / 2)
      .attr("y", (d) => y(d[props.axisProperties.y]) - 5) // Adjust this value for positioning
      .attr("text-anchor", "middle")
      .attr("fill", "#393939")
      .attr("class", "text-caption")
      .text((d) => d[props.barAnnotationProperty]); // You can adjust this to show any value you want
  }

  // trendline
  if (props.trendline) {
    const trendline = d3.line()
      .x(d => x(d[props.axisProperties.x]) + x.bandwidth() / 2)
      .y(d => y(d[props.axisProperties.y]))
    svg.append("path")
      .datum(props.trendline)
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1.5)
      .attr("d", trendline)
      // .call(tooltip, tooltipDiv);
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
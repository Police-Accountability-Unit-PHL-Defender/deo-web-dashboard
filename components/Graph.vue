<template>
  <div class="my-6 p-4 bg-[#FCFCFC] rounded-xl shadow-graph">
    <div class="w-full text-center mt-1 text-body-2 font-semibold text-primary-800 max-w-[630px] mx-auto">
      <slot></slot>
    </div>
    <div ref="container" class="relative">
      <svg class="mx-auto text-body-4" ref="graphSvg"></svg>
      <div class="tooltip text-caption"></div>
    </div>
    <slot name="footer"></slot>
    <div v-if="props.chartLegend" class="text-caption pt-4 px-4 text-neutral-800 flex gap-x-8 gap-y-2 flex-wrap md:justify-center md:ml-20">
      <div v-for="(item, key) in props.chartLegend" :key="key" class="flex gap-1 items-center">
        <div :class="props.groupClasses[key]" class="w-3 h-3"></div>
        <div>{{ item }}</div>
      </div>
      <!-- <div class="flex gap-1 items-center">
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
      </div> -->
    </div>

    <div v-if="isStacked" class="text-caption pt-4 px-4 text-neutral-800 flex gap-x-8 gap-y-2 flex-wrap md:justify-center md:ml-20">
      <div v-for="colorMap in stackedColorMap" :key="colorMap.key" class="flex gap-1 items-center">
        <div :style="{ backgroundColor: colorMap.color }" class="w-3 h-3"></div>
        <div>{{ colorMap.key }}</div>
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
    type: Object,
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
  },
  margin: {
    type: Object,
    required: false,
    default: { top: 75, right: 0, bottom: 60, left: 80 }
  },
  minimumContainerWidth: {
    type: Number,
    required: false,
    default: 640
  },
  wrapXAxisLabels: {
    type: Boolean,
    required: false,
    default: false
  }
})

const graphSvg = ref(null)
const container = ref(null)
let stackedColorMap = ref([])

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

const margin = {
  top: props.margin.top ?? 75,
  right: props.margin.right ?? 0,
  bottom: props.margin.bottom ?? 60,
  left: props.margin.left ?? 80
}

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
  const minContainerWidth = props.minimumContainerWidth ?? 640
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
  const height = 380;
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
    maxStackHeight = d3.max(series, (d) => d3.max(d, (d) => d[1]))
    const keys = series.map(d => d.key)
    const colors = ["#644CF9", "#00B8FF", "#5FEEBB", "#F94C4C", "#FCD034"]
    color = d3.scaleOrdinal()
      .domain(keys)
      .range(colors)
    stackedColorMap.value = keys.map((key, index) => ({ key: key, color: colors[index] }))
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
    .nice()

  // axes
  // Add the y-axis and label, and remove the domain line.
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .attr("class", "text-caption")
    .call(d3.axisLeft(y).tickSizeInner(-width, 0, 0).tickSizeOuter(0).tickPadding(8))
    .call(g => g.append("foreignObject")
      .attr("x", -margin.left)
      .attr("y", 0)
      .attr("width", margin.left * 2)
      .attr("height", margin.top)
      .append("xhtml:div")
      .attr("class", "text-body-4 graph-y-axis-container font-semibold")
      .html(applyLineBreaks(props.axisProperties.y)))
  // Add the x-axis
  let tickSkip = 1
  if (n >= 32) {
    tickSkip = 8
  } else if (n >= 16) {
    tickSkip = 4
  } else {
    tickSkip = 2
  }
  const tickValues = n >= 8 && props.quarterlyXAxisTicks ? x.domain().filter(function(d,i){ return !(i%tickSkip)}) : x.domain()
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .attr("class", "text-caption")
    .call(d3.axisBottom(x).tickSizeInner(0).tickSizeOuter(0).tickPadding(12).tickValues(tickValues))
    .selectAll(".tick text")
      .call(wrap, x.bandwidth() + 29);
  // Add the x-axis label
  svg.append("text")
    .attr("x", (width + margin.left) / 2)
    .attr("y", height - 6)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("class", "text-body-4 font-semibold")
    .text(props.axisProperties.x);
  
  const MOUSE_POS_Y_OFFSET = 8;
  const MOUSE_POS_X_OFFSET = 0;
  const tooltipDiv = d3.select(container.value).select('.tooltip')
  const tooltip = (selectionGroup, tooltipDiv, trendline = false, isStack = false) => {
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
          mouseY < height / 2
            ? `${mouseY + MOUSE_POS_Y_OFFSET}px`
            : "initial"
        )
        .style(
          "right",
          mouseX > width / 2
            ? `${width - mouseX + MOUSE_POS_X_OFFSET}px`
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
          mouseX < width / 2
            ? `${mouseX + MOUSE_POS_X_OFFSET}px`
            : "initial"
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
        .attr("transform", ([xAxisProperty]) => `translate(${x(xAxisProperty) - groupGapRatio * barWidth},0)`)
      .selectAll()
      .data(([, values]) => values)
      .join("rect")
        .attr("x", (d) => gx(d.group))
        .attr("y", (d) => y(d[props.axisProperties.y]))
        .attr("height", (d) => y(0) - y(d[props.axisProperties.y]))
        .attr("width", barWidth)
        .attr("class", (d) => getGroupClass(d.group))
      .call(tooltip, tooltipDiv);
  } else if (isStacked.value) {
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
        .call(tooltip, tooltipDiv, false, true);
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
  if (!props.wrapXAxisLabels) return
  text.each(function() {
    var wordsSplitBySlash = d3.select(this).text().split(/\//)
    wordsSplitBySlash = wordsSplitBySlash.map((word, index) => index < wordsSplitBySlash.length - 1 ? word + '/' : word)
    var text = d3.select(this),
        // wordsSplitBySlash = text.text().split(/(?=\/)/)
        // words = text.text().split(/(?=\/)/).reverse(),
        words = wordsSplitBySlash.flatMap(w => w.split(/\s+/)).reverse(),
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
        lineNumber++
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

function applyLineBreaks(text) {
  switch (text) {
    case 'Number of Traffic Stops':
      return 'Number of\nTraffic Stops'
    case 'Contraband Hit Rate (%)':
      return 'Contraband\nHit Rate (%)'
    case 'District':
      return 'District'
    default:
      return text
  }
}
</script>

<style scoped lang="scss">
.tooltip {
  top: 0;
  left: -100000000px;
  @apply flex flex-col gap-1 absolute z-[1] p-2 bg-white border border-neutral-400 pointer-events-none box-border shadow-dropdown;
}
</style>
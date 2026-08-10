import * as d3 from 'd3'

/**
 * Chart internals shared by Graph.vue (bars) and LineGraph.vue (lines).
 *
 * Every function here was extracted verbatim from Graph.vue so the two chart
 * components render axes, tooltips and labels identically. Changing anything
 * here changes eight published charts — treat it as such.
 */

// modified from source: https://gist.github.com/mbostock/7555321
//
// Extracted verbatim from the `wrap` function in Graph.vue, minus the
// `if (!props.wrapXAxisLabels) return` guard at the top — that guard is
// Graph.vue-specific (reads a component prop) and now lives at the call
// site: callers should only invoke wrapLabel when wrapping is desired.
export function wrapLabel(text: d3.Selection<any, any, any, any>, width: number): void {
  text.each(function () {
    var wordsSplitBySlash = d3.select(this).text().split(/\//)
    wordsSplitBySlash = wordsSplitBySlash.map((word, index) => index < wordsSplitBySlash.length - 1 ? word + '/' : word)
    var text = d3.select(this),
        words = wordsSplitBySlash.flatMap(w => w.split(/\s+/)).reverse(),
        word,
        line = [] as string[],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null)
    let firstWord = true
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (!firstWord && tspan.node().getComputedTextLength() > width) {
        lineNumber++
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em").text(word);
      }
      firstWord = false
    }
  });
}

// Extracted verbatim from Graph.vue.
export function applyLineBreaks(text: string): string {
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

// Extracted from the y-scale construction in Graph.vue's drawGraph:
//   const y = d3.scaleLinear()
//     .domain([0, yScaleDomainMax])
//     .range([height - (margin.bottom + marginBottomAdjustment), margin.top])
//     .nice()
// where `yScaleDomainMax` was resolved as:
//   if (props.yScaleDomainMax) yScaleDomainMax = props.yScaleDomainMax
//   else if (props.stackName) yScaleDomainMax = maxStackHeight
//   else yScaleDomainMax = d3.max(graphData, d => d[props.axisProperties.y])
// The stacked/computed-max branch is data-model-specific and stays at the
// call site, which passes its result in as `maxValue`. `domainMax` mirrors
// the `props.yScaleDomainMax` truthy-check priority exactly (including its
// falsy-value quirk, e.g. domainMax === 0 falls back to maxValue).
export function buildYScale(
  maxValue: number,
  chartHeight: number,
  marginTop: number,
  domainMax?: number | null
): d3.ScaleLinear<number, number> {
  const effectiveMax = domainMax ? domainMax : maxValue
  return d3.scaleLinear()
    .domain([0, effectiveMax])
    .range([chartHeight, marginTop])
    .nice()
}

// Extracted verbatim from the y-axis block in Graph.vue's drawGraph (comment
// there reads "Add the y-axis and label, and remove the domain line" — but
// no `.select('.domain').remove()` call exists; see chart.test.ts note).
// `width` (used for the gridline tickSizeInner) is read off the svg's own
// `width` attribute, which drawGraph sets before calling this.
export function drawYAxis(
  svg: d3.Selection<any, any, any, any>,
  y: d3.ScaleLinear<number, number>,
  opts: { marginLeft: number; marginTop: number; label: string; tickFormat?: (d: any) => string }
): void {
  const { marginLeft, marginTop, label, tickFormat } = opts
  const width = +svg.attr('width')
  const axis = d3.axisLeft(y).tickSizeInner(-width, 0, 0).tickSizeOuter(0).tickPadding(8)
  if (tickFormat) {
    axis.tickFormat(tickFormat)
  }
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .attr("class", "text-caption")
    .call(axis)
    .call((g: any) => g.append("foreignObject")
      .attr("x", -marginLeft)
      .attr("y", 0)
      .attr("width", marginLeft * 2)
      .attr("height", marginTop)
      .append("xhtml:div")
      .attr("class", "text-body-4 graph-y-axis-container font-semibold")
      .html(applyLineBreaks(label)))
}

// Extracted from the tooltip closure in Graph.vue's drawGraph (showTooltip /
// hideTooltip / setPosition local functions). The mouseover/mouseleave
// wiring and datum lookup (stack vs. group vs. plain) are data-model-specific
// and stay in the calling component; this covers only visibility + position
// + content.
//
// IMPORTANT: `size` must be the same `width`/`height` values drawGraph used
// to build the chart's own scales — NOT anything measured off `container`.
// In the original Graph.vue, `width` was `Math.max(containerWidth, props.
// minimumContainerWidth ?? 640)` (a floor, routinely 1080 on some charts,
// e.g. pages/reasons.vue) and `height` was the constant 380. Charts that sit
// inside an `overflow-x-auto` scroller have a visible `container.clientWidth`
// that is often much smaller than that floor, and the SVG's `height: auto`
// means `container.clientHeight` can be less than 380 on narrow viewports —
// so measuring the container instead of using drawGraph's own numbers moves
// the left/right and top/bottom flip thresholds and changes tooltip
// placement. `container` is kept as a parameter for callers that have no
// better source of dimensions, but Graph.vue always passes its computed
// `width`/`height` explicitly to preserve the original behaviour exactly.
export function createTooltip(
  container: HTMLElement,
  tooltipDiv: HTMLElement,
  size?: { width: number; height: number }
): { show(html: string): void; move(event: any): void; hide(): void } {
  const MOUSE_POS_Y_OFFSET = 8
  const MOUSE_POS_X_OFFSET = 0
  const tooltip = d3.select(tooltipDiv)

  return {
    show(html: string) {
      tooltip.style("visibility", "visible")
      tooltip.html(html)
    },
    move(event: any) {
      const { offsetX, offsetY } = event
      const width = size ? size.width : container.clientWidth
      const height = size ? size.height : container.clientHeight
      tooltip
        .style(
          "top",
          offsetY < height / 2
            ? `${offsetY + MOUSE_POS_Y_OFFSET}px`
            : "initial"
        )
        .style(
          "right",
          offsetX > width / 2
            ? `${width - offsetX + MOUSE_POS_X_OFFSET}px`
            : "initial"
        )
        .style(
          "bottom",
          offsetY > height / 2
            ? `${height - offsetY + MOUSE_POS_Y_OFFSET}px`
            : "initial"
        )
        .style(
          "left",
          offsetX < width / 2
            ? `${offsetX + MOUSE_POS_X_OFFSET}px`
            : "initial"
        );
    },
    hide() {
      tooltip.style("visibility", "hidden")
    }
  }
}

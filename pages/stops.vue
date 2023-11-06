<template>
  <p class="my-12 text-body-4">
    This is a WIP to demo UI state management, CSV parsing, front-end data aggregation, and plotting. The data used is only for PSA 91. Different filters do not yet update the results.
  </p>
  <div class="text-body-1">
    How many
    <SelectEvent v-model="selectedEvent"/>
    did Philadelphia police make
    <SelectLocation v-model="selectedLocation"/>,
    <SelectTimeGranularity v-model="selectedTimeGranularity"/>
    from
    <SelectTime v-model="selectedTime0"/>
    to
    <SelectTime v-model="selectedTime1"/>?
  </div>
  <div class="text-body-1">
    <SelectedResult>{{ selectedLocation }}</SelectedResult>,
    from
    <SelectedResult>{{ selectedTime0 }}</SelectedResult>
    to
    <SelectedResult>{{ selectedTime1 }}</SelectedResult>,
    Philadelphia police
    <SelectedResult>{{ selectedEvent }}</SelectedResult>
    a total of
    <SelectedResult>{{ question1Total }} {{ selectedEvent }}</SelectedResult>.
  </div>

  <svg></svg>
</template>

<script setup>
import SelectEvent from '~/components/SelectEvent.vue'
import SelectLocation from '~/components/SelectLocation.vue'
import SelectTimeGranularity from '~/components/SelectTimeGranularity.vue'
import SelectedResult from '~/components/ui/SelectedResult.vue';
import * as d3 from 'd3'

const selectedEvent = ref('stops')
const selectedLocation = ref('citywide')
const selectedTimeGranularity = ref('every year')
const selectedTime0 = ref(2015)
const selectedTime1 = ref(2023)
const question1Total = ref(0)

const data = ref([])

watch(selectedLocation, () => {
  console.log('selected location changed. reloading data')
  data.value = getDataFromCSV('/data/open_data_philly_psa-091.csv')
})

const parseTime = d3.timeParse("%y");

// const question1Data = computed(() => {
  
//   // console.log(graphData)
// })

onMounted(async () => {
  // data.value = await getDataFromCSV('/data/open_data_philly_psa-091.csv')
  const source = '/data/open_data_philly_psa-091.csv'
  data.value = await fetch(source)
    .then(response => response.text())
    .then(text => {
      const csv = CSVToArrayOfObjects(text);
      return csv;
    })
    .catch(error => {
      console.error(error);
    });
  updateQuestion1()
})

const updateQuestion1 = () => {
  console.log(data.value)
  const filteredData = data.value.filter(d => Number(d.year) >= selectedTime0.value && Number(d.year) <= selectedTime1.value)
  console.log(filteredData)
  const groupedData = groupBy(filteredData, 'year')
  console.log(groupedData)
  const graphData = []
  for (const [key, value] of Object.entries(groupedData)) {
    graphData.push({
      time: Number(key),
      amount: value.reduce((acc, cur) => {
        return acc + Number(cur['n_stopped'])
      }, 0)
    })
  }
  question1Total.value = graphData.reduce((acc, cur) => {
    return acc + cur.amount
  }, 0)
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 0;
  const marginBottom = 30;
  const marginLeft = 40;
  const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");
  // const svg = d3.select("svg").attr("width", width).attr("height", height);
  // const g = svg.append("g");
  // const x = d3
  //   .scaleTime()
  //   .domain(
  //     d3.extent(graphData, d => parseTime(d.time))
  //   )
  //   .rangeRound([0, width]);
  // const y = d3
  //   .scaleLinear()
  //   .domain(
  //     d3.extent(graphData, d => d.amount)
  //   )
  //   .rangeRound([height, 0]);
  const x = d3.scaleLinear()
    .domain(d3.extent(graphData, (d) => d.time))
    .range([marginLeft, width - marginRight])
  const y = d3.scaleLinear()
    .domain([0, d3.max(graphData, (d) => d.amount)])
    .range([height - marginBottom, marginTop]);
  svg.append("g")
    .attr("class", "fill-primary-600")
    .selectAll()
    .data(graphData)
    .join("rect")
      .attr("x", (d) => x(d.time))
      .attr("y", (d) => y(d.amount))
      .attr("height", (d) => y(0) - y(d.amount))
      .attr("width", (width / graphData.length) - 1);
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
      .text("Stops"));
}
</script>
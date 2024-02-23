<template>
  <LayoutPageHeader>
    <template #header>
      How many stops do police make, and who do they stop?
    </template>
    <template #image>
      <img class="w-full h-full object-cover object-[0%_20%]" src="~/assets/images/stops.jpg" alt="Closeup of police lights at night"/>
    </template>
    <template #quote>
      <Quote author="Carl Day, Pastor" source="https://www.facebook.com/CMThomasPHL/videos/578497320999248">
        <template #quoteText>
          <p>
            As a Black man, you’re just awaiting that moment. You’ll sit in the car and you’re just waiting for that time for the red and blue lights to come on.
          </p>
        </template>
      </Quote>
    </template>
    <template #jumplinks>
      <nav class="flex flex-col gap-3">
        <h2>Jump to:</h2>
        <ul class="flex flex-col gap-3">
          <li>
            <a href="#part1" class="deo_scroll text-hyperlink flex">
              <IconsChevron class="fill-white -rotate-90"/>
              How many stops do police make?
            </a>
          </li>
          <li>
            <a href="#part2" class="deo_scroll text-hyperlink flex">
              <IconsChevron class="fill-white -rotate-90"/>
              Who are police stopping in traffic stops?
            </a>
          </li>
        </ul>
      </nav>
    </template>
  </LayoutPageHeader>

  <main class="layout-container mt-4">
    <h2 id="part1" class="text-heading-2 text-center pt-16 mb-16">How many stops do police make?</h2>
    <section>
      <QuestionHeader>
          <h3>
            How many stops
            <!-- <SelectEvent v-model="selectedEvent" word-form="noun"/> -->
            did Philadelphia police make in <SelectLocation v-model="selectedLocation"/>, by <SelectTimeGranularity v-model="selectedTimeGranularity"/>
            <!-- from <SelectTime v-model="selectedTime0"/> to <SelectTime v-model="selectedTime1"/> -->
            ?
          </h3>
      </QuestionHeader>
      <IconsArrow class="text-primary-800 rotate-180 mx-auto my-8 h-6"/>
      <QuestionHeader>
          {{ q1?.text?.full_data_sentence }}
          <!-- From the start of 2014 to the present, Philadelphia police made a total of <SelectedResult>{{ q1Total.toLocaleString() }} traffic stops</SelectedResult> in <SelectedResult>{{ formatLocationForSentence(selectedLocation) }}</SelectedResult>. -->
          <!-- <SelectedResult>{{ formatLocationForSentence(selectedLocation, true) }}</SelectedResult>, from <SelectedResult>{{ selectedTime0 }}</SelectedResult> to <SelectedResult>{{ selectedTime1 }}</SelectedResult>, Philadelphia police <SelectedResult>{{ policeEvent[selectedEvent].verb_past }}</SelectedResult> a total of <SelectedResult>{{ q1Total.toLocaleString() }} people</SelectedResult>. -->
      </QuestionHeader>
      <Graph :graph-data="q1?.figures?.barplot?.data" :axis-properties="{x: q1?.figures?.barplot?.properties?.xAxis, y: q1?.figures?.barplot?.properties?.yAxis}">
          <h3 class="max-w-[500px] mx-auto">Number of PPD Traffic Stops in {{ selectedLocation }} from 2014 through 2023</h3>
      </Graph>
      <QuestionHeader>
          <div class="text-body-3 leading-6 text-left whitespace-pre-line">{{ q1?.text?.data_over_time_sentences }}</div>
      </QuestionHeader>
    </section>

    <HorizontalLine class="my-16"/>

    <section>
      <QuestionHeader>
          <h3>
            Does traffic enforcement change depending on the time of year?
            How many traffic stops do Philadelphia police make in certain times of the year in
            <SelectLocation v-model="selectedLocation"/>?
          </h3>
      </QuestionHeader>
      <div class="mx-auto max-w-2xl mt-8">
        <div class="text-label-1 text-center">Select time(s) of year</div>
        <SelectTimeOfYear class="mt-2 max-w-[390px] mx-auto" v-model="q12TimeOfYear"/>
      </div>
      <IconsArrow class="text-primary-800 rotate-180 mx-auto my-8 h-6"/>
      <Graph :graph-data="q12GraphData" :axis-properties="{x: 'time', y: 'amount'}">
          <h3 class="max-w-[550px] mx-auto">Number of PPD Traffic Stops in {{ selectedLocation }} for {{ grammaticalJoin(q12TimeOfYear) }}</h3>
      </Graph>
    </section>

    <HorizontalLine class="mt-16"/>
    <h2 id="part2" class="text-heading-2 text-center pt-20 mb-16">Who are police stopping in traffic stops?</h2>
    <section>
      <QuestionHeader>
          How often did Philadelphia police stop
          <!-- <SelectEvent v-model="selectedEvent" word-form="verb_present"/> -->
          people of different
          <SelectDemographicCategory v-model="selectedDemographic"></SelectDemographicCategory>
          from the start of <SelectQuarter v-model="selectedTime0"/> to the end of <SelectQuarter v-model="selectedTime1"/>,
          in <SelectLocation v-model="selectedLocation"/>?
      </QuestionHeader>
      <IconsArrow class="text-primary-800 rotate-180 mx-auto my-8 h-6"/>
      <Graph :graph-data="summedDataByDemographic" :axis-properties="{x: selectedDemographic, y: selectedEvent}">
          <h3 class="max-w-[500px] mx-auto">
            Number of Philadelphia police stops
            <!-- {{ policeEvent[selectedEvent].noun }} -->
            of vehicles driven by different {{ selectedDemographic }}, {{ selectedLocation }},from {{ selectedTime0 }} to {{ selectedTime1 }}.
          </h3>
      </Graph>
    </section>

    <HorizontalLine class="my-16"/>

    <section>
      <QuestionHeader>
          Which demographic groups did Philadelphia police most frequently stop in
          <SelectLocation v-model="selectedLocation" :capitalize="true"/>
          from the start of <SelectTime v-model="selectedTime0"/> to the end of <SelectTime v-model="selectedTime1"/>?
          <!-- <SelectEvent v-model="selectedEvent" word-form="verb_past"/> -->
      </QuestionHeader>
      <IconsArrow class="text-primary-800 rotate-180 mx-auto my-8 h-6"/>
      <QuestionHeader>
          Philadelphia police most frequently stopped
          <SelectedResult>{{ sortedSummedDataTopDemographic[0] }}, {{ sortedSummedDataTopDemographic[1] }}, {{ sortedSummedDataTopDemographic[2] }} year old</SelectedResult>
          drivers in <SelectedResult>{{ formatLocationForSentence(selectedLocation) }}</SelectedResult>
          from <SelectedResult>{{ selectedTime0 }}</SelectedResult> to <SelectedResult>{{ selectedTime1 }}</SelectedResult>,
          making up <SelectedResult>{{ (Object.values(sortedSummedData)[0] / q1Total * 100).toFixed(2) }}%</SelectedResult> of all stops.
      </QuestionHeader>
      <div class="deo-table mt-10">
        <div class="relative w-full">
          <table class="w-full">
            <thead class="w-full">
              <tr>
                <th class="w-1/4">Race</th>
                <th class="w-1/4">Gender</th>
                <th class="w-1/4">Age Range</th>
                <th class="w-1/4">% of Stops</th>
              </tr>
            </thead>
          </table>
        </div>
        <div class="w-full h-[400px] overflow-y-scroll">
          <table class="text-body-3 relative w-full">
            <tbody class="w-full">
              <tr v-for="(value, key) in sortedSummedData">
                <td class="w-1/4">{{ key.split(':')[0] }}</td>
                <td class="w-1/4">{{ key.split(':')[1] }}</td>
                <td class="w-1/4">{{ key.split(':')[2] }}</td>
                <td class="w-1/4">{{ (value / q1Total * 100).toFixed(2) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <HorizontalLine class="my-16"/>

    <section>
      <QuestionHeader>
          <h3>
            How many times did Philadelphia police stop one demographic group compared to another in
            <SelectLocation v-model="selectedLocation"/>, from <SelectTime v-model="selectedTime0"/> to <SelectTime v-model="selectedTime1"/>?
          </h3>
      </QuestionHeader>
      <div class="mx-auto max-w-2xl mt-16">
        <div class="text-label-1 text-center">Select two demographic groups and compare</div>
        <div class="grid grid-cols-2 gap-4 mt-6">
          <div class="col-span-1 flex flex-col gap-6 text-body-1 font-medium">
            <h4 class="text-label-2 flex gap-2 items-center">
              Group 1
              <div class="demographic-group-square bg-primary-600"></div>
            </h4>
            <SelectAgeGroup v-model="q2Group1AgeRanges"/>
            <SelectGenderIdentity v-model="q2Group1Genders"/>
            <SelectRaces v-model="q2Group1Races"/>
          </div>
          <div class="col-span-1 flex flex-col gap-6 text-body-1 font-medium">
            <h4 class="text-label-2 flex gap-2 items-center">
              Group 2
              <div class="demographic-group-square bg-red"></div>
            </h4>
            <SelectAgeGroup v-model="q2Group2AgeRanges"/>
            <SelectGenderIdentity v-model="q2Group2Genders"/>
            <SelectRaces v-model="q2Group2Races"/>
          </div>
        </div>
      </div>
      <IconsArrow class="text-primary-800 rotate-180 mx-auto my-8 h-6"/>
      <Graph :graph-data="q2GraphData" :axis-properties="{x: 'time', y: 'amount'}" group-name="group" :group-classes="{'group1': 'fill-primary-600', 'group2': 'fill-red'}">
          <h2 class="max-w-[500px] mx-auto">
            Number of PPD Traffic Stops in
            {{ formatLocationForSentence(selectedLocation) }} from {{ selectedTime0 }} through {{ selectedTime1 }}
            Comparing
            <SelectedResult>
              <span class="text-label-1">Group 1</span> <div class="demographic-group-square bg-primary-600"></div>
            </SelectedResult>
            and
            <SelectedResult>
              <span class="text-label-1">Group 2</span> <div class="demographic-group-square bg-red"></div>
            </SelectedResult>
          </h2>
      </Graph>
    </section>
  </main>

  <HorizontalLine class="my-16"/>
</template>

<style>
.demographic-group-square {
  @apply inline-block w-6 h-6 align-middle;
}
</style>

<script setup>
import QuestionHeader from '~/components/QuestionHeader.vue';
import Graph from '~/components/Graph.vue';
import SelectEvent from '~/components/SelectEvent.vue'
import SelectLocation from '~/components/SelectLocation.vue'
import SelectTimeGranularity from '~/components/SelectTimeGranularity.vue'
import SelectDemographicCategory from '~/components/SelectDemographicCategory.vue'
import SelectedResult from '~/components/ui/SelectedResult.vue';
import HorizontalLine from '~/components/ui/HorizontalLine.vue';
import * as d3 from 'd3'
import { capitalize } from 'vue';
import { QuarterMonths } from '~/utils/index'

const selectedEvent = ref('n_stopped')
const selectedLocation = ref('Philadelphia')
const selectedTimeGranularity = ref('year')
const selectedTime0 = ref(2015)
const selectedTime1 = ref(2023)
const selectedDemographic = ref('age_range')
const q1GraphData = ref([])
const q1Total = ref(0)
const q12TimeOfYear = ref(['Jan-Mar'])
const q12GraphData = ref([])
const q2Group1AgeRanges = ref(['25-34'])
const q2Group2AgeRanges = ref(['25-34'])
const q2Group1Genders = ref(['Male'])
const q2Group2Genders = ref(['Male'])
const q2Group1Races = ref(['black'])
const q2Group2Races = ref(['white'])
const q2GraphData = ref([])
const sortedSummedData = ref([])
const sortedSummedDataTopDemographic = ref([])
const summedDataByDemographic = ref([])

const watchedParameters = ref([selectedEvent, selectedLocation, selectedTimeGranularity, q12TimeOfYear, selectedTime0, selectedTime1, selectedDemographic, q2Group1AgeRanges, q2Group2AgeRanges, q2Group1Genders, q2Group2Genders, q2Group1Races, q2Group2Races])

const data = ref([])

// watch(selectedLocation, () => {
//   console.log('selected location changed. reloading data')
//   // data.value = getDataFromCSV('/data/open_data_philly_psa-091.csv')
// })

const parseTime = d3.timeParse("%y");

onMounted(async () => {
  // data.value = await getDataFromCSV('/data/open_data_philly_psa-091.csv')
  const source = '/data/open_data_philly.csv'
  data.value = await fetch(source)
    .then(response => response.text())
    .then(text => {
      const csv = CSVToArrayOfObjects(text);
      return csv;
    })
    .catch(error => {
      console.error(error);
    });
  calculateQuestion1Data()
})

const sumGroupedDataByKey = (groupedData, key) => {
  return Object.values(objectMap(groupedData, (group, year) => { 
    return {
      time: year,
      amount: group.reduce((acc, cur) => {
        return acc + Number(cur[key])
      }, 0)
    }
  }))
}

const sumUniqueCombinations = (data, categories) => {
  // Create an object to store the sums for each unique combination
  const sums = {};
  // Iterate through each row in the table
  data.forEach(item => {
    const values = categories.map(category => item[category])
    const key = values.join(':')
    if (!sums[key]) {
      sums[key] = Number(item[selectedEvent.value]);
    } else {
      sums[key] += Number(item[selectedEvent.value]);
    }
  });
  return sums;
}

const sortObjectByValues = (obj) => {
  const entries = Object.entries(obj);
  entries.sort((a, b) => b[1] - a[1]);
  const sortedObject = Object.fromEntries(entries);
  return sortedObject;
}

// initialize a map between numbers and sets of nubmers
const districtsByDivision = new Map([
  ['NEPD', new Set([2, 7, 8, 15])],
  ['NWPD', new Set([5, 14, 39, 35])],
  ['EPD', new Set([24, 25, 26])],
  ['CPD', new Set([6, 9, 22])],
  ['SPD', new Set([1, 3, 17])],
  ['SWPD', new Set([12, 16, 18, 19, 77])]
])

const apiBaseUrl = 'https://deo-fastapi.onrender.com'
const q1 = ref(null)
async function fetchQ1() {
  const endpoint = '/stops/num-stops'
  const q1Request = await useFetch(`${apiBaseUrl}${endpoint}`, {
    params: {
      location: "*",
      time_aggregation: selectedTimeGranularity.value,
    }
  })
  console.log(q1Request.data.value)
  console.log(q1Request.data.value.figures.barplot)
  q1.value = q1Request.data.value
  // q1GraphData.value = q1Request.data
}
fetchQ1()

const filterByLocationValue = (inputData) => {
  if (selectedLocation.value.startsWith('District')) {
    const districtNumber = parseInt(selectedLocation.value.substring(9))
    return inputData.value.filter(d => Number(d.districtoccur) === districtNumber)
  } else if (selectedLocation.value.startsWith('PSA')) {
    const district = selectedLocation.value.substring(4,6)
    const psa = selectedLocation.value.substring(6)
    return inputData.value.filter(d => d.districtoccur === district && d.psa === psa)
  } else if (selectedLocation.value.startsWith('Division')) {
    const division = selectedLocation.value.substring(9)
    const districts = districtsByDivision.get(division)
    return inputData.value.filter(d => districts.has(Number(d.districtoccur)))
  } else {
    return inputData.value
  }
}


const calculateQuestion1Data = () => {
  let filteredData = filterByLocationValue(data)
  filteredData = filteredData.filter(d => Number(d.year) >= selectedTime0.value && Number(d.year) <= selectedTime1.value)
  const groupedData = groupBy(filteredData, selectedTimeGranularity.value)
  console.log(groupedData)

  q1GraphData.value = sumGroupedDataByKey(groupedData, selectedEvent.value)
  q1Total.value = q1GraphData.value.reduce((acc, cur) => acc + cur.amount, 0)
  console.log(q1GraphData)

  const q12QuarterNames = q12TimeOfYear.value.map(monthRange => `Q${QuarterMonths[monthRange]}`)
  const q12FilteredData = filteredData.filter(d => q12QuarterNames.includes(d.q_str))
  const q12GroupedData = groupBy(q12FilteredData, 'year')
  q12GraphData.value = sumGroupedDataByKey(q12GroupedData, selectedEvent.value)

  const q2Group1Filtered = objectMap(groupedData, group => group.filter(d => q2Group1AgeRanges.value.includes(d.age_range) && q2Group1Genders.value.includes(d.gender) && q2Group1Races.value.includes(d.race)))
  const q2Group2Filtered = objectMap(groupedData, group => group.filter(d => q2Group2AgeRanges.value.includes(d.age_range) && q2Group2Genders.value.includes(d.gender) && q2Group2Races.value.includes(d.race)))
  const q2Group1GraphData = sumGroupedDataByKey(q2Group1Filtered, selectedEvent.value).map(d => { return { ...d, group: 'group1' }})
  const q2Group2GraphData = sumGroupedDataByKey(q2Group2Filtered, selectedEvent.value).map(d => { return { ...d, group: 'group2' }})
  q2GraphData.value = [...q2Group1GraphData, ...q2Group2GraphData]

  const summedData = sumUniqueCombinations(filteredData, ['race', 'gender', 'age_range'])
  sortedSummedData.value = sortObjectByValues(summedData)
  sortedSummedDataTopDemographic.value = Object.keys(sortedSummedData.value)[0].split(':')
  // sortedSummedDataTotal.value = Object.values(sortedSummedData.value).reduce((acc, cur) => acc + cur, 0)

  summedDataByDemographic.value = Object.entries(sumUniqueCombinations(filteredData, [selectedDemographic.value])).map(([key, value]) => {
    return {
      [selectedDemographic.value]: key,
      [selectedEvent.value]: value
    }
  })
}



// watch all variables that affect the data and re-run updateQuestion1() when they change
watch(watchedParameters, () => {
  console.log(selectedLocation.value)
  calculateQuestion1Data()
}, { deep: true })
</script>
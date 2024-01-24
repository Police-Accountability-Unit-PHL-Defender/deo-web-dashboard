<template>
  <LayoutPageHeader>
    <template #header>
      How many stops have police made in my neighborhood?
    </template>
    <template #image>
      <img class="w-full h-full object-cover" src="~/assets/images/stops.jpg" alt="Closeup of police lights at night"/>
    </template>
    <template #quote>
      <Quote author="Carl Day, Pastor" source="https://phillydefenders.org">
        <template #quoteText>
          <p>
            As a Black man, oftentimes I’ve definitely been targeted by police. I’ve watched police make U-turns after just riding by them if there happen to be two Black men in the car. I watched them follow me for periods of time and ultimately, just to finally turn those lights on. As a Black man, you’re just awaiting that moment. You’ll sit in the car and you’re just waiting for that time for the red and blue lights to come on.
          </p>
        </template>
      </Quote>
    </template>
  </LayoutPageHeader>

  <section>
    <QuestionHeader>
      <template #content>
        How many stops
        <!-- <SelectEvent v-model="selectedEvent" word-form="noun"/> -->
        did Philadelphia police make <SelectLocation v-model="selectedLocation"/>, <SelectTimeGranularity v-model="selectedTimeGranularity"/> from <SelectTime v-model="selectedTime0"/> to <SelectTime v-model="selectedTime1"/>?
      </template>
    </QuestionHeader>
    <IconsArrow class="text-neutral-200 rotate-180 mx-auto my-10"/>
    <QuestionHeader>
      <template #content>
        <SelectedResult>{{ formatLocationForSentence(selectedLocation, true) }}</SelectedResult>, from <SelectedResult>{{ selectedTime0 }}</SelectedResult> to <SelectedResult>{{ selectedTime1 }}</SelectedResult>, Philadelphia police <SelectedResult>{{ policeEvent[selectedEvent].verb_past }}</SelectedResult> a total of <SelectedResult>{{ q1Total.toLocaleString() }} people</SelectedResult>.
      </template>
    </QuestionHeader>
    <Graph :graph-data="q1GraphData" :axis-properties="{x: 'time', y: 'amount'}">
      <template #title>
        <h2>
          Number of stops
          <!-- {{ policeEvent[selectedEvent].noun }} -->
          {{ formatLocationForSentence(selectedLocation) }} from {{ selectedTime0 }} to {{ selectedTime1 }}</h2>
      </template>
    </Graph>
  </section>

  <HorizontalLine class="my-20"/>

  <section>
    <QuestionHeader>
      <template #content>
        What are the ages, genders, and racial identities of people stopped 
        <!-- <SelectEvent v-model="selectedEvent" word-form="verb_past"/>&nbsp; -->
        <SelectLocation v-model="selectedLocation"/>, from <SelectTime v-model="selectedTime0"/> to <SelectTime v-model="selectedTime1"/>?
      </template>
    </QuestionHeader>
    <div class="mx-auto max-w-2xl mt-16">
      <div class="text-label-1 text-center">Select demographics and compare</div>
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
    <IconsArrow class="text-neutral-200 rotate-180 mx-auto my-10"/>
    <Graph :graph-data="q2GraphData" :axis-properties="{x: 'time', y: 'amount'}" group-name="group" :group-classes="{'group1': 'fill-primary-600', 'group2': 'fill-red'}">
      <template #title>
        <h2 class="max-w-[500px] mx-auto">
          Number of stops
          <!-- {{ policeEvent[selectedEvent].noun }} -->
          of vehicles driven by
          <SelectedResult>
            <span class="text-label-1">Group 1</span> <div class="demographic-group-square bg-primary-600"></div>
          </SelectedResult>
          and
          <SelectedResult>
            <span class="text-label-1">Group 2</span> <div class="demographic-group-square bg-red"></div>
          </SelectedResult>
          {{ formatLocationForSentence(selectedLocation) }} from {{ selectedTime0 }} to {{ selectedTime1 }}
        </h2>
      </template>
    </Graph>
  </section>

  <HorizontalLine class="my-20"/>

  <section>
    <QuestionHeader>
      <template #content>
        <SelectLocation v-model="selectedLocation" :capitalize="true"/>, from <SelectTime v-model="selectedTime0"/> to <SelectTime v-model="selectedTime1"/> which demographic groups did Philadelphia police most frequently stop?
        <!-- <SelectEvent v-model="selectedEvent" word-form="verb_past"/> -->
      </template>
    </QuestionHeader>
    <IconsArrow class="text-neutral-200 rotate-180 mx-auto my-10"/>
    <QuestionHeader>
      <template #content>
        <SelectedResult>{{ formatLocationForSentence(selectedLocation, true) }}</SelectedResult>, from <SelectedResult>{{ selectedTime0 }}</SelectedResult> to <SelectedResult>{{ selectedTime1 }}</SelectedResult>, Philadelphia police most frequently
        stopped
        <!-- <SelectedResult>{{ policeEvent[selectedEvent].verb_past }}</SelectedResult> -->
        people who they identified as <SelectedResult>{{ sortedSummedDataTopDemographic[0] }}, {{ sortedSummedDataTopDemographic[1] }}, and {{ sortedSummedDataTopDemographic[2] }} years old</SelectedResult>.
      </template>
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


  <HorizontalLine class="my-20"/>

  <section>
    <QuestionHeader>
      <template #content>
        How often did Philadelphia police stop
        <!-- <SelectEvent v-model="selectedEvent" word-form="verb_present"/> -->
        vehicles, passengers, and/or drivers of different <SelectDemographicCategory v-model="selectedDemographic"></SelectDemographicCategory> from <SelectTime v-model="selectedTime0"/> to <SelectTime v-model="selectedTime1"/>, <SelectLocation v-model="selectedLocation"/>?
      </template>
    </QuestionHeader>
    <IconsArrow class="text-neutral-200 rotate-180 mx-auto my-10"/>
    <Graph :graph-data="summedDataByDemographic" :axis-properties="{x: selectedDemographic, y: selectedEvent}">
      <template #title>
        <h2 class="max-w-[500px] mx-auto">
          Number of Philadelphia police stops
          <!-- {{ policeEvent[selectedEvent].noun }} -->
          of vehicles driven by different {{ selectedDemographic }}, {{ selectedLocation }}, from {{ selectedTime0 }} to {{ selectedTime1 }}.
        </h2>
      </template>
    </Graph>
  </section>
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

const selectedEvent = ref('n_stopped')
const selectedLocation = ref('citywide')
const selectedTimeGranularity = ref('every year')
const selectedTime0 = ref(2015)
const selectedTime1 = ref(2023)
const selectedDemographic = ref('age_range')
const q1GraphData = ref([])
const q1Total = ref(0)
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

const watchedParameters = ref([selectedEvent, selectedLocation, selectedTimeGranularity, selectedTime0, selectedTime1, selectedDemographic, q2Group1AgeRanges, q2Group2AgeRanges, q2Group1Genders, q2Group2Genders, q2Group1Races, q2Group2Races])

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
    console.log(data.value)
  calculateQuestion1Data()
})

const sumGroupedDataByKey = (groupedData, key) => {
  return Object.values(objectMap(groupedData, (group, year) => { 
    return {
      time: Number(year),
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
  const groupedData = groupBy(filteredData, 'year')

  q1GraphData.value = sumGroupedDataByKey(groupedData, selectedEvent.value)
  q1Total.value = q1GraphData.value.reduce((acc, cur) => acc + cur.amount, 0)

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
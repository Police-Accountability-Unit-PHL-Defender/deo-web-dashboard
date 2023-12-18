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
  <QuestionHeader>
    <template #content>
      How many <SelectEvent v-model="selectedEvent" word-form="noun"/> did Philadelphia police make <SelectLocation v-model="selectedLocation"/>, <SelectTimeGranularity v-model="selectedTimeGranularity"/> from <SelectTime v-model="selectedTime0"/> to <SelectTime v-model="selectedTime1"/>?
    </template>
  </QuestionHeader>
  <QuestionHeader>
    <template #content>
      <SelectedResult>{{ selectedLocation }}</SelectedResult>, from <SelectedResult>{{ selectedTime0 }}</SelectedResult> to <SelectedResult>{{ selectedTime1 }}</SelectedResult>, Philadelphia police <SelectedResult>{{ policeEvent[selectedEvent].verb_past }}</SelectedResult> a total of <SelectedResult>{{ q1Total }} people</SelectedResult>.
    </template>
  </QuestionHeader>
  <Graph :graph-data="q1GraphData" :axis-properties="{x: 'time', y: 'amount'}">
    <template #title>
      <h2>Number of {{ policeEvent[selectedEvent].noun }} {{ selectedLocation }} from {{ selectedTime0 }} to {{ selectedTime1 }}</h2>
    </template>
  </Graph>
  <HorizontalLine class="my-20"/>

  <QuestionHeader>
    <template #content>
      What are the ages, genders, and racial identities of people<br/> <SelectEvent v-model="selectedEvent" word-form="verb_past"/>&nbsp; <SelectLocation v-model="selectedLocation"/>, from <SelectTime v-model="selectedTime0"/> to <SelectTime v-model="selectedTime1"/>?
    </template>
  </QuestionHeader>

  <div>
    <div class="text-label-1">Select demographics and compare</div>
    <div class="grid grid-cols-2">
      <div>
        <h4 class="text-label-2">Group 1</h4>
        <SelectAgeGroup v-model="q2Group1AgeRanges"/>
        <SelectGenderIdentity v-model="q2Group1Genders"/>
        <SelectRaces v-model="q2Group1Races"/>
      </div>
      <div>
        <h4 class="text-label-2">Group 2</h4>
        <SelectAgeGroup v-model="q2Group2AgeRanges"/>
        <SelectGenderIdentity v-model="q2Group2Genders"/>
        <SelectRaces v-model="q2Group2Races"/>
      </div>
    </div>
    <!-- <div class="text-body-4">
      <p>
        <strong>Why the quotes?</strong>
        The quotes are meant to highlight that police record data is created by police officers. During an incident, the police officer records a person's age group, sex, and race, often without actually asking them. These categories and their names come directly from the system that Philadelphia Police have designed for recording their interactions with people.
      </p>
    </div> -->
  </div>

  <Graph :graph-data="q2GraphData" :axis-properties="{x: 'time', y: 'amount'}" group-name="group" :group-classes="{'group1': 'fill-primary-600', 'group2': 'fill-red'}">
    <template #title>
      <h2>Number of {{ policeEvent[selectedEvent].noun }} of vehicles driven by <span class="text-label-1">Group 1</span> and <span class="text-label-1">Group 2</span> {{ selectedLocation }} from {{ selectedTime0 }} to {{ selectedTime1 }}</h2>
    </template>
  </Graph>

  <HorizontalLine class="my-20"/>

  <QuestionHeader>
    <template #content>
      <SelectLocation v-model="selectedLocation"/>, from <SelectTime v-model="selectedTime0"/> to <SelectTime v-model="selectedTime1"/> which demographic groups did Philadelphia police most frequently <SelectEvent v-model="selectedEvent" word-form="verb_past"/>?
    </template>
  </QuestionHeader>

  <QuestionHeader>
    <template #content>
      <SelectedResult>{{ selectedLocation }}</SelectedResult>, from <SelectedResult>{{ selectedTime0 }}</SelectedResult> to <SelectedResult>{{ selectedTime1 }}</SelectedResult>, Philadelphia police most frequently <SelectedResult>{{ policeEvent[selectedEvent].verb_past }}</SelectedResult> people who they identified as <SelectedResult>{{ sortedSummedDataTopDemographic[0] }}, {{ sortedSummedDataTopDemographic[1] }}, and {{ sortedSummedDataTopDemographic[2] }} years old</SelectedResult>.
    </template>
  </QuestionHeader>

  <div>
    <div class="max-h-[400px] overflow-y-hidden">
      <table>
        <thead>
          <tr>
            <th>Race</th>
            <th>Gender</th>
            <th>Age Range</th>
            <th>Percentage of {{ selectedEvent }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(value, key) in sortedSummedData">
            <td>{{ key.split(':')[0] }}</td>
            <td>{{ key.split(':')[1] }}</td>
            <td>{{ key.split(':')[2] }}</td>
            <td>{{ (value / q1Total * 100).toFixed(2) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <HorizontalLine class="my-20"/>

  <QuestionHeader>
    <template #content>
      How often did Philadelphia police <SelectEvent v-model="selectedEvent" word-form="verb_present"/> vehicles, passengers, and/or drivers of different <SelectDemographicCategory v-model="selectedDemographic"></SelectDemographicCategory> from <SelectTime v-model="selectedTime0"/> to <SelectTime v-model="selectedTime1"/>, <SelectLocation v-model="selectedLocation"/>?
    </template>
  </QuestionHeader>

  <QuestionHeader>
    <template #content>
      Number of Philadelphia police <SelectedResult>{{ policeEvent[selectedEvent].noun }}</SelectedResult> of vehicles driven by different <SelectedResult>{{ selectedDemographic }}</SelectedResult>, <SelectedResult>{{ selectedLocation }}</SelectedResult>, from <SelectedResult>{{ selectedTime0 }}</SelectedResult> to <SelectedResult>{{ selectedTime1 }}</SelectedResult>.
    </template>
  </QuestionHeader>

  <Graph :graph-data="summedDataByDemographic" :axis-properties="{x: selectedDemographic, y: selectedEvent}"></Graph>
</template>

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

watch(selectedLocation, () => {
  console.log('selected location changed. reloading data')
  data.value = getDataFromCSV('/data/open_data_philly_psa-091.csv')
})

const parseTime = d3.timeParse("%y");

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


const calculateQuestion1Data = () => {
  const filteredData = data.value.filter(d => Number(d.year) >= selectedTime0.value && Number(d.year) <= selectedTime1.value)
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
  calculateQuestion1Data()
}, { deep: true })
</script>
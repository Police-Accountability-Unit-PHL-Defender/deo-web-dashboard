<template>
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
    <SelectedResult>400 vehicles</SelectedResult>.
  </div>

  {{ question1Data }}
</template>

<script setup>
import SelectEvent from '~/components/SelectEvent.vue'
import SelectLocation from '~/components/SelectLocation.vue'
import SelectTimeGranularity from '~/components/SelectTimeGranularity.vue'
import SelectedResult from '~/components/ui/SelectedResult.vue';

const selectedEvent = ref('stops')
const selectedLocation = ref('citywide')
const selectedTimeGranularity = ref('every year')
const selectedTime0 = ref(2015)
const selectedTime1 = ref(2023)

const data = ref([])

watch(selectedLocation, () => {
  console.log('selected location changed. reloading data')
  data.value = getDataFromCSV('/data/open_data_philly_psa-091.csv')
})

const question1Data = computed(() => {
  console.log('hi')
  console.log(data)
  const filteredData = data.value.filter(d => d.year >= selectedTime0 && d.year <= selectedTime1)
  const groupedData = groupBy(filteredData, 'year')
  const reducedData = objectMap(groupedData, group => group.length)
  console.log(reducedData)
})

onMounted(async () => {
  // data.value = await getDataFromCSV('/data/open_data_philly_psa-091.csv')
  const source = '/data/open_data_philly_psa-091.csv'
  data.value = await fetch(source)
    .then(response => response.text())
    .then(text => {
      const csv = CSVToArrayOfObjects(text);
      return data;
    })
    .catch(error => {
      console.error(error);
    });
  console.log(data.value)
})
</script>
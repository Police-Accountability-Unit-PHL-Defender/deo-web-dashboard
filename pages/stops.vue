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
</script>
<template>
  How many
  <SelectStops />
  did Philadelphia police make
  <SelectLocation />,
  <SelectTimeGranularity />
  from 2015 to 2023?
</template>

<script setup>
import SelectStops from '~/components/SelectStops.vue'
import SelectLocation from '~/components/SelectLocation.vue'
import SelectTimeGranularity from '~/components/SelectTimeGranularity.vue'
</script>
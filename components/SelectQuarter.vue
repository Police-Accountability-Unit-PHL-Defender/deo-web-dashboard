<template>
  <SelectOne
    :items="items"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  // TODO: Options for years should be based on available data
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023]
  const quarterMonths = Object.values(QuarterMonths).filter(key => typeof(key) === 'string')
  const items = years.flatMap(year => quarterMonths.map(quarter => `${quarter} ${year}`))
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>
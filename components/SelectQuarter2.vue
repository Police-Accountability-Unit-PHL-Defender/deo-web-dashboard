<template>
  <SelectOne
    :items="items"
    :modelValue="modelValue"
    :itemDisplayText="itemDisplayText"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  // TODO: Options for years should be based on available data
  const years = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023]
  const quarterMonths = Object.values(QuarterMonths).filter(key => typeof(key) === 'string')
  const items = years.flatMap(year => quarterMonths.map(quarter => new Quarter(year, QuarterMonths[quarter])))
  const props = defineProps(['modelValue', 'itemLabelEnd'])
  const emit = defineEmits(['update:modelValue'])

  const itemDisplayText = computed(() => {
    if (!props.itemLabelEnd) return
    if (props.itemLabelEnd === 'start') {
      return items.reduce((acc, item) => {
        acc[item] = item.getStartString()
        return acc
      }, {})
    } else if (props.itemLabelEnd === 'end') {
      return items.reduce((acc, item) => {
        acc[item] = item.getEndString()
        return acc
      }, {})
    }
  })
</script>
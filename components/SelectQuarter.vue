<template>
  <SelectOne
    :items="selectableQuarters"
    :modelValue="modelValue"
    :itemDisplayText="itemDisplayText"
    :disabledItems="disabledItems"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const config = useRuntimeConfig()
  const firstQuarter = new Quarter(2014, 1)
  const mostRecentQuarter = Quarter.fromParamString(config.public.mostRecentQuarter)
  let currentQuarter = firstQuarter
  let availableQuarters = [currentQuarter]
  while (!Quarter.isSameQuarter(currentQuarter, mostRecentQuarter)) {
    currentQuarter = currentQuarter.getNextQuarter()
    availableQuarters.push(currentQuarter)
  }
  const props = defineProps(['modelValue', 'itemLabelEnd', 'minSelectable', 'maxSelectable'])
  const emit = defineEmits(['update:modelValue'])
  const selectableQuarters = computed(() => {
    if (!props.minSelectable) return availableQuarters
    const minSelectableIndex = availableQuarters.findIndex(q => Quarter.isSameQuarter(q, props.minSelectable))
    return availableQuarters.slice(minSelectableIndex)
  })
  const itemDisplayText = computed(() => {
    if (!props.itemLabelEnd) return
    if (props.itemLabelEnd === 'start') {
      return selectableQuarters.value.reduce((acc, item) => {
        acc[item] = item.getStartString()
        return acc
      }, {})
    } else if (props.itemLabelEnd === 'end') {
      return selectableQuarters.value.reduce((acc, item) => {
        acc[item] = item.getEndString()
        return acc
      }, {})
    }
  })
  const disabledItems = computed(() => {
    if (!props.maxSelectable) return []
    const maxSelectableIndex = availableQuarters.findIndex(q => Quarter.isSameQuarter(q, props.maxSelectable))
    if (maxSelectableIndex === -1 || maxSelectableIndex === availableQuarters.length - 1) {
      return []
    }
    const disabledQuarters = availableQuarters.slice(maxSelectableIndex + 1)
    return disabledQuarters
  })
</script>
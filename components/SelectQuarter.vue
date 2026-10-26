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
  // Options are actual published quarters, capped by the calendar/pin.
  const availableQuarters = useState('stopsQuarters').value.map(q => Quarter.fromParamString(q))
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

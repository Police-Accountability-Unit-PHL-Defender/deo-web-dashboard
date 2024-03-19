<template>
  <SelectOne
    :items="availableQuarters"
    :modelValue="modelValue"
    :itemDisplayText="itemDisplayText"
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
  const props = defineProps(['modelValue', 'itemLabelEnd'])
  const emit = defineEmits(['update:modelValue'])
  const itemDisplayText = computed(() => {
    if (!props.itemLabelEnd) return
    if (props.itemLabelEnd === 'start') {
      return availableQuarters.reduce((acc, item) => {
        acc[item] = item.getStartString()
        return acc
      }, {})
    } else if (props.itemLabelEnd === 'end') {
      return availableQuarters.reduce((acc, item) => {
        acc[item] = item.getEndString()
        return acc
      }, {})
    }
  })
</script>
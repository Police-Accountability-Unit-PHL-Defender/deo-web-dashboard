<template>
  <SelectOne
    :items="items"
    :itemDisplayText="itemDisplayText"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = ['n_stopped', 'n_frisked', 'n_searched', 'n_intruded']
  const props = defineProps(['modelValue', 'wordForm'])
  const emit = defineEmits(['update:modelValue'])
  const itemDisplayText = computed(() => {
    if (!props.wordForm) return null
    const obj = items.reduce((acc, item) => {
      acc[item] = policeEvent[item][props.wordForm]
      return acc
    }, {})
    return obj
  })
</script>
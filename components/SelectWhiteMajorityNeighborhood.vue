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
  const items = ['Non-white', 'White']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
  const itemDisplayText = {
    'Non-white': 'non-white districts, compared to majority white districts',
    'White': 'white-districts, compared to majority non-white districts'
  }
</script>
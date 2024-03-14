<template>
  <SelectOne
    :items="items"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = ['Under 25', '25-34', '35-44', '45-54', '55-64', '65+']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>
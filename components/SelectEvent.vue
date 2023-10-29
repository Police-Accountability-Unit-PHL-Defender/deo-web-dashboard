<template>
  <SelectOne
    :items="items"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = ['stops', 'frisks', 'searches', 'intrusions']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>
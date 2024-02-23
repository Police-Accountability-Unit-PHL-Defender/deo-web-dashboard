<template>
  <SelectOne
    :items="items"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = ['Age Range', 'Race', 'Gender']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>
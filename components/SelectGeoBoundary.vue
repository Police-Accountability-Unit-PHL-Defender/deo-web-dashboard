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
  const items = ['city', 'district', 'division', 'psa']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>
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
  const items = ['Black', 'White']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
  const itemDisplayText = {
    'Black': 'Black drivers, compared to white drivers',
    'White': 'white drivers, compared to Black drivers'
  }
</script>
<template>
  <label class="block text-body-3">"Race"</label>
  <SelectOne
    :items="items"
    :modelValue="modelValue"
    :multiple="true"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = ['asian', 'black', 'latino', 'white', 'other_race']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>
<template>
  <div>
    <SelectOne
      :items="items"
      :modelValue="modelValue"
      :multiple="true"
      @update:modelValue="value => emit('update:modelValue', value)"
    />
  </div>
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>
<template>
  <div>
    <label class="block text-body-3 mb-2 font-normal">Age group</label>
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
  const items = ['<25', '25-34', '35-44', '45-54', '55-64', '65+']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>
<template>
  <div>
    <label class="block text-caption mb-[6px] font-normal">Age and gender</label>
    <SelectOne
      :items="items"
      :model-value="modelValue"
      :multiple="true"
      @update:model-value="value => emit('update:modelValue', value)"
      needs-selection-warning="Please select at least one group"
    />
  </div>
</template>

<script setup lang="ts">
import SelectOne from '~/components/ui/SelectOne.vue'

defineProps<{ modelValue: string[]; items: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
</script>

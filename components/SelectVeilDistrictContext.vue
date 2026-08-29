<template>
  <div>
    <label class="block text-caption mb-[6px] font-normal">District context</label>
    <SelectOne
      :items="items"
      :model-value="modelValue"
      @update:model-value="value => emit('update:modelValue', value)"
    />
  </div>
</template>

<script setup lang="ts">
import SelectOne from '~/components/ui/SelectOne.vue'

defineProps<{ modelValue: string; items: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div>
    <label class="block text-caption mb-[6px] font-normal">Race</label>
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
  const items = ['Asian', 'Black', 'Latino', 'White', 'All Other Races']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>
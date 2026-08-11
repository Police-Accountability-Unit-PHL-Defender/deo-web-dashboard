<template>
  <div>
    <label class="block text-caption mb-[6px] font-normal">Years</label>
    <SelectOne
      :items="items"
      :modelValue="modelValue"
      :multiple="true"
      @update:modelValue="value => emit('update:modelValue', value)"
      :needsSelectionWarning="`Please select at least one year`"
    />
  </div>
</template>

<script setup>
  // Unlike its sibling selectors, the options are a prop rather than a
  // literal: the years come from the cube, so hardcoding them here would
  // let the control drift out of step with the data on the next rebuild.
  import SelectOne from '~/components/ui/SelectOne.vue'
  const props = defineProps(['modelValue', 'items'])
  const emit = defineEmits(['update:modelValue'])
</script>

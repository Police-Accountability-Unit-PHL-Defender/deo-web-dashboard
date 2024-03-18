<template>
  <div>
    <label class="block text-caption mb-[6px] font-normal">Gender</label>
    <SelectOne
      :items="items"
      :modelValue="modelValue"
      :multiple="true"
      @update:modelValue="value => emit('update:modelValue', value)"
      :needsSelectionWarning="`Please select at least one gender`"
    />
  </div>
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = ['Male', 'Female']
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>
<template>
  <SelectOne
    :items="items"
    :modelValue="modelValue"
    :multiple="true"
    @update:modelValue="handleUpdate"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = [
    'District 01',
    'District 02',
    'District 03',
    'District 05',
    'District 06',
    'District 07',
    'District 08',
    'District 09',
    'District 12',
    'District 14',
    'District 15',
    'District 16',
    'District 17',
    'District 18',
    'District 19',
    'District 22',
    'District 24',
    'District 25',
    'District 26',
    'District 35',
    'District 39',
  ]
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
  // when the selected districts changes, sort them alphabetically
  const handleUpdate = (newValue) => {
    emit('update:modelValue', newValue.sort())
  }
</script>
<template>
  <SelectOne :items="items" :selectedItem="selectedItem" />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = ['every year', 'every quarter']
  const selectedItem = ref(items[0])
</script>
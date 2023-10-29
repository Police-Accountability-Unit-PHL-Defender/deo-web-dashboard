<template>
  <SelectOne :items="items" :selectedItem="selectedItem" />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = ['stops', 'frisks', 'searches', 'intrusions']
  const selectedItem = ref(items[0])
</script>
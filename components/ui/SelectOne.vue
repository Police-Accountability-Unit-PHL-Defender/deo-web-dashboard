<template>
  <Listbox v-model="props.selectedItem">
    <ListboxButton class="bg-neutral-100 p-2">{{ props.selectedItem }}</ListboxButton>
    <ListboxOptions class="bg-neutral-100">
      <ListboxOption
        v-for="item in props.items"
        :key="item"
        :value="item"
        class="pl-4 cursor-pointer hover:bg-neutral-200 text-primary-default"
      >
        {{ item }}
      </ListboxOption>
    </ListboxOptions>
  </Listbox>
</template>

<script setup>
  import {
    Listbox,
    ListboxButton,
    ListboxOptions,
    ListboxOption,
  } from '@headlessui/vue'
  const props = defineProps({
    items: {
      type: Array,
      required: true,
    },
    selectedItem: {
      required: true,
    },
  })
  // const items = ['stops', 'frisks', 'searches', 'intrusions']
  // const selectedItem = ref(items[0])
</script>
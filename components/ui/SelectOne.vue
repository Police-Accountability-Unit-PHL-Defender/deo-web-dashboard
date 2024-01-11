<template>
  <Listbox
    as="div"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
    :multiple="props.multiple"
    class="relative inline-block text-left"
  >
    <ListboxButton class="button-select flex gap-6 items-center h-12 px-2">
      <span class="text-primary-800 leading-6">{{ getDisplayText(props.modelValue) }}</span>
      <IconsChevron classes="fill-black"></IconsChevron>
    </ListboxButton>
    <ListboxOptions class="bg-neutral-100 absolute z-[1] top-full w-auto mt-2 leading-6">
      <ListboxOption
        v-for="item in props.items"
        :key="item"
        :value="item"
        class="py-2 pl-8 pr-4 cursor-pointer hover:bg-neutral-200 text-neutral-600 hover:text-primary-800 whitespace-nowrap transition-colors"
      >
        {{ getDisplayText(item) }}
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
  const props = defineProps(['modelValue', 'items', 'itemDisplayText', 'multiple'])
  const emit = defineEmits(['update:modelValue'])
  const getDisplayText = (item) => {
    if (!props.itemDisplayText) return item
    return props.itemDisplayText[item]
  }
</script>
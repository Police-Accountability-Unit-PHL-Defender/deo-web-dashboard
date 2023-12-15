<template>
  <Listbox
    as="div"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
    :multiple="props.multiple"
    class="relative inline-block text-left"
  >
    <ListboxButton class="button-select">{{ props.modelValue }}</ListboxButton>
    <ListboxOptions class="bg-neutral-100 absolute z-10 top-full w-auto">
      <ListboxOption
        v-for="item in props.items"
        :key="item"
        :value="item"
        class="px-4 cursor-pointer hover:bg-neutral-200 text-primary-default whitespace-nowrap"
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
  const props = defineProps(['modelValue', 'items', 'multiple'])
  const emit = defineEmits(['update:modelValue'])
</script>
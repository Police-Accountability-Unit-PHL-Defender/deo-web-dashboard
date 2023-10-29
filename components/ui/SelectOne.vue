<template>
  <Listbox
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
  >
    <ListboxButton class="button-select">{{ props.modelValue }}</ListboxButton>
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
  const props = defineProps(['modelValue', 'items'])
  const emit = defineEmits(['update:modelValue'])
</script>
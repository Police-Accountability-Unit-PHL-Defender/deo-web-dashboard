<template>
  <Listbox
    as="div"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
    :multiple="props.multiple"
    class="relative inline-block text-left"
    :class="{'w-full': props.multiple}"
  >
    <ListboxButton class="button-select flex gap-6 items-center justify-between h-10 px-2 font-medium" :class="{'w-full': props.multiple}">
      <div v-if="props.multiple" class="flex gap-2">
        <div v-for="item in props.modelValue" class="bg-white text-primary-800 px-1">
          {{ item }}
        </div>
      </div>
      <span v-else class="text-primary-800">{{ getDisplayText(props.modelValue) }}</span>
      <IconsChevron classes="fill-black"></IconsChevron>
    </ListboxButton>
    <ListboxOptions class="bg-neutral-100 absolute z-[1] top-full w-auto mt-2 leading-6 max-h-[50vh] overflow-scroll">
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
<template>
  <Listbox
    as="div"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
    :multiple="props.multiple"
    class="relative inline-block text-left"
    :class="{'w-full': props.multiple}"
    v-slot="{ open }"
  >
    <ListboxButton class="button-select flex gap-6 items-center justify-between h-10 px-2 font-medium" :class="{'w-full': props.multiple, 'border-primary-600 hover:border-primary-600': open}">
      <div v-if="props.multiple" class="flex gap-2">
        <div v-for="item in props.modelValue" class="bg-white text-primary-800 px-1">
          {{ item }}
        </div>
      </div>
      <span v-else class="text-primary-800">{{ getDisplayText(props.modelValue) }}</span>
      <IconsChevron classes="fill-black" :class="{'rotate-180': open}"></IconsChevron>
    </ListboxButton>
    <ListboxOptions class="bg-neutral-100 border border-neutral-400 absolute z-[1] top-full w-auto mt-0 leading-6 max-h-[50vh] min-w-full overflow-y-auto">
      <ListboxOption
        v-for="item in props.items"
        :key="item"
        :value="item"
        class="py-2 pl-6 pr-4 cursor-pointer hover:bg-neutral-200 text-black hover:text-primary-800 whitespace-nowrap transition-colors"
        v-slot="{ selected }"
      >
        <span :class="{'text-primary-800': selected}">{{ getDisplayText(item) }}</span>
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
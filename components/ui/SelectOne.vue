<template>
  <Listbox
    as="div"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
    :multiple="props.multiple"
    class="relative inline-block text-left"
    :class="{'w-full': props.multiple}"
    v-slot="{ open }"
    ref="listbox"
  >
    <ListboxButton
      class="flex gap-6 items-center justify-between pl-2 pr-8 font-medium border bg-neutral-100 hover:bg-neutral-200"
      :class="{
        'w-full': props.multiple,
        'border-primary-600 hover:border-primary-600': open,
        'border-neutral-100 hover:border-neutral-200': !needsSelection,
        'border-error': needsSelection,
      }"
    >
      <div v-if="props.multiple" class="flex gap-2 flex-wrap py-[6px] min-h-10">
        <div v-for="item in props.modelValue" class="text-primary-800" :key="item">
          <div class="flex items-center gap-[2px]">
            <IconsClose class="text-neutral-600 hover:text-neutral-800 w-4 h-4" @click="removeItem(item)"/>
            <span>{{ item }}</span>
          </div>
        </div>
        <div v-if="props.modelValue.length === 0" class="text-neutral-600 font-normal">Select options</div>
      </div>
      <span v-else class="text-primary-800">{{ getDisplayText(props.modelValue) }}</span>
      <IconsChevron classes="fill-black" class="absolute right-1" :class="{'rotate-180': open}"></IconsChevron>
    </ListboxButton>
    <div v-if="needsSelection" class="absolute top-full z-[0] text-error text-caption font-normal">{{ props.needsSelectionWarning }}</div>
    <ListboxOptions class="bg-neutral-100 border border-neutral-400 absolute z-[1] top-full w-auto mt-0 leading-6 max-h-[50vh] min-w-full overflow-y-scroll font-normal">
      <div v-if="props.multiple" class="flex justify-between">
        <button
          @click="emit('update:modelValue', props.items)"
          class="text-neutral-800 hover:text-black text-left px-4 py-2 cursor-pointer flex items-center gap-2"
        >
          <IconsCheckbox class="text-primary-600" :selected="props.modelValue.length === props.items.length"/>
          Select all
        </button>
        <button
          @click="emit('update:modelValue', [])"
          class="text-neutral-600 hover:text-neutral-800 text-right px-4 py-2 cursor-pointer"
        >
          Clear all
        </button>
      </div>
      <ListboxOption
        v-for="item in props.items"
        :key="item"
        :value="item"
        class="py-2 pl-6 pr-4 cursor-pointer hover:bg-neutral-200 text-black hover:text-primary-800 whitespace-nowrap transition-colors flex items-center gap-2"
        v-slot="{ selected }"
      >
        <IconsCheckbox v-if="props.multiple" class="text-primary-600" :selected="props.modelValue.includes(item)"/>
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
  const props = defineProps(['modelValue', 'items', 'itemDisplayText', 'multiple', 'needsSelectionWarning'])
  const emit = defineEmits(['update:modelValue'])
  const getDisplayText = (item) => {
    if (!props.itemDisplayText) return item
    return props.itemDisplayText[item]
  }
  const removeItem = (item) => {
    const newValue = props.modelValue.filter((i) => i !== item)
    emit('update:modelValue', newValue)
  }
  const needsSelection = computed(() => props.multiple && props.needsSelectionWarning && props.modelValue.length === 0)
  const listbox = ref(null)
</script>
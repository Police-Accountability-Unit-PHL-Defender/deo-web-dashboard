<template>
  <div class="relative max-w-md bg-pink px-14 py-20 font-medium rounded-bl-[100px] rounded-tr-[100px]">
    <IconsQuoteMark class="absolute -top-6 right-10" classes="fill-red" />
    <slot name="quote"></slot>
    <div class="text-center text-body-2 font-bold">{{ props.author }}</div>
    <div class="flex justify-end">
      <a class="text-right text-primary-600 underline" :href="props.source">SOURCE</a>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  author: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
})
</script>
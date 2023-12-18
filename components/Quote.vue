<template>
  <div class="relative max-w-[630px] px-14 pt-24 pb-16 font-medium rounded-bl-[100px] rounded-tr-[100px] text-center" :class="backgroundClass">
    <IconsQuoteMark class="absolute -top-6 right-10" :classes="quoteMarkClass" />
    <slot name="quoteText"></slot>
    <div class="text-center text-body-2 font-bold mt-6">{{ props.author }}</div>
    <div class="flex justify-end mt-6">
      <a class="text-right text-primary-600" :href="props.source">
        <IconsLinkExternal class="inline mr-2"/>
        <span class="underline">SOURCE</span>
      </a>
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
  backgroundClass: {
    type: String,
    default: 'bg-pink'
  },
  quoteMarkClass: {
    type: String,
    default: 'fill-red'
  }
})
</script>
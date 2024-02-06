<template>
  <div class="layout-container grid-container">
    <div class="md:col-start-7 col-span-6 relative w-full max-w-[630px] px-6 md:px-14 pt-18 pb-12 font-medium rounded-bl-[100px] rounded-tr-[100px] text-center shadow-quote" :class="boxClasses">
      <IconsQuoteMark class="absolute -top-20 md:-top-16 left-6 scale-75 md:scale-100 rotate-180" :classes="quoteMarkClass" />
      <div class="text-black">
        <slot name="quoteText"></slot>
        <div class="text-center text-body-2 font-bold mt-4">{{ props.author }}</div>
        <div class="flex justify-end mt-4">
          <a class="text-right text-primary-600" :href="props.source">
            <IconsLinkExternal class="inline mr-2"/>
            <span class="underline">SOURCE</span>
          </a>
        </div>
      </div>
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
  },
  boldColorClass: {
    type: String,
    default: 'text-red'
  }
})

const boxClasses = computed(() => {
  return props.backgroundClass + ' ' + props.boldColorClass
})
</script>
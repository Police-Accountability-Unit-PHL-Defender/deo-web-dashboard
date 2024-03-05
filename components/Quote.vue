<template>
  <div class="layout-container grid-container">
    <div class="md:col-start-7 col-span-6 pl-[44px]">
      <div class="relative w-full px-6 md:px-8 pt-10 pb-6 font-medium rounded-bl-[100px] rounded-tr-[100px] text-center shadow-quote" :class="boxClasses">
        <IconsQuoteMark class="absolute -top-20 md:top-[-60px] left-6 scale-75 md:scale-100 rotate-180 w-[75px]" :classes="quoteMarkClass" />
        <div class="text-black text-body-3 font-medium">
          <slot name="quoteText"></slot>
          <div class="text-center font-bold mt-2">—{{ props.author }}</div>
          <div class="flex justify-end mt-1">
            <a class="text-right text-primary-600" :href="props.source" target="_blank">
              <IconsLinkExternal class="inline mr-2"/>
              <span class="underline">SOURCE</span>
            </a>
          </div>
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
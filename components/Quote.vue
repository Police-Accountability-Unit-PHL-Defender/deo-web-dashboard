<template>
  <div class="layout-container">
    <div class="grid-container">
      <div :class="props.alignment === 'center' ? 'md:col-start-3 col-span-8' : 'md:col-start-7 col-span-6 md:pl-[44px]'">
        <div class="relative w-full px-6 pt-8 md:pt-10 pb-4 md:pb-6 font-medium rounded-bl-[50px] rounded-tr-[50px] md:rounded-bl-[100px] md:rounded-tr-[100px] text-center shadow-quotemini md:shadow-quote" :class="boxClasses">
          <IconsQuoteMark class="absolute -top-14 md:top-[-60px] left-0 md:left-6 scale-50 md:scale-75 rotate-180" :classes="quoteMarkClasses" />
          <div class="text-black text-body-3 font-normal">
            <div class="flex justify-center w-full">
              <div :class="props.alignment === 'right' ? 'max-w-[456px]' : ''">
                <slot name="quoteText"></slot>
              </div>
            </div>
            <div class="text-center font-medium mt-2">—{{ props.author }}</div>
            <div class="flex justify-center md:justify-end mt-1">
              <a class="text-primary-600" :href="props.source" target="_blank">
                <IconsLinkExternal class="inline mr-1 w-[16px]"/>
                <span class="underline text-cta-1">SOURCE</span>
              </a>
            </div>
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
  },
  alignment: {
    type: String,
    default: 'right'
  }
})

const boxClasses = computed(() => {
  const paddingClasses = props.alignment === 'center' ? 'md:pt-18 md:px-14 md:pb-12' : 'md:px-8 md:pt-14'
  return props.backgroundClass + ' ' + props.boldColorClass + ' ' + paddingClasses
})

const quoteMarkClasses = computed(() => {
  const quoteSize = props.alignment === 'center' ? 'w-[75px] md:w-[113px]' : 'w-[75px]'
  return props.quoteMarkClass + ' ' + quoteSize
})
</script>
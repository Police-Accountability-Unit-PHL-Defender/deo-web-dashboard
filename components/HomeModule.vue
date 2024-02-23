<template>
  <div class="md:my-40 grid md:grid-cols-2 gap-4 items-center relative">
    <div class="order-2 md:order-1" :class="{'md:order-2 md:pl-[8.333%]': props.reverse}">
      <div class="text-heading-2">
        <slot name="title"></slot>
      </div>
      <div class="mt-4 md:mt-10 mb-6">
        <Button :href="props.ctaLink" class="w-full md:w-auto">Learn more</Button>
      </div>
    </div>
    <div class="relative flex items-center order-1 -mx-4 md:mx-0">
      <slot name="image"></slot>
    </div>
  </div>
</template>

<script setup>
import Button from './ui/Button.vue';
const props = defineProps({
  ctaLink: {
    type: String,
    required: true
  },
  reverse: {
    type: Boolean,
    default: false
  }
})
</script>
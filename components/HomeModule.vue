<template>
  <div class="my-20 grid md:grid-cols-2 gap-4 md:gap-10 items-center relative">
    <div class="order-2 md:order-1" :class="{'md:order-2': props.reverse}">
      <div class="text-heading-2">
        <slot name="title"></slot>
      </div>
      <div class="mt-4 md:mt-10">
        <Button :href="props.ctaLink">Learn more</Button>
      </div>
    </div>
    <div class="relative flex items-center h-[300px] md:h-[430px] overflow-hidden order-1">
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
<template>
  <div class="my-20 grid grid-cols-2 gap-10 h-[430px] items-center">
    <div :class="{'order-2': props.reverse}">
      <div class="text-heading-2">
        <slot name="title"></slot>
      </div>
      <div class="mt-10">
        <Button :href="props.ctaLink">Learn more</Button>
      </div>
    </div>
    <div class="relative flex items-center h-full overflow-hidden">
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
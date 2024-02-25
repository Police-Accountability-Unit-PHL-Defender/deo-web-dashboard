<template>
  <div class="relative md:pl-9">
    <IconsArrowRight v-if="props.arrow" class="hidden md:block absolute top-2 left-0 text-primary-800 mx-auto"/>
    <IconsArrowRight v-if="props.arrow" class="block md:hidden rotate-90 text-primary-800 mx-auto"/>
    <slot></slot>
  </div>
</template>

<script setup>
const props = defineProps({
  arrow: {
    type: Boolean,
    required: false
  },
})
</script>
<template>
  <div class="relative pl-9">
    <IconsArrowRight v-if="props.arrow" class="absolute top-2 left-0 text-primary-800 mx-auto"/>
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
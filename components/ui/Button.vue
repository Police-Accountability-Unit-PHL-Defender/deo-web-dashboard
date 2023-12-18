<template>
  <button v-if="!props.href"
    class="button inline-block text-label-2"
    :disabled="disabled"
    :type="type"
  >
    <slot />
  </button>
  <a v-else :href="props.href" class="button inline-block text-label-2">
    <slot />
  </a>
</template>

<script setup>
import { defineProps } from 'vue'
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'button',
  },
  href: {
    type: String,
    default: null,
  },
})
</script>

<style scoped>
.button {
  @apply cursor-pointer rounded-md px-10 py-6 text-primary-800 bg-primary-200 font-semibold focus:outline-none focus:ring-2 focus:ring-purple focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:bg-primary-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
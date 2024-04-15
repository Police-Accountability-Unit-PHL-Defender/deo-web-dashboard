<template>
  <div v-if="!props.color" class="w-full h-[1px] flex bg-neutral-200"></div>
  <div v-else class="w-full h-[1px] flex">
    <div class="bg-purple basis-[20%]"></div>
    <div class="bg-yellow basis-[10%]"></div>
    <div class="bg-yellowgreen basis-[20%]"></div>
    <div class="bg-red basis-[25%]"></div>
    <div class="bg-mint basis-[15%]"></div>
    <div class="bg-violet basis-[10%]"></div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
const props = defineProps({
  color: {
    type: Boolean,
    default: false,
  },
})
</script>
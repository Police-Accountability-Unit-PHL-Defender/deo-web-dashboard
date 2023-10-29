<template>
  <button class="button-select" @click="locationModalIsOpen = true">
    {{ props.modelValue }}
  </button>
  <div v-if="locationModalIsOpen" class="fixed inset-0 flex justify-center items-center p-4">
    <div class="absolute z-0 inset-0 bg-[rgba(255,255,255,0.75)]" @click="locationModalIsOpen = false"></div>
    <div class="relative z-10 w-[630px] h-[750px] max-h-full max-w-full p-10 bg-neutral-100 drop-shadow-popup">
      <div class="flex flex-col">
        <div class="basis-8 grow-1 shrink-0">
          Show map by:
          <SelectGeoBoundary v-model="selectedGeoBoundary"></SelectGeoBoundary>
        </div>
        <div class="h-[600px]">
          <LeafletMap
            :geo-aggregation="selectedGeoBoundary"
            :modelValue="modelValue"
            @update:modelValue="value => emit('update:modelValue', value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LeafletMap from '~/components/map/LeafletMap.vue'
import SelectGeoBoundary from './SelectGeoBoundary.vue';
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])
const selectedGeoBoundary = ref('city')
const locationModalIsOpen = ref(false)
</script>
<template>
  <button class="button-select px-2 inline-block text-primary-800 font-medium" @click="locationModalIsOpen = true">
    <span>{{ formatLocationForSentence(props.modelValue, props.capitalize)}}</span>
  </button>
  <div v-if="locationModalIsOpen" class="fixed z-10 inset-0 flex justify-center items-center p-2">
    <div class="absolute z-0 inset-0 bg-[rgba(255,255,255,0.75)]" @click="locationModalIsOpen = false"></div>
    <div class="relative z-10 w-[568px] h-[630px] max-h-full max-w-full p-6 bg-white drop-shadow-popup">
      <div>
        <button class="absolute z-20 top-6 right-4 text-neutral-600 hover:text-black">
          <IconsClose class="close-button w-10" @click="locationModalIsOpen = false" />
        </button>
        <div class="relative z-10 mb-4 mr-8">
          Select a region on the map by <span class="inline-block"><SelectGeoBoundary v-model="selectedGeoBoundary" :allowOnlyCityOrDivision="props.allowOnlyCityOrDivision"/>:</span>
        </div>
        <div class="h-[520px] relative z-0">
          <LeafletMap
            :geo-aggregation="selectedGeoBoundary"
            :modelValue="modelValue"
            @update:modelValue="handleSelectGeography"
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
const props = defineProps(['modelValue', 'capitalize', 'allowOnlyCityOrDivision'])
const emit = defineEmits(['update:modelValue'])
const selectedGeoBoundary = ref('city')
const locationModalIsOpen = ref(false)
const handleSelectGeography = (value) => {
  locationModalIsOpen.value = false
  emit('update:modelValue', value)
}
</script>
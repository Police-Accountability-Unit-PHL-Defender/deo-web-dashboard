<template>
  <button class="bg-neutral-100 p-2" @click="locationModalIsOpen = true">
    {{ selectedLocation }}
  </button>
  <div v-if="locationModalIsOpen" class="fixed inset-0 flex justify-center items-center p-4">
    <div class="absolute z-0 inset-0 bg-[rgba(255,255,255,0.75)]" @click="locationModalIsOpen = false"></div>
    <div class="relative z-10 w-[400px] h-[400px] max-h-full max-w-full bg-white">
      Select a location on the map
      <LeafletMap />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LeafletMap from '~/components/map/LeafletMap.vue'
const selectedLocation = ref('citywide')
const locationModalIsOpen = ref(false)
</script>
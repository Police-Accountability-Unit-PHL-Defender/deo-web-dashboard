<template>
  <header class="w-full bg-primary-800 text-white text-center">
    <div class="layout-container relative max-w-4xl mx-auto pt-12 pb-8">
      <div class="w-full flex justify-between">
        <button id="header-menu-button" class="-mt-4 -ml-4" title="Open full menu" @click="openPopupMenu"></button>
        <Button class="hidden md:block">Contact us</Button>
      </div>
      <div class="flex justify-center -mt-8 md:-mt-20">
        <a href="/" class="order-2">
          <img src="~/assets/images/defender-logo-white.png" alt="Defender Association of Philadelphia" class="w-[182px] mx-auto" />
        </a>
      </div>
      <div v-if="isIndex">
        <h1 class="text-heading-4 mt-14">Traffic Stops in Philadelphia</h1>
        <div class="grid-container justify-center">
          <p class="col-span-6 md:col-start-4 text-body-3 mt-4 text-left">
            Traffic enforcement has consistently been used by police as a pretext to stop, frisk, and/or search Black drivers, contributing to unnecessary, harmful, and too often deadly police interactions. Philadelphia’s Driving Equality law is one step towards reducing unnecessary interactions between police and drivers. In this dashboard, learn more about racial disparities in the Philadelphia Police Department’s traffic enforcement, how traffic stops have changed over time, and the history of Driving Equality.
          </p>
        </div>
      </div>
    </div>
    <nav class="hidden md:grid grid-cols-5 gap-1">
      <a href="/snapshot" class="flex items-center bg-primary-600 hover:bg-primary-200 hover:text-primary-600 p-4 text-body-3 font-medium">
        <span class="block max-w-[252px] mx-auto">Snapshot of traffic enforcement in Philadelphia</span>
      </a>
      <a href="/stops" class="flex items-center bg-primary-600 hover:bg-primary-200 hover:text-primary-600 p-4 text-body-3 font-medium">
        <span class="block max-w-[252px] mx-auto">How many stops have police made in my neighborhood?</span>
      </a>
      <a href="/neighborhoods" class="flex items-center bg-primary-600 hover:bg-primary-200 hover:text-primary-600 p-4 text-body-3 font-medium">
        <span class="block max-w-[252px] mx-auto">Do police treat people or neighborhoods differently?</span>
      </a>
      <a href="/safety" class="flex items-center bg-primary-600 hover:bg-primary-200 hover:text-primary-600 p-4 text-body-3 font-medium">
        <span class="block max-w-[252px] mx-auto">Do traffic stops promote safety?</span>
      </a>
      <a href="/driving-equality" class="flex items-center bg-primary-600 hover:bg-primary-200 hover:text-primary-600 p-4 text-body-3 font-medium">
        <span class="block max-w-[252px] mx-auto">Does Driving Equality promote safety?</span>
      </a>
    </nav>
    <menu class="fixed z-[999] w-screen h-screen top-0 left-0 bg-primary-800 py-8 text-left layout-container flex flex-col justify-between items-start" :class="{'block': isMenuOpen, 'hidden': !isMenuOpen}" ref="menu">
      <div class="flex flex-col gap-3">
        <ul class="flex flex-col gap-3 order-2">
          <li>
            <a href="/snapshot" class="text-body-1 font-medium">
              Snapshot of traffic enforcement in Philadelphia
            </a>
          </li>
          <li>
            <a href="/stops" class="text-body-1 font-medium">
              How many stops have police made in my neighborhood?
            </a>
          </li>
          <li>
            <a href="/neighborhoods" class="text-body-1 font-medium">
              Do police treat people or neighborhoods differently?
            </a>
          </li>
          <li>
            <a href="/safety" class="text-body-1 font-medium">
              Do traffic stops promote safety?
            </a>
          </li>
          <li>
            <a href="/driving-equality" class="text-body-1 font-medium">
              Does Driving Equality promote safety?
            </a>
          </li>
          <li>
            <a href="/about" class="text-body-1 font-medium">
              About Driving Equality
            </a>
          </li>
          <li>
            <a href="/about-the-data" class="text-body-1 font-medium">
              About the data
            </a>
          </li>
        </ul>
        <button class="order-1 -ml-4" id="header-menu-close-button" title="Close menu" @click="closePopupMenu"></button>
      </div>
      <Button class="mt-12">Contact us</Button>
    </menu>
  </header>
</template>

<style scoped>
button#header-menu-button {
  background-image: url('~/assets/icons/menu.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 24px;
  border: none;
  cursor: pointer;
  height: 48px;
  width: 48px;
}
button#header-menu-close-button {
  background-image: url('~/assets/icons/close.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 24px;
  border: none;
  cursor: pointer;
  height: 48px;
  width: 48px;
}
</style>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';
const isMenuOpen = ref(false);
const menu = ref();
const openPopupMenu = () => {
  isMenuOpen.value = true;
  menu.value.focus();
}
const closePopupMenu = () => {
  isMenuOpen.value = false;
}

// Get current route
const router = useRouter();
const currentRoute = ref(router.currentRoute.value.path);
const isIndex = computed(() => currentRoute.value === '/');
</script>
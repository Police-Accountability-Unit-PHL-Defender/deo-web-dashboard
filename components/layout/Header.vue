<template>
  <header class="w-full bg-primary-600 text-white text-center">
    <div class="layout-container relative">
      <div v-if="!isIndex">
        <div class="absolute inset-0 flex justify-center items-center pointer-events-none">
          <a href="/" class="pointer-events-auto">
            <h1 class="text-heading-3 mt-1">Traffic Stops in Philadelphia</h1>
          </a>
        </div>
        <div class="h-32 flex justify-between items-center">
          <a href="/">
            <img src="~/assets/images/defender-logo-white.png" alt="Defender Association of Philadelphia" class="h-20 mx-auto" />
          </a>
          <button id="header-menu-button" title="Open full menu" @click="openPopupMenu"></button>
        </div>
      </div>
      <div v-else>
        <button id="header-menu-button" class="absolute top-4 right-4 md:top-12 md:right-12" title="Open full menu" @click="openPopupMenu"></button>
        <div class="absolute top-3 left-4 md:top-12 md:left-12">
          <a href="/" class="order-2">
            <img src="~/assets/images/defender-logo-white.png" alt="Defender Association of Philadelphia" class="w-[73px] md:w-[182px] mx-auto" />
          </a>
        </div>
        <div class="pt-20 md:pt-[98px] pb-6 md:pb-18">
          <h1 class="text-heading-1">Traffic Stops in<br/>Philadelphia</h1>
          <div class="grid-container justify-center">
            <p class="col-span-6 md:col-start-4 text-body-4 mt-2 md:mt-4 text-center">
              Explore this dashboard to learn more about racial disparities in the Philadelphia Police Department’s traffic enforcement, how traffic stops have changed over time, and the history of Driving Equality.
            </p>
          </div>
        </div>
      </div>
    </div>
    <nav v-if="!isIndex" class="hidden md:grid grid-cols-5 gap-[1px]">
      <a href="/snapshot" class="flex items-center bg-primary-800 hover:bg-primary-400 hover:text-primary-800 py-6 px-4 text-body-3 font-medium">
        <span class="block max-w-[252px] mx-auto text-label-1">Snapshot</span>
      </a>
      <a href="/stops" class="flex items-center bg-primary-800 hover:bg-primary-400 hover:text-primary-800 py-6 px-4 text-body-3 font-medium">
        <span class="block max-w-[252px] mx-auto text-label-1">Traffic stops</span>
      </a>
      <a href="/neighborhoods" class="flex items-center bg-primary-800 hover:bg-primary-400 hover:text-primary-800 py-6 px-4 text-body-3 font-medium">
        <span class="block max-w-[252px] mx-auto text-label-1">Neighbor&shy;hoods</span>
      </a>
      <a href="/safety" class="flex items-center bg-primary-800 hover:bg-primary-400 hover:text-primary-800 py-6 px-4 text-body-3 font-medium">
        <span class="block max-w-[252px] mx-auto text-label-1">Safety</span>
      </a>
      <a href="/driving-equality" class="flex items-center bg-primary-800 hover:bg-primary-400 hover:text-primary-800 py-6 px-4 text-body-3 font-medium">
        <span class="block max-w-[252px] mx-auto text-label-1">Reasons for stops</span>
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
  background-size: 30px;
  border: none;
  cursor: pointer;
  height: 40px;
  width: 40px;
}
button#header-menu-close-button {
  background-image: url('~/assets/icons/close.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 24px;
  border: none;
  cursor: pointer;
  height: 40px;
  width: 40px;
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
<template>
  <header class="w-full bg-primary-600 text-white text-center">
    <div class="layout-container relative">
      <div v-if="!isIndex">
        <div class="hidden md:flex absolute inset-0 justify-center items-center pointer-events-none">
          <a href="/" class="pointer-events-auto">
            <h1 class="text-heading-3 mt-1">Traffic Stops in Philadelphia</h1>
          </a>
        </div>
        <div class="h-16 md:h-32 flex justify-between items-center">
          <a href="/">
            <img src="~/assets/images/defender-logo-white.png" alt="Defender Association of Philadelphia" class="h-10 md:h-20 mx-auto" />
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
        <div class="pt-20 md:pt-[98px] pb-6 md:pb-12">
          <h1 class="text-heading-1">Traffic Stops in<br/>Philadelphia</h1>
          <div class="grid-container justify-center">
            <p class="col-span-6 md:col-start-4 text-body-4 mt-2 md:mt-4 text-center">
              Explore this dashboard to learn more about racial disparities in the Philadelphia Police Department’s traffic enforcement, how traffic stops have changed over time, and the history of Driving Equality.
            </p>
          </div>
        </div>
      </div>
    </div>
    <nav v-if="isDataPage" class="hidden md:grid grid-cols-5 gap-[1px]">
      <a href="/snapshot" class="flex items-center hover:bg-primary-400 hover:text-primary-800 py-6 px-4 text-body-3 font-medium" :class="currentRoute === '/snapshot' ? 'bg-primary-400 text-primary-800' : 'bg-primary-800 text-white'">
        <span class="block max-w-[252px] mx-auto text-label-1">Snapshot</span>
      </a>
      <a href="/stops" class="flex items-center hover:bg-primary-400 hover:text-primary-800 py-6 px-4 text-body-3 font-medium" :class="currentRoute === '/stops' ? 'bg-primary-400 text-primary-800' : 'bg-primary-800 text-white'">
        <span class="block max-w-[252px] mx-auto text-label-1">Traffic stops</span>
      </a>
      <a href="/neighborhoods" class="flex items-center hover:bg-primary-400 hover:text-primary-800 py-6 px-4 text-body-3 font-medium" :class="currentRoute === '/neighborhoods' ? 'bg-primary-400 text-primary-800' : 'bg-primary-800 text-white'">
        <span class="block max-w-[252px] mx-auto text-label-1">Neighbor&shy;hoods</span>
      </a>
      <a href="/safety" class="flex items-center hover:bg-primary-400 hover:text-primary-800 py-6 px-4 text-body-3 font-medium" :class="currentRoute === '/safety' ? 'bg-primary-400 text-primary-800' : 'bg-primary-800 text-white'">
        <span class="block max-w-[252px] mx-auto text-label-1">Safety</span>
      </a>
      <a href="/reasons" class="flex items-center hover:bg-primary-400 hover:text-primary-800 py-6 px-4 text-body-3 font-medium" :class="currentRoute === '/driving-equality' ? 'bg-primary-400 text-primary-800' : 'bg-primary-800 text-white'">
        <span class="block max-w-[252px] mx-auto text-label-1">Reasons for stops</span>
      </a>
    </nav>
    <menu class="fixed z-[999] w-screen h-screen inset-0 bg-primary-800 py-8 text-left overflow-y-scroll" :class="{'block': isMenuOpen, 'hidden': !isMenuOpen}" ref="menu">
      <div class="layout-container">
        <div class="relative w-full">
          <button class="absolute top-3 right-3" id="header-menu-close-button" title="Close menu" @click="closePopupMenu"></button>
        </div>
        <div class="flex flex-col justify-center gap-3">
          <ul class="flex flex-col gap-6 order-2 mt-18 md:mt-28">
            <li>
              <a href="/snapshot" class="text-fullscreen-nav font-medium hover:underline hover:text-primary-200">
                Snapshot of traffic enforcement in Philadelphia
              </a>
            </li>
            <li>
              <a href="/stops" class="text-fullscreen-nav font-medium hover:underline hover:text-primary-200">
                How many stops do police make, and who do they stop?
              </a>
            </li>
            <li>
              <a href="/neighborhoods" class="text-fullscreen-nav font-medium hover:underline hover:text-primary-200">
                Do police treat people and neighborhoods differently?
              </a>
            </li>
            <li>
              <a href="/safety" class="text-fullscreen-nav font-medium hover:underline hover:text-primary-200">
                Do traffic stops promote safety?
              </a>
            </li>
            <li>
              <a href="/reasons" class="text-fullscreen-nav font-medium hover:underline hover:text-primary-200">
                Do police make traffic stops for safety reasons?
              </a>
            </li>
            <li>
              <a href="/data" class="text-fullscreen-nav font-medium hover:underline hover:text-primary-200">
                About the Data
              </a>
            </li>
            <li>
              <a href="/driving-equality" class="text-fullscreen-nav font-medium hover:underline hover:text-primary-200">
                What is Driving Equality?
              </a>
            </li>
            <li>
              <a href="/glossary" class="text-fullscreen-nav font-medium hover:underline hover:text-primary-200">
                Glossary
              </a>
            </li>
          </ul>
        </div>
        <Button class="mt-8 w-full md:w-auto" href="contact">Contact us</Button>
      </div>
    </menu>
  </header>
</template>

<style scoped>
button#header-menu-button {
  background-image: url('~/assets/icons/menu.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 40px;
  border: none;
  cursor: pointer;
  height: 40px;
  width: 40px;
}
button#header-menu-close-button {
  background-image: url('~/assets/icons/close.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 40px;
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

const dataPages = [
  { slug: '/snapshot', title: 'Snapshot' },
  { slug: '/stops', title: 'Traffic Stops' },
  { slug: '/neighborhoods', title: 'Neighborhoods' },
  { slug: '/safety', title: 'Safety' },
  { slug: '/reasons', title: 'Reasons for Stops' }
];
const isDataPage = computed(() => {
  return dataPages.some(page => page.slug === currentRoute.value);
})
</script>
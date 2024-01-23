<template>
  <header class="w-full bg-primary-800 text-white text-center">
    <div class="layout-container relative max-w-4xl mx-auto pt-12 pb-8">
      <div class="w-full flex justify-between">
        <button id="header-menu-button" class="-mt-4 -ml-4" title="Open full menu" @click="openPopupMenu"></button>
        <Button class="hidden lg:block">Contact us</Button>
      </div>
      <div class="flex justify-center -mt-8 lg:-mt-20">
        <a href="/" class="order-2">
          <img src="~/assets/images/defender-logo-white.png" alt="Defender Association of Philadelphia" class="w-[182px] mx-auto" />
        </a>
      </div>
      <h1 class="text-heading-4 mt-14">Driving Equality Act, 2 Years Later</h1>
      <p class="text-body-3 mt-4">
        March 2024 marks the second anniversary of the Driving Equality Act in Philadelphia. This landmark policy changed the way that police make stops in the city, and was the first in the country. This project surfaces public data to show the law’s impact on the people of Philadelphia since it was passed.
      </p>
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
</script>
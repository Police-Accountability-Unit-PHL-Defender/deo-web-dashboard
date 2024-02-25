<template>
  <div v-if="!isIndex" class="layout-container flex justify-end my-20">
    <button class="flex items-center gap-3" @click="scrollToTop">
      <IconsArrow class="text-primary-600"/>
      <span class="text-cta-1">Back to top</span>
    </button>
  </div>
  <nav v-if="isDataPage" class="w-full bg-primary-600">
    <div class="layout-container flex justify-between text-white text-label-2">
      <a v-if="previousDataPage" :href="previousDataPage.slug" class="flex items-center py-2 text-body-3 font-medium group">
        <IconsChevron class="w-10 h-10 transform rotate-90 group-hover:-translate-x-2 transition-transform" classes="fill-white"></IconsChevron>
        <div class="flex flex-wrap">
          <span class="text-primary-200">Previous:&nbsp;</span>
          <span>{{ previousDataPage.title }}</span>
        </div>
      </a>
      <div v-else></div>
      <a v-if="nextDataPage" :href="nextDataPage.slug" class="flex items-center py-2 text-body-3 font-medium group">
        <div class="flex flex-wrap justify-end">
          <span class="text-primary-200">Next:</span>
          <span>&nbsp;{{ nextDataPage.title }}</span>
        </div>
        <IconsChevron class="w-10 h-10 transform -rotate-90 group-hover:translate-x-2 transition-transform" classes="fill-white"></IconsChevron>
      </a>
      <div v-else></div>
    </div>
  </nav>
  <div class="w-full bg-primary-800 text-white pt-8 md:pt-14">
    <div class="layout-container">
      <a href="/">
        <h2 class="text-heading-3 mb-10 md:mb-12">Traffic Stops in Philadelphia</h2>
      </a>
      <ul class="flex flex-col md:flex-row gap-4 md:gap-10">
        <li>
          <a href="#" class="text-cta-1 text-white">About the Data</a>
        </li>
        <li>
          <a href="#" class="text-cta-1 text-white">About Driving Equality</a>
        </li>
        <li>
          <a href="#" class="text-cta-1 text-white">Glossary</a>
        </li>
      </ul>
      <div class="flex flex-col gap-10 sm:flex-row justify-between">
        <Button class="mt-10 md:mt-20">Contact us</Button>
        <a href="/" class="self-start sm:self-end">
          <img src="~/assets/images/defender-logo-white.png" alt="Defender Association of Philadelphia" class="w-[145px] md:w-[182px] mx-auto" />
        </a>
      </div>
      <div class="mt-4 md:mt-10 pb-12 md:pb-18 text-caption text-white">
        Copyright © 2024 Defender Association of Philadelphia. All rights reserved.
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from '@/components/ui/Button.vue'
import { useRouter } from 'vue-router';

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
const previousDataPage = computed(() => {
  const index = dataPages.findIndex(page => page.slug === currentRoute.value);
  return index > 0 ? dataPages[index - 1] : null;
});
const nextDataPage = computed(() => {
  const index = dataPages.findIndex(page => page.slug === currentRoute.value);
  return index < dataPages.length - 1 ? dataPages[index + 1] : null;
});

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
</script>
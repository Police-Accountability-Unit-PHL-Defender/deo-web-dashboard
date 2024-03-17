<template>
  <div v-if="!isIndex" class="layout-container flex justify-end mt-8 md:mt-0 mb-14">
    <button class="flex items-center gap-3 rounded-full bg-neutral-200 aspect-square px-4 hover:bg-primary-200" @click="scrollToTop">
      <span class="text-cta-1 text-primary-600">Back to top</span>
    </button>
  </div>
  <nav v-if="isDataPage" class="w-full bg-primary-600">
    <div class="layout-container flex justify-between text-white text-label-2">
      <a v-if="previousDataPage" :href="previousDataPage.slug" class="flex items-center py-2 text-body-3 font-medium group">
        <IconsChevron class="w-10 h-10 transform rotate-90 fill-white group-hover:fill-highlight transition-colors"></IconsChevron>
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
        <IconsChevron class="w-10 h-10 transform -rotate-90 fill-white group-hover:fill-highlight transition-colors"></IconsChevron>
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
          <a href="/data" class="text-cta-18 text-white">About the Data</a>
        </li>
        <li>
          <a href="/driving-equality" class="text-cta-18 text-white">About Driving Equality</a>
        </li>
        <li>
          <a href="/glossary" class="text-cta-18 text-white">Glossary</a>
        </li>
      </ul>
      <div class="mt-8 max-w-[847px]">
        <p class="text-body-4">
          Please note: This dashboard shows public data from the Philadelphia Police Department, which may at times be incomplete, unreliable, or inaccurate.
          Learn more about the <a href="/data#11" class="underline">data limitations</a>.
        </p>
      </div>
      <div class="flex flex-col gap-10 sm:flex-row justify-between md:pb-18">
        <div>
          <Button type="link" href="/contact" class="mt-10 md:mt-20">Contact us</Button>
          <div class="hidden sm:block mt-4 md:mt-8 text-caption text-white">
            Copyright © 2024 Defender Association of Philadelphia. All rights reserved.
          </div>
        </div>
        <a href="/" class="self-start sm:self-end mb-[6px]">
          <img src="~/assets/images/defender-logo-white.png" alt="Defender Association of Philadelphia" class="w-[145px] md:w-[182px] mx-auto" />
        </a>
      </div>
      <div class="block sm:hidden mt-4 md:mt-8 text-caption text-white pb-12">
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
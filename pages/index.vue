<template>
  <main class="layout-container overflow-hidden pb-8">
    <HomeModule ctaLink="/snapshot">
      <template #title>
        Snapshot of traffic enforcement in Philadelphia
      </template>
      <template #image>
        <div class="absolute right-0 bottom-1/2 rounded-full bg-highlight w-1/3 aspect-square"></div>
        <img class="relative w-full md:w-5/6 aspect-[3/2] object-cover" src="~/assets/images/snapshot.jpg" alt="At a protest, youths hold up a banner that reads Black Lives Matter" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/stops" :reverse="true">
      <template #title>
        How many stops do police make, and who do they stop?
      </template>
      <template #image>
        <div class="hidden md:block absolute bg-red w-1/3 aspect-square left-0 bottom-[52%]"></div>
        <img class="relative md:left-[16.66%] w-full md:w-5/6 aspect-[3/2] object-cover" src="~/assets/images/stops.jpg" alt="A closeup of a police siren" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/neighborhoods">
      <template #title>
        Do police treat people and neighborhoods differently?
      </template>
      <template #image>
        <div class="hidden md:block absolute bg-primary-600 w-1/3 aspect-square rounded-tr-full right-0 top-1/2"></div>
        <img class="relative w-full md:w-5/6 aspect-[3/2] object-cover" src="~/assets/images/neighborhoods.jpg" alt="A police car" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/safety" :reverse="true">
      <template #title>
        Do traffic stops promote safety?
      </template>
      <template #image>
        <div class="hidden md:block absolute bg-yellowgreen w-1/3 aspect-square rounded-tl-super bottom-1/2 left-0"></div>
        <img class="relative md:left-[16%] w-full md:w-5/6 aspect-[3/2] object-cover" src="~/assets/images/safety.jpg" alt="A car's side view mirror" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/reasons">
      <template #title>
        Do police make traffic stops for safety reasons?
      </template>
      <template #image>
        <div class="hidden md:block absolute right-0 -top-[40px] bg-yellow w-1/3 aspect-square"></div>
        <img class="relative w-full md:w-5/6 aspect-[3/2] object-cover" src="~/assets/images/reasons.jpg" alt="A street in Philadelphia" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/driving-equality" :reverse="true">
      <template #title>
        What is Driving Equality?
      </template>
      <template #image>
        <div class="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 bg-violet rounded-full w-1/3 aspect-square"></div>
        <img class="relative md:left-[16%] bottom-0 md:bottom-auto w-full md:w-5/6" src="~/assets/images/driving-equality.jpg" alt="A police car" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/data">
      <template #title>
        About the Data
      </template>
      <template #image>
        <div class="hidden md:block absolute right-0 top-1/2 w-1/3 rounded-br-super bg-mint aspect-square"></div>
        <img class="relative w-full md:w-5/6 aspect-[3/2] object-cover" src="~/assets/images/data.jpg" alt="A police car" />
      </template>
    </HomeModule>
  </main>
</template>

<script setup lang="ts">
import HomeModule from '~/components/HomeModule.vue';
</script>
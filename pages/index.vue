<template>
  <main class="layout-container overflow-hidden pb-8">
    <HomeModule ctaLink="/snapshot">
      <template #title>
        Snapshot of traffic enforcement in Philadelphia
      </template>
      <template #image>
        <img src="~/assets/images/snapshot.jpg" alt="Snapshot" />
        <!-- <div class="rounded-full bg-highlight w-[430px] aspect-square"></div> -->
      </template>
    </HomeModule>

    <HomeModule ctaLink="/stops" :reverse="true">
      <template #title>
        How many stops do police make, and who do they stop?
      </template>
      <template #image>
        <div class="hidden md:block bg-red w-[224px] aspect-square absolute left-0 top-0"></div>
        <img class="md:left-[16%] w-full md:w-5/6" src="~/assets/images/stops.jpg" alt="A closeup of a police siren" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/neighborhoods">
      <template #title>
        Do police treat people and neighborhoods differently?
      </template>
      <template #image>
        <!-- <div class="absolute left-[40%] top-[-50%] rounded-full bg-primary-600 w-[506px] aspect-square"></div> -->
        <img class="right-[16%] w-full md:w-5/6" src="~/assets/images/neighborhoods.jpg" alt="A police car" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/safety" :reverse="true">
      <template #title>
        Do traffic stops promote safety?
      </template>
      <template #image>
        <!-- <div class="absolute bg-yellowgreen h-full aspect-[23/43] rounded-tl-super"></div> -->
        <img class="left-[16%] w-full md:w-5/6" src="~/assets/images/safety.jpg" alt="A car's side view mirror" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/reasons" :reverse="true">
      <template #title>
        Do police make traffic stops for safety reasons?
      </template>
      <template #image>
        <!-- <div class="absolute bg-yellowgreen h-full aspect-[23/43] rounded-tl-super"></div> -->
        <img class="left-[16%] w-full md:w-5/6" src="~/assets/images/reasons.jpg" alt="A street in Philadelphia" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/driving-equality">
      <template #title>
        What is Driving Equality?
      </template>
      <template #image>
        <!-- <div class="absolute right-0 top-0 bg-yellow h-2/3 aspect-[251/283]"></div> -->
        <img class="right-[16%] bottom-0 md:bottom-auto w-full md:w-5/6" src="~/assets/images/driving-equality.jpg" alt="A police car" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/about-driving-equality" :reverse="true">
      <template #title>
        About the Data
      </template>
      <template #image>
        <!-- <div class="absolute left-0 top-0 h-full rounded-full bg-mint aspect-square"></div> -->
        <img class="left-[16%] w-full md:w-5/6" src="~/assets/images/data.jpg" alt="A police car" />
      </template>
    </HomeModule>
  </main>
</template>

<script setup lang="ts">
import HomeModule from '~/components/HomeModule.vue';
</script>
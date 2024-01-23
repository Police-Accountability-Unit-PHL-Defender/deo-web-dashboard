<template>
  <div>
    <HomeModule ctaLink="/snapshot">
      <template #title>
        Snapshot of traffic enforcement in Philadelphia
      </template>
      <template #image>
        <img src="" alt="Snapshot" />
        <div class="rounded-full bg-highlight w-[430px] aspect-square"></div>
      </template>
    </HomeModule>

    <HomeModule ctaLink="/stops" :reverse="true">
      <template #title>
        How many stops have police made in my neighborhood?
      </template>
      <template #image>
        <div class="bg-red h-full aspect-[2/3] absolute left-0 top-0"></div>
        <img class="absolute left-[16%] w-5/6" src="~/assets/images/stops.jpg" alt="A closeup of a police siren" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/neighborhoods">
      <template #title>
        Do police treat people or neighborhoods differently when making traffic stops?
      </template>
      <template #image>
        <div class="absolute left-[40%] top-[-50%] rounded-full bg-primary-600 w-[506px] aspect-square"></div>
        <img class="absolute right-[16%] w-5/6" src="~/assets/images/neighborhoods.jpg" alt="A police car" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/safety" :reverse="true">
      <template #title>
        Do traffic stops promote safety?
      </template>
      <template #image>
        <div class="absolute bg-yellowgreen h-full aspect-[23/43] rounded-tl-super"></div>
        <img class="absolute left-[16%] w-5/6" src="~/assets/images/safety.jpg" alt="A street in Philadelphia" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/driving-equality">
      <template #title>
        Does Driving Equality promote safety?
      </template>
      <template #image>
        <div class="absolute right-0 top-0 bg-yellow h-2/3 aspect-[251/283]"></div>
        <img class="absolute right-[16%] bottom-0 md:bottom-auto w-5/6" src="~/assets/images/neighborhoods.jpg" alt="A police car" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/about-driving-equality" :reverse="true">
      <template #title>
        Tell me more about Driving Equality
      </template>
      <template #image>
        <div class="absolute left-0 top-0 h-full rounded-full bg-mint aspect-square"></div>
        <img class="absolute left-[16%] w-5/6" src="~/assets/images/about-driving-equality.jpg" alt="A police car" />
      </template>
    </HomeModule>
  </div>
</template>

<script setup lang="ts">
import HomeModule from '~/components/HomeModule.vue';
</script>
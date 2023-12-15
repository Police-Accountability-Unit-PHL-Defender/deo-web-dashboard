<template>
  <div class="layout-container">
    <HomeModule ctaLink="/about">
      <template #title>
        Snapshot of traffic enforcement in Philadelphia
      </template>
      <template #image>
        <img src="" alt="Snapshot" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/stops" :reverse="true">
      <template #title>
        How many stops have police made in my neighborhood?
      </template>
      <template #image>
        <img src="~/assets/images/stops.jpg" alt="A closeup of a police siren" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/neighborhoods">
      <template #title>
        Do police treat people or neighborhoods differently when making traffic stops?
      </template>
      <template #image>
        <img src="~/assets/images/neighborhoods.jpg" alt="A police car" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/neighborhoods" :reverse="true">
      <template #title>
        Do traffic stops promote safety?
      </template>
      <template #image>
        <img src="~/assets/images/safety.jpg" alt="A street in Philadelphia" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/neighborhoods">
      <template #title>
        Does Driving Equality promote safety?
      </template>
      <template #image>
        <img src="~/assets/images/neighborhoods.jpg" alt="A police car" />
      </template>
    </HomeModule>

    <HomeModule ctaLink="/neighborhoods" :reverse="true">
      <template #title>
        Tell me more about Driving Equality
      </template>
      <template #image>
        <img src="~/assets/images/about-driving-equality.jpg" alt="A police car" />
      </template>
    </HomeModule>
  </div>
</template>

<script setup lang="ts">
import HomeModule from '~/components/HomeModule.vue';
</script>
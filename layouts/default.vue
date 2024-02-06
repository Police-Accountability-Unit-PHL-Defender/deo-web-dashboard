<template>
  <div>
    <Header></Header>
    <div>
      <slot />
    </div>
    <BackToTop></BackToTop>
    <Footer></Footer>
  </div>
</template>

<script setup lang="ts">
import Header from '~/components/layout/Header.vue'
import Footer from '~/components/layout/Footer.vue'
import BackToTop from '~/components/layout/BackToTop.vue';
</script>
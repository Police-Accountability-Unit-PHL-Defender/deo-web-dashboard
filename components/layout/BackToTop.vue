<template>
  <div class="layout-container flex justify-end my-20">
    <button class="text-cta-1" @click="scrollToTop">Back to top</button>
  </div>
</template>

<script setup>
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
</script>
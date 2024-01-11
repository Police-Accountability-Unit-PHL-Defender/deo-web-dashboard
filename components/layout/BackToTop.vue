<template>
  <div class="layout-container flex justify-end my-20">
    <button class="flex items-center gap-3" @click="scrollToTop">
      <IconsArrow class="text-primary-600"/>
      <span class="text-cta-1">Back to top</span>
    </button>
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
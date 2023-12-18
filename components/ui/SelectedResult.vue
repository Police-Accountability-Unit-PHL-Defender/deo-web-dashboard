<template>
  <div class="bg-primary-200 px-2 inline-block h-12">
    <slot />
  </div>
</template>
<script setup>
defineProps({
  text: String
})
</script>
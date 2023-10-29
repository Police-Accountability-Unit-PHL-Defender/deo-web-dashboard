<template>
  <div class="bg-primary-200 p-2 inline-block">
    <slot />
  </div>
</template>
<script setup>
defineProps({
  text: String
})
</script>
<template>
  <svg width="113" height="96" viewBox="0 0 113 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path :class="props.classes" d="M0 0V44.9253H27.0648C27.4096 49.8221 26.4902 54.605 24.3066 59.274C20.2843 68.1566 12.4694 74.4199 0.861937 78.0641V96C16.6067 93.0391 28.5589 86.4911 36.7185 76.3559C44.9931 66.2206 49.1304 52.7829 49.1304 36.0427V0H0Z"/>
    <path :class="props.classes" d="M63.8691 0V44.9253H90.934C91.2788 49.8221 90.3594 54.605 88.1758 59.274C84.1534 68.1566 76.3385 74.4199 64.7311 78.0641V96C80.4758 93.0391 92.428 86.4911 100.588 76.3559C108.862 66.2206 113 52.7829 113 36.0427V0H63.8691Z"/>
  </svg>
</template>

<script setup>
const props = defineProps({
  classes: {
    type: String,
    required: false
  }
})
</script>
<template>
  <h3>{{ props.title }}</h3>
</template>
<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
})
</script>
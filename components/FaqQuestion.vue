<template>
  <li :id="props.id">
    <details class="text-body-3">
      <summary>
        <h3 class="text-body-2">
          {{ props.question }}
        </h3>
      </summary>
      <slot></slot>
    </details>
  </li>
</template>

<script setup>
const props = defineProps({
  question: String,
  id: String,
});
onMounted(() => {
  // if the URL has a hash that matches this question's id, open the details
  if (window.location.hash === `#${props.id}`) {
    const details = document.getElementById(props.id).querySelector('details');
    if (details) {
      details.open = true;
    }
  }
})
</script>
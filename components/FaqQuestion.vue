<template>
  <li>
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
});
</script>
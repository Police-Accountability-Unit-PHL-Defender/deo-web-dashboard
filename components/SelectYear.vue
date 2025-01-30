<template>
  <SelectOne
    :items="watchedYears"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>
<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  
  const yearsState = useState("deoYears")
  const watchedYears = ref(yearsState.value)

  watch(yearsState, (newValue) => {
    watchedYears.value = newValue
    console.log('watchedYears', watchedYears.value)
  }, { immediate: true })

  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
</script>

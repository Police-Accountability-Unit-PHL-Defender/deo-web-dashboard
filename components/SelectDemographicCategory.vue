<template>
  <SelectOne
    :items="items"
    :modelValue="modelValue"
    :itemDisplayText="itemDisplayText"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const items = ['age range', 'gender', 'race']
  const props = defineProps(['modelValue', 'isPlural'])
  const emit = defineEmits(['update:modelValue'])
  const itemDisplayText = computed(() => {
    if (!props.isPlural) return null
    const obj = items.reduce((acc, item) => {
      acc[item] = item + 's'
      return acc
    }, {})
    return obj
  })
</script>
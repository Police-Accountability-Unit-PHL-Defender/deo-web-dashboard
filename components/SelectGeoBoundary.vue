<template>
  <SelectOne
    :items="items"
    :itemDisplayText="itemDisplayText"
    :modelValue="modelValue"
    @update:modelValue="value => emit('update:modelValue', value)"
  />
</template>

<script setup>
  import SelectOne from '~/components/ui/SelectOne.vue'
  const props = defineProps(['modelValue', 'allowOnlyCityOrDivision'])
  const emit = defineEmits(['update:modelValue'])
  const items = computed(() => {
    if (props.allowOnlyCityOrDivision) {
      return ['city', 'division']
    }
    return ['city', 'division', 'district', 'psa']
  })
  const itemDisplayText = computed(() => {
    if (props.allowOnlyCityOrDivision) {
      return {
        city: 'city',
        division: 'division'
      }
    }
    return {
      city: 'city',
      division: 'division',
      district: 'district',
      psa: 'PSA'
    }
  })
</script>
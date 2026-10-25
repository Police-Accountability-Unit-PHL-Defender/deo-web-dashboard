<template>
  <p v-if="compact" aria-label="Pre and post analysis dates" class="text-body-4 mt-3">
    We compare stops before Driving Equality ({{ periods.before }}) with stops after it ({{ periods.after }}).
    <template v-if="periods.excluded">We leave out {{ periods.excluded }}<template v-if="cube.excluded_years.includes(2020)"> because pandemic restrictions changed evening travel</template>.</template>
  </p>
  <aside v-else aria-label="Pre and post analysis dates" class="my-6 rounded-xl border border-neutral-300 p-5 text-body-4">
    <dl class="grid md:grid-cols-2 gap-4">
      <div><dt class="font-bold text-purple">Before Driving Equality</dt>
        <dd>{{ periods.before }}</dd>
        <dd v-if="periods.excluded" class="mt-1">Excluding {{ periods.excluded }}.</dd>
      </div>
      <div><dt class="font-bold text-purple">After Driving Equality</dt>
        <dd>{{ periods.after }}</dd>
      </div>
    </dl>
    <p v-if="cube.excluded_years.includes(2020)" class="mt-4">Pandemic lockdowns and curfews changed evening travel, so 2020 is left out.</p>
    <p class="mt-2">The comparison combines evening stops across each period, covering more years before the law than after.
      It ends with the last full year of data; partial years are left out.</p>
    <p class="mt-2 text-caption">Philadelphia local time; both endpoints included.</p>
  </aside>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { veilComparisonPeriods } from '../utils/veil'
import type { VeilComparisonCube } from '../utils/veil'
const props = defineProps<{ cube: VeilComparisonCube; compact?: boolean }>()
const periods = computed(() => veilComparisonPeriods(props.cube))
</script>

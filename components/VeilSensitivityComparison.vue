<template>
  <div v-if="cube">
    <p class="text-body-4 mb-6">We vary the race comparison, whether a violation code was recorded, and how multiple
      recorded occupants are classified. {{ clearChanges }} of {{ cube.sensitivity.length }} specifications show a
      statistically significant pre/post difference. The main result uses Black/white sole-occupant stops without requiring a code.</p>
    <VeilComparisonPeriods :cube="cube"/>
    <div class="flex flex-wrap gap-6 my-6">
      <label class="flex flex-col gap-2 text-body-4">Race comparison
        <select v-model="universe" class="border border-neutral-400 rounded p-3 bg-white" aria-label="Race comparison">
          <option value="black_white">Non-Latino Black/white occupants only</option>
          <option value="all_races">Occupants of all races</option>
        </select>
      </label>
      <label class="flex flex-col gap-2 text-body-4">Recorded violation code
        <select v-model="requireMvc" class="border border-neutral-400 rounded p-3 bg-white" aria-label="Recorded violation code">
          <option :value="false">No code required</option><option :value="true">Code required</option>
        </select>
      </label>
    </div>
    <CoefficientGraph :estimates="chartData" :axis-properties="axes" :group-classes="classes" :chart-legend="legend">
      <h4>Before and After Driving Equality Under Different Occupant Definitions</h4>
      <template #footer><p class="text-caption text-neutral-800 pt-4 px-4 max-w-[630px] mx-auto">Each dot is the daylight-to-dark
        change in the share of stops meeting the occupant definition, with a 95% confidence interval. Every stop counts once.
        Majority means more than half; 50/50 stops count as no Black majority. All recorded people must be adults with recorded demographics.</p></template>
    </CoefficientGraph>
    <div class="overflow-x-auto my-6">
      <table class="w-full text-body-4 border-collapse">
        <caption class="text-left font-semibold mb-4">Direct pre/post differences (percentage points)</caption>
        <thead><tr><th scope="col">Occupant definition</th><th scope="col">Difference</th><th scope="col">95% confidence interval</th><th scope="col">Stops</th></tr></thead>
        <tbody><tr v-for="fit in selected" :key="fit.key">
          <th scope="row">{{ label(fit) }}</th><td>{{ signed(fit.result.difference_pp) }}</td>
          <td>{{ signed(fit.result.difference_ci_lo_pp) }} to {{ signed(fit.result.difference_ci_hi_pp) }}</td>
          <td>{{ fit.result.n.toLocaleString() }}</td>
        </tr></tbody>
      </table>
    </div>
    <p class="text-body-4">Black means non-Latino Black in every version. With all races included, the comparison is with all
      other recorded racial categories, rather than white alone. “Anyone,” “majority,” and “everyone” describe people recorded at
      the stop; they do not identify the driver or establish who else was physically in the car.</p>
    <p class="text-body-4 mt-4">Years: {{ yearsLabel }}; {{ cube.excluded_years.join(' and ') }} excluded. These fits use the same
      time window, seasonality weights, and controls for clock time, weekday, year, police service area, officer assignment, and summer.
      Stops are grouped using vehicle records only. Earlier supporting analyses below grouped pedestrian and vehicle records before
      inferring sole occupancy; the correction moves the baseline estimates by less than 0.02 points on the current archive.</p>
  </div>
  <p v-else role="status">{{ error ? 'The sensitivity comparisons are unavailable.' : 'Loading sensitivity comparisons…' }}</p>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import CoefficientGraph from './CoefficientGraph.vue'
import VeilComparisonPeriods from './VeilComparisonPeriods.vue'
import { useVeilComparison } from '../composables/useVeilComparison'
import { hasSignificantVeilChange, veilPeriodPoints, veilYearsLabel } from '../utils/veil'
import type { VeilSensitivityFit } from '../utils/veil'
const { data, error } = useVeilComparison()
const cube = computed(() => data.value?.cube)
const universe = ref('black_white')
const requireMvc = ref(false)
const selected = computed(() => cube.value?.sensitivity.filter(f => f.universe === universe.value && f.require_mvc === requireMvc.value && f.result.converged) ?? [])
const label = (f: VeilSensitivityFit) => f.occupancy === 'sole' ? 'Sole occupant'
  : { any_black: 'Anyone Black', majority_black: 'Majority Black', all_black: 'Everyone Black' }[f.rule]
const signed = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`
const chartData = computed(() => selected.value.flatMap(f => veilPeriodPoints(f.result, cube.value).map(p => ({
  ...p, x: label(f), group: p.x, hoverText: [label(f), ...p.hoverText],
}))))
const clearChanges = computed(() => cube.value?.sensitivity.filter(f => hasSignificantVeilChange(f.result)).length ?? 0)
const yearsLabel = computed(() => veilYearsLabel(cube.value?.years ?? []))
const axes = { x: 'Recorded occupants', y: 'Change in share of stops (percentage points)' }
const classes = { Before: 'stroke-purple fill-purple bg-purple', After: 'stroke-violet fill-violet bg-violet' }
const legend = { Before: 'Before Driving Equality', After: 'After Driving Equality' }
</script>
<style scoped>
th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
</style>

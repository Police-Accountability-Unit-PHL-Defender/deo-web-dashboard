<template>
  <section id="veil-of-darkness">
    <h2 class="text-heading-3 text-left mb-6">Driving Equality and the veil of darkness</h2>
    <p class="mb-6">Darkness can make a driver's race harder to see. The veil of darkness test<Tooltip term="Veil of darkness"/> compares the racial
      makeup of stops at the same evening hours in daylight and darkness for evidence that race may influence who police stop.</p>
      <QuestionHeader><h3>Did the daylight–darkness pattern change after Driving Equality?</h3></QuestionHeader>
      <Answer v-if="result && cube" :arrow="true">
        <AnswerText>
          <p class="result-text"><strong class="text-purple">{{ significant
            ? 'A statistically significant change.' : 'No statistically significant change.' }}</strong><Tooltip term="Statistical significance"/>
            {{ periodSignificance }}</p>
        </AnswerText>
        <CoefficientGraph :estimates="points" :axis-properties="axes" :group-classes="classes" horizontal>
          <h4>Percentage of stopped drivers who were Black: darkness vs. daylight</h4>
          <template #footer><p class="text-caption text-neutral-800 pt-4 px-4 max-w-[630px] mx-auto">
            Lines show 95% confidence intervals<Tooltip term="Confidence interval"/>. Negative values mean a lower Black share of stops in darkness.
          </p></template>
        </CoefficientGraph>
        <p class="text-caption mt-4">Source: Philadelphia Police Department records.
          <a href="/data#veil-of-darkness" class="text-hyperlink">About the data and research</a>.</p>
          <details class="text-body-4 mt-4">
            <summary class="cursor-pointer">About this comparison</summary>
          <p class="mt-3">The test compares the racial makeup of stops at the same evening hour in daylight and darkness.
            No statistically significant change does not prove the pattern stayed the same.</p>
          <VeilComparisonPeriods :cube="cube" compact/>
          <p class="result-text text-body-4 mt-3">Based on <span>{{ result.n.toLocaleString() }}</span> evening vehicle stops of adult non-Latino Black
            and white motorists with one person recorded at the stop, in Philadelphia's residential districts. No recorded violation code is required.</p>
          </details>
      </Answer>
      <p v-else class="my-6" role="status">{{ comparisonError || (cube && !cube.main.converged)
        ? 'The comparison is unavailable.' : 'Loading the comparison…' }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CoefficientGraph from '../components/CoefficientGraph.vue'
import Tooltip from '../components/ui/Tooltip.vue'
import VeilComparisonPeriods from '../components/VeilComparisonPeriods.vue'
import { useVeilComparison } from '../composables/useVeilComparison'
import { hasSignificantVeilChange, veilPeriodPoints } from '../utils/veil'

const { data, error: comparisonError } = useVeilComparison()
const cube = computed(() => data.value?.cube ?? null)
const result = computed(() => cube.value?.main.converged ? cube.value.main : null)
const significant = computed(() => result.value ? hasSignificantVeilChange(result.value) : false)
const before = computed(() => result.value!.effects.reference)
const after = computed(() => result.value!.effects.group)
const periodSignificance = computed(() => {
  if (!result.value) return ''
  const periods = [
    { label: 'before', effect: before.value },
    { label: 'after', effect: after.value },
  ].filter(({ effect }) => Number.isFinite(effect.effect_ci_lo_pp) && Number.isFinite(effect.effect_ci_hi_pp)
    && (effect.effect_ci_lo_pp > 0 || effect.effect_ci_hi_pp < 0))
  if (periods.length === 2) return 'The daylight–darkness difference in who police stopped is statistically significant both before and after Driving Equality.'
  if (periods.length === 1) return `The daylight–darkness difference in who police stopped is statistically significant ${periods[0].label} Driving Equality, but not ${periods[0].label === 'before' ? 'after' : 'before'}.`
  return 'The daylight–darkness difference in who police stopped is not statistically significant in either period.'
})
const points = computed(() => result.value && cube.value ? veilPeriodPoints(result.value, cube.value) : [])
const axes = { x: 'Driving Equality', y: 'Difference (percentage points)' }
const classes = { Estimate: 'stroke-purple fill-purple bg-purple' }
</script>

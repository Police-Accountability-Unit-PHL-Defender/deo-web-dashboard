<template>
  <section id="veil-of-darkness">
    <h2 class="text-heading-3 text-left mb-6">Driving Equality and the veil of darkness</h2>
    <p class="mb-6">At the same evening hour, officers can see drivers more easily in daylight than in darkness.
      The veil of darkness test compares the racial makeup of stops at the same evening hour in daylight
      and darkness to ask whether officers' ability to see a driver's race affects who they stop.</p>
      <QuestionHeader><h3>Did the daylight–darkness difference in the percentage of stopped drivers who were Black change after
        Driving Equality took effect?</h3></QuestionHeader>
      <Answer v-if="result && cube" :arrow="true">
        <AnswerText>
          <p class="result-text"><strong class="text-purple">{{ significant
            ? 'A statistically significant change.' : 'No statistically significant change.' }}</strong>
            The percentage of stopped drivers who were Black was <span>{{ magnitude(before.effect_pp) }}</span> percentage points
            {{ before.effect_pp < 0 ? 'lower' : 'higher' }} in darkness than in daylight before the law,
            and <span>{{ magnitude(after.effect_pp) }}</span> points {{ after.effect_pp < 0 ? 'lower' : 'higher' }} afterward.</p>
          <p class="mt-3">{{ periodSignificance }}</p>
          <VeilComparisonPeriods :cube="cube" compact/>
          <p class="result-text text-body-4 mt-3">Based on <span>{{ result.n.toLocaleString() }}</span> evening vehicle stops of adult non-Latino Black
            and white motorists with one person recorded at the stop, in Philadelphia's residential districts. No recorded violation code is required.</p>
        </AnswerText>
        <CoefficientGraph :estimates="points" :axis-properties="axes" :group-classes="classes" horizontal>
          <h4>Percentage of stopped drivers who were Black: darkness vs. daylight</h4>
          <template #footer><p class="text-caption text-neutral-800 pt-4 px-4 max-w-[630px] mx-auto">
            Lines show 95% confidence intervals. Negative values mean a lower percentage of stopped drivers were Black in darkness.
          </p></template>
        </CoefficientGraph>
      </Answer>
      <p v-else class="my-6" role="status">{{ comparisonError || (cube && !cube.main.converged)
        ? 'The comparison is unavailable.' : 'Loading the comparison…' }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CoefficientGraph from '../components/CoefficientGraph.vue'
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
const magnitude = (v: number) => Math.abs(v).toFixed(2)
</script>

<template>
  <section id="veil-of-darkness">
      <Answer v-if="result && cube" :arrow="true">
        <AnswerText class="space-y-6">
          <p><strong>Do Philadelphia police stop Black drivers more often when officers can see a driver’s race?</strong> Officers can more easily see a driver’s race in daylight than after dark.</p>
          <p>The “veil of darkness” statistical test compares traffic stops police made throughout the year at the same evening hours, some in daylight and some after dark due to seasonal changes. If Black drivers make up a larger share of daylight traffic stops than stops after dark during the same times, that suggests race influences who police pulled over.</p>
          <p class="result-text">Both before<Tooltip term="Before Driving Equality" :definition="periods.before.replace(' through ', ' - ')"/> and after<Tooltip term="After Driving Equality" :definition="periods.after.replace(' through ', ' - ')"/> Driving Equality, Black drivers made up a larger share of traffic stops when a driver’s race was visible. In the graph below, negative values indicate that Black drivers made up a smaller share of PPD traffic stops when it was dark outside.</p>
        </AnswerText>
        <CoefficientGraph :estimates="points" :axis-properties="axes" :group-classes="classes" horizontal>
          <h4>Percent of Drivers Stopped by the PPD Who Were Black: Traffic Stops in Darkness vs. Daylight</h4>
        </CoefficientGraph>
      </Answer>
      <p v-else class="my-6" role="status">{{ comparisonError || (cube && !cube.main.converged)
        ? 'The comparison is unavailable.' : 'Loading the comparison…' }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CoefficientGraph from '../components/CoefficientGraph.vue'
import Tooltip from '../components/ui/Tooltip.vue'
import { useVeilComparison } from '../composables/useVeilComparison'
import { veilComparisonPeriods, veilPeriodPoints } from '../utils/veil'

const { data, error: comparisonError } = useVeilComparison()
const cube = computed(() => data.value?.cube ?? null)
const result = computed(() => cube.value?.main.converged ? cube.value.main : null)
const periods = computed(() => cube.value ? veilComparisonPeriods(cube.value) : { before: '', after: '' })
const points = computed(() => result.value && cube.value
  ? veilPeriodPoints(result.value, cube.value).map(point => ({ ...point, x: `${point.x} Driving Equality` }))
  : [])
const axes = { x: 'Driving Equality', y: 'Difference (percentage points)' }
const classes = { Estimate: 'stroke-purple fill-purple bg-purple' }
</script>

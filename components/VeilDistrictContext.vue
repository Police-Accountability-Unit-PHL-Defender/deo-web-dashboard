<template>
  <div class="mt-12 pt-10 border-t border-neutral-300">
    <QuestionHeader>
      <h3>Does the daylight–darkness pattern vary with who lives in a district or how often police make stops there?</h3>
    </QuestionHeader>
    <Answer v-if="context" :arrow="true">
      <AnswerText>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div class="rounded-xl bg-[#FCFCFC] shadow-graph p-5 border-t-4 border-purple">
            <p class="font-semibold text-primary-800">Percentage of residents who are white</p>
            <p class="text-heading-4 text-purple mt-2">A relationship with age and gender</p>
            <p class="text-body-4 mt-2">Where a larger percentage of residents are white, the model finds smaller after-dark declines in the odds that a stopped motorist is young or male. It does not detect a clear relationship for whether a stopped motorist is Black.</p>
          </div>
          <div class="rounded-xl bg-[#FCFCFC] shadow-graph p-5 border-t-4 border-mint">
            <p class="font-semibold text-primary-800">Recorded stops per 1,000 residents</p>
            <p class="text-heading-4 text-primary-800 mt-2">No clear relationship</p>
            <p class="text-body-4 mt-2">This analysis does not detect a clear relationship between stops per resident and the daylight–darkness patterns for race, age, or gender. That does not establish that no relationship exists.</p>
          </div>
        </div>
        <p class="text-body-4">
          These comparisons include both district measures in the same model. They describe relationships in the
          records; they do not establish that a district's population or number of stops caused the pattern.
          Race, age, and gender refer to the categories recorded by police. The sample includes adult non-Latino
          Black and white motorists with one person recorded at the stop and a recorded violation code.
        </p>
        <p class="text-body-4 mt-4">
          We divide the average annual number of recorded vehicle stops in each district by its resident population,
          then express that number per 1,000 residents. People often drive outside the district where they live.
          Commuting, major roads, and visitors can therefore affect this measure. It describes the volume of stops
          relative to population; by itself, it cannot tell us a driver's chance of being stopped or whether police make too many stops.
        </p>
        <details class="mt-6">
          <summary class="text-body-4 cursor-pointer">See the statistical estimates</summary>
          <p class="text-caption mt-4">Each number is the percentage change in the darkness-to-daylight odds ratio
            for a ten-percentage-point increase in white residents, or ten additional annual stops per 1,000 residents.
            These are changes in odds ratios, not percentage-point changes in the share of stops.
            Intervals account for stops within the same district being related.</p>
        <div class="overflow-x-auto mt-4">
          <table class="w-full text-body-4 text-left">
            <thead><tr class="border-b border-neutral-400">
              <th class="p-2">Recorded characteristic</th>
              <th class="p-2">10 points more white residents</th>
              <th class="p-2">10 more stops per 1,000 residents</th>
            </tr></thead>
            <tbody>
              <tr v-for="effect in context.effects" :key="effect.attribute" class="border-b border-neutral-200">
                <td class="p-2 font-semibold">{{ labels[effect.attribute] }}</td>
                <td class="p-2">{{ interactionText(effect.moderators.district_whiteness) }}</td>
                <td class="p-2">{{ interactionText(effect.moderators.stops_per_1000) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-caption text-neutral-800 mt-4">
          Based on {{ context.effects[0].n.toLocaleString() }} evening stops, {{ yearsLabel }}.
          Models account for clock time, day of the week, year, police service area, assigned police unit, summer,
          seasonality, and both district measures. The estimates use district-clustered uncertainty and assume a
          linear relationship on the log-odds scale. With relatively few districts, these exploratory results should be read cautiously.
        </p>
        </details>
      </AnswerText>
    </Answer>
    <p v-else class="my-6" role="status">Loading district-context analysis…</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useVeilCube } from '../composables/useVeilCube'
import type { VeilAttribute, VeilContextModerator } from '../utils/veil'

const { data } = useVeilCube()
const context = computed(() => data.value?.cube?.intraracial?.by_year?.district_context ?? null)
const labels: Record<VeilAttribute, string> = {
  race: 'Black rather than white non-Latino',
  age: 'Age 18–29 rather than 30+',
  gender: 'Male rather than female',
}
const yearsLabel = computed(() => {
  const years = context.value?.years ?? []
  return years.length ? `${years[0]}–${years[years.length - 1]}, excluding 2020` : ''
})
const pctChange = (oddsRatio: number) => ((oddsRatio - 1) * 100).toFixed(1)
const fmtP = (p: number) => p < 0.001 ? '< .001' : `= ${p.toFixed(3)}`
const interactionText = (m: VeilContextModerator) =>
  `${pctChange(m.odds_ratio_multiplier_per_10)}% (95% interval ${pctChange(m.odds_ratio_ci_lo_per_10)}% to ${pctChange(m.odds_ratio_ci_hi_per_10)}%); p ${fmtP(m.interaction_p_value)}`
</script>

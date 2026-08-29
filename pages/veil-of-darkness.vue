<template>
  <LayoutPageHeader>
    <template #header>
      When police can see who's driving, who do they stop?
    </template>
    <template #image>
      <img class="w-full h-full object-cover object-center" src="~/assets/images/stops.jpg" alt="A street in Philadelphia at dusk"/>
      <div class="absolute inset-0 z-[1] bg-black opacity-60"></div>
    </template>
    <template #quote>
      <Quote author="Professor Lance Hannon" source="http://www88.homepage.villanova.edu/lance.hannon/TestimonyBills210635and210636Draft.pdf" backgroundClass="bg-[#E9D1F7]" quoteMarkClass="fill-violet" bold-color-class="text-violet" alignment="center">
        <template #quoteText>
          <p>
            I look forward to the day that I will see Philadelphia featured not as an example where numerous statistical tests all point to racial bias in policing practices, but rather as a national leader in evidence-based justice reform.
          </p>
        </template>
      </Quote>
    </template>
  </LayoutPageHeader>

  <main class="layout-container mt-8 md:-mt-4 text-body-3">
    <div class="grid-container">
      <div class="col-span-10">
        <section v-if="intraracialByYear">
          <h2 class="text-heading-3 text-left pt-10 mb-6">What changes after sunset?</h2>
          <AnswerText>
            <p class="text-body-4">
              This chart extends the analysis in
              <a class="text-hyperlink" href="https://doi.org/10.1007/s12103-025-09879-8" target="_blank" rel="noopener">Hannon
              &amp; Biddle (2025), <em>Unequal Policing of Black Motorists in Black Communities by Age and
              Gender</em></a>. The paper analyzes Black motorists in majority-Black districts; this extension fits
              Black and White motorists separately and lets you switch between the dashboard's Census-based
              majority-White and majority-non-White district groups. The first chart gives the report-style
              before-and-after view on a probability scale:
              each line connects a group's model-adjusted share of stops in daylight with its share after dark.
              Use the selectors to aggregate any combination of years and compare any age-and-gender groups.
            </p>
          </AnswerText>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[900px] mt-6">
            <SelectVeilGroups v-model="selectedGroups" :items="trendGroupOptions"/>
            <SelectVeilRaces v-model="selectedRaces" :items="raceOptions"/>
            <SelectVeilDistrictContext v-model="selectedDistrictContext" :items="districtContextOptions"/>
            <SelectYears v-model="selectedYears" :items="trendYearOptions"/>
          </div>

          <LineGraph
            :graph-data="aggregateProbabilityData"
            :axis-properties="{x: 'Lighting', y: 'Model-adjusted share of stops (%)'}"
            group-name="group"
            :group-classes="TREND_CLASSES"
            :chart-legend="trendLegend">
            <h4>Model-adjusted share of stops before and after sunset</h4>
            <template #footer>
              <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[630px] mx-auto">
                This combines the selected calendar years by weighting each year's marginal prediction by the number
                of stops in that year's model. It is an aggregate of the annual standardized estimates, not a newly
                fitted pooled regression. Black and White motorists are always fitted separately. “Majority White”
                means more than 50% of district residents are White; every other classified residential district is
                “majority non-White.” The same selections control the charts below.
              </p>
            </template>
          </LineGraph>

          <CoefficientGraph
            :estimates="aggregateEffectData"
            :axis-properties="{x: 'Age and gender', y: 'Change after dark (percentage points)'}"
            :group-classes="TREND_CLASSES"
            :chart-legend="trendLegend">
            <h4>Combined model-adjusted change after dark across the selected years</h4>
            <template #footer>
              <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[630px] mx-auto">
                One point summarizes all selected years for each identity; its vertical bar is a 95% confidence
                interval. Annual marginal effects and their independent variances use the same stop-count weighting
                as the before/after chart. Below zero means a smaller adjusted share after dark; above zero, larger.
              </p>
            </template>
          </CoefficientGraph>

          <h3 id="intra-trend" class="text-heading-4 text-left pt-10 mb-6">Does this pattern hold up year by year?</h3>
          <AnswerText>
            <p class="text-body-4">
              The report pools several years into a single estimate. That cannot show whether the finding is steady
              or whether one unusual year is carrying it, so here the same model is fitted again, one calendar year
              at a time, from {{ trendYearsLabel }} &mdash; eight years further back than the published study reaches.
              Each dot is the model-adjusted change in probability after dark, measured in percentage points, and
              each vertical bar is its 95% confidence interval &mdash;
              the range the true effect plausibly falls in. Where a bar crosses the dashed zero line, that
              year cannot distinguish the effect from no effect at all.
            </p>
          </AnswerText>

          <CoefficientGraph
            :estimates="trendData"
            :axis-properties="{x: 'Year', y: 'Change after dark (percentage points)'}"
            :group-classes="TREND_CLASSES"
            :chart-legend="trendLegend"
            :minimum-container-width="1080">
            <h4>Model-adjusted change in who gets stopped after dark, by year</h4>
            <template #footer>
              <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[630px] mx-auto">
                Below zero means that group's model-adjusted share of stops is lower after dark; above zero, higher.
                These are average marginal changes: the model predicts every stop once as if it happened in daylight
                and once as if it happened after dark, then averages the difference over that year's actual stops.
                Each year is fitted on its own, using the same controls and the same
                seasonality weighting as the published analysis, and all years share one
                inter-twilight window so that a year-to-year difference cannot be an artifact of a shifting
                comparison period. Hover any point for the two predicted probabilities, their difference, and sample size.
                <template v-if="trendOverlapYear">
                  These are <strong>full calendar years</strong>, whereas the published analysis runs
                  {{ intraracialWindowLabel }} &mdash; so its {{ trendOverlapYear }} covers only part of the year and
                  the two {{ trendOverlapYear }} figures are not the same quantity.
                </template>
                Everything before 2022 predates Driving Equality, which took effect in March that year.
                <template v-if="trendOffByDefault.length">
                  <strong>{{ trendOffByDefault.join(' and ') }} is fitted and can be switched on, but is off by
                  default</strong>: lockdowns and curfews changed when people drive in the evening, and this test
                  assumes travel patterns do not shift with the light. That assumption fails for that year in
                  particular, so it is a deliberate choice rather than part of the default picture.
                </template>
                From 2023 onward a smaller share of vehicle stops carries a recorded violation code (about 82%, against
                93&ndash;96% in every earlier year), so the sample is composed slightly differently either side of that
                break &mdash; another reason to read the overall pattern rather than year-to-year wiggles.
                2026 is left out because the data only runs through June, and a half year would cover only the lighter
                half of the daylight cycle. A single year holds a fraction of the pooled sample, so these
                intervals are correspondingly wider than the pooled ones.
              </p>
            </template>
          </CoefficientGraph>

          <AnswerText>
            <p class="text-body-4">
              These comparisons are exploratory extensions. The paper's published coefficients validate the original
              Black-motorist, majority-Black-district specification; they do not validate every race-and-context line
              shown here. Read repeated direction across years more heavily than an isolated confidence interval.
            </p>
          </AnswerText>
        </section>

      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import CoefficientGraph from '~/components/CoefficientGraph.vue'
import LineGraph from '~/components/LineGraph.vue'
import SelectVeilGroups from '~/components/SelectVeilGroups.vue'
import SelectVeilRaces from '~/components/SelectVeilRaces.vue'
import SelectVeilDistrictContext from '~/components/SelectVeilDistrictContext.vue'
import SelectYears from '~/components/SelectYears.vue'
import { useVeilCube } from '~/composables/useVeilCube'
import {
  aggregateMarginalProbabilities,
  type VeilComparisonRace,
  type VeilDistrictContext,
  type VeilIntraracialGroup,
} from '~/utils/veil'

useHead({
  title: "When police can see who's driving, who do they stop?",
})

const { data: veilBundle } = useVeilCube()

// =========================================================================
// Year-by-year trend.
//
// Reads `intraracial` straight off the cube bundle: the trend fits are
// pre-aggregated (sample metadata, per-year estimates for four outcomes),
// so there is no row-level aggregation left to do here.
// =========================================================================
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "2022-01-01" -> "January 2022". */
function monthYearLabel(isoDate: string): string {
  const [year, month] = isoDate.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`
}

const intraracial = computed(() => veilBundle.value?.cube?.intraracial ?? null)
const intraracialSample = computed(() => intraracial.value?.sample ?? null)
const intraracialByYear = computed(() => intraracial.value?.by_year ?? null)

const TREND_LABEL: Record<VeilIntraracialGroup, string> = {
  young_male: 'Young man (18–29)',
  young_female: 'Young woman (18–29)',
  older_male: 'Older man (30+)',
  older_female: 'Older woman (30+)',
}

// One fixed palette entry per race/group combination. Keeping the complete
// class strings literal here also ensures Tailwind includes every SVG stroke
// and legend fill in the generated stylesheet.
const SERIES_CLASSES = [
  'stroke-purple fill-purple bg-purple', 'stroke-violet fill-violet bg-violet',
  'stroke-red fill-red bg-red', 'stroke-yellow fill-yellow bg-yellow',
  'stroke-yellowgreen fill-yellowgreen bg-yellowgreen', 'stroke-mint fill-mint bg-mint',
  'stroke-highlight fill-highlight bg-highlight', 'stroke-primary-800 fill-primary-800 bg-primary-800',
]
const TREND_CLASSES: Record<string, string> = {}
let seriesClassIndex = 0
for (const race of ['Black', 'White']) {
  for (const group of Object.values(TREND_LABEL)) {
    TREND_CLASSES[`${race}: ${group}`] = SERIES_CLASSES[seriesClassIndex++]
  }
}

const RACE_LABEL: Record<VeilComparisonRace, string> = { black: 'Black', white: 'White' }
const CONTEXT_LABEL: Record<VeilDistrictContext, string> = {
  majority_non_white: 'Majority non-White districts',
  majority_white: 'Majority White districts',
}

const trendYearOptions = computed<string[]>(() =>
  (intraracialByYear.value?.years ?? []).map(String),
)

const trendGroupOptions = Object.values(TREND_LABEL)
const raceOptions = Object.values(RACE_LABEL)
const districtContextOptions = Object.values(CONTEXT_LABEL)
const selectedGroups = ref<string[]>([
  TREND_LABEL.young_male,
  TREND_LABEL.older_female,
])
const selectedRaces = ref<string[]>(raceOptions)
const selectedDistrictContext = ref<string>(CONTEXT_LABEL.majority_non_white)
const trendLegend = computed<Record<string, string>>(() =>
  Object.fromEntries(
    selectedRaces.value.flatMap((race) =>
      selectedGroups.value.map((group) => [`${race}: ${group}`, `${race}: ${group}`]),
    ),
  ),
)

/**
 * The cube loads lazily, so the years are unknown at setup and the default
 * selection has to be filled in once they arrive. Only seeded while the
 * selection is empty, so a reader's own choice is never overwritten by a
 * later re-evaluation.
 */
const selectedYears = ref<string[]>([])
watch(intraracialByYear, (byYear) => {
  if (byYear && selectedYears.value.length === 0) {
    // `default_years`, not every year: 2020 is selectable but off by
    // default. See the type's comment and the caption beneath the chart.
    selectedYears.value = byYear.default_years.map(String)
  }
}, { immediate: true })

/** Years present in the data but not shown until the reader asks for them. */
const trendOffByDefault = computed<number[]>(() => {
  const byYear = intraracialByYear.value
  if (!byYear) return []
  const shown = new Set(byYear.default_years)
  return byYear.years.filter((y) => !shown.has(y))
})

const trendData = computed(() => {
  const byYear = intraracialByYear.value
  if (!byYear) return []
  const chosen = new Set(selectedYears.value)
  const chosenGroups = new Set(selectedGroups.value)
  return selectedStrata.value.flatMap((stratum) => stratum.estimates
    .filter((e) => chosen.has(String(e.year)) && chosenGroups.has(TREND_LABEL[e.outcome]))
    .map((e) => {
      const series = `${RACE_LABEL[stratum.race]}: ${TREND_LABEL[e.outcome]}`
      return {
      x: String(e.year),
      group: series,
      value: e.marginal_effect_pp,
      ciLo: e.marginal_ci_lo_pp,
      ciHi: e.marginal_ci_hi_pp,
      hoverText: [
        `${series}, ${e.year}`,
        `${e.marginal_daylight_pct.toFixed(1)}% in daylight; ${e.marginal_dark_pct.toFixed(1)}% after dark`,
        `${formatSigned(e.marginal_effect_pp)} percentage points after dark`,
        `95% interval ${formatSigned(e.marginal_ci_lo_pp)} to ${formatSigned(e.marginal_ci_hi_pp)} (p ${fmtP(e.p_value)})`,
        `${e.n.toLocaleString()} stops`,
      ],
      }
    }))
})

const selectedStrata = computed(() => {
  const byYear = intraracialByYear.value
  if (!byYear) return []
  const races = new Set(selectedRaces.value)
  return byYear.strata.filter((stratum) =>
    races.has(RACE_LABEL[stratum.race])
    && CONTEXT_LABEL[stratum.district_context] === selectedDistrictContext.value,
  )
})

const aggregateProbabilityData = computed(() => {
  const byYear = intraracialByYear.value
  if (!byYear) return []
  const labelToOutcome = new Map(
    Object.entries(TREND_LABEL).map(([outcome, label]) => [label, outcome as VeilIntraracialGroup]),
  )
  const outcomes = selectedGroups.value
    .map((label) => labelToOutcome.get(label))
    .filter((outcome): outcome is VeilIntraracialGroup => Boolean(outcome))
  const years = selectedYears.value.map(Number)

  return selectedStrata.value.flatMap((stratum) =>
    aggregateMarginalProbabilities(stratum.estimates, outcomes, years).flatMap((estimate) => {
    const label = `${RACE_LABEL[stratum.race]}: ${TREND_LABEL[estimate.outcome]}`
    const difference = estimate.darkPct - estimate.daylightPct
    const common = [
      label,
      `${estimate.n.toLocaleString()} stops across ${years.length} selected ${years.length === 1 ? 'year' : 'years'}`,
      `${formatSigned(difference)} percentage points after dark`,
    ]
    return [
      { group: label, Lighting: 'Before sunset', 'Model-adjusted share of stops (%)': estimate.daylightPct,
        hover_text: [label, `${estimate.daylightPct.toFixed(1)}% before sunset`, ...common.slice(1)] },
      { group: label, Lighting: 'After sunset', 'Model-adjusted share of stops (%)': estimate.darkPct,
        hover_text: [label, `${estimate.darkPct.toFixed(1)}% after sunset`, ...common.slice(1)] },
    ]
  }))
})

const aggregateEffectData = computed(() => {
  const labelToOutcome = new Map(
    Object.entries(TREND_LABEL).map(([outcome, label]) => [label, outcome as VeilIntraracialGroup]),
  )
  const outcomes = selectedGroups.value
    .map((label) => labelToOutcome.get(label))
    .filter((outcome): outcome is VeilIntraracialGroup => Boolean(outcome))
  const years = selectedYears.value.map(Number)

  return selectedStrata.value.flatMap((stratum) =>
    aggregateMarginalProbabilities(stratum.estimates, outcomes, years).map((estimate) => {
      const identity = TREND_LABEL[estimate.outcome]
      const series = `${RACE_LABEL[stratum.race]}: ${identity}`
      return {
        x: identity,
        group: series,
        value: estimate.effectPp,
        ciLo: estimate.effectCiLoPp,
        ciHi: estimate.effectCiHiPp,
        hoverText: [
          series,
          `${formatSigned(estimate.effectPp)} percentage points after dark`,
          `95% interval ${formatSigned(estimate.effectCiLoPp)} to ${formatSigned(estimate.effectCiHiPp)}`,
          `${estimate.n.toLocaleString()} stops across ${years.length} selected ${years.length === 1 ? 'year' : 'years'}`,
        ],
      }
    }),
  )
})

/** "2021–2025", from the trend window rather than asserted in the page's voice. */
const trendYearsLabel = computed(() => {
  const years = intraracialByYear.value?.years ?? []
  return years.length ? `${years[0]}–${years[years.length - 1]}` : ''
})

/** The paper's window ends mid-2025; the trend's 2025 is a whole year. */
const trendOverlapYear = computed<number | null>(() => {
  const end = intraracialSample.value?.window_end
  return end ? Number(end.slice(0, 4)) : null
})

/** "January 2022 to August 2025" -- the published analysis's window. */
const intraracialWindowLabel = computed(() => {
  const sample = intraracialSample.value
  if (!sample) return 'January 2022 to August 2025'
  return `${monthYearLabel(sample.window_start)} to ${monthYearLabel(sample.window_end)}`
})

/** An estimate's interval clears the no-effect mark in its own right. */
function formatSigned(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`
}

/** p-values render as "< .001" below that floor, else to three decimals. */
function fmtP(p: number): string {
  return p < 0.001 ? '< .001' : `= ${p.toFixed(3)}`
}
</script>

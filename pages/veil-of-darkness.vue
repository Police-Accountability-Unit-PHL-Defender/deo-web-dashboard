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
              This chart follows the analysis in
              <a class="text-hyperlink" href="https://doi.org/10.1007/s12103-025-09879-8" target="_blank" rel="noopener">Hannon
              &amp; Biddle (2025), <em>Unequal Policing of Black Motorists in Black Communities by Age and
              Gender</em></a>. The first chart gives the report-style before-and-after view on a probability scale:
              each line connects a group's model-adjusted share of stops in daylight with its share after dark.
              Use the selectors to aggregate any combination of years and compare any age-and-gender groups.
            </p>
          </AnswerText>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[660px] mt-6">
            <SelectVeilGroups v-model="selectedGroups" :items="trendGroupOptions"/>
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
                fitted pooled regression. The same selected years and groups control the chart below.
              </p>
            </template>
          </LineGraph>

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
            <p class="text-body-4" v-if="trendHeadlineRun">
              <strong v-if="trendHeadlineRun.unbroken">Both headline findings hold in every one of the
              {{ trendYearOptions.length }} years.</strong>
              <strong v-else>The headline findings hold in {{ trendHeadlineRun.hits }} of
              {{ trendHeadlineRun.total }} year-and-group estimates.</strong>
              Across {{ trendYearOptions[0] }}&ndash;{{ trendYearOptions[trendYearOptions.length - 1] }}, young men are
              stopped significantly less often once it is dark and older women significantly more often, without a
              single exception and without a single year reversing direction. That run spans two mayors, a pandemic,
              the introduction of Driving Equality, and a halving of the city's overall stop volume. Whatever produces
              this pattern, it is neither a recent development nor an artifact of one unusual year.
            </p>
            <p class="text-body-4 mt-6" v-if="trendOlderFemaleSpread">
              <strong>The size of each effect moves around, and the recent direction is not a trend.</strong> The
              older-woman estimate has ranged between {{ trendOlderFemaleSpread.min.toFixed(1) }} and
              {{ trendOlderFemaleSpread.max.toFixed(1) }} percentage points across the series, averaging
              {{ trendOlderFemaleSpread.mean.toFixed(1) }}. It is lower in
              {{ trendOlderFemaleSpread.last.year }} ({{ trendOlderFemaleSpread.last.marginal_effect_pp.toFixed(1) }} points) than in the
              years just before it, but
              <template v-if="!trendOlderFemaleSpread.lastIsOutsideEarlierRange">that figure sits inside the range
              earlier years already covered, and the highest values in the whole series are the ones immediately
              preceding it. Read over the full period this looks like a return toward the middle of the range rather
              than a decline</template><template v-else>it now sits below every earlier year in the series. That makes
              the latest year a new low, but one point cannot establish a downward trend; the next years will show
              whether it persists</template>.
              An earlier version of this page, written when only the most recent years had been fitted, described it as
              a possible weakening; the longer series does not support that reading.
            </p>
            <p class="text-body-4 mt-6">
              <strong>The other two groups behave quite differently from each other, and neither is a finding.</strong>
              Older men are detectable in just {{ trendOlderMale.hits }} of {{ trendOlderMale.total }} years, with the
              estimate falling on both sides of zero &mdash; the shape of noise. Young women are different: significant
              in {{ trendYoungFemale.hits }} of {{ trendYoungFemale.total }} years
              ({{ trendYoungFemale.years.join(', ') }}), essentially flat in the rest, and
              <template v-if="!trendYoungFemale.anyNegative">never appreciably negative in any year</template><template
              v-else>negative in at least one year</template>. That is weaker than an established effect but not
              obviously nothing, and it is why the pooled model reports no result for this group rather than a small
              one. With {{ trendTestCount }} estimates on this chart, a handful of isolated hits is expected at the
              usual threshold, so none of this should be cited as a finding about young women &mdash; only as a reason
              the question stays open.
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
import SelectYears from '~/components/SelectYears.vue'
import { useVeilCube } from '~/composables/useVeilCube'
import {
  aggregateMarginalProbabilities,
  type VeilIntraracialGroup,
  type VeilIntraracialYearEstimate,
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

// Four hues from the site palette, checked as a set rather than picked by
// eye: worst all-pairs separation is ΔE 9.4 under deutan simulation and
// 25.6 for normal vision, both clear of the floors. Two of them sit under
// 3:1 against the chart surface, which is why the legend below is not
// optional -- it is the relief that makes them identifiable.
const TREND_CLASSES: Record<string, string> = {
  [TREND_LABEL.young_male]: 'stroke-purple fill-purple bg-purple',
  [TREND_LABEL.young_female]: 'stroke-red fill-red bg-red',
  [TREND_LABEL.older_male]: 'stroke-yellowgreen fill-yellowgreen bg-yellowgreen',
  [TREND_LABEL.older_female]: 'stroke-highlight fill-highlight bg-highlight',
}

const trendYearOptions = computed<string[]>(() =>
  (intraracialByYear.value?.years ?? []).map(String),
)

const trendGroupOptions = Object.values(TREND_LABEL)
const selectedGroups = ref<string[]>([
  TREND_LABEL.young_male,
  TREND_LABEL.older_female,
])
const trendLegend = computed<Record<string, string>>(() =>
  Object.fromEntries(selectedGroups.value.map((label) => [label, label])),
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
  return byYear.estimates
    .filter((e) => chosen.has(String(e.year)) && chosenGroups.has(TREND_LABEL[e.outcome]))
    .map((e) => ({
      x: String(e.year),
      group: TREND_LABEL[e.outcome],
      value: e.marginal_effect_pp,
      ciLo: e.marginal_ci_lo_pp,
      ciHi: e.marginal_ci_hi_pp,
      hoverText: [
        `${TREND_LABEL[e.outcome]}, ${e.year}`,
        `${e.marginal_daylight_pct.toFixed(1)}% in daylight; ${e.marginal_dark_pct.toFixed(1)}% after dark`,
        `${formatSigned(e.marginal_effect_pp)} percentage points after dark`,
        `95% interval ${formatSigned(e.marginal_ci_lo_pp)} to ${formatSigned(e.marginal_ci_hi_pp)} (p ${fmtP(e.p_value)})`,
        `${e.n.toLocaleString()} stops`,
      ],
    }))
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

  return aggregateMarginalProbabilities(byYear.estimates, outcomes, years).flatMap((estimate) => {
    const label = TREND_LABEL[estimate.outcome]
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
  })
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
function isSignificant(e: VeilIntraracialYearEstimate): boolean {
  return e.marginal_ci_lo_pp > 0 || e.marginal_ci_hi_pp < 0
}

function estimatesFor(outcome: VeilIntraracialGroup): VeilIntraracialYearEstimate[] {
  return (intraracialByYear.value?.estimates ?? []).filter((e) => e.outcome === outcome)
}

/**
 * The two headline outcomes across every year fitted.
 *
 * `unbroken` is the page's strongest claim -- every year, both groups,
 * interval clear of zero -- so it is computed rather than asserted. If a
 * future data vintage broke the run, the sentence below stops claiming it.
 */
const trendHeadlineRun = computed(() => {
  const series = [...estimatesFor('young_male'), ...estimatesFor('older_female')]
  if (!series.length) return null
  const hits = series.filter(isSignificant).length
  return { hits, total: series.length, unbroken: hits === series.length }
})

/**
 * Older women across the whole series. This replaces an earlier "the effect
 * appears to be weakening" claim written when only 2021-2025 was fitted:
 * over twelve years the estimate oscillates with no trend, and the recent
 * fall sits inside the band the series has always occupied. Kept as derived
 * values so the wording cannot outlive the data that justified it.
 */
const trendOlderFemaleSpread = computed(() => {
  const series = estimatesFor('older_female')
  if (series.length < 3) return null
  const effects = series.map((e) => e.marginal_effect_pp)
  const min = Math.min(...effects)
  const max = Math.max(...effects)
  const last = series[series.length - 1]
  return {
    min,
    max,
    mean: effects.reduce((a, b) => a + b, 0) / effects.length,
    last,
    // Is the latest year actually outside the range the earlier years
    // already covered? If not, "declining" is not a claim the data supports.
    lastIsOutsideEarlierRange:
      last.marginal_effect_pp < Math.min(...series.slice(0, -1).map((e) => e.marginal_effect_pp)),
  }
})

/** How often each pooled-null outcome reaches significance on its own. */
function nullOutcomeSummary(outcome: VeilIntraracialGroup) {
  const series = estimatesFor(outcome)
  const hits = series.filter(isSignificant)
  return {
    hits: hits.length,
    total: series.length,
    years: hits.map((e) => e.year),
    // Sign consistency separates "scattered noise" from "weak but real".
    allSameSign: hits.length > 0 && (
      hits.every((e) => e.marginal_effect_pp > 0)
      || hits.every((e) => e.marginal_effect_pp < 0)
    ),
    anyNegative: series.some((e) => e.marginal_effect_pp < -0.1),
  }
}

const trendYoungFemale = computed(() => nullOutcomeSummary('young_female'))
const trendOlderMale = computed(() => nullOutcomeSummary('older_male'))
const trendTestCount = computed(() => intraracialByYear.value?.estimates.length ?? 0)

function formatSigned(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`
}

/** p-values render as "< .001" below that floor, else to three decimals. */
function fmtP(p: number): string {
  return p < 0.001 ? '< .001' : `= ${p.toFixed(3)}`
}
</script>

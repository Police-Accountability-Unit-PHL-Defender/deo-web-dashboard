<template>
  <LayoutPageHeader>
    <template #header>Veil of darkness: sensitivity and supporting analyses</template>
    <template #image>
      <img class="w-full h-full object-cover object-[0%_20%]" :src="stopsImage" alt="Closeup of police lights at night"/>
      <div class="absolute inset-0 z-[1] bg-black opacity-40"></div>
    </template>
    <template #quote>
      <Quote author="Professor Lance Hannon" source="http://www88.homepage.villanova.edu/lance.hannon/TestimonyBills210635and210636Draft.pdf" backgroundClass="bg-[#E9D1F7]" quoteMarkClass="fill-violet" bold-color-class="text-violet" alignment="center">
        <template #quoteText>
          <p>I look forward to the day that I will see Philadelphia featured not as an example where numerous statistical tests all point to racial bias in policing practices, but rather as a national leader in evidence-based justice reform.</p>
        </template>
      </Quote>
    </template>
  </LayoutPageHeader>

  <main class="layout-container mt-8 md:-mt-4 text-body-3">
    <div class="grid-container">
      <div class="col-span-10">
        <nav class="flex flex-col gap-3 border-b border-neutral-400 pb-10" aria-label="On this page">
          <h2 class="text-label-1">Jump to:</h2>
          <ul class="flex flex-col gap-3">
            <li><a href="#sample-rules" class="text-hyperlink">Do the sample definitions change the result?</a></li>
            <li v-for="item in sectionLinks" :key="item.id">
              <a :href="`#${item.id}`" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>{{ item.label }}
              </a>
            </li>
          </ul>
        </nav>

        <section id="sample-rules" class="pt-10">
          <h2 class="text-heading-3 mb-6">Do the sample definitions change the result?</h2>
          <p class="mb-6"><a href="/snapshot#veil-of-darkness" class="text-hyperlink">Back to the main pre/post Driving Equality result</a></p>
          <VeilSensitivityComparison/>
        </section>
        <HorizontalLine class="my-12" :color="true"/>
        <p class="text-body-4 mb-6">The annual, young-men, and district analyses below use the narrower sample with a
          recorded violation code. They are supporting analyses, rather than the main page's result without that requirement.</p>
        <section>
          <h2 id="citywide" class="text-heading-3 text-left pt-10 mb-6">{{ sectionLinks[0].label }}</h2>
          <QuestionHeader>
            <h3>At the same time of evening, it is light out in summer and dark in winter, when officers have a harder
              time seeing who is driving. Across Philadelphia, did Black drivers make up a smaller share of traffic
              stops<Tooltip term="Traffic Stop"/> after dark<Tooltip term="Veil of darkness"/>?</h3>
          </QuestionHeader>
          <Answer v-if="pooled" :arrow="true">
            <AnswerText>
              <p class="result-text">{{ pooled.marginal_effect_pp < 0 ? 'Yes.' : 'No.' }} This test compares Black and white drivers. {{ pooledPeriodLabel }},
                <span class="font-bold text-purple">{{ pooled.marginal_daylight_pct.toFixed(1) }}%</span> of the drivers police
                stopped in daylight were Black. After dark, it was
                <span class="font-bold text-purple">{{ pooled.marginal_dark_pct.toFixed(1) }}%</span> —
                <span class="font-bold text-purple">{{ points(pooled.marginal_effect_pp) }}<Tooltip term="Percentage point"/>
                  {{ pooled.marginal_effect_pp < 0 ? 'lower' : 'higher' }}.</span>
                <template v-if="pooled.marginal_effect_pp < 0 && pooled.marginal_ci_hi_pp < 0">
                  The shift is small, but it should not be there if race played no part in who police stopped, and this test
                  tends to understate it.</template>
              </p>
            </AnswerText>
            <CoefficientGraph :estimates="sharesTrendData" :axis-properties="sharesAxes" :group-classes="sharesClasses"
              :chart-legend="sharesLegend" :connect-points="true" :show-intervals="false" :include-zero="false" :dodge="false" :column-hover="sharesColumnHover">
              <h4>Black Share of Black and White Drivers Stopped by PPD in Daylight and After Dark, by Year</h4>
              <template #footer>
                <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[630px] mx-auto">For each year, the Black share of evening stops in daylight
                  and after dark, adjusted so the two are compared at the same times of day, days of the week, seasons, and
                  locations. The after-dark line sits below the daylight line in {{ adultYearsSummary }}. The gray 2020 points are shown
                  for context but left out of the combined result, because pandemic lockdowns and curfews changed evening travel.</p>
              </template>
            </CoefficientGraph>
            <AnswerText>
              <p class="text-body-4">Who is on the road at, say, 7 p.m. changes relatively little through the year, but
                whether officers can see drivers does. If race played no part in who police stopped, Black drivers would
                make up about the same share of stops at that hour in daylight and in darkness. A smaller share after dark
                suggests race influenced some stops made when officers could see the driver. Researchers call this the
                veil of darkness test.</p>
              <p class="text-body-4 mt-4">Put another way, out of every 1,000 Black and white drivers stopped, about
                {{ perThousand(pooled.marginal_daylight_pct) }} were Black in daylight and about
                {{ perThousand(pooled.marginal_dark_pct) }} were Black after dark. This difference is
                {{ crossesZero(pooled.marginal_ci_lo_pp, pooled.marginal_ci_hi_pp) ? 'not clearly distinguishable from' : 'very unlikely to be' }}
                chance: the 95% confidence interval<Tooltip term="Confidence interval"/> runs from
                {{ signed(pooled.marginal_ci_lo_pp) }} to {{ signed(pooled.marginal_ci_hi_pp) }} points. It is based on
                {{ pooled.n.toLocaleString() }} evening stops, roughly 5 to 8:30 p.m., of adult non-Latino Black and white
                drivers in Philadelphia's residential police districts. Latino, Asian, and other drivers are not part of this
                comparison, so these percentages are higher than the Black share of all traffic stops. The stops are adjusted for time of day,
                day of the week, season, year, and location<Tooltip term="District"/>. A single year has far fewer stops, so in
                {{ uncertainAdultYears }} of {{ defaultAdultYears.length }} comparable years the annual difference alone
                cannot rule out no change; that is why the answer combines years.</p>
              <p class="text-body-4 mt-4">Darkness only partly hides who is driving. Streetlights, headlights, and stops
                made after an officer has followed a car can all let an officer see a driver at night. For that reason,
                researchers generally treat this test as conservative: it can show that race influenced stops, but it
                likely understates how much. These estimates describe the racial makeup <em>of recorded stops</em>; they do
                not measure a driver's personal chance of being stopped, and they cannot identify any individual officer's
                motives.</p>
            </AnswerText>
          </Answer>
          <p v-else class="text-body-4 my-6" role="status">Loading the analysis…</p>
        </section>

        <HorizontalLine class="my-12" :color="true"/>
        <section v-if="pooled">
          <h2 id="young-men" class="text-heading-3 text-left mb-6">{{ sectionLinks[1].label }}</h2>
          <AnswerText>
            <p>Concerns about racial profiling in traffic stops often center on young Black men. If race shapes who
              officers stop when they can see drivers, the after-dark change could be larger for men ages 18–29.</p>
          </AnswerText>
          <QuestionHeader>
            <h3>Among men ages 18–29, did Black drivers make up a smaller share of traffic stops after dark? How does that
              compare with all adult drivers?</h3>
          </QuestionHeader>
          <Answer v-if="youngPooled" :arrow="true">
            <AnswerText>
              <p class="result-text">{{ youngPooled.marginal_effect_pp < 0 ? 'Yes.' : 'No.' }} Among men ages 18–29,
                <span class="font-bold text-violet">{{ youngPooled.marginal_daylight_pct.toFixed(1) }}%</span> of those police stopped
                in daylight were Black. After dark, it was
                <span class="font-bold text-violet">{{ youngPooled.marginal_dark_pct.toFixed(1) }}%</span> —
                <span class="font-bold text-violet">{{ points(youngPooled.marginal_effect_pp) }}
                  {{ youngPooled.marginal_effect_pp < 0 ? 'lower' : 'higher' }}</span>, compared to
                {{ Math.abs(pooled.marginal_effect_pp).toFixed(1) }} for all adults.
              </p>
            </AnswerText>
            <CoefficientGraph :estimates="comparisonTrendData" :axis-properties="annualAxes"
              :group-classes="overviewClasses" :chart-legend="comparisonLegend" :connect-points="true" :marker="deMarker">
              <h4>Change in the Black Share of PPD Traffic Stops After Dark: Men Ages 18–29 Compared to All Adults</h4>
              <template #footer>
                <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[630px] mx-auto">Each dot is one year's estimate of the change
                  from daylight to dark, with its 95% confidence interval; below the dashed line means a smaller Black share
                  after dark. The drop was larger for young men than for all adults in {{ moreNegativeYoungYears }} of
                  {{ byYear!.default_years.length }} comparable years. Young men are a smaller group, so their intervals are
                  wider; a wider bar shows more uncertainty, not a larger effect<template v-for="year in positiveYoungYears"
                    :key="year.year">, and the {{ year.year }} young-men estimate ({{ signed(year.marginal_effect_pp) }},
                    interval {{ signed(year.marginal_ci_lo_pp) }} to {{ signed(year.marginal_ci_hi_pp) }}) is too wide to
                    show a reversal</template>. The gray 2020 points are shown for context. The dotted vertical line marks
                  Driving Equality taking effect in March 2022.</p>
              </template>
            </CoefficientGraph>
            <AnswerText>
              <p class="text-body-4">{{ youngDifferenceIsClear
                ? "The larger drop for young men is very unlikely to be chance."
                : "The data cannot tell young men's drop apart from other adults'." }} Comparing young men directly with
                other adult drivers in one model, the after-dark drop was
                {{ Math.abs(youngDifference.difference_pp).toFixed(1) }} points
                {{ youngDifference.difference_pp < 0 ? 'larger' : 'smaller' }} for young men (95% confidence interval
                {{ signed(youngDifference.difference_ci_lo_pp) }} to {{ signed(youngDifference.difference_ci_hi_pp) }}
                points, where below zero means a larger drop for young men). This is based on
                {{ youngPooled.n.toLocaleString() }} stops of young men among the
                {{ youngDifference.n.toLocaleString() }} adult stops in the citywide result.</p>
            </AnswerText>
          </Answer>
        </section>

        <HorizontalLine class="my-12" :color="true"/>
        <section v-if="byYear">
          <h2 id="time-and-place" class="text-heading-3 text-left mb-6">{{ sectionLinks[2].label }}</h2>
          <QuestionHeader>
            <h3>Is the after-dark change larger or smaller in districts<Tooltip term="District"/> with more Black residents?</h3>
          </QuestionHeader>
          <Answer :arrow="true">
            <AnswerText>
              <p class="result-text"><span class="font-bold text-purple">{{ allModerationNull ? 'No clear relationship' : 'It depends on the group' }}</span>
                {{ allModerationNull
                  ? 'for young men, young women, older men, or older women.'
                  : 'the results differ across age-and-gender groups; explore the estimates below.' }}</p>
            </AnswerText>
            <AnswerText>
              <p class="text-body-4">We tested whether the change in the Black share of stops after dark grows or shrinks as the
                share of district residents who are Black rises. District population describes the neighborhood where a
                stop happened, not the driver.</p>
            </AnswerText>
          </Answer>
          <details class="analysis-details" @toggle="toggleDetails">
            <summary class="text-body-3">Explore the district breakdown by age and gender</summary>
            <div v-if="detailsOpen" class="pt-4">
              <div class="max-w-[440px] my-6">
                <SelectVeilGroups v-model="selectedGroup" :items="groupOptions"/>
              </div>
              <CoefficientGraph :estimates="moderationData"
                :axis-properties="{x: 'District residents who are Black', y: annualAxes.y}"
                :group-classes="overviewClasses" :connect-points="true">
                <h4>Modeled Change After Dark Across District Black Population</h4>
                <template #footer>
                  <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[630px] mx-auto">One model fitted over {{ pooledYearsLabel }}
                    traces how the change varies with a district's Black population, using only stops of the selected
                    age-and-gender group. Bars are 95% confidence intervals. Where most residents are Black, Black drivers
                    are already close to 100% of stops, which limits how far the share can move.</p>
                </template>
              </CoefficientGraph>
              <AnswerText v-if="moderation">
                <p class="text-body-4">For {{ selectedGroupPlural }}, {{ moderation.interaction_p_value >= 0.05
                  ? 'this model does not detect a clear relationship'
                  : 'this model detects a relationship' }} between a district's Black population and the after-dark
                  change (p {{ formatP(moderation.interaction_p_value) }}).</p>
              </AnswerText>
            </div>
          </details>
        </section>

        <HorizontalLine class="my-12" :color="true"/>
        <section>
          <h2 id="methods" class="text-heading-3 text-left mb-6">{{ sectionLinks[3].label }}</h2>
          <AnswerText>
            <p>These results compare the racial makeup of traffic stops in daylight and after dark at the same evening
              hours. A one-percentage-point change means a share moving, for example, from 80% to 79%. It does not mean
              1% fewer stops, or that any one driver was 1% less likely to be stopped.</p>
            <p class="mt-4">The annual, subgroup, and district analyses below the sensitivity chart include adult non-Latino Black and white motorists who appear to have been alone in the
              car, in stops with a recorded age, gender, and violation code, in residential police districts. The results
              describe these stops, not every traffic stop in Philadelphia.</p>
          </AnswerText>
          <details class="analysis-details">
            <summary class="text-body-3">Read the method, data limitations, and research source</summary>
            <div class="pt-4 text-body-4 leading-7 pb-6">
              <p>Each year is fitted separately over the same evening comparison window. The combined result fits
                one model over {{ pooledYearsLabel }}; it is not an average of the annual dots. Models account for
                clock time, day of the week, year, police service area<Tooltip term="PSA"/>, assigned police unit, and
                summer, and use seasonality weights. The percentage-point change averages each stop's model prediction
              under daylight and darkness. The young-men comparison and the pre/post sensitivity comparisons each fit both groups in one model
                with shared controls and an interaction between darkness and group, which is what tests the difference
                directly. Their group estimates therefore differ slightly from the separately fitted results above, and
                the figures do not subtract exactly. Confidence intervals describe uncertainty under this model; they do not
                include every possible source of bias or recording error.</p>
              <p class="mt-4">{{ excludedYearsLabel }} is excluded from the combined result because lockdowns and curfews changed
                evening travel. Annual charts still display it in gray. The annual series ends at
                {{ lastYear }} because later data covers only part of a year and cannot represent a full daylight cycle.
                A smaller share of stops carries a recorded violation code from 2023 onward, changing which stops
                enter the sample. This is another reason to avoid reading every annual fluctuation as a change in policing.</p>
              <p class="mt-4">The veil-of-darkness test was first applied to Philadelphia traffic stops by
                <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3628865" class="text-hyperlink" target="_blank" rel="noopener">Hannon,
                  Neal and Gustafson (2021), <em>Out-of-Place and In-Place Policing</em></a>. This page applies the same
                test to the full set of residential districts and to each calendar year since 2014.</p>
              <p class="mt-4">Source: Philadelphia Police Department traffic-stop records from Open Data Philly, with Census
                district demographics and Philadelphia sunset times. See
                <a href="/data" class="text-hyperlink">About the data</a> for the dashboard's data sources.</p>
            </div>
          </details>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import stopsImage from '../assets/images/stops.jpg'
import VeilSensitivityComparison from '../components/VeilSensitivityComparison.vue'
import CoefficientGraph from '../components/CoefficientGraph.vue'
import SelectVeilGroups from '../components/SelectVeilGroups.vue'
import HorizontalLine from '../components/ui/HorizontalLine.vue'
import Tooltip from '../components/ui/Tooltip.vue'
import { useVeilCube } from '../composables/useVeilCube'
import type { VeilIntraracialGroup } from '../utils/veil'

useHead({ title: "Veil of darkness: sensitivity and supporting analyses" })
const { data: bundle } = useVeilCube()
const byYear = computed(() => bundle.value?.cube.intraracial?.by_year ?? null)
const pooled = computed(() => {
  const result = byYear.value?.race_composition_pooled
  return result?.converged ? result : null
})
const youngComparison = computed(() => {
  const result = byYear.value?.race_composition_young_men_pooled
  return result?.pooled.converged && result.difference.converged ? result : null
})
const youngPooled = computed(() => youngComparison.value?.pooled ?? null)
const youngDifference = computed(() => youngComparison.value!.difference)
const youngDifferenceIsClear = computed(() =>
  !crossesZero(youngDifference.value.difference_ci_lo_pp, youngDifference.value.difference_ci_hi_pp))
const deMarker = { after: '2021', label: 'Driving Equality' }
const sectionLinks = [
  { id: 'citywide', label: 'Are Black drivers a smaller share of traffic stops after dark?' },
  { id: 'young-men', label: 'Is the pattern stronger for young men?' },
  { id: 'time-and-place', label: 'Does the pattern vary by district?' },
  { id: 'methods', label: 'How should we read these results?' },
]
const annualAxes = { x: 'Year', y: 'Change in Black share (percentage points)' }
const overviewClasses = {
  'All adults': 'stroke-purple fill-purple bg-purple',
  'Men ages 18–29': 'stroke-violet fill-violet bg-violet',
  Estimate: 'stroke-purple fill-purple bg-purple',
}
const groups: Record<VeilIntraracialGroup, string> = {
  young_male: 'Young man (18–29)', young_female: 'Young woman (18–29)',
  older_male: 'Older man (30+)', older_female: 'Older woman (30+)',
}
const groupPlurals: Record<VeilIntraracialGroup, string> = {
  young_male: 'young men', young_female: 'young women', older_male: 'older men', older_female: 'older women',
}
const groupOptions = Object.values(groups)
const selectedGroup = ref(groups.young_male)
const selectedGroupKey = computed(() => Object.entries(groups).find(([, label]) => label === selectedGroup.value)?.[0])
const detailsOpen = ref(false)
function toggleDetails(event: Event) { detailsOpen.value = (event.target as HTMLDetailsElement).open }

// "1.0 percentage point", "1.7 percentage points".
function points(value: number) {
  const magnitude = Math.abs(value).toFixed(1)
  return `${magnitude} percentage point${magnitude === '1.0' ? '' : 's'}`
}
function perThousand(pct: number) { return Math.round(pct * 10).toLocaleString() }
function signed(value: number) { return `${value > 0 ? '+' : ''}${value.toFixed(1)}` }
function formatP(value: number) { return value < 0.001 ? '< .001' : `= ${value.toFixed(3)}` }
function crossesZero(lo: number, hi: number) { return lo <= 0 && hi >= 0 }
function yearsLabel(years: number[]) {
  const ranges: string[] = []
  if (!years.length) return ''
  let start = years[0], end = years[0]
  for (const year of years.slice(1)) {
    if (year === end + 1) { end = year; continue }
    ranges.push(start === end ? String(start) : `${start}–${end}`)
    start = end = year
  }
  ranges.push(start === end ? String(start) : `${start}–${end}`)
  return ranges.join(' and ')
}
const pooledYearsLabel = computed(() => yearsLabel(pooled.value?.years ?? byYear.value?.default_years ?? []))
// "From 2014 to 2025, leaving out 2020" reads better than the range list.
const pooledPeriodLabel = computed(() => {
  const years = pooled.value?.years ?? []
  if (!years.length) return ''
  const span = `From ${years[0]} to ${years.at(-1)}`
  return excludedYears.value.length ? `${span}, leaving out ${excludedYearsLabel.value}` : span
})
const excludedYears = computed(() => byYear.value?.years.filter(year => !byYear.value?.default_years.includes(year)) ?? [])
const excludedYearsLabel = computed(() => excludedYears.value.join(' and '))
const firstYear = computed(() => byYear.value?.years[0])
const lastYear = computed(() => byYear.value?.years.at(-1))
const selectedGroupPlural = computed(() => groupPlurals[selectedGroupKey.value as VeilIntraracialGroup])
type AnnualEstimate = NonNullable<typeof byYear.value>['race_composition_overall'][number]
function chartPoint(estimate: Pick<AnnualEstimate, 'year' | 'n' | 'marginal_effect_pp' | 'marginal_ci_lo_pp' | 'marginal_ci_hi_pp' | 'marginal_daylight_pct' | 'marginal_dark_pct'>, group: string) {
  return {
    x: String(estimate.year), group,
    value: estimate.marginal_effect_pp, ciLo: estimate.marginal_ci_lo_pp, ciHi: estimate.marginal_ci_hi_pp,
    caution: excludedYears.value.includes(estimate.year),
    hoverText: [
      `${group}, ${estimate.year}`,
      `${signed(estimate.marginal_effect_pp)} percentage points after dark`,
      `95% interval: ${signed(estimate.marginal_ci_lo_pp)} to ${signed(estimate.marginal_ci_hi_pp)}`,
      `${estimate.marginal_daylight_pct.toFixed(1)}% Black in daylight; ${estimate.marginal_dark_pct.toFixed(1)}% after dark`,
      `${estimate.n.toLocaleString()} Black and White stops`,
      ...(excludedYears.value.includes(estimate.year) ? ['Pandemic year: excluded from the combined result'] : []),
    ],
  }
}
const annualEstimates = computed(() => byYear.value?.race_composition_overall.filter(e => e.converged) ?? [])
const allAdultsTrendData = computed(() => annualEstimates.value.filter(e => e.sample === 'all_adults').map(e => chartPoint(e, 'All adults')))
const youngMenTrendData = computed(() => annualEstimates.value.filter(e => e.sample === 'young_male').map(e => chartPoint(e, 'Men ages 18–29')))
const sharesAxes = { x: 'Year', y: 'Black share of drivers stopped (%)' }
const sharesClasses = {
  Daylight: 'stroke-yellow fill-yellow bg-yellow',
  'After dark': 'stroke-purple fill-purple bg-purple',
}
const sharesLegend = { Daylight: 'In daylight', 'After dark': 'After dark' }
// The level each year's model predicts under daylight and under darkness, so
// the reader sees the two shares before the chart of their difference.
const sharesTrendData = computed(() => annualEstimates.value.filter(e => e.sample === 'all_adults').flatMap(e =>
  (['Daylight', 'After dark'] as const).map(lighting => {
    const value = lighting === 'Daylight' ? e.marginal_daylight_pct : e.marginal_dark_pct
    return {
      x: String(e.year), group: lighting, value, ciLo: value, ciHi: value,
      caution: excludedYears.value.includes(e.year),
      hoverText: [`${e.year}, ${lighting.toLowerCase()}`, `${value.toFixed(1)}% Black`],
    }
  })))
// One tooltip per year for the shares chart: the two shares and the gap
// between them, which is what the reader is comparing.
function sharesColumnHover(x: string) {
  const e = annualEstimates.value.find(e => e.sample === 'all_adults' && String(e.year) === x)
  if (!e) return []
  return [
    excludedYears.value.includes(e.year) ? `${e.year} (pandemic year, excluded from the combined result)` : String(e.year),
    `In daylight: ${e.marginal_daylight_pct.toFixed(1)}% of Black and white drivers stopped were Black`,
    `After dark: ${e.marginal_dark_pct.toFixed(1)}%`,
    `Difference: ${signed(e.marginal_effect_pp)} points (95% interval ${signed(e.marginal_ci_lo_pp)} to ${signed(e.marginal_ci_hi_pp)})`,
    `${e.n.toLocaleString()} stops`,
  ]
}
const comparisonTrendData = computed(() => [...allAdultsTrendData.value, ...youngMenTrendData.value])
const comparisonLegend = { 'All adults': 'All adult drivers', 'Men ages 18–29': 'Men ages 18–29' }
const defaultAdultYears = computed(() => allAdultsTrendData.value.filter(e => !e.caution))
const uncertainAdultYears = computed(() => defaultAdultYears.value.filter(e => crossesZero(e.ciLo, e.ciHi)).length)
// Counted over the comparable years the headline uses; 2020 only widens the
// claim to "every year" when it agrees, so the sentence never leans on it.
const adultYearsSummary = computed(() => {
  const comparable = defaultAdultYears.value
  const negative = comparable.filter(e => e.value < 0).length
  if (negative < comparable.length) return `${negative} of ${comparable.length} comparable years`
  return allAdultsTrendData.value.every(e => e.value < 0)
    ? `every year from ${firstYear.value} to ${lastYear.value}`
    : `all ${comparable.length} comparable years`
})
const moreNegativeYoungYears = computed(() => byYear.value?.default_years.filter(year => {
  const all = annualEstimates.value.find(e => e.year === year && e.sample === 'all_adults')
  const young = annualEstimates.value.find(e => e.year === year && e.sample === 'young_male')
  return all && young && young.marginal_effect_pp < all.marginal_effect_pp
}).length ?? 0)
const positiveYoungYears = computed(() => annualEstimates.value.filter(e =>
  e.sample === 'young_male' && e.marginal_effect_pp > 0 && byYear.value?.default_years.includes(e.year)))
const allModerationNull = computed(() => {
  const results = byYear.value?.district_blackness_moderation.groups ?? []
  return results.length === 4 && results.every(e => e.converged && e.interaction_p_value >= 0.05)
})
const moderation = computed(() => byYear.value?.district_blackness_moderation.groups.find(e => e.group === selectedGroupKey.value && e.converged))
const moderationData = computed(() => moderation.value?.effects.map(effect => ({
  x: `${effect.district_black_pct.toFixed(0)}%`, group: 'Estimate',
  value: effect.effect_pp, ciLo: effect.effect_ci_lo_pp, ciHi: effect.effect_ci_hi_pp,
  hoverText: [
    `${effect.district_black_pct.toFixed(0)}% of district residents are Black`,
    `${signed(effect.effect_pp)} percentage points after dark`,
    `95% interval: ${signed(effect.effect_ci_lo_pp)} to ${signed(effect.effect_ci_hi_pp)}`,
    `${moderation.value?.n.toLocaleString()} Black and White stops across the combined years`,
  ],
})) ?? [])
</script>

<style scoped lang="scss">
.analysis-details {
  @apply border-y border-neutral-400 my-6;
  summary {
    @apply cursor-pointer py-5 font-medium text-primary-800;
  }
  summary:focus-visible {
    @apply outline outline-2 outline-purple outline-offset-4;
  }
}
</style>

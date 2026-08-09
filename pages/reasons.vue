<template>
  <LayoutPageHeader>
    <template #header>
      What reasons do police give for making traffic stops?
    </template>
    <template #image>
      <img class="w-full h-full object-cover object-bottom" src="~/assets/images/reasons-large.jpg" alt="A street in Philadelphia"/>
      <div class="absolute inset-0 z-[1] bg-black opacity-60"></div>
    </template>
    <template #quote>
      <Quote author="Councilmember Kendra Brooks" source="https://www.inquirer.com/news/philadelphia-police-racial-bias-vehicle-stops-council-member-isaiah-thomas-black-drivers-20201028.html" backgroundClass="bg-[#FEF1C2]" quoteMarkClass="fill-yellow" bold-color-class="text-yellow">
        <template #quoteText>
          <p>
            Motor-code violations contribute to the deep mistrust between police and the communities they police, especially Black communities. Driving stops make Black and brown drivers feel harassed and surveilled.
          </p>
        </template>
      </Quote>
    </template>
  </LayoutPageHeader>
  <main class="layout-container mt-8 md:-mt-4 text-body-3">
    <div class="grid-container">
      <div class="col-span-10">
        <nav class="flex flex-col gap-3 border-b border-neutral-400 pb-10">
          <h2 class="text-label-1">Jump to:</h2>
          <ul class="flex flex-col gap-3">
            <li>
              <a href="#part1" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                Do the reasons police stop drivers differ by race or neighborhood?
              </a>
            </li>
            <li>
              <a href="#part2" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                How has Driving Equality impacted traffic stops?
              </a>
            </li>
          </ul>
        </nav>
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-10 mb-6">Do the reasons police stop drivers differ by race or neighborhood?</h2>
          <QuestionHeader>
            <h3>Do Philadelphia police stop Black and white drivers for different reasons? When Philadelphia police gave a reason, what were the primary reasons why police stopped <SelectWhiteBlackDriver v-model="q1Race" /> in Philadelphia in <span class="whitespace-nowrap"><SelectYear v-model="q1Year"/>?</span></h3>
          </QuestionHeader>
          <Answer v-if="q1" :arrow="true">
            <Graph :graph-data="q1.figures.barplot.data" :axis-properties="{x: q1.figures.barplot.properties.xAxis, y: q1.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'Black drivers': 'fill-purple bg-purple', 'White drivers': 'fill-mint bg-mint'}" :chart-legend="{'Black drivers': 'Black drivers', 'White drivers': 'White drivers'}" :wrap-x-axis-labels="true" :minimum-container-width="1080" :margin="{bottom: 110}">
              <h4>{{ q1.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <p class="text-body-4">
              Philadelphia police do not record reasons for a small but significant portion of traffic stops<Tooltip term="Traffic Stop"/> in the public traffic stop data. Notably, the public data undercount the number of traffic stops for tint. Per Defender analysis of the <a href="/data#10" class="text-hyperlink-blue" target="_blank"><i>Bailey</i></a> dataset, police have routinely miscoded tint stops since 2023 by omitting the MVC<Tooltip term="MVC"/> violation for a large but unknown number of tint stops, skewing those numbers down dramatically.
              </p>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-4 md:my-12"/>
        <section>
          <QuestionHeader>
            <h3>Do Philadelphia police make traffic stops for different reasons in districts<Tooltip term="District" /> where most residents are white, compared to districts where most residents are people of color? When Philadelphia police gave a reason, what were the primary reasons why police stopped drivers in majority <SelectWhiteMajorityNeighborhood v-model="selectedNeighborhoodMajority"/> in Philadelphia in <span class="whitespace-nowrap"><SelectYear v-model="q1Year"/>?</span></h3>
          </QuestionHeader>
          <Answer v-if="q2" :arrow="true">
            <Graph :graph-data="q2.figures.barplot.data" :axis-properties="{x: q2.figures.barplot.properties.xAxis, y: q2.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'Majority non-white districts': 'fill-purple bg-purple', 'Majority white districts': 'fill-mint bg-mint'}" :chart-legend="{'Majority non-white districts': 'Majority non-white districts', 'Majority white districts': 'Majority white districts'}" :wrap-x-axis-labels="true" :minimum-container-width="1080" :margin="{bottom: 110}">
              <h4>{{ q2.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <p class="text-body-4">
                As noted above, a small but significant portion of traffic stops<Tooltip term="Traffic Stop"/> have no reason recorded. Analysis of the <a href="/data#10" class="text-hyperlink-blue" target="_blank"><i>Bailey</i></a> dataset found that police routinely miscoded stops for tint, omitting the MVC<Tooltip term="MVC"/> violation for a large but unknown number of tint stops, skewing those numbers down dramatically.
              </p>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-12" :color="true"/>
        <section>
          <h2 id="part2" class="text-heading-3 text-left mb-6">How has Driving Equality impacted traffic stops?</h2>
          <QuestionHeader>
            <h3>Driving Equality came into effect on March 3, 2022. After Driving Equality, how many traffic stops did Philadelphia police make for the 8 reasons covered by the law? Show primary reasons for traffic stops by <span class="whitespace-nowrap"><SelectTimeGranularity v-model="selectedTimeGranularity"/>.</span></h3>
          </QuestionHeader>
          <Answer v-if="q3" :arrow="true">
            <Graph :graph-data="q3.figures.barplot.data" :axis-properties="{x: q3.figures.barplot.properties.xAxis, y: q3.figures.barplot.properties.yAxis}" stack-name="group" :quarterlyXAxisTicks="true">
              <h4>{{ q3.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <p class="text-body-4">
                See <a href="driving-equality#7" class="text-hyperlink-blue" target="_bla">What is Driving Equality?</a> to learn about the 8 reasons covered by the law. Importantly, Philadelphia police can still stop drivers for registration and lighting violations that are <u>not</u> covered by Driving Equality. For example, Philadelphia police can stop drivers for having all lights out, but police cannot stop drivers for a single broken bulb or light.</p>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-4 md:my-12"/>
        <section>
          <QuestionHeader>
            <h3>How often do Philadelphia police stop drivers for operational<Tooltip term="Operational"/> violations? Are there racial disparities<Tooltip term="Disparity"/> in these traffic stops? Out of all traffic stops, how often did police stop people of different races for operational violations in <span class="whitespace-nowrap"><SelectYear v-model="q1Year"/>?</span></h3>
          </QuestionHeader>
          <Answer v-if="q4" :arrow="true">
            <Graph :graph-data="q4.figures.barplot.data" :axis-properties="{x: q4.figures.barplot.properties.xAxis, y: q4.figures.barplot.properties.yAxis}" :y-scale-domain-max="100">
              <h4>{{ q4.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import Graph from '~/components/Graph.vue';
import QuestionHeader from '~/components/QuestionHeader.vue';
import SelectTimeGranularity from '~/components/SelectTimeGranularity.vue';
import HorizontalLine from '~/components/ui/HorizontalLine.vue';
import Tooltip from '~/components/ui/Tooltip.vue';
import {
  groupSum,
  groupTupleSum,
  sumMeasure,
  VIOLATION_CATEGORIES_DEO_IMPACTED,
} from '~/utils/cube';
import { operationalShareByRace } from '~/utils/reasons';
import { useReasonsCube } from '~/composables/useReasonsCube';
import { useDistrictsDemographics } from '~/composables/useDistrictsDemographics';

useHead({
  title: 'What reasons do police give for making traffic stops?',
})

const deoYears = useState('deoYears')

const selectedNeighborhoodMajority = ref('Non-white')
const selectedTimeGranularity = ref('quarter')
const q1Year = ref(Math.max(...deoYears.value))
const q1Race = ref('Black')

// Shared cube + districts demographics.
const { data: reasonsBundle } = await useReasonsCube()
const { data: districtsDemo } = await useDistrictsDemographics()

// SEASON mapping mirrors deo_backend/models.py SEASON_QUARTER_MAPPING.
const SEASON_LABEL = { Q1: 'Jan-Mar', Q2: 'Apr-Jun', Q3: 'July-Sep', Q4: 'Oct-Dec' }
function seasonAndYear(qStr) {
  const [year, q] = qStr.split('-')
  return `${SEASON_LABEL[q]} ${year}`
}

// Majority-white/non-white district sets are derived from districts.json
// (whiteness > 50 ⇒ majority white). Mirrors demographic_constants.py.
const majorityDistricts = computed(() => {
  const demo = districtsDemo.value || {}
  const white = []
  const nonwhite = []
  for (const [d, v] of Object.entries(demo)) {
    if ((v?.whiteness ?? 0) > 50) white.push(d)
    else nonwhite.push(d)
  }
  return { white, nonwhite }
})

// =========================================================================
// q1: reasons-comparison-bar-drivers
// =========================================================================
const q1 = computed(() => {
  const bundle = reasonsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const year = String(q1Year.value)
  const race = q1Race.value // 'Black' | 'White'

  const filterOpts = {
    startQuarter: `${year}-Q1`,
    endQuarter: `${year}-Q4`,
  }
  // groupBy [race, violation_category] then drop Other/None.
  const groups = groupTupleSum(cube, ['race', 'violation_category'], 'n_stopped', filterOpts)
    .filter(({ keys }) => (keys[0] === 'Black' || keys[0] === 'White')
      && keys[1] !== 'Other' && keys[1] !== 'None')

  // Totals per race (over filtered groups).
  const totalsByRace = { Black: 0, White: 0 }
  for (const g of groups) totalsByRace[g.keys[0]] += g.value

  // Sort: by race (Black-or-White first depending on selection), then n_stopped desc.
  const raceAscBool = race !== 'White' // matches python: ascending=[race != "White"]
  const rows = groups.slice().sort((a, b) => {
    if (a.keys[0] !== b.keys[0]) {
      // ascending=true means Black before White (alphabetical); false flips.
      const cmp = a.keys[0] < b.keys[0] ? -1 : 1
      return raceAscBool ? cmp : -cmp
    }
    return b.value - a.value // n_stopped desc
  })

  const xAxis = 'Primary Reason for Traffic Stop'
  const yAxis = 'Percentage (%)'
  const title = race === 'Black'
    ? `Primary Reasons PPD Stopped Black Drivers, Compared to White Drivers, in ${year}`
    : `Primary Reasons PPD Stopped White Drivers, Compared to Black Drivers, in ${year}`

  const data = rows.map(({ keys, value }) => {
    const r = keys[0]
    const vc = keys[1]
    const tot = totalsByRace[r] || 0
    const pctVal = tot ? Math.round((1000 * value) / tot) / 10 : 0
    return {
      group: `${r} drivers`,
      [xAxis]: vc,
      [yAxis]: pctVal,
      annotation: null,
      hover_text: [
        `${r} drivers`,
        vc,
        `${pctVal.toFixed(1)}% of traffic stops`,
        `${value.toLocaleString()} traffic stops`,
        '',
      ],
    }
  })

  return {
    text: [],
    figures: {
      barplot: {
        properties: { xAxis, yAxis, title },
        trendlines: [],
        data,
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})

// =========================================================================
// q2: reasons-comparison-bar-neighborhoods
// =========================================================================
const q2 = computed(() => {
  const bundle = reasonsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const year = String(q1Year.value)
  const race = selectedNeighborhoodMajority.value // 'Non-white' | 'White'
  const { white: whiteDistricts, nonwhite: nonwhiteDistricts } = majorityDistricts.value

  const baseOpts = {
    startQuarter: `${year}-Q1`,
    endQuarter: `${year}-Q4`,
  }
  // Per python: filter out Other/None, group by violation_category + majority_district.
  const whiteGroups = groupSum(cube, 'violation_category', 'n_stopped', {
    ...baseOpts,
    districtIn: whiteDistricts,
  }).filter(g => g.key !== 'Other' && g.key !== 'None')
  const nonwhiteGroups = groupSum(cube, 'violation_category', 'n_stopped', {
    ...baseOpts,
    districtIn: nonwhiteDistricts,
  }).filter(g => g.key !== 'Other' && g.key !== 'None')

  const labels = {
    white: 'Majority white districts',
    nonwhite: 'Majority non-white districts',
  }
  const all = [
    ...whiteGroups.map(g => ({ majority: 'white', vc: g.key, n: g.value })),
    ...nonwhiteGroups.map(g => ({ majority: 'nonwhite', vc: g.key, n: g.value })),
  ]
  const totals = {
    white: whiteGroups.reduce((s, g) => s + g.value, 0),
    nonwhite: nonwhiteGroups.reduce((s, g) => s + g.value, 0),
  }

  // Sort: by majority_district (alpha asc/desc), then n desc. Python uses
  // ascending=[race != 'White'] on the majority_district label
  // ("Majority non-white" < "Majority white") so race=='White' → desc.
  const raceAscBool = race !== 'White'
  const sortKey = (m) => m === 'nonwhite' ? 'Majority non-white' : 'Majority white'
  const rows = all.slice().sort((a, b) => {
    if (a.majority !== b.majority) {
      const cmp = sortKey(a.majority) < sortKey(b.majority) ? -1 : 1
      return raceAscBool ? cmp : -cmp
    }
    return b.n - a.n
  })

  const xAxis = 'Primary Reason for Traffic Stop'
  const yAxis = 'Percentage (%)'
  const title = race === 'Non-white'
    ? `Primary Reasons PPD Stopped Drivers in Majority Non-White Districts, Compared to Majority White Districts, in ${year}`
    : `Primary Reasons PPD Stopped Drivers in Majority White Districts, Compared to Majority Non-White Districts, in ${year}`

  const data = rows.map(({ majority, vc, n }) => {
    const tot = totals[majority] || 0
    const pctVal = tot ? Math.round((1000 * n) / tot) / 10 : 0
    const groupName = `${labels[majority]} districts`
    return {
      group: groupName,
      [xAxis]: vc,
      [yAxis]: pctVal,
      annotation: null,
      hover_text: [
        labels[majority],
        vc,
        `${pctVal.toFixed(1)}% of traffic stops`,
        `${n.toLocaleString()} traffic stops`,
        '',
      ],
    }
  })

  return {
    text: [],
    figures: {
      barplot: {
        properties: { xAxis, yAxis, title },
        trendlines: [],
        data,
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})

// =========================================================================
// q3: reasons-deo-impacts
// =========================================================================
const q3 = computed(() => {
  const bundle = reasonsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const tg = selectedTimeGranularity.value // 'quarter' | 'year'

  const filterOpts = {
    startQuarter: '2022-Q1',
    violationCategory: VIOLATION_CATEGORIES_DEO_IMPACTED,
  }
  // Always sum n_stopped grouped by [quarter, violation_category].
  const groups = groupTupleSum(cube, ['quarter', 'violation_category'], 'n_stopped', filterOpts)

  // Roll up to time-granularity bucket.
  const acc = new Map() // bucket -> Map(vc -> sum)
  for (const { keys, value } of groups) {
    const [q, vc] = keys
    const bucket = tg === 'year' ? q.slice(0, 4) : q
    if (!acc.has(bucket)) acc.set(bucket, new Map())
    const inner = acc.get(bucket)
    inner.set(vc, (inner.get(vc) ?? 0) + value)
  }

  // Sort by bucket ascending. Within bucket, by n_stopped descending.
  const buckets = Array.from(acc.keys()).sort()
  const xAxis = tg === 'quarter' ? 'Quarter' : 'Year'
  const yAxis = 'Number of Traffic Stops'

  const data = []
  for (const b of buckets) {
    const xVal = tg === 'quarter' ? seasonAndYear(b) : Number(b)
    const inner = acc.get(b)
    const items = Array.from(inner, ([vc, v]) => ({ vc, v }))
      .sort((a, c) => c.v - a.v)
    for (const { vc, v } of items) {
      data.push({
        group: vc,
        [xAxis]: xVal,
        [yAxis]: v,
        annotation: null,
        hover_text: [String(xVal), vc, `${v.toLocaleString()} traffic stops`, ''],
      })
    }
  }

  return {
    text: [],
    figures: {
      barplot: {
        properties: {
          xAxis,
          yAxis,
          title: 'Number of PPD Traffic Stops for Reasons Covered by Driving Equality',
        },
        trendlines: [],
        data,
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})

// =========================================================================
// q4: reasons-operational
// =========================================================================
const q4 = computed(() => {
  const bundle = reasonsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const year = String(q1Year.value)

  const xAxis = 'Race'
  const yAxis = 'Percentage (%)'
  const data = operationalShareByRace(cube, q1Year.value).map(({ race, pct: pctVal }) => ({
    group: null,
    [xAxis]: race,
    [yAxis]: pctVal,
    annotation: null,
    hover_text: [race, `${pctVal}% of traffic stops for operational violations`, ''],
  }))

  return {
    text: [],
    figures: {
      barplot: {
        properties: {
          xAxis,
          yAxis,
          title: `Percentage of Operational Stops by Race in ${year}`,
        },
        trendlines: [],
        data,
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})
</script>

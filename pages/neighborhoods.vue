<template>
  <LayoutPageHeader>
    <template #header>
      Do police treat people and neighborhoods differently?
    </template>
    <template #image>
      <img class="w-full h-full object-cover" src="~/assets/images/neighborhoods.jpg" alt="A police car"/>
      <div class="absolute inset-0 z-[1] bg-black opacity-50"></div>
    </template>
    <template #quote>
      <Quote author="Attorney Mahari Bailey" source="/sources/Bailey-Inquirer-Article.pdf" backgroundClass="bg-[#D7DCF7]" quoteMarkClass="fill-primary-600" bold-color-class="text-primary-600">
        <template #quoteText>
          <p>
            It's very disheartening and very degrading… I should feel comfortable enough going to neighborhoods rather than being fearful of being subjected to disrespectful and unlawful activities by a police officer.
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
                How intrusive are police during traffic stops?
              </a>
            </li>
            <li>
              <a href="#part2" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                During traffic stops, do police treat people differently?
              </a>
            </li>
            <li>
              <a href="#part3" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                During traffic stops, do police treat neighborhoods differently?
              </a>
            </li>
          </ul>
        </nav>
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-10 mb-6">How intrusive are police during traffic stops?</h2>
          <QuestionHeader>
            <h3>How many times did Philadelphia police intrude<Tooltip term="Intrusion"/> during traffic stops<Tooltip term="Traffic Stop"/> in <SelectLocation v-model="selectedLocation"/> by <span class="whitespace-nowrap"><SelectTimeGranularity v-model="selectedTimeGranularity"/>?</span></h3>
          </QuestionHeader>
          <Answer v-if="q1A" :arrow="true">
            <AnswerText>
              <div v-html="q1A.text[0]" class="result-text"></div>
            </AnswerText>
            <Graph :graph-data="q1A.figures.barplot.data" :axis-properties="{x: q1A.figures.barplot.properties.xAxis, y: q1A.figures.barplot.properties.yAxis}" :quarterlyXAxisTicks="true">
              <h4>{{ q1A.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <div class="result-text">
                <p v-html="q1A.text[1]"></p>
                <ul class="pl-4">
                  <li v-for="text in q1A.text.slice(2)">
                    <p v-html="text"></p>
                  </li>
                </ul>
              </div>
              <!-- <div class="text-body-3 text-left whitespace-pre-line">
                <span v-for="sentence in q1A.text.slice(1)"><span class="result-text" v-html="sentence"></span>&nbsp;</span>
              </div> -->
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-4 md:my-12"/>
        <section>
          <QuestionHeader>
            <h3>How have Philadelphia police changed the way they intrude during traffic stops in <SelectLocation v-model="selectedLocation"/> by <span class="whitespace-nowrap"><SelectTimeGranularity v-model="selectedTimeGranularity"/>?</span> How do frisks<Tooltip term="Frisk"/> and searches<Tooltip term="Search"/> compare over time?</h3>
          </QuestionHeader>
          <Answer v-if="q1B" :arrow="true">
            <Graph :graph-data="q1B.figures.barplot.data" :axis-properties="{x: q1B.figures.barplot.properties.xAxis, y: q1B.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'# of searches': 'fill-purple bg-purple', '# of frisks': 'fill-mint bg-mint'}" :chart-legend="{'# of searches': 'Number of searches', '# of frisks': 'Number of frisks'}" :quarterlyXAxisTicks="true">
              <h4>{{ q1B.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
        </section>
        <HorizontalLine class="my-12" :color="true"/>
        <section>
          <h2 id="part2" class="text-heading-3 text-left mb-6">During traffic stops, do police treat people differently?</h2>
          <QuestionHeader>
            <h3>
              Do Philadelphia police intrude upon some drivers and/or their vehicles more often than others?
              Show data by <SelectDemographicCategory v-model="q2ADemographicCategory" /> in <SelectLocation v-model="selectedLocation"/> from the start of <SelectQuarter v-model="q2AQuarterStart" item-label-end="start" :max-selectable="q2AQuarterEnd"/> through the end of <SelectQuarter v-model="q2AQuarterEnd" item-label-end="end" :min-selectable="q2AQuarterStart"/>, compared to a baseline of people who are
              <SelectRace v-if="q2ADemographicCategory === 'race'" v-model="q2ARace"/>
              <SelectGender v-if="q2ADemographicCategory ==='gender'" v-model="q2AGender"/>
              <SelectAgeGroup v-if="q2ADemographicCategory === 'age range'" v-model="q2AAgeGroup"/>.
            </h3>
          </QuestionHeader>
          <Answer v-if="q2A" :arrow="true">
            <Graph :graph-data="q2AData1" :axis-properties="{x: q2A.figures.barplot.properties.xAxis, y: q2A.figures.barplot.properties.yAxis}" bar-annotation-property="annotation">
              <h4>{{ q2A.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
          <QuestionHeader>
            <h3>How many times do Philadelphia police intrude during traffic stops without finding any <span class="whitespace-nowrap">contraband<Tooltip term="Contraband"/>?</span></h3>
          </QuestionHeader>
          <Answer v-if="q2A" :arrow="true">
            <Graph :graph-data="q2AData2" :axis-properties="{x: q2A.figures.barplot2.properties.xAxis, y: q2A.figures.barplot2.properties.yAxis}" bar-annotation-property="annotation">
              <h4>{{ q2A.figures.barplot2.properties.title }}</h4>
            </Graph>
          </Answer>
          <QuestionHeader>
            <h3>When Philadelphia police intrude during traffic stops, how often do they find contraband?</h3>
          </QuestionHeader>
          <Answer v-if="q2A" :arrow="true">
            <Graph :graph-data="q2AData3" :axis-properties="{x: q2A.figures.barplot3.properties.xAxis, y: q2A.figures.barplot3.properties.yAxis}" bar-annotation-property="annotation">
              <h4>{{ q2A.figures.barplot3.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <div class="result-text">
                <p v-html="q2A.text[0]"></p>
                <ul class="pl-4">
                  <li v-for="text in q2A.text.slice(1)">
                    <p v-html="text"></p>
                  </li>
                </ul>
              </div>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-12" :color="true"/>
        <section>
          <h2 id="part3" class="text-heading-3 text-left mb-6">During traffic stops, do police treat neighborhoods differently?</h2>
          <QuestionHeader>
            <h3>
              Is traffic enforcement different in districts<Tooltip term="District"/> where most residents are white, compared to districts where most residents are people of color?
              Comparing majority white districts to majority non-white districts, how many <SelectEvent v-model="q3AEvent" /> did Philadelphia police make from the start of <SelectQuarter v-model="q2AQuarterStart" item-label-end="start"  :max-selectable="q2AQuarterEnd"/> through the end of 
              <span class="whitespace-nowrap"><SelectQuarter v-model="q2AQuarterEnd" item-label-end="end" :min-selectable="q2AQuarterStart"/>?</span>
            </h3>
          </QuestionHeader>
          <Answer v-if="q3A" :arrow="true">
            <Graph :graph-data="q3A.figures.barplot.data" :axis-properties="{x: q3A.figures.barplot.properties.xAxis, y: q3A.figures.barplot.properties.yAxis}" :trendline="q3A.figures.barplot.trendlines">
              <h4>{{ q3A.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
          <QuestionHeader>
            <h3>
              During this time period, what was the intrusion rate<Tooltip term="Intrusion rate"/> and contraband hit rate<Tooltip term="Contraband hit rate"/> across districts?
            </h3>
          </QuestionHeader>
          <Answer v-if="q3A" :arrow="true">
            <Graph :graph-data="q3A.figures.barplot2.data" :axis-properties="{x: q3A.figures.barplot2.properties.xAxis, y: q3A.figures.barplot2.properties.yAxis}" :trendline="q3A.figures.barplot2.trendlines">
              <h4>{{ q3A.figures.barplot2.properties.title }}</h4>
            </Graph>
            <Graph :graph-data="q3A.figures.barplot3.data" :axis-properties="{x: q3A.figures.barplot3.properties.xAxis, y: q3A.figures.barplot3.properties.yAxis}" :trendline="q3A.figures.barplot3.trendlines">
              <h4>{{ q3A.figures.barplot3.properties.title }}</h4>
            </Graph>
          </Answer>
        </section>
        <HorizontalLine class="my-4 md:my-12"/>
        <section>
          <QuestionHeader>
            <h3>
              How does traffic enforcement compare in different districts?
              How many <SelectEvent v-model="q3AEvent" /> did Philadelphia police make
              from the start of <SelectQuarter v-model="q2AQuarterStart" item-label-end="start"  :max-selectable="q2AQuarterEnd"/>
              through the end of <SelectQuarter v-model="q2AQuarterEnd" item-label-end="end" :min-selectable="q2AQuarterStart"/>
              in the following districts?
            </h3>
            <div class="max-w-2xl mt-4">
              <div class="text-body-4 text-left">Select districts</div>
              <SelectDistricts v-model="selectedDistricts" class="mt-2 max-w-[720px]"/>
            </div>
          </QuestionHeader>
          <Answer v-if="q3B" :arrow="true">
            <Graph :graph-data="q3B.figures.barplot.data" :axis-properties="{x: q3B.figures.barplot.properties.xAxis, y: q3B.figures.barplot.properties.yAxis}">
              <h4>{{ q3B.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import Graph from '~/components/Graph.vue';
import IconsChevron from '~/components/icons/Chevron.vue';
import QuestionHeader from '~/components/QuestionHeader.vue';
import SelectLocation from '~/components/SelectLocation.vue';
import SelectTimeGranularity from '~/components/SelectTimeGranularity.vue';
import HorizontalLine from '~/components/ui/HorizontalLine.vue';
import Tooltip from '~/components/ui/Tooltip.vue';
import { getDemographicGroupParam, getEventParam, getLocationParam, policeEvent } from '~/utils';
import {
  sumMeasure,
  groupSum,
  groupSumByDistrict,
  groupAllMeasuresByDistrict,
  olsTrendline,
  pct,
} from '~/utils/cube';
import { useStopsCube } from '~/composables/useStopsCube';
import { useDistrictsDemographics } from '~/composables/useDistrictsDemographics';

useHead({
  title: 'Do police treat people and neighborhoods differently?',
})

const mostRecentQuarter = Quarter.fromParamString(useState("mostRecentQuarter").value)

const selectedLocation = ref('Philadelphia')
const selectedTimeGranularity = ref('year')
const q2ADemographicCategory = ref('race')
const q2AQuarterStart = ref(new Quarter(2014, QuarterMonths['Jan-Mar']))
const q2AQuarterEnd = ref(mostRecentQuarter)
const q2ARace = ref('White')
const q2AGender = ref('Female')
const q2AAgeGroup = ref('35-44')
const q2ADemographicBaseline = computed(() => {
  if (q2ADemographicCategory.value === 'race') { return q2ARace.value }
  if (q2ADemographicCategory.value === 'age range') { return q2AAgeGroup.value }
  if (q2ADemographicCategory.value === 'gender') { return q2AGender.value }
})
const q3AEvent = ref('traffic stops')
const selectedDistricts = ref(['District 05', 'District 12'])

// Shared cube + districts demographics. Both endpoints are pure derivations.
const { data: stopsBundle } = await useStopsCube()
const { data: districtsDemo } = await useDistrictsDemographics()

// --- Location helpers -----------------------------------------------------

function locationStringFor(locParam) {
  if (!locParam || locParam === '*') return 'Philadelphia'
  // Division
  if (/^[A-Z]+$/.test(locParam)) return `Division ${locParam}`
  // Bare district like "22*" or "22"
  const dMatch = /^(\d{1,2})\*?$/.exec(locParam)
  if (dMatch) return `District ${dMatch[1].padStart(2, '0')}`
  // Full PSA "22-1"
  const psaMatch = /^(\d{1,2})-(.+)$/.exec(locParam)
  if (psaMatch) return `PSA ${psaMatch[1].padStart(2, '0')}-${psaMatch[2]}`
  return locParam
}

// Quarter/season formatting (mirrors deo_backend/models.py).
const SEASON_START = { Q1: 'Jan', Q2: 'Apr', Q3: 'Jul', Q4: 'Oct' }
const SEASON_END = { Q1: 'Mar', Q2: 'Jun', Q3: 'Sep', Q4: 'Dec' }
const SEASON_LABEL = { Q1: 'Jan-Mar', Q2: 'Apr-Jun', Q3: 'July-Sep', Q4: 'Oct-Dec' }

function quarterStartStr(qStr) {
  const [year, q] = qStr.split('-')
  return `${SEASON_START[q]} ${year}`
}
function quarterEndStr(qStr) {
  const [year, q] = qStr.split('-')
  return `${SEASON_END[q]} ${year}`
}
function seasonAndYear(qStr) {
  const [year, q] = qStr.split('-')
  return `${SEASON_LABEL[q]} ${year}`
}

// Enumerate cube quarters within [start, end] (inclusive). Lexicographic
// ordering of "YYYY-QN" sorts correctly because Q1..Q4 sort numerically.
function quartersInRange(cube, start, end) {
  const qIdx = cube.dimensions.indexOf('quarter')
  const set = new Set()
  for (const row of cube.rows) {
    const q = row[qIdx]
    if (typeof q !== 'string') continue
    if (q >= start && q <= end) set.add(q)
  }
  return Array.from(set).sort()
}

// Sum cube measures grouped by year-or-quarter bucket.
function rollupOverTime(groups, timeGranularity) {
  const out = new Map()
  for (const { key, value } of groups) {
    const bucket = timeGranularity === 'year' ? key.slice(0, 4) : key
    out.set(bucket, (out.get(bucket) ?? 0) + value)
  }
  return Array.from(out, ([key, value]) => ({ key, value })).sort((a, b) =>
    a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
  )
}

// Order-of-group lists mirror DemographicCategory.order_of_group.
const RACE_ORDER = ['Asian', 'Black', 'Latino', 'White', 'All Other Races']
const GENDER_ORDER = ['Male', 'Female']
const AGE_ORDER = ['Under 25', '25-34', '35-44', '45-54', '55-64', '65+']

function demoOrder(dimName) {
  if (dimName === 'race') return RACE_ORDER
  if (dimName === 'gender') return GENDER_ORDER
  if (dimName === 'age_range') return AGE_ORDER
  return null
}

const DEMO_DIM_MAP = {
  'Race': 'race',
  'Gender': 'gender',
  'Age Range': 'age_range',
  'race': 'race',
  'gender': 'gender',
  'age_range': 'age_range',
}

function multiplierLabel(multiplier, isBaseline) {
  if (isBaseline) return 'Baseline'
  if (!Number.isFinite(multiplier)) {
    if (multiplier === Infinity || multiplier === -Infinity) return 'Above baseline'
    return '0.0x of Baseline'
  }
  return `${Math.abs(multiplier).toFixed(1)}x of Baseline`
}

// =========================================================================
// num-intrusions  (was q1A)
// =========================================================================
const q1A = computed(() => {
  const bundle = stopsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const loc = getLocationParam(selectedLocation.value)
  const timeGranularity = selectedTimeGranularity.value
  const locStr = locationStringFor(loc)

  // Grand totals (no time filter — endpoint always reads "all time").
  const totalIntrusions = sumMeasure(cube, 'n_intruded', { location: loc })
  const totalStopped = sumMeasure(cube, 'n_stopped', { location: loc })
  const pctTotal = pct(totalIntrusions, totalStopped)

  // Date range string covers every quarter present in the cube for this location.
  const presentQs = quartersInRange(cube, '0000-Q0', '9999-Q9')
  const startStr = quarterStartStr(presentQs[0])
  const endStr = quarterEndStr(presentQs[presentQs.length - 1])
  const startYear = presentQs[0].slice(0, 4)
  const endYear = presentQs[presentQs.length - 1].slice(0, 4)

  // Per-bucket figure.
  const groupedStops = groupSum(cube, 'quarter', 'n_stopped', { location: loc })
  const groupedIntr = groupSum(cube, 'quarter', 'n_intruded', { location: loc })
  const stopsByBucket = rollupOverTime(groupedStops, timeGranularity)
  const intrByBucket = rollupOverTime(groupedIntr, timeGranularity)
  const stopsMap = new Map(stopsByBucket.map(({ key, value }) => [key, value]))

  const xAxisLabel = timeGranularity === 'quarter' ? 'Quarter' : 'Year'
  const dateRangeStr = timeGranularity === 'quarter'
    ? `${seasonAndYear(presentQs[0])} through ${seasonAndYear(presentQs[presentQs.length - 1])}`
    : `${startYear} through ${endYear}`
  const longDateRange = `the start of ${startStr} through the end of ${endStr}`

  const data = intrByBucket.map(({ key, value }) => {
    const stops = stopsMap.get(key) ?? 0
    const rate = pct(value, stops)
    const xVal = timeGranularity === 'quarter' ? seasonAndYear(key) : Number(key)
    return {
      group: null,
      [xAxisLabel]: xVal,
      'Number of Intrusions': value,
      annotation: null,
      hover_text: [
        String(xVal),
        `${value.toLocaleString()} intrusions`,
        `${rate}% intrusion rate`,
      ],
    }
  })

  // Period statistics for the trailing prose paragraph. Match the
  // Python: round((sum/num_quarters)/3) — i.e. monthly average rounded
  // to int.
  function periodStats(startQ, endQ) {
    const intr = sumMeasure(cube, 'n_intruded', { location: loc, startQuarter: startQ, endQuarter: endQ })
    const stops = sumMeasure(cube, 'n_stopped', { location: loc, startQuarter: startQ, endQuarter: endQ })
    const quarters = quartersInRange(cube, startQ, endQ)
    const nQ = quarters.length || 1
    const monthly = Math.round(intr / nQ / 3)
    const monthlyStops = Math.round(stops / nQ / 3)
    return { monthly, monthlyStops, pctRate: pct(intr, stops) }
  }

  const baseline = periodStats('2014-Q1', '2018-Q4')
  const surge = periodStats('2019-Q1', '2019-Q4')
  // Pandemic: 2020-04-01 to 2021-02-28 → 2020-Q2..2021-Q1 (matches cube
  // semantics; FastAPI uses month-precision but cube only has quarters).
  // Python rounds the quarter boundary to the same 4 quarters.
  const covid = periodStats('2020-Q2', '2021-Q1')

  return {
    text: [
      `From ${longDateRange}, <span>${pctTotal}%</span> of traffic stops involved an intrusion, and Philadelphia police made a total of <span>${totalIntrusions.toLocaleString()}</span> intrusions.`,
      `In ${locStr}:`,
      `From the start of 2014 through the end of 2018, <span>${baseline.pctRate}%</span> of traffic stops involved an intrusion, and Philadelphia police made an average of <span>${baseline.monthly.toLocaleString()}</span> intrusions per month.`,
      `During a surge in stops in 2019, <span>${surge.pctRate}%</span> of traffic stops involved an intrusion, and Philadelphia police made an average of <span>${surge.monthly.toLocaleString()}</span> intrusions per month.`,
      `From the start of April 2020 through the end of March 2021 (pandemic), <span>${covid.pctRate}%</span> of traffic stops involved an intrusion, and Philadephia police made an average of <span>${covid.monthly.toLocaleString()}</span> intrusions per month.`,
    ],
    figures: {
      barplot: {
        properties: {
          xAxis: xAxisLabel,
          yAxis: 'Number of Intrusions',
          title: `Number of Intrusions During PPD Traffic Stops in ${locStr} from ${dateRangeStr}`,
        },
        trendlines: [],
        data,
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})

// =========================================================================
// searches-vs-frisks  (was q1B)
// =========================================================================
const q1B = computed(() => {
  const bundle = stopsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const loc = getLocationParam(selectedLocation.value)
  const timeGranularity = selectedTimeGranularity.value
  const locStr = locationStringFor(loc)

  const stops = rollupOverTime(groupSum(cube, 'quarter', 'n_stopped', { location: loc }), timeGranularity)
  const frisks = rollupOverTime(groupSum(cube, 'quarter', 'n_frisked', { location: loc }), timeGranularity)
  const searches = rollupOverTime(groupSum(cube, 'quarter', 'n_searched', { location: loc }), timeGranularity)
  const stopsMap = new Map(stops.map(({ key, value }) => [key, value]))

  const presentQs = quartersInRange(cube, '0000-Q0', '9999-Q9')
  const dateRangeStr = timeGranularity === 'quarter'
    ? `${seasonAndYear(presentQs[0])} through ${seasonAndYear(presentQs[presentQs.length - 1])}`
    : `${presentQs[0].slice(0,4)} through ${presentQs[presentQs.length - 1].slice(0,4)}`
  const xAxisLabel = timeGranularity === 'quarter' ? 'Quarter' : 'Year'

  // FastAPI emits searches first, then frisks (the order of value_vars in melt).
  const data = []
  for (const { key, value } of searches) {
    const stopsAt = stopsMap.get(key) ?? 0
    const rate = pct(value, stopsAt)
    const xVal = timeGranularity === 'quarter' ? seasonAndYear(key) : Number(key)
    data.push({
      group: '# of searches',
      [xAxisLabel]: xVal,
      'Number of Searches or Frisks': value,
      annotation: null,
      hover_text: [
        String(xVal),
        `${value.toLocaleString()} searches`,
        `${rate}% search rate`,
      ],
    })
  }
  const frisksMap = new Map(frisks.map(({ key, value }) => [key, value]))
  for (const { key } of searches) {
    const value = frisksMap.get(key) ?? 0
    const stopsAt = stopsMap.get(key) ?? 0
    const rate = pct(value, stopsAt)
    const xVal = timeGranularity === 'quarter' ? seasonAndYear(key) : Number(key)
    data.push({
      group: '# of frisks',
      [xAxisLabel]: xVal,
      'Number of Searches or Frisks': value,
      annotation: null,
      hover_text: [
        String(xVal),
        `${value.toLocaleString()} frisks`,
        `${rate}% frisk rate`,
      ],
    })
  }

  return {
    text: [],
    figures: {
      barplot: {
        properties: {
          xAxis: xAxisLabel,
          yAxis: 'Number of Searches or Frisks',
          title: `Number of Searches and Frisks During PPD Traffic Stops in ${locStr} from ${dateRangeStr}`,
        },
        trendlines: [],
        data,
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})

// =========================================================================
// neighborhoods-by-demographic-category  (was q2A)
// =========================================================================
const q2A = computed(() => {
  const bundle = stopsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const loc = getLocationParam(selectedLocation.value)
  const start = q2AQuarterStart.value.toParamString()
  const end = q2AQuarterEnd.value.toParamString()
  const locStr = locationStringFor(loc)
  const demoLabel = getDemographicGroupParam(q2ADemographicCategory.value) // 'Race' | 'Gender' | 'Age Range'
  const dim = DEMO_DIM_MAP[demoLabel]
  const order = demoOrder(dim) || []
  const baseline = q2ADemographicBaseline.value

  const filterOpts = { location: loc, startQuarter: start, endQuarter: end }
  const stopsByGroup = new Map(groupSum(cube, dim, 'n_stopped', filterOpts).map(g => [g.key, g.value]))
  const intrByGroup = new Map(groupSum(cube, dim, 'n_intruded', filterOpts).map(g => [g.key, g.value]))
  const contrabandByGroup = new Map(groupSum(cube, dim, 'n_contraband', filterOpts).map(g => [g.key, g.value]))

  const orderedKeys = order.length ? order : Array.from(stopsByGroup.keys()).sort()

  // Period totals & strings.
  const totalIntr = sumMeasure(cube, 'n_intruded', filterOpts)
  const totalStop = sumMeasure(cube, 'n_stopped', filterOpts)
  const totalContraband = sumMeasure(cube, 'n_contraband', filterOpts)
  const pctRate = pct(totalIntr, totalStop)
  const pctNotFound = totalIntr === 0 ? 0 : Math.round((1 - totalContraband / totalIntr) * 1000) / 10
  const dateRangeStr = `${quarterStartStr(start)} through ${quarterEndStr(end)}`
  const longDateRange = `the start of ${quarterStartStr(start)} through the end of ${quarterEndStr(end)}`

  // ---- barplot: intrusion rate %
  const intrRateByKey = new Map()
  for (const k of orderedKeys) {
    const r = pct(intrByGroup.get(k) ?? 0, stopsByGroup.get(k) ?? 0)
    intrRateByKey.set(k, r)
  }
  const baselineRate = intrRateByKey.get(baseline) ?? 0
  const data1 = orderedKeys.map(k => {
    const yVal = intrRateByKey.get(k) ?? 0
    const isBaseline = k === baseline
    const multiplier = baselineRate === 0 ? Infinity : yVal / baselineRate
    return {
      group: null,
      [demoLabel]: k,
      'Intrusion Rate (%)': yVal,
      annotation: multiplierLabel(multiplier, isBaseline),
      hover_text: [k, `${yVal}% intrusion rate`],
    }
  })

  // ---- barplot2: intrusions without contraband (clipped at 0)
  const noContrabandByKey = new Map()
  for (const k of orderedKeys) {
    const intr = intrByGroup.get(k) ?? 0
    const c = contrabandByGroup.get(k) ?? 0
    noContrabandByKey.set(k, Math.max(0, intr - c))
  }
  const baselineNoContraband = noContrabandByKey.get(baseline) ?? 0
  const data2 = orderedKeys.map(k => {
    const yVal = noContrabandByKey.get(k) ?? 0
    const isBaseline = k === baseline
    const multiplier = baselineNoContraband === 0 ? Infinity : yVal / baselineNoContraband
    return {
      group: null,
      [demoLabel]: k,
      'Number of Intrusions without Contraband': yVal,
      annotation: multiplierLabel(multiplier, isBaseline),
      hover_text: [k, `${yVal.toLocaleString()} intrusions`, ''],
    }
  })

  // ---- barplot3: contraband hit rate %
  const hitRateByKey = new Map()
  for (const k of orderedKeys) {
    const intr = intrByGroup.get(k) ?? 0
    const c = contrabandByGroup.get(k) ?? 0
    // Python: percentage = 100 - (n_contraband / police_action.sql_column) * 100
    // → percentage_found = round(100 - percentage, 1) = round(100 * c / intr, 1)
    // When intr=0, percentage is NaN, then 100 - NaN = NaN, fillna(0) → 0.
    const found = intr === 0 ? 0 : Math.round((1000 * c) / intr) / 10
    hitRateByKey.set(k, found)
  }
  const baselineHit = hitRateByKey.get(baseline) ?? 0
  const data3 = orderedKeys.map(k => {
    const yVal = hitRateByKey.get(k) ?? 0
    const isBaseline = k === baseline
    const multiplier = baselineHit === 0 ? Infinity : yVal / baselineHit
    return {
      group: null,
      [demoLabel]: k,
      'Contraband Hit Rate (%)': yVal,
      annotation: multiplierLabel(multiplier, isBaseline),
      hover_text: [k, `${yVal}% contraband hit rate`, ''],
    }
  })

  return {
    text: [
      `In ${locStr}:`,
      `When making traffic stops, Philadelphia police intruded upon <span>${pctRate}%</span> of people and/or vehicles from ${longDateRange}.`,
      `During these intrusions, Philadelphia police did not find any contraband <span>${pctNotFound}%</span> of the time.`,
    ],
    figures: {
      barplot: {
        properties: {
          xAxis: demoLabel,
          yAxis: 'Intrusion Rate (%)',
          title: `Intrusion Rates by ${demoLabel} in ${locStr} from ${dateRangeStr}`,
        },
        trendlines: [],
        data: data1,
      },
      barplot2: {
        properties: {
          xAxis: demoLabel,
          yAxis: 'Number of Intrusions without Contraband',
          title: `Intrusions Resulting in No Contraband by ${demoLabel} in ${locStr} from ${dateRangeStr}`,
        },
        trendlines: [],
        data: data2,
      },
      barplot3: {
        properties: {
          xAxis: demoLabel,
          yAxis: 'Contraband Hit Rate (%)',
          title: `Contraband Hit Rates by ${demoLabel} in ${locStr} from ${dateRangeStr}`,
        },
        trendlines: [],
        data: data3,
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})

// q2A annotated data passthroughs (kept for backward compat with existing template).
const q2AData1 = computed(() => q2A.value ? q2A.value.figures.barplot.data : null)
const q2AData2 = computed(() => q2A.value ? q2A.value.figures.barplot2.data : null)
const q2AData3 = computed(() => q2A.value ? q2A.value.figures.barplot3.data : null)

// =========================================================================
// neighborhoods-by-neighborhood  (was q3A)
// =========================================================================
const q3A = computed(() => {
  const bundle = stopsBundle.value
  const demo = districtsDemo.value
  if (!bundle || !demo) return null
  const { cube } = bundle
  const start = q2AQuarterStart.value.toParamString()
  const end = q2AQuarterEnd.value.toParamString()
  const event = getEventParam(q3AEvent.value) // 'stop' | 'search' | 'frisk' | 'intrusion'
  const actionMap = {
    stop: { col: 'n_stopped', noun: 'Traffic Stops' },
    search: { col: 'n_searched', noun: 'Searches' },
    frisk: { col: 'n_frisked', noun: 'Frisks' },
    intrusion: { col: 'n_intruded', noun: 'Intrusions' },
  }
  const action = actionMap[event] || actionMap.stop

  const filterOpts = { startQuarter: start, endQuarter: end }
  const perDistrict = groupAllMeasuresByDistrict(cube, filterOpts)

  // Drop district 77 (airport, no residents). Drop any district without
  // demographic data — mirrors `dropna()` on the join.
  const rows = perDistrict
    .filter(r => r.district !== '77' && demo[r.district] && demo[r.district].total)
    .map(r => {
      const m = r.measures
      const nStopped = m.n_stopped || 0
      const nIntruded = m.n_intruded || 0
      const nContraband = m.n_contraband || 0
      const whiteness = demo[r.district].whiteness
      return {
        district: r.district,
        whiteness,
        n_stopped: nStopped,
        n_intruded: nIntruded,
        n_contraband: nContraband,
        n_searched: m.n_searched || 0,
        n_frisked: m.n_frisked || 0,
        intrusion_rate: pct(nIntruded, nStopped),
        contraband_hit_rate: pct(nContraband, nIntruded),
      }
    })
    .sort((a, b) => a.whiteness - b.whiteness)

  const xAxisLabel = 'Majority Non-White Districts → Majority White Districts'
  const dateRangeStr = `${quarterStartStr(start)} through ${quarterEndStr(end)}`

  function buildFig(yKey, yLabel, hoverSuffix, title) {
    const data = rows.map(r => ({
      group: null,
      [xAxisLabel]: r.district,
      [yLabel]: r[yKey],
      annotation: null,
      hover_text: [
        `District ${r.district}`,
        `${r.whiteness}% of residents are white`,
        ...hoverSuffix(r),
      ],
    }))
    // OLS trendline over (whiteness, y), then displayed with x=district.
    const trend = olsTrendline(rows.map(r => ({ x: r.whiteness, y: r[yKey] })))
    let trendlines = []
    if (trend) {
      trendlines = rows.map(r => ({
        hover_text: null,
        [xAxisLabel]: r.district,
        [yLabel]: Math.max(0, trend.predict(r.whiteness)),
      }))
    }
    return {
      properties: { xAxis: xAxisLabel, yAxis: yLabel, title },
      trendlines,
      data,
    }
  }

  const fig = buildFig(
    action.col,
    `Number of ${action.noun}`,
    (r) => [`${r[action.col].toLocaleString()} ${action.noun.toLowerCase()}`],
    `Number of ${action.noun} in Majority Non-White Districts vs. Majority White Districts from ${dateRangeStr}`,
  )
  const fig2 = buildFig(
    'intrusion_rate',
    'Intrusion Rate (%)',
    (r) => [`${r.n_intruded.toLocaleString()} intrusions`, `${r.intrusion_rate}% intrusion rate`],
    `PPD Intrusion Rate During Traffic Stops in Majority Non-White Districts vs. Majority White Districts from ${dateRangeStr}`,
  )
  const fig3 = buildFig(
    'contraband_hit_rate',
    'Contraband Hit Rate (%)',
    (r) => [`${r.contraband_hit_rate}% contraband hit rate`],
    `Contraband Hit Rate in Majority Non-White Districts vs. Majority White Districts from ${dateRangeStr}`,
  )

  return {
    text: [],
    figures: { barplot: fig, barplot2: fig2, barplot3: fig3 },
    tables: {}, geojsons: [], data: {},
  }
})

// =========================================================================
// neighborhoods-compare-districts  (was q3B)
// =========================================================================
const q3B = computed(() => {
  const bundle = stopsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const start = q2AQuarterStart.value.toParamString()
  const end = q2AQuarterEnd.value.toParamString()
  const event = getEventParam(q3AEvent.value)
  const actionMap = {
    stop: { col: 'n_stopped', noun: 'traffic stops', titleNoun: 'Traffic Stops' },
    search: { col: 'n_searched', noun: 'searches', titleNoun: 'Searches' },
    frisk: { col: 'n_frisked', noun: 'frisks', titleNoun: 'Frisks' },
    intrusion: { col: 'n_intruded', noun: 'intrusions', titleNoun: 'Intrusions' },
  }
  const action = actionMap[event] || actionMap.stop

  // The Vue passes "District 05" → getLocationParam → "05*". Strip
  // the trailing asterisk to get the district code, but use the
  // location predicate for filtering.
  const districtParams = (selectedDistricts.value || []).map(d => getLocationParam(d))
  const districtRows = districtParams.map(locParam => {
    const dCode = locParam.replace(/\*$/, '').padStart(2, '0')
    const value = sumMeasure(cube, action.col, {
      location: locParam,
      startQuarter: start,
      endQuarter: end,
    })
    return { district: dCode, value }
  })

  const districtsInTitle = englishCommaSeparated(districtRows.map(r => `District ${r.district}`))
  const dateRangeStr = `${quarterStartStr(start)} through ${quarterEndStr(end)}`

  return {
    text: [],
    figures: {
      barplot: {
        properties: {
          xAxis: 'District',
          yAxis: `Number of ${action.titleNoun}`,
          title: `Number of ${action.titleNoun} in Districts ${districtsInTitle} from ${dateRangeStr}`,
        },
        trendlines: [],
        data: districtRows.map(r => ({
          group: null,
          District: r.district,
          [`Number of ${action.titleNoun}`]: r.value,
          annotation: null,
          hover_text: [`District ${r.district}`, `${r.value.toLocaleString()} ${action.noun}`],
        })),
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})

function englishCommaSeparated(arr) {
  if (arr.length === 0) return ''
  if (arr.length === 1) return arr[0]
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`
}
</script>

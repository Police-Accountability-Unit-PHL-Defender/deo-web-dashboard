<template>
  <LayoutPageHeader>
    <template #header>
      How many stops do police make, and who do they stop?
    </template>
    <template #image>
      <img class="w-full h-full object-cover object-[0%_20%]" src="~/assets/images/stops.jpg" alt="Closeup of police lights at night"/>
      <div class="absolute inset-0 z-[1] bg-black opacity-40"></div>
    </template>
    <template #quote>
      <Quote author="Pastor Carl Day" source="https://vimeo.com/phillydefenders/driving-equality-anniversary">
        <template #quoteText>
          <p>
            As a Black man, you’re just awaiting that moment. You’ll sit in the car and you’re just awaiting that time for the red and blue lights to come on.
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
                How many traffic stops do police make?
              </a>
            </li>
            <li>
              <a href="#part2" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                Who are police stopping in traffic stops?
              </a>
            </li>
          </ul>
        </nav>
    
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-10 mb-6">How many traffic stops do police make?</h2>
          <QuestionHeader>
            <h3>How many traffic stops<Tooltip term="Traffic Stop"/> did Philadelphia police make in <SelectLocation v-model="selectedLocation"/> by <span class="whitespace-nowrap"><SelectTimeGranularity v-model="selectedTimeGranularity"/>?</span></h3>
          </QuestionHeader>
          <Answer v-if="q1A" :arrow="true">
            <AnswerText>
              <div v-html="q1A.text[0]" class="result-text"></div>
            </AnswerText>
            <Graph :graph-data="q1A.figures.barplot.data" :axis-properties="{x: q1A.figures.barplot.properties.xAxis, y: q1A.figures.barplot.properties.yAxis}" :quarterlyXAxisTicks="selectedTimeGranularity === 'quarter'">
              <h4>{{ q1A.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <div class="result-text">
                <p v-html="q1A.text[1]"></p>
                <ul class="pl-4">
                  <li>
                    <p v-html="q1A.text[2]"></p>
                  </li>
                  <li>
                    <p v-html="q1A.text[3]"></p>
                  </li>
                  <li>
                    <p v-html="q1A.text[4]"></p>
                  </li>
                </ul>
              </div>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-4 md:my-12"/>
        <section>
          <QuestionHeader>
            <h3>
              In <SelectLocation v-model="selectedLocation"/>, from the start of <SelectQuarter v-model="q1BQuarterStart" item-label-end="start" :max-selectable="q1BQuarterEnd" /> through the end of <SelectQuarter v-model="q1BQuarterEnd" item-label-end="end" :min-selectable="q1BQuarterStart"/>,
              <span v-if="q1B" class="result-text" v-html="q1B.text[0]"></span>
            </h3>
          </QuestionHeader>
        </section>
        <HorizontalLine class="my-4 md:my-12"/>
        <section>
          <QuestionHeader>
            <h3>Does traffic enforcement change depending on the time of year? How many traffic stops did Philadelphia police make in certain times of year in <span class="whitespace-nowrap"><SelectLocation v-model="selectedLocation"/>?</span></h3>
          </QuestionHeader>
          <div class="max-w-2xl mt-4">
            <div class="text-body-4 text-left">Select time(s) of year</div>
            <SelectTimeOfYear class="mt-2 max-w-[390px]" v-model="q1CQuarters"/>
          </div>
          <Answer v-if="q1C">
            <Graph :graph-data="q1C.figures.barplot.data" :axis-properties="{x: q1C.figures.barplot.properties.xAxis, y: q1C.figures.barplot.properties.yAxis}">
              <h4 class="max-w-[550px] mx-auto">{{ q1C.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
        </section>
        <HorizontalLine class="mt-12" :color="true"/>
        <section>
          <h2 id="part2" class="text-heading-3 text-left pt-10 mb-6">Who are police stopping in traffic stops?</h2>
          <QuestionHeader>
            How often did Philadelphia police stop people of different <SelectDemographicCategory v-model="q2ADemographicCategory" :is-plural="true" /> from the start of <SelectQuarter v-model="q1BQuarterStart" item-label-end="start" :max-selectable="q1BQuarterEnd"/> through the end of <SelectQuarter v-model="q1BQuarterEnd" item-label-end="end" :min-selectable="q1BQuarterStart"/> in <span class="whitespace-nowrap"><SelectLocation v-model="selectedLocation"/>?</span>
            </QuestionHeader>
            <Answer>
            <div v-if="q2A">
              <Graph :graph-data="q2A.figures.barplot.data" :axis-properties="{x: q2A.figures.barplot.properties.xAxis, y: q2A.figures.barplot.properties.yAxis}">
                <h4 class="max-w-[550px] mx-auto">{{ q2A.figures.barplot.properties.title }}</h4>
              </Graph>
            </div>
          </Answer>
        </section>
        <HorizontalLine class="my-4 md:my-12"/>
        <section>
          <QuestionHeader>
            <h3>Which demographic groups did Philadelphia police most frequently stop in <SelectLocation v-model="selectedLocation"/> from the start of <SelectQuarter v-model="q1BQuarterStart" item-label-end="start" :max-selectable="q1BQuarterEnd"/> through the end of <span class="whitespace-nowrap"><SelectQuarter v-model="q1BQuarterEnd" item-label-end="end" :min-selectable="q1BQuarterStart"/>?</span></h3>
          </QuestionHeader>
          <Answer :arrow="true">
            <div v-if="q2B">
              <AnswerText>
                <div v-html="q2B.text[1]" class="result-text"></div>
              </AnswerText>
              <div class="border border-neutral-400 pt-6">
                <h4 class="text-center text-body-2 font-semibold text-primary-800">{{ q2B.text[0] }}</h4>
                <div class="deo-table mt-6 text-body-3">
                  <div class="relative w-full">
                    <table class="w-full">
                      <thead class="w-full">
                        <tr>
                          <th class="w-1/4 font-medium">Race</th>
                          <th class="w-1/4 font-medium">Gender</th>
                          <th class="w-1/4 font-medium">Age Range</th>
                          <th class="w-1/4 font-medium">% of Stops</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div ref="tableScrollContainer" class="w-full border-b border-neutral-400" :class="{'h-[400px] overflow-y-scroll': isTableShowingAll}, 'h-[280px] overflow-y-hidden'">
                    <table class="text-body-3 relative w-full">
                      <tbody class="w-full">
                        <tr v-for="row in q2B.tables.demo">
                          <td class="w-1/4">{{ row['Race'] }}</td>
                          <td class="w-1/4">{{ row['Gender'] }}</td>
                          <td class="w-1/4">{{ row['Age Range'] }}</td>
                          <td class="w-1/4">{{ row["% of traffic stops"] }}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="flex justify-center">
                    <Button class="my-4 mx-auto" @click="isTableShowingAll = !isTableShowingAll">
                      {{ isTableShowingAll ? 'Show less' : 'Show all' }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Answer>
        </section>
        <HorizontalLine class="my-4 md:my-12"/>
        <section>
          <QuestionHeader>
            How many times did Philadelphia police stop one demographic group compared to another in <SelectLocation v-model="selectedLocation"/> from the start of <SelectQuarter v-model="q1BQuarterStart" item-label-end="start" :max-selectable="q1BQuarterEnd"/> through the end of <span class="whitespace-nowrap"><SelectQuarter v-model="q1BQuarterEnd" item-label-end="end" :min-selectable="q1BQuarterStart"/>?</span>
          </QuestionHeader>
          <div class="max-w-2xl mt-10 mb-6">
            <div class="text-label-2 text-left">Select two demographic groups and compare</div>
            <div class="grid grid-cols-2 gap-4 mt-6">
              <div class="col-span-1 flex flex-col gap-4 text-body-3 font-medium">
                <h4 class="text-body-3 font-medium flex gap-2 items-center">
                  Group 1
                  <div class="demographic-group-square bg-purple"></div>
                </h4>
                <SelectAgeGroups v-model="q2CGroup1AgeRange"/>
                <SelectGenders v-model="q2CGroup1Gender"/>
                <SelectRaces v-model="q2CGroup1Race"/>
              </div>
              <div class="col-span-1 flex flex-col gap-4 text-body-3 font-medium">
                <h4 class="text-body-3 font-medium flex gap-2 items-center">
                  Group 2
                  <div class="demographic-group-square bg-mint"></div>
                </h4>
                <SelectAgeGroups v-model="q2CGroup2AgeRange"/>
                <SelectGenders v-model="q2CGroup2Gender"/>
                <SelectRaces v-model="q2CGroup2Race"/>
              </div>
            </div>
          </div>
          <Answer>
            <div v-if="q2C">
              <Graph :graph-data="q2C.figures.barplot.data" :axis-properties="{x: q2C.figures.barplot.properties.xAxis, y: q2C.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'Group 1': 'fill-purple bg-purple', 'Group 2': 'fill-mint bg-mint'}" :chart-legend="{'Group 1': 'Group 1', 'Group 2': 'Group 2'}" :quarterly-x-axis-ticks="true" :wrap-x-axis-labels="true">
                <h4 class="max-w-[550px] mx-auto">{{ q2C.figures.barplot.properties.title }}</h4>
              </Graph>
            </div>
          </Answer>
        </section>
      </div>
    </div>
  </main>
</template>

<style>
.demographic-group-square {
  @apply inline-block w-6 h-6 align-middle;
}
</style>

<script setup>
import Graph from '~/components/Graph.vue';
import QuestionHeader from '~/components/QuestionHeader.vue';
import SelectLocation from '~/components/SelectLocation.vue';
import SelectTimeGranularity from '~/components/SelectTimeGranularity.vue';
import Button from '~/components/ui/Button.vue';
import HorizontalLine from '~/components/ui/HorizontalLine.vue';
import Tooltip from '~/components/ui/Tooltip.vue';
import { groupSum, sumMeasure, groupTupleSum } from '~/utils/cube';
import { useStopsCube } from '~/composables/useStopsCube';

useHead({
  title: 'How many stops do police make, and who do they stop?',
})

// SEASON mapping mirrors deo_backend/models.py SEASON_QUARTER_MAPPING.
const SEASON_LABEL = { Q1: 'Jan-Mar', Q2: 'Apr-Jun', Q3: 'July-Sep', Q4: 'Oct-Dec' }
function seasonAndYear(qStr) {
  const [year, q] = qStr.split('-')
  return `${SEASON_LABEL[q]} ${year}`
}

const config = useRuntimeConfig()
const mostRecentQuarter = Quarter.fromParamString(useState("mostRecentQuarter").value)
const defaultStartQuarter = mostRecentQuarter.getPreviousQuarter().getPreviousQuarter().getPreviousQuarter()

const selectedLocation = ref('Philadelphia')
const selectedTimeGranularity = ref('year')
const q1BQuarterStart = ref(defaultStartQuarter)
const q1BQuarterEnd = ref(mostRecentQuarter)
const q1CQuarters = ref(['Jan-Mar'])
const q2ADemographicCategory = ref('race')
const q2CGroup1AgeRange = ref(['25-34'])
const q2CGroup2AgeRange = ref(['25-34'])
const q2CGroup1Gender = ref(['Male'])
const q2CGroup2Gender = ref(['Male'])
const q2CGroup1Race = ref(['Black'])
const q2CGroup2Race = ref(['White'])

const tableScrollContainer = ref(null)
const isTableShowingAll = ref(false)
watch(isTableShowingAll, (newValue) => {
  if (!newValue) {
    tableScrollContainer.value.scrollTop = 0
  }
})

const { data: stopsBundle } = await useStopsCube()

const firstQuarter = new Quarter(2014, 1)

const q1A = computed(() => {
  const bundle = stopsBundle.value
  if (!bundle) return null
  const { cube, scalars } = bundle
  const loc = getLocationParam(selectedLocation.value)
  const locStr = formatLocationForSentence(selectedLocation.value)
  const timeDim = selectedTimeGranularity.value // 'year' or 'quarter'

  const groups = groupSum(cube, 'quarter', 'n_stopped', { location: loc })
  const rolled = new Map()
  for (const { key, value } of groups) {
    const bucket = timeDim === 'year' ? key.slice(0, 4) : key
    rolled.set(bucket, (rolled.get(bucket) ?? 0) + value)
  }
  const sorted = Array.from(rolled, ([key, value]) => ({ key, value })).sort((a, b) => a.key.localeCompare(b.key))

  const total = sumMeasure(cube, 'n_stopped', { location: loc })
  const baseline = scalars['stops_monthly_avg_2014_2018']?.[loc] ?? null
  const surge    = scalars['stops_monthly_avg_2019']?.[loc] ?? null
  const covid    = scalars['stops_monthly_avg_2020Q2_2021Q1']?.[loc] ?? null

  const startStr = firstQuarter.getStartString()
  const endStr   = mostRecentQuarter.getEndString()
  const startYear = sorted.length ? sorted[0].key.slice(0,4) : '2014'
  const endYear   = sorted.length ? sorted[sorted.length-1].key.slice(0,4) : String(mostRecentQuarter.year)

  const xAxisLabel = timeDim === 'year' ? 'Year' : 'Quarter'
  return {
    text: [
      `From the start of ${startStr} through the end of ${endStr}, Philadelphia police made a total of <span>${total.toLocaleString()}</span> traffic stops in ${locStr}.`,
      `In ${locStr}:`,
      baseline === null ? '' : `From the start of 2014 through the end of 2018, Philadelphia police made an average of <span>${Math.round(baseline).toLocaleString()}</span> traffic stops per month.`,
      surge    === null ? '' : `During a surge in traffic stops in 2019, Philadelphia police made an average of <span>${Math.round(surge).toLocaleString()}</span> traffic stops per month.`,
      covid    === null ? '' : `From the start of April 2020 through the end of March 2021 (pandemic), Philadelphia police made an average of <span>${Math.round(covid).toLocaleString()}</span> traffic stops per month.`,
    ],
    figures: {
      barplot: {
        properties: { xAxis: xAxisLabel, yAxis: 'Number of Traffic Stops', title: `Number of PPD Traffic Stops in ${locStr} from ${startYear} through ${endYear}` },
        trendlines: [],
        data: sorted.map(({ key, value }) => ({
          group: null,
          [xAxisLabel]: key,
          'Number of Traffic Stops': value,
          annotation: null,
          hover_text: [`${key}`, `${value.toLocaleString()} traffic stops`],
        })),
      },
    },
    tables: {},
    geojsons: [],
    data: {},
  }
})

const q1B = computed(() => {
  const bundle = stopsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const loc = getLocationParam(selectedLocation.value)
  const locStr = formatLocationForSentence(selectedLocation.value)
  const start = q1BQuarterStart.value.toParamString()
  const end   = q1BQuarterEnd.value.toParamString()

  const groups = groupSum(cube, 'quarter', 'n_stopped', { location: loc, startQuarter: start, endQuarter: end })
  const total = groups.reduce((s, g) => s + g.value, 0)
  const months = Math.max(1, groups.length * 3)
  const perMonth = Math.round(total / months)

  return {
    text: [`Philadelphia police made an average of <span>${perMonth.toLocaleString()}</span> traffic stops per month in ${locStr}, totaling <span>${total.toLocaleString()}</span> traffic stops during that period.`],
    figures: {
      barplot: {
        properties: { xAxis: 'Quarter', yAxis: 'Number of Traffic Stops', title: 'Number of PPD Traffic Stops by Quarter' },
        trendlines: [],
        data: groups.map(({ key, value }) => ({
          group: null,
          Quarter: key,
          'Number of Traffic Stops': value,
          annotation: null,
          hover_text: [key, `${value.toLocaleString()} traffic stops`],
        })),
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})

const q1C = computed(() => {
  const bundle = stopsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const loc = getLocationParam(selectedLocation.value)
  const locStr = formatLocationForSentence(selectedLocation.value)
  const wantedQuarters = new Set(q1CQuarters.value.map(q => getQuarterParam(q))) // ['Q1', 'Q3', ...]

  const seasonStr = q1CQuarters.value.join(', ')
  // Graph.vue reads each row's x value by `axisProperties.x`, so the data key
  // has to be the display label itself.
  const xAxisLabel = `Times of Year: ${seasonStr}`

  const groups = groupSum(cube, 'quarter', 'n_stopped', { location: loc })
  const filtered = groups
    .filter(g => wantedQuarters.has(g.key.slice(-2))) // 'YYYY-QN' → 'QN'
    .map(({ key, value }) => ({
      group: key.slice(-2),
      [xAxisLabel]: key.slice(0, 4),
      'Number of Traffic Stops': value,
      annotation: null,
      hover_text: [key, `${value.toLocaleString()} traffic stops`],
    }))

  const startYear = filtered.length ? filtered[0][xAxisLabel] : '2014'
  const endYear   = filtered.length ? filtered[filtered.length-1][xAxisLabel] : String(mostRecentQuarter.year)

  return {
    text: [],
    figures: {
      barplot: {
        properties: { xAxis: xAxisLabel, yAxis: 'Number of Traffic Stops', title: `Number of PPD Traffic Stops in ${locStr} for ${seasonStr} from ${startYear} through ${endYear}` },
        trendlines: [],
        data: filtered,
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})

const DEMO_DIM_MAP = {
  'Age Range': 'age_range',
  'Gender': 'gender',
  'Race': 'race',
  'age_range': 'age_range',
  'gender': 'gender',
  'race': 'race',
}

// Order-of-group lists mirror DemographicCategory.order_of_group. groupSum
// returns keys alphabetically, which would put "All Other Races" first.
const RACE_ORDER = ['Asian', 'Black', 'Latino', 'White', 'All Other Races']
const GENDER_ORDER = ['Male', 'Female']
const AGE_ORDER = ['Under 25', '25-34', '35-44', '45-54', '55-64', '65+']

function demoOrder(dimName) {
  if (dimName === 'race') return RACE_ORDER
  if (dimName === 'gender') return GENDER_ORDER
  if (dimName === 'age_range') return AGE_ORDER
  return null
}

const q2A = computed(() => {
  const bundle = stopsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const loc = getLocationParam(selectedLocation.value)
  const locStr = formatLocationForSentence(selectedLocation.value)
  const start = q1BQuarterStart.value.toParamString()
  const end   = q1BQuarterEnd.value.toParamString()
  const dim = DEMO_DIM_MAP[getDemographicGroupParam(q2ADemographicCategory.value)]
  const dimLabel = { age_range: 'Age Range', gender: 'Gender', race: 'Race' }[dim] || dim

  const order = demoOrder(dim)
  const unordered = groupSum(cube, dim, 'n_stopped', { location: loc, startQuarter: start, endQuarter: end })
  const groups = order
    ? order.filter(k => unordered.some(g => g.key === k)).map(k => unordered.find(g => g.key === k))
    : unordered
  const total = groups.reduce((s, g) => s + g.value, 0)
  const withPct = groups.map(({ key, value }) => ({
    key,
    pct: total === 0 ? 0 : Math.round((value / total) * 1000) / 10,
    value,
  }))

  const startStr = q1BQuarterStart.value.getStartString()
  const endStr   = q1BQuarterEnd.value.getEndString()

  return {
    text: [],
    figures: {
      barplot: {
        properties: { xAxis: dimLabel, yAxis: 'Percentage (%)', title: `Percent of PPD Traffic Stops in ${locStr} by ${dimLabel} from ${startStr} through ${endStr}` },
        trendlines: [],
        data: withPct.map(({ key, pct, value }) => ({
          group: null,
          [dimLabel]: key,
          'Percentage (%)': pct,
          annotation: null,
          hover_text: [key, `${pct}% of traffic stops`],
        })),
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})

const q2B = computed(() => {
  const bundle = stopsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const loc = getLocationParam(selectedLocation.value)
  const start = q1BQuarterStart.value.toParamString()
  const end   = q1BQuarterEnd.value.toParamString()

  const tuples = groupTupleSum(
    cube, ['race', 'gender', 'age_range'], 'n_stopped',
    { location: loc, startQuarter: start, endQuarter: end }
  )
  const total = tuples.reduce((s, t) => s + t.value, 0)
  const withPct = tuples
    .map(({ keys, value }) => ({
      Race: keys[0],
      Gender: keys[1],
      'Age Range': keys[2],
      '% of traffic stops': total === 0 ? 0 : Math.round((value / total) * 1000) / 10,
    }))
    .filter(r => r['% of traffic stops'] > 0)

  const top = withPct[0]
  const locationStr = formatLocationForSentence(selectedLocation.value)
  const startStr = q1BQuarterStart.value.getStartString()
  const endStr   = q1BQuarterEnd.value.getEndString()
  const title = `Demographic Groups Stopped by PPD in ${locationStr} from ${startStr} through ${endStr}`
  const sentence = top
    ? `Philadelphia police most frequently stopped <span>${String(top.Race).toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase())} ${String(top.Gender).toLowerCase()} ${top['Age Range']}</span> year old drivers in ${locationStr} from the start of ${startStr} through the end of ${endStr}, or <span>${top['% of traffic stops'].toFixed(1)}%</span> of stops.`
    : ''

  return {
    text: [title, sentence],
    figures: {},
    tables: { demo: withPct },
    geojsons: [], data: {},
  }
})

const q2C = computed(() => {
  const bundle = stopsBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const loc = getLocationParam(selectedLocation.value)
  const start = q1BQuarterStart.value.toParamString()
  const end   = q1BQuarterEnd.value.toParamString()

  // Both groups are broken out by quarter and drawn as a grouped bar series,
  // mirroring group_comparison.py (groupby ["group", "quarter"], x="season").
  const quartersFor = (ages, genders, races) =>
    groupSum(cube, 'quarter', 'n_stopped', {
      location: loc, startQuarter: start, endQuarter: end,
      race: races.length ? races : undefined,
      gender: genders.length ? genders : undefined,
      ageRange: ages.length ? ages : undefined,
    })

  const series = [
    { name: 'Group 1', rows: quartersFor(q2CGroup1AgeRange.value, q2CGroup1Gender.value, q2CGroup1Race.value) },
    { name: 'Group 2', rows: quartersFor(q2CGroup2AgeRange.value, q2CGroup2Gender.value, q2CGroup2Race.value) },
  ]

  // groupSum sorts by 'YYYY-QN', which is already chronological.
  const allQuarters = Array.from(new Set(series.flatMap(s => s.rows.map(r => r.key)))).sort()
  const data = []
  for (const q of allQuarters) {
    const season = seasonAndYear(q)
    for (const s of series) {
      const hit = s.rows.find(r => r.key === q)
      if (!hit) continue
      data.push({
        group: s.name,
        Quarter: season,
        'Number of Traffic Stops': hit.value,
        annotation: null,
        hover_text: [s.name, season, `${hit.value.toLocaleString()} traffic stops`],
      })
    }
  }

  const locStr = formatLocationForSentence(selectedLocation.value)
  const startStr = q1BQuarterStart.value.getStartString()
  const endStr   = q1BQuarterEnd.value.getEndString()
  return {
    text: [],
    figures: {
      barplot: {
        properties: { xAxis: 'Quarter', yAxis: 'Number of Traffic Stops', title: `Number of PPD Traffic Stops in ${locStr}, Comparing Group 1 to Group 2, from ${startStr} through ${endStr}` },
        trendlines: [],
        data,
      },
    },
    tables: {}, geojsons: [], data: {},
  }
})
</script>

<template>

  <LayoutPageHeader>
    <template #header>
      Do traffic stops promote safety?
    </template>
    <template #image>
      <img class="w-full h-full object-cover" src="~/assets/images/safety.jpg" alt="The side rearview mirror of a car"/>
      <div class="absolute inset-0 z-[1] bg-black opacity-40"></div>
    </template>
    <template #quote>
      <Quote author="Councilmember Isaiah Thomas" source="https://www.cnn.com/2021/10/30/us/philadelphia-driving-equality-bill/index.html" backgroundClass="bg-[#DBEEB9]" quoteMarkClass="fill-yellowgreen" bold-color-class="text-yellowgreen">
        <template #quoteText>
          <p>
            To many people who look like me, a traffic stop is a rite of passage – we pick out cars, we determine routes, we plan our social interactions around the fact that it is likely that we will be pulled over by police.
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
                Do traffic stops happen where car accidents happen?
              </a>
            </li>
            <li>
              <a href="#part2" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                Do changes in traffic stops over time relate to changes in shootings?
              </a>
            </li>
          </ul>
        </nav>
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-14 mb-6">Do traffic stops happen where car accidents happen?</h2>
          <QuestionHeader>
            <h3>How often did Philadelphia police make traffic stops<Tooltip term="Traffic Stop"/> on High Injury Network<Tooltip term="High Injury Network"/> (HIN) roads in <SelectLocation v-model="selectedLocation" :allowOnlyCityOrDivision="true"/> by <span class="whitespace-nowrap"><SelectTimeGranularity v-model="selectedTimeGranularity"/>?</span></h3>
          </QuestionHeader>
          <Answer v-if="q1A" :arrow="true">
            <Graph :graph-data="q1A.figures.barplot.data" :axis-properties="{x: q1A.figures.barplot.properties.xAxis, y: q1A.figures.barplot.properties.yAxis}" :yScaleDomainMax="100" :quarterlyXAxisTicks="true">
              <h4>{{ q1A.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              Driving Equality came into effect on March 3, 2022. In the year after<Tooltip term="Year after"/> Driving Equality,
              <span v-html="q1A.text[0]" class="result-text"></span>
              compared to 2021 (see <a href="/driving-equality#10" class="text-hyperlink-blue" target="_blank">What is Driving Equality?</a> to learn more about these date comparisons).
            </AnswerText>
            <LeafletMap2 :geo-aggregation="q1CGeoAggregation" hin-legend="true">
              <h4>{{ q1C?.geojsons?.[0]?.properties?.title }}</h4>
            </LeafletMap2>
          </Answer>
        </section>
        <HorizontalLine class="my-12" :color="true"/>
        <section>
          <h2 id="part2" class="text-heading-3 text-left mb-6">Do changes in traffic stops over time relate to changes in shootings?</h2>
          <QuestionHeader>
            <h3>During a surge in traffic stops from 2018 to 2019, which districts<Tooltip term="District"/> had the largest percent increases in traffic stops? Were these the same districts that had the largest percent decreases in shootings?</h3>
          </QuestionHeader>
          <Answer v-if="q2" :arrow="true">
            <AnswerText>
              <p v-html="q2.text[0]" class="result-text"></p>
            </AnswerText>
            <LeafletMap2 :geo-aggregation="q2AGeoAggregation" :map-legend="['Districts with largest % increases in traffic stops', 'Districts with largest % decreases in shootings', 'Districts with both one of the largest % increases in traffic stops and decreases in shootings']">
              <h4>{{ q2.geojsons[0].properties.title }}</h4>
            </LeafletMap2>
          </Answer>
        </section>
        <HorizontalLine class="my-4 md:my-12"/>
        <section>
          <QuestionHeader>
            <h3>Driving Equality came into effect on March 3, 2022. In the year after<Tooltip term="Year after"/> Driving Equality, which districts had the largest percent decreases in traffic stops, compared to 2021? (See <a href="/driving-equality#10" target="_blank" class="text-hyperlink-blue">What is Driving Equality?</a> to learn more about these date comparisons.) Were these the same districts that had the largest percent increases in shootings?</h3>
          </QuestionHeader>
          <Answer v-if="q2" :arrow="true">
            <AnswerText>
              <p v-html="q2.text[1]" class="result-text mt-2"></p>
            </AnswerText>
            <LeafletMap2 :geo-aggregation="q2BGeoAggregation" :map-legend="['Districts with largest % decreases in traffic stops', 'Districts with largest % increases in shootings', 'Districts with both the largest % decreases in traffic stops and increases in shootings']">
              <h4>{{ q2.geojsons[1].properties.title }}</h4>
            </LeafletMap2>
          </Answer>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import Graph from '~/components/Graph.vue';
import LeafletMap2 from '~/components/map/LeafletMap2.vue';
import QuestionHeader from '~/components/QuestionHeader.vue';
import SelectLocation from '~/components/SelectLocation.vue';
import SelectTimeGranularity from '~/components/SelectTimeGranularity.vue';
import HorizontalLine from '~/components/ui/HorizontalLine.vue';
import Tooltip from '~/components/ui/Tooltip.vue';
import { getLocationParam } from '~/utils';
import { sumMeasure } from '~/utils/cube';

useHead({
  title: 'Do traffic stops promote safety?',
})

const selectedLocation = ref('Philadelphia')
const selectedTimeGranularity = ref('year')

const { data: safetyBundle } = await useSafetyCube()

// ------ Helpers ------------------------------------------------------------

const SEASON_LABEL = { Q1: 'Jan-Mar', Q2: 'Apr-Jun', Q3: 'July-Sep', Q4: 'Oct-Dec' }

function yearQuarterToYearSeason(q) {
  const [year, qx] = q.split('-')
  return `${SEASON_LABEL[qx]} ${year}`
}

function locationStringFor(locParam) {
  if (!locParam || locParam === '*') return 'Philadelphia'
  if (/^[A-Z]+$/.test(locParam)) return `Division ${locParam}`
  const dMatch = /^(\d{1,2})\*?$/.exec(locParam)
  if (dMatch) return `District ${dMatch[1].padStart(2, '0')}`
  const psaMatch = /^(\d{1,2})-(.+)$/.exec(locParam)
  if (psaMatch) return `PSA ${psaMatch[1].padStart(2, '0')}-${psaMatch[2]}`
  return locParam
}

function round1(v) {
  return Math.round(v * 10) / 10
}

// ------ q1A: HIN num-accidents (bar chart + DEO sentence) -----------------

const q1A = computed(() => {
  const bundle = safetyBundle.value
  if (!bundle) return null
  const { cube } = bundle
  const hin = cube.hin
  const loc = getLocationParam(selectedLocation.value)
  const timeAgg = selectedTimeGranularity.value
  const locStr = locationStringFor(loc)

  // Sum on_hin / locatable for the selected location, all time, grouped
  // by year or quarter.
  const qIdx = hin.dimensions.indexOf('quarter')
  const yearIdx = hin.dimensions.indexOf('year')
  const locIdx = hin.dimensions.indexOf('location')
  const onHinIdx = hin.dimensions.length + hin.measures.indexOf('n_stopped_locatable_on_hin')
  const totalIdx = hin.dimensions.length + hin.measures.indexOf('n_stopped_locatable')

  // Build a location predicate matching FastAPI's Geography filter.
  let locPred
  if (loc === '*') {
    locPred = () => true
  } else {
    // Reuse cube locationPredicate behaviour for division/district/psa.
    const DIVISION_MAP = {
      SPD: ['01', '03', '17'],
      NEPD: ['02', '07', '08', '15', '25'],
      NWPD: ['05', '14', '35', '39'],
      CPD: ['06', '09', '22'],
      SWPD: ['12', '16', '18', '19'],
      EPD: ['24', '25', '26'],
    }
    if (loc in DIVISION_MAP) {
      const districts = new Set(DIVISION_MAP[loc])
      locPred = (l) => districts.has(l.split('-', 1)[0])
    } else {
      const dMatch = /^(\d{1,2})\*?$/.exec(loc)
      if (dMatch) {
        const d = dMatch[1].padStart(2, '0')
        const prefix = d + '-'
        locPred = (l) => l.startsWith(prefix)
      } else {
        locPred = (l) => l === loc
      }
    }
  }

  // Accumulate per bucket.
  const buckets = new Map() // key -> {on_hin, total, sample_quarter}
  let yearsSet = new Set()
  for (const row of hin.rows) {
    const l = row[locIdx]
    if (typeof l !== 'string' || !locPred(l)) continue
    const q = row[qIdx]
    const y = row[yearIdx]
    const onHin = row[onHinIdx] || 0
    const total = row[totalIdx] || 0
    yearsSet.add(y)
    const key = timeAgg === 'year' ? String(y) : q
    let b = buckets.get(key)
    if (!b) {
      b = { on_hin: 0, total: 0, quarter: q }
      buckets.set(key, b)
    }
    b.on_hin += onHin
    b.total += total
  }

  // Build x_label sorting.
  const keys = Array.from(buckets.keys()).sort()
  const data = []
  for (const key of keys) {
    const b = buckets.get(key)
    const pct = b.total > 0 ? round1(100 * b.on_hin / b.total) : 0
    const xLabel = timeAgg === 'quarter' ? yearQuarterToYearSeason(key) : Number(key)
    data.push({
      group: null,
      x_label: xLabel,
      'Percentage (%)': pct,
      annotation: null,
      hover_text: [`${xLabel}`, `${pct}% of traffic stops on HIN`],
    })
  }

  // Date range string for title.
  const yearsSorted = Array.from(yearsSet).filter((y) => y != null).sort((a, b) => a - b)
  const dateRangeStr = timeAgg === 'year'
    ? `${yearsSorted[0]} through ${yearsSorted[yearsSorted.length - 1]}`
    : (() => {
        const qsAll = Array.from(new Set(hin.rows
          .filter((r) => locPred(r[locIdx]))
          .map((r) => r[qIdx])
          .filter((q) => typeof q === 'string'))).sort()
        const first = qsAll[0]
        const last = qsAll[qsAll.length - 1]
        const SEASON_START = { Q1: 'Jan', Q2: 'Apr', Q3: 'Jul', Q4: 'Oct' }
        const SEASON_END = { Q1: 'Mar', Q2: 'Jun', Q3: 'Sep', Q4: 'Dec' }
        const [fy, fq] = first.split('-')
        const [ly, lq] = last.split('-')
        return `${SEASON_START[fq]} ${fy} through ${SEASON_END[lq]} ${ly}`
      })()

  const title = `Percent of PPD Traffic Stops on the HIN in ${locStr} from ${dateRangeStr}`

  // DEO comparison sentence — citywide regardless of location filter
  // (matches FastAPI before_deo_filter_hin / after_deo_filter_hin which
  // are hard-coded to location="*").
  const beforeQuarters = new Set(['2021-Q1', '2021-Q2', '2021-Q3', '2021-Q4'])
  const afterQuarters = new Set(['2022-Q2', '2022-Q3', '2022-Q4', '2023-Q1'])
  let beforeOnHin = 0, beforeTotal = 0, afterOnHin = 0, afterTotal = 0
  for (const row of hin.rows) {
    const q = row[qIdx]
    const onHin = row[onHinIdx] || 0
    const total = row[totalIdx] || 0
    if (beforeQuarters.has(q)) {
      beforeOnHin += onHin
      beforeTotal += total
    } else if (afterQuarters.has(q)) {
      afterOnHin += onHin
      afterTotal += total
    }
  }
  const beforeRatio = beforeTotal > 0 ? beforeOnHin / beforeTotal : 0
  const afterRatio = afterTotal > 0 ? afterOnHin / afterTotal : 0
  const pctIncrease = beforeRatio > 0
    ? (100 * (afterRatio - beforeRatio) / beforeRatio).toFixed(1)
    : '0.0'
  // The template wraps text[0] in <span class="result-text">; emit the bare prose.
  const text0 = `the proportion of traffic stops Philadelphia police made along the HIN increased by ${pctIncrease}%`

  return {
    text: [text0],
    figures: {
      barplot: {
        properties: {
          xAxis: 'x_label',
          yAxis: 'Percentage (%)',
          title,
        },
        trendlines: [],
        data,
      },
    },
  }
})

// ------ q1C: HIN map (geojsons[0]) ----------------------------------------

const q1C = computed(() => {
  const bundle = safetyBundle.value
  if (!bundle) return null
  return {
    geojsons: [
      {
        type: 'FeatureCollection',
        features: bundle.cube.hin_map.features,
        properties: {
          title: bundle.cube.hin_map.title,
          map_key: 'map_hin',
        },
      },
    ],
  }
})

const q1CGeoAggregation = computed(() => {
  if (!q1C.value?.geojsons?.[0]?.features) {
    return {
      data: { type: 'FeatureCollection', features: [] },
      legendSelectedTextFunction: () => '',
      tooltipFunction: () => '',
    }
  }
  const features = q1C.value.geojsons[0].features
  const data = { type: 'FeatureCollection', features }
  const hinTooltipOrLabel = (obj) => {
    if (obj.name === 'Traffic stop on the HIN' || obj.name === 'Traffic stop not on the HIN') {
      return obj.name
    }
    return obj.street_name || obj.stname || ''
  }
  return {
    data,
    legendSelectedTextFunction: hinTooltipOrLabel,
    tooltipFunction: hinTooltipOrLabel,
  }
})

// ------ q2: shootings_vs_stops_maps ---------------------------------------

const q2 = computed(() => {
  const bundle = safetyBundle.value
  if (!bundle) return null
  const surge = bundle.cube.shootings_vs_stops.surge
  const deo = bundle.cube.shootings_vs_stops.deo

  const fmtInt = (n) => Math.round(n).toLocaleString('en-US')
  const fmt1 = (n) => (Math.round(n * 10) / 10).toFixed(1)

  const surgeDiff = surge.n_stopped_end - surge.n_stopped_start
  const surgePctDiff = surge.n_stopped_start > 0
    ? 100 * surgeDiff / surge.n_stopped_start
    : 0
  const surgeText = `Comparing 2018 to 2019, the Philadelphia Police Department increased traffic stops across nearly all 21 districts by ${fmtInt(surgeDiff)} stops, a ${fmt1(surgePctDiff)}% increase. The map below compares the 5 districts with the largest percent increases in traffic stops to the 5 districts with the largest percent decreases in shootings. This map attempts to see whether the districts with the largest percent increases in traffic stops also had the largest percent decreases in shootings. Here, only one district, the 18th district, had such an outcome, with the third largest percent increase of traffic stops and the second largest percent decrease in shootings.`

  const deoDiff = deo.n_stopped_end - deo.n_stopped_start
  const deoPctDiff = deo.n_stopped_start > 0
    ? 100 * deoDiff / deo.n_stopped_start
    : 0
  const deoText = `Comparing before and after Driving Equality, the Philadelphia Police Department decreased traffic stops by ${fmtInt(-deoDiff)} stops, a ${fmt1(-deoPctDiff)}% decrease. The map below compares the 5 districts with the largest percent decreases in traffic stops to the 5 districts with the largest percent increases in shootings. This map attempts to see whether the districts with the largest percent decreases in traffic stops also had the largest percent increases in shootings. Here, only one district, the 3rd district, had such an outcome, with the third largest percent decrease of traffic stops and the third largest percent increase in shootings.`

  return {
    text: [surgeText, deoText],
    geojsons: [
      {
        type: 'FeatureCollection',
        features: surge.features,
        properties: { title: surge.title, map_key: 'map_surge' },
      },
      {
        type: 'FeatureCollection',
        features: deo.features,
        properties: { title: deo.title, map_key: 'map_deo' },
      },
    ],
  }
})

const q2AGeoAggregation = computed(() => {
  return {
    data: {
      features: q2.value?.geojsons?.[0]?.features ?? [],
      type: 'FeatureCollection',
    },
    legendSelectedTextFunction: (obj) => obj.DIST_NUM,
    tooltipFunction: (obj) => obj.hovertext,
  }
})
const q2BGeoAggregation = computed(() => {
  return {
    data: {
      features: q2.value?.geojsons?.[1]?.features ?? [],
      type: 'FeatureCollection',
    },
    legendSelectedTextFunction: (obj) => obj.DIST_NUM,
    tooltipFunction: (obj) => obj.hovertext,
  }
})
</script>

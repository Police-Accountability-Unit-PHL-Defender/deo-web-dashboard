<template>
  <LayoutPageHeader>
    <template #header>
      Do police treat people or neighborhoods differently?
    </template>
    <template #image>
      <img class="w-full h-full object-cover" src="~/assets/images/neighborhoods.jpg" alt="A police car"/>
    </template>
    <template #quote>
      <Quote author="Mahari Bailey, Attorney" source="https://phillydefenders.org" backgroundClass="bg-[#D7DCF7]" quoteMarkClass="fill-primary-600" bold-color-class="text-primary-600">
        <template #quoteText>
          <p>
            It's very disheartening and very degrading… I should feel comfortable enough going to neighborhoods rather than being fearful of being subjected to disrespectful and unlawful activities by a police officer.
          </p>
        </template>
      </Quote>
    </template>
  </LayoutPageHeader>
  <main class="layout-container -mt-4 text-body-3">
    <div class="grid-container">
      <div class="col-span-10">
        <nav class="flex flex-col gap-3 border-b border-neutral-400 pb-10">
          <h2 class="text-label-1">Jump to:</h2>
          <ul class="flex flex-col gap-3">
            <li>
              <a href="#part1" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-white -rotate-90"/>
                How intrusive are police during traffic stops?
              </a>
            </li>
            <li>
              <a href="#part2" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-white -rotate-90"/>
                During traffic stops, do police treat people differently?
              </a>
            </li>
            <li>
              <a href="#part3" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-white -rotate-90"/>
                During traffic stops, do police officers treat neighborhoods differently?
              </a>
            </li>
          </ul>
        </nav>
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-10 mb-6">How intrusive are police during traffic stops?</h2>
          <QuestionHeader>
            <h3>How many times did Philadelphia police intrude<Tooltip term="Intrusion"/> during traffic stops<Tooltip term="Traffic Stop"/> in <SelectLocation v-model="selectedLocation"/>, by <SelectTimeGranularity v-model="selectedTimeGranularity"/> ?</h3>
          </QuestionHeader>
          <Answer v-if="q1A" :arrow="true">
            <AnswerText>
              <div v-html="q1A.text[0]" class="result-text"></div>
            </AnswerText>
            <Graph :graph-data="q1A.figures.barplot.data" :axis-properties="{x: q1A.figures.barplot.properties.xAxis, y: q1A.figures.barplot.properties.yAxis}">
              <h4>{{ q1A.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <div class="text-body-3 text-left whitespace-pre-line">
                <span v-for="sentence in q1A.text.slice(1)"><span class="result-text" v-html="sentence"></span>&nbsp;</span>
              </div>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <QuestionHeader>
            <h3>How have Philadelphia police changed the way they intrude during traffic stops in <SelectLocation v-model="selectedLocation"/>, by <SelectTimeGranularity v-model="selectedTimeGranularity"/>? How do frisks<Tooltip term="Frisk"/> and searches<Tooltip term="Search"/>  compare over time?</h3>
          </QuestionHeader>
          <Answer v-if="q1B" :arrow="true">
            <Graph :graph-data="q1B.figures.barplot.data" :axis-properties="{x: q1B.figures.barplot.properties.xAxis, y: q1B.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'# of Searches': 'fill-primary-600', '# of Frisks': 'fill-red'}">
              <h4>{{ q1B.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <h2 id="part2" class="text-heading-3 text-left mb-6">During traffic stops, do police treat people differently?</h2>
          <QuestionHeader>
            <h3>
              Do Philadelphia police intrude upon some drivers and/or their vehicles more often than others?
              Show data by <SelectDemographicCategory v-model="q2ADemographicCategory" /> from the start of <SelectQuarter2 v-model="q2AQuarterStart" item-label-end="start"/> to the end of <SelectQuarter2 v-model="q2AQuarterEnd" item-label-end="end"/>, compared to a baseline of people who are
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
            <h3>How many times do Philadelphia police intrude during traffic stops without finding any contraband<Tooltip term="Contraband"/>?</h3>
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
              <div v-html="q2A.text[0]" class="result-text"></div>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <h2 id="part3" class="text-heading-3 text-left mb-6">During traffic stops, do police treat neighborhoods differently?</h2>
          <QuestionHeader>
            <h3>
              Is traffic enforcement different in districts<Tooltip term="District"/> where most residents are white, compared to districts where most residents are people of color?
              Comparing majority white districts to majority non-white districts, how many <SelectEvent v-model="q3AEvent" /> did Philadelphia police make from the start of <SelectQuarter2 v-model="q2AQuarterStart" item-label-end="start"/> to the end of <SelectQuarter2 v-model="q2AQuarterEnd" item-label-end="end"/>?
            </h3>
          </QuestionHeader>
          <Answer v-if="q3A" :arrow="true">
            <Graph :graph-data="q3A.figures.barplot.data" :axis-properties="{x: q3A.figures.barplot.properties.xAxis, y: q3A.figures.barplot.properties.yAxis}" :trendline="q3A.figures.barplot.trendlines">
              <h4>{{ q3A.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
          <QuestionHeader>
            <h3>
              During this time period, what was the intrusion rate<Tooltip term="Intrusion Rate"/> and contraband hit rate<Tooltip term="Contraband Hit Rate"/> across districts?
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
        <HorizontalLine class="my-16"/>
        <section>
          <QuestionHeader>
            <h3>
              How does traffic enforcement compare in different districts? How many <SelectEvent v-model="q3AEvent" /> did Philadelphia police make from the start of <SelectQuarter2 v-model="q2AQuarterStart" item-label-end="start"/> through the end of <SelectQuarter2 v-model="q2AQuarterEnd" item-label-end="end"/> in these districts: <SelectDistricts v-model="selectedDistricts" />?
            </h3>
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
import QuestionHeader from '~/components/QuestionHeader.vue';
import Graph from '~/components/Graph.vue';
import SelectLocation from '~/components/SelectLocation.vue'
import SelectTimeGranularity from '~/components/SelectTimeGranularity.vue'
import HorizontalLine from '~/components/ui/HorizontalLine.vue';
import Button from '~/components/ui/Button.vue';
import Tooltip from '~/components/ui/Tooltip.vue';
import { getDemographicGroupParam } from '~/utils';

const selectedLocation = ref('Philadelphia')
const selectedTimeGranularity = ref('year')
const q2ADemographicCategory = ref('race')
const q2AQuarterStart = ref(new Quarter(2023, QuarterMonths['Jan-Mar']))
const q2AQuarterEnd = ref(new Quarter(2023, QuarterMonths['Oct-Dec']))
const q2ARace = ref('White')
const q2AGender = ref('Male')
const q2AAgeGroup = ref('Under 25')
const q2ADemographicBaseline = computed(() => {
  if (q2ADemographicCategory.value === 'race') { return q2ARace.value }
  if (q2ADemographicCategory.value === 'age range') { return q2AAgeGroup.value }
  if (q2ADemographicCategory.value === 'gender') { return q2AGender.value }
})
const q3AEvent = ref('traffic stops')
const selectedDistricts = ref(['District 05', 'District 12'])

const q1AParams = ref([selectedLocation, selectedTimeGranularity])
const { data: q1A, refresh: refreshQ1A } = await useAsyncData('q1A',
  () => $fetch(`${apiBaseUrl}/neighborhoods/num-intrusions`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      time_aggregation: selectedTimeGranularity.value,
    },
    options
  })
)
watch(q1AParams, async () => { refreshQ1A() }, { deep: true })

const q1BParams = ref([selectedLocation, selectedTimeGranularity])
const { data: q1B, refresh: refreshQ1B } = await useAsyncData('q1B',
  () => $fetch(`${apiBaseUrl}/neighborhoods/searches-vs-frisks`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      time_aggregation: selectedTimeGranularity.value,
    },
    options
  })
)
watch(q1BParams, async () => { refreshQ1B() }, { deep: true })

const q2AParams = ref([q2ADemographicCategory, q2AQuarterStart, q2AQuarterEnd, q2ARace, q2AGender, q2AAgeGroup])
const { data: q2A, refresh: refreshQ2A } = await useAsyncData('q2A',
  () => $fetch(`${apiBaseUrl}/neighborhoods/neighborhoods-by-demographic-category`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      demographic_category: getDemographicGroupParam(q2ADemographicCategory.value),
      demographic_baseline: q2ADemographicBaseline.value,
      start_qyear: q2AQuarterStart.value.toParamString(),
      end_qyear: q2AQuarterEnd.value.toParamString(),
    },
    options
  })
)
watch(q2AParams, async () => { refreshQ2A() }, { deep: true })

const getQ2AnnotatedData = (barplotKey) => {
  if (!q2A.value) return null
  const yAxisProperty = q2A.value.figures[barplotKey].properties.yAxis
  const baselineDatum = q2A.value.figures[barplotKey].data.find(d => d[getDemographicGroupParam(q2ADemographicCategory.value)] === q2ADemographicBaseline.value)
  const baselineAmount = baselineDatum[yAxisProperty]
  return q2A.value.figures[barplotKey].data.map(d => {
    let annotation = ''
    if (d[getDemographicGroupParam(q2ADemographicCategory.value)] === q2ADemographicBaseline.value) {
      annotation = 'Baseline'
    } else {
      const multiple = (d[yAxisProperty] / baselineAmount).toFixed(1)
      annotation = `${multiple}x of ${q2ADemographicBaseline.value} people`
    }
    return {
      ...d,
      annotation
    }
  })
}

const q2AData1 = computed(() => {
  return getQ2AnnotatedData('barplot')
})
const q2AData2 = computed(() => {
  return getQ2AnnotatedData('barplot2')
})
const q2AData3 = computed(() => {
  return getQ2AnnotatedData('barplot3')
})

const q3AParams = ref([q3AEvent, q2AQuarterStart, q2AQuarterEnd])
const { data: q3A, refresh: refreshQ3A } = await useAsyncData('q3A',
  () => $fetch(`${apiBaseUrl}/neighborhoods/neighborhoods-by-neighborhood`, {
    params: {
      police_action: getEventParam(q3AEvent.value),
      start_qyear: q2AQuarterStart.value.toParamString(),
      end_qyear: q2AQuarterEnd.value.toParamString(),
    },
    options
  })
)
watch(q3AParams, async () => { refreshQ3A() }, { deep: true })

const q3BParams = ref([q3AEvent, q2AQuarterStart, q2AQuarterEnd, selectedDistricts])
const { data: q3B, refresh: refreshQ3B } = await useAsyncData('q3B',
  () => $fetch(`${apiBaseUrl}/neighborhoods/neighborhoods-compare-districts`, {
    params: {
      police_action: getEventParam(q3AEvent.value),
      start_qyear: q2AQuarterStart.value.toParamString(),
      end_qyear: q2AQuarterEnd.value.toParamString(),
      districts: selectedDistricts.value.map(d => getLocationParam(d)),
    },
    options
  })
);
watch(q3BParams, async () => { refreshQ3B() }, { deep: true })
</script>
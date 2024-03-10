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
        <HorizontalLine class="my-16"/>
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-10 mb-6">How intrusive are police during traffic stops?</h2>
          <QuestionHeader>
            <h3>How many times did Philadelphia police intrude during traffic stops in <SelectLocation v-model="selectedLocation"/>, by <SelectTimeGranularity v-model="selectedTimeGranularity"/> ?</h3>
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
            <h3>How have Philadelphia police changed the way they intrude during traffic stops in <SelectLocation v-model="selectedLocation"/>, by <SelectTimeGranularity v-model="selectedTimeGranularity"/> ?</h3>
          </QuestionHeader>
          <Answer v-if="q1B" :arrow="true">
            <Graph :graph-data="q1B.figures.barplot.data" :axis-properties="{x: q1B.figures.barplot.properties.xAxis, y: q1B.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'# of Searches': 'fill-primary-600', '# of Frisks': 'fill-red'}">
              <h4>{{ q1B.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <h2 id="part2" class="text-heading-3 text-left pt-10 mb-6">During traffic stops, do police treat people differently?</h2>
          <QuestionHeader>
            <h3>
              Do Philadelphia police intrude upon some drivers and their vehicles more often than others?
              Show data by <SelectDemographicCategory v-model="q2ADemographicCategory" /> from the start of <SelectQuarter v-model="q2AQuarterStart"/> to the end of <SelectQuarter v-model="q2AQuarterEnd"/>, compared to a baseline of people who are
              <SelectRace v-if="q2ADemographicCategory === 'Race'" v-model="q2ARace"/>
              <SelectGender v-if="q2ADemographicCategory ==='Gender'" v-model="q2AGender"/>
              <SelectAgeGroup v-if="q2ADemographicCategory === 'Age Range'" v-model="q2AAgeGroup"/>.
            </h3>
          </QuestionHeader>
          <Answer v-if="q2A" :arrow="true">
            <Graph :graph-data="q2A.figures.barplot.data" :axis-properties="{x: q2A.figures.barplot.properties.xAxis, y: q2A.figures.barplot.properties.yAxis}">
              <h4>{{ q2A.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
          <QuestionHeader>
            <h3>How many times do police intrude during traffic stops without finding any contraband?</h3>
          </QuestionHeader>
          <Answer v-if="q2A" :arrow="true">
            <Graph :graph-data="q2A.figures.barplot2.data" :axis-properties="{x: q2A.figures.barplot2.properties.xAxis, y: q2A.figures.barplot2.properties.yAxis}">
              <h4>{{ q2A.figures.barplot2.properties.title }}</h4>
            </Graph>
          </Answer>
          <QuestionHeader>
            <h3>When police intrude during traffic stops, how often do they find contraband?</h3>
          </QuestionHeader>
          <Answer v-if="q2A" :arrow="true">
            <Graph :graph-data="q2A.figures.barplot3.data" :axis-properties="{x: q2A.figures.barplot3.properties.xAxis, y: q2A.figures.barplot3.properties.yAxis}">
              <h4>{{ q2A.figures.barplot3.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <div v-html="q2A.text[0]" class="result-text"></div>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <h2 id="part3" class="text-heading-3 text-left pt-10 mb-6">During traffic stops, do police officers treat neighborhoods differently?</h2>
          <QuestionHeader>
            <h3>
              Is traffic enforcement different in districts where most residents are white, compared to districts where most residents are people of color?
              Comparing majority white districts to majority non-white districts, how many <SelectEvent v-model="q3AEvent" /> did Philadelphia police make from the start of <SelectQuarter v-model="q2AQuarterStart"/> to the end of <SelectQuarter v-model="q2AQuarterEnd"/>?
            </h3>
          </QuestionHeader>
          <Answer v-if="q3A" :arrow="true">
            <Graph :graph-data="q3A.figures.barplot.data" :axis-properties="{x: q3A.figures.barplot.properties.xAxis, y: q3A.figures.barplot.properties.yAxis}" :trendline="q3A.figures.barplot.trendlines">
              <h4>{{ q3A.figures.barplot.properties.title }}</h4>
            </Graph>
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
              From the start of <SelectQuarter v-model="q2AQuarterStart"/> to the end of <SelectQuarter v-model="q2AQuarterEnd"/>, how many <SelectEvent v-model="q3AEvent" /> happened at the following districts: <SelectDistricts v-model="selectedDistricts" />?
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

const selectedLocation = ref('Philadelphia')
const selectedTimeGranularity = ref('year')
const q2ADemographicCategory = ref('Race')
const q2AQuarterStart = ref(new Quarter(2023, QuarterMonths['Jan-Mar']))
const q2AQuarterEnd = ref(new Quarter(2023, QuarterMonths['Oct-Dec']))
const q2ARace = ref('White')
const q2AGender = ref('Male')
const q2AAgeGroup = ref('<25')
const q2ADemographicBaseline = computed(() => {
  if (q2ADemographicCategory.value === 'Race') { return q2ARace.value }
  if (q2ADemographicCategory.value === 'Age Group') { return q2AAgeGroup.value }
  if (q2ADemographicCategory.value === 'Gender') { return q2AGender.value }
})
const q3AEvent = ref('traffic stops')
const selectedDistricts = ref(['District 25', 'District 05'])

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
      demographic_category: q2ADemographicCategory.value,
      demographic_baseline: q2ADemographicBaseline.value,
      start_qyear: q2AQuarterStart.value.toParamString(),
      end_qyear: q2AQuarterEnd.value.toParamString(),
    },
    options
  })
)
watch(q2AParams, async () => { refreshQ2A() }, { deep: true })

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

console.log(q1A.value)
console.log(q1B.value)
console.log(q2A.value)
console.log(q3A.value)
console.log(q3B.value)
</script>
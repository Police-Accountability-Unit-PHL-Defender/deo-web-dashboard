<template>

  <LayoutPageHeader>
    <template #header>
      Do traffic stops promote safety?
    </template>
    <template #image>
      <img class="w-full h-full object-cover" src="~/assets/images/safety.jpg" alt="The side rearview mirror of a car"/>
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

  <main class="layout-container -mt-4 text-body-3">
    <div class="grid-container">
      <div class="col-span-10">
        <nav class="flex flex-col gap-3 border-b border-neutral-400 pb-10">
          <h2 class="text-label-1">Jump to:</h2>
          <ul class="flex flex-col gap-3">
            <li>
              <a href="#part1" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-white -rotate-90"/>
                Do traffic stops happen where car accidents happen?
              </a>
            </li>
            <li>
              <a href="#part2" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-white -rotate-90"/>
                How do police stops relate to shootings?
              </a>
            </li>
          </ul>
        </nav>
        <HorizontalLine class="my-16"/>
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-10 mb-6">Do traffic stops happen where car accidents happen?</h2>
          <QuestionHeader>
            <h3>How often did Philadelphia police make traffic stops<Tooltip term="Traffic Stop"/> on High Injury Network (HIN)<Tooltip term="High Injury Network"/> roads in <SelectLocation v-model="selectedLocation"/>, by <SelectTimeGranularity v-model="selectedTimeGranularity"/> ?</h3>
          </QuestionHeader>
          <Answer v-if="q1A" :arrow="true">
            <Graph :graph-data="q1A.figures.barplot.data" :axis-properties="{x: q1A.figures.barplot.properties.xAxis, y: q1A.figures.barplot.properties.yAxis}">
              <h4>{{ q1A.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <QuestionHeader>
            <h3>When police stop people, what percent take place on high injury network roads? Show me the data by <SelectDemographicCategory v-model="q1BDemographicCategory" /> in <SelectLocation v-model="selectedLocation"/> from the start of <SelectQuarter v-model="q1BQuarterStart"/> to the end of <SelectQuarter v-model="q1BQuarterEnd"/>.</h3>
          </QuestionHeader>
          <Answer v-if="q1B" :arrow="true">
            <AnswerText>
              <div v-html="q1B.text[0]" class="result-text"></div>
            </AnswerText>
            <Graph :graph-data="q1B.figures.barplot.data" :axis-properties="{x: q1B.figures.barplot.properties.xAxis, y: q1B.figures.barplot.properties.yAxis}">
              <h4>{{ q1B.figures.barplot.properties.title }}</h4>
            </Graph>
            <div class="h-[480px] relative z-0">
              <LeafletMap2 :geo-aggregation="q1CGeoAggregation" />
            </div>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-10 mb-6">How do police stops relate to shootings?</h2>
          <QuestionHeader>
            <h3>Comparing 2018 to 2019</h3>
          </QuestionHeader>
          <Answer v-if="q2" :arrow="true">
            <div class="h-[480px] relative z-0">
              <LeafletMap2 :geo-aggregation="q2AGeoAggregation" />
            </div>
          </Answer>
          <QuestionHeader>
            <h3>Comparing Jan 2021-Dec 2021 to April 2022-March 2023</h3>
          </QuestionHeader>
          <Answer v-if="q2" :arrow="true">
            <div class="h-[480px] relative z-0">
              <LeafletMap2 :geo-aggregation="q2BGeoAggregation" />
            </div>
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
import LeafletMap2 from '~/components/map/LeafletMap2.vue'
import Tooltip from '~/components/ui/Tooltip.vue';

const selectedLocation = ref('Philadelphia')
const selectedTimeGranularity = ref('year')
const q1BDemographicCategory = ref('Race')
const q1BQuarterStart = ref(new Quarter(2023, QuarterMonths['Jan-Mar']))
const q1BQuarterEnd = ref(new Quarter(2023, QuarterMonths['Oct-Dec']))
const q3AEvent = ref('traffic stops')
const selectedDistricts = ref(['District 25', 'District 05'])

const q1AParams = ref([selectedLocation, selectedTimeGranularity])
const { data: q1A, refresh: refreshQ1A } = await useAsyncData('q1A',
  () => $fetch(`${apiBaseUrl}/safety/safety-num-accidents`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      time_aggregation: selectedTimeGranularity.value,
    },
    options
  })
)
watch(q1AParams, async () => { refreshQ1A() }, { deep: true })

const q1BParams = ref([selectedLocation, q1BQuarterStart, q1BQuarterEnd, q1BDemographicCategory])
const { data: q1B, refresh: refreshQ1B } = await useAsyncData('q1B',
  () => $fetch(`${apiBaseUrl}/safety/safety-by-demographic-category`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      start_qyear: q1BQuarterStart.value.toParamString(),
      end_qyear: q1BQuarterEnd.value.toParamString(),
      demographic_category_str: q1BDemographicCategory.value,
    },
    options
  })
)
watch(q1BParams, async () => { refreshQ1B() }, { deep: true })

const { data: q1C, refresh: refreshQ1C } = await useAsyncData('q1C',
  () => $fetch(`${apiBaseUrl}/safety/safety-hin-map`, {
    options
  })
)
const q1CGeoAggregation = computed(() => {
  return {
    data: q1C.value.maps[0],
    legendSelectedTextFunction: (obj) => obj.street_name,
    tooltipFunction: (obj) => obj.street_name,
  }
})

const { data: q2, refresh: refreshQ2 } = await useAsyncData('q2',
  () => $fetch(`${apiBaseUrl}/safety/safety-shootings-vs-stops-maps`, {
    options
  })
)
const q2AGeoAggregation = computed(() => {
  return {
    data: q2.value.maps[0],
    legendSelectedTextFunction: (obj) => obj.DIST_NUM,
    tooltipFunction: (obj) => obj.DIST_NUM,
  }
})
const q2BGeoAggregation = computed(() => {
  return {
    data: q2.value.maps[1],
    legendSelectedTextFunction: (obj) => obj.DIST_NUM,
    tooltipFunction: (obj) => obj.DIST_NUM,
  }
})
</script>
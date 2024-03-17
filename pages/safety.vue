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
            <h3>How often did Philadelphia police make traffic stops<Tooltip term="Traffic Stop"/> on High Injury Network<Tooltip term="High Injury Network"/> (HIN) roads in <SelectLocation v-model="selectedLocation"/> by <SelectTimeGranularity v-model="selectedTimeGranularity"/> ?</h3>
          </QuestionHeader>
          <Answer v-if="q1A" :arrow="true">
            <Graph :graph-data="q1A.figures.barplot.data" :axis-properties="{x: q1A.figures.barplot.properties.xAxis, y: q1A.figures.barplot.properties.yAxis}">
              <h4>{{ q1A.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              Driving Equality came into effect on March 3, 2022. In the year after<Tooltip term="Year after"/> Driving Equality,
              <span v-html="q1A.text[0]" class="result-text"></span>
              compared to 2021 (see <a href="/driving-equality#10" class="text-hyperlink-blue" target="_blank">What is Driving Equality?</a> to learn more about these date comparisons). However, in 2023, most traffic stops by the Philadelphia police still did not happen on the HIN.
            </AnswerText>
            <LeafletMap2 :geo-aggregation="q1CGeoAggregation" hin-legend="true">
              <h4>Random Sample of 1,000 PPD Traffic Stops in 2023 Mapped on HIN Roads</h4>
            </LeafletMap2>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <h2 id="part1" class="text-heading-3 text-left mb-6">Do changes in traffic stops over time relate to changes in shootings?</h2>
          <QuestionHeader>
            <h3>During a surge in traffic stops from 2018 to 2019, which districts had the largest increase in traffic stops? Were these the same districts that had the largest decrease in shootings?</h3>
          </QuestionHeader>
          <Answer v-if="q2" :arrow="true">
            <LeafletMap2 :geo-aggregation="q2AGeoAggregation" map-legend="true">
              <h4>Comparing 2018 to 2019: Districts with Largest Increase in Traffic Stops vs. Districts with Largest Decrease in Shootings</h4>
            </LeafletMap2>
          </Answer>
          <QuestionHeader>
            <h3>Comparing the year before Driving Equality to the year after the law was implemented, which districts had the largest increase in traffic stops? Were these the same districts that had the largest decrease in shootings?</h3>
          </QuestionHeader>
          <Answer v-if="q2" :arrow="true">
            <LeafletMap2 :geo-aggregation="q2BGeoAggregation" map-legend="true">
              <h4>Before and After Driving Equality: Districts with Largest Increase in Traffic Stops vs. Districts with Largest Decrease in Shootings</h4>
            </LeafletMap2>
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

const config = useRuntimeConfig()

const selectedLocation = ref('Philadelphia')
const selectedTimeGranularity = ref('year')
const q1BDemographicCategory = ref('race')
const q1BQuarterStart = ref(new Quarter(2023, QuarterMonths['Jan-Mar']))
const q1BQuarterEnd = ref(new Quarter(2023, QuarterMonths['Oct-Dec']))
const q3AEvent = ref('traffic stops')
const selectedDistricts = ref(['District 25', 'District 05'])

const q1AParams = ref([selectedLocation, selectedTimeGranularity])
const { data: q1A, refresh: refreshQ1A } = await useAsyncData('q1A',
  () => $fetch(`${config.public.apiBaseUrl}/safety/safety-num-accidents`, {
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
  () => $fetch(`${config.public.apiBaseUrl}/safety/safety-by-demographic-category`, {
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
  () => $fetch(`${config.public.apiBaseUrl}/safety/safety-hin-map`, {
    options
  })
)
const q1CGeoAggregation = computed(() => {
  const reversedData = q1C.value.geojson.features.reverse()
  const data = {
    type: "FeatureCollection",
    features: reversedData
  }
  return {
    data,
    legendSelectedTextFunction: (obj) => obj.street_name,
    tooltipFunction: (obj) => obj.street_name,
  }
})

const { data: q2, refresh: refreshQ2 } = await useAsyncData('q2',
  () => $fetch(`${config.public.apiBaseUrl}/safety/safety-shootings-vs-stops-maps`, {
    options
  })
)
console.log(q2.value)
const q2AGeoAggregation = computed(() => {
  return {
    data: {
      features: q2.value.geojson.features.slice(0, 10),
      type: "FeatureCollection"
    },
    legendSelectedTextFunction: (obj) => obj.DIST_NUM,
    tooltipFunction: (obj) => obj.hovertext,
  }
})
const q2BGeoAggregation = computed(() => {
  return {
    data: {
      features: q2.value.geojson.features.slice(10),
      type: "FeatureCollection"
    },
    legendSelectedTextFunction: (obj) => obj.DIST_NUM,
    tooltipFunction: (obj) => obj.hovertext,
  }
})
</script>
<template>
  <LayoutPageHeader>
    <template #header>
      Snapshot of traffic enforcement in Philadelphia
    </template>
    <template #image>
      <img class="w-full h-full object-cover" src="~/assets/images/snapshot.jpg" alt="Closeup of police lights at night"/>
    </template>
    <template #quote>
      <Quote author="Elder Melanie DuBouse" source="https://soundcloud.com/speakingfreelyaclupa/a-state-of-perpetual-alert-living-while-black-in-philadelphia" backgroundClass="bg-[#CCF1FF]" quoteMarkClass="fill-highlight" bold-color-class="text-[#00B8FF]">
        <template #quoteText>
          <p>
            We, as Black and brown people, are witnesses to the racism every day in the Philadelphia Police Department and the city and the country.
          </p>
        </template>
      </Quote>
    </template>
  </LayoutPageHeader>

  <main class="layout-container -mt-4 text-body-3">
    <div class="grid-container">
      <div class="col-span-10">
        <section>
          <QuestionHeader>
            <h3>How many traffic stops<Tooltip term="Traffic Stop"/> did Philadelphia police make in the last year?</h3>
          </QuestionHeader>
          <Answer v-if="q1A" :arrow="true">
            <AnswerText>
              <div v-html="q1A.text[0]" class="result-text"></div>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <QuestionHeader>
            <h3>What are the racial disparities<Tooltip term="Disparity"/> in traffic stops by Philadelphia police? How does the city population compare to who is stopped?</h3>
          </QuestionHeader>
          <Answer v-if="q1A" :arrow="true">
            <Graph :graph-data="q1A.figures.barplot.data" :axis-properties="{x: q1A.figures.barplot.properties.xAxis, y: q1A.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'Percent of traffic stops': 'fill-primary-600', 'Percent of population': 'fill-red'}">
              <h4>{{ q1A.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <div v-html="q1A.text.slice(3,4).join(' ')" class="result-text"></div>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <QuestionHeader>
            <h3>How did traffic stops change after Driving Equality?</h3>
          </QuestionHeader>
          <Answer v-if="q1A" :arrow="true">
            <AnswerText>
              <div v-html="q1A.text.slice(1, 2).join(' ')" class="result-text"></div>
            </AnswerText>
            [Graph]
            <AnswerText>
              <div v-html="q1A.text.slice(2, 3).join(' ')" class="result-text"></div>
            </AnswerText>
            [Graph]
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

const selectedLocation = ref('Philadelphia')
const selectedTimeGranularity = ref('year')
const q2ADemographicCategory = ref('Race')
const q2AQuarterStart = ref(new Quarter(2023, QuarterMonths['Jan-Mar']))
const q2AQuarterEnd = ref(new Quarter(2023, QuarterMonths['Oct-Dec']))
const q2ARace = ref('White')
const q2AGender = ref('Male')
const q2AAgeGroup = ref('<25')
const q3AEvent = ref('traffic stops')
const selectedDistricts = ref(['District 25', 'District 05'])

const q1AParams = ref([selectedLocation, selectedTimeGranularity])
const { data: q1A, refresh: refreshQ1A } = await useAsyncData('q1A',
  () => $fetch(`${apiBaseUrl}/snapshot/annual-summary`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      time_aggregation: selectedTimeGranularity.value,
    },
    options
  })
)
watch(q1AParams, async () => { refreshQ1A() }, { deep: true })

console.log(q1A.value)
</script>
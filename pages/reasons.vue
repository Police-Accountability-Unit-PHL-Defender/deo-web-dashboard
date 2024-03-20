<template>
  <LayoutPageHeader>
    <template #header>
      Do police make traffic stops for safety reasons?
    </template>
    <template #image>
      <img class="w-full h-full object-cover object-bottom" src="~/assets/images/reasons.jpg" alt="A street in Philadelphia"/>
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
  <main class="layout-container -mt-4 text-body-3">
    <div class="grid-container">
      <div class="col-span-10">
        <section>
          <QuestionHeader>
            <h3>When Philadelphia police provided a reason, what were the primary reasons why police stopped Black and white drivers in Philadelphia in <SelectYear v-model="q1Year"/> sorted by <SelectRace v-model="q1Race"/>?</h3>
          </QuestionHeader>
          <Answer v-if="q1" :arrow="true">
            <Graph :graph-data="q1.figures.barplot.data" :axis-properties="{x: q1.figures.barplot.properties.xAxis, y: q1.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'Black': 'fill-primary-600', 'White': 'fill-red'}" :chart-legend="['Black drivers', 'White drivers']">
              <h4>{{ q1.figures.barplot.properties.title }}</h4>
            </Graph>
          </Answer>
        </section>
        <section>
          <QuestionHeader>
            <h3>When Philadelphia police provided a reason, what were the primary reasons why police stopped White and Non-white neighborhoods in Philadelphia in <SelectYear v-model="q1Year"/> sorted by <SelectRace v-model="q1Race"/>?</h3>
          </QuestionHeader>
          <Answer v-if="q2" :arrow="true">
            <Graph :graph-data="q2.figures.barplot.data" :axis-properties="{x: q2.figures.barplot.properties.xAxis, y: q2.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'Black': 'fill-primary-600', 'White': 'fill-red'}" :chart-legend="['Black drivers', 'White drivers']">
              <h4>{{ q2.figures.barplot.properties.title }}</h4>
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
import Tooltip from '~/components/ui/Tooltip.vue';

const config = useRuntimeConfig()

// const selectedLocation = ref('Philadelphia')
const q1Year = ref(2023)
const q1Race = ref('Black')

const q1Params = ref([q1Year, q1Race])
const { data: q1, refresh: refreshQ1 } = await useAsyncData('q1',
  () => $fetch(`${config.public.apiBaseUrl}/reasons/reasons-comparison-bar-drivers`, {
    params: {
      year: q1Year.value,
      race: q1Race.value,
    },
    options
  })
)
watch(q1Params, async () => { refreshQ1() }, { deep: true })
console.log(q1.value)

const q2Params = ref([q1Year, q1Race])
const { data: q2, refresh: refreshQ2 } = await useAsyncData('q2',
  () => $fetch(`${config.public.apiBaseUrl}/reasons/reasons-comparison-bar-neighborhoods`, {
    params: {
      year: q1Year.value,
      race: q1Race.value,
    },
    options
  })
)
watch(q2Params, async () => { refreshQ1() }, { deep: true })
console.log(q2.value)
</script>
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

console.log(q1A.value)
console.log(q1B.value)
</script>
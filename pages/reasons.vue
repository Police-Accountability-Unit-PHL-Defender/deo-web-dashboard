<template>
  <LayoutPageHeader>
    <template #header>
      What reasons do police give for making traffic stops?
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
  <main class="layout-container mt-8 md:-mt-4 text-body-3">
    <div class="grid-container">
      <div class="col-span-10">
        <nav class="flex flex-col gap-3 border-b border-neutral-400 pb-10">
          <h2 class="text-label-1">Jump to:</h2>
          <ul class="flex flex-col gap-3">
            <li>
              <a href="#part1" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                Do the reasons police stop drivers differ by race or neighborhood?
              </a>
            </li>
            <li>
              <a href="#part2" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                How has Driving Equality impacted traffic stops?
              </a>
            </li>
          </ul>
        </nav>
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-10 mb-6">Do the reasons police stop drivers differ by race or neighborhood?</h2>
          <QuestionHeader>
            <h3>Do Philadelphia police stop Black and white drivers for different reasons? When Philadelphia police gave a reason, what were the primary reasons why police stopped <SelectWhiteBlackDriver v-model="q1Race" /> in Philadelphia in <span class="whitespace-nowrap"><SelectYear v-model="q1Year"/>?</span></h3>
          </QuestionHeader>
          <Answer v-if="q1" :arrow="true">
            <Graph :graph-data="q1.figures.barplot.data" :axis-properties="{x: q1.figures.barplot.properties.xAxis, y: q1.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'Black': 'fill-purple', 'White': 'fill-mint'}" :chart-legend="['Black drivers', 'White drivers']">
              <h4>{{ q1.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <p class="text-body-4">
                Police officers often did not give an MVC<Tooltip term="MVC"/> reason for their traffic stops<Tooltip term="Traffic Stop"/> in 2022 and 2023. Furthermore, the Defender’s review of a separate dataset found that police routinely miscoded MVC stops for tint, mistakenly omitting the MVC reason for a large but unknown number of those stops, skewing the tint stops numbers down dramatically.
              </p>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-12"/>
        <section>
          <QuestionHeader>
            <h3>Do Philadelphia police make traffic stops<Tooltip term="Traffic Stop" /> for different reasons in districts<Tooltip term="District" /> where most residents are white, compared to districts where most residents are people of color? When Philadelphia police gave a reason, what were the primary reasons why police stopped drivers in majority <SelectWhiteMajorityNeighborhood v-model="selectedNeighborhoodMajority"/> in Philadelphia in <span class="whitespace-nowrap"><SelectYear v-model="q1Year"/>?</span></h3>
          </QuestionHeader>
          <Answer v-if="q2" :arrow="true">
            <Graph :graph-data="q2.figures.barplot.data" :axis-properties="{x: q2.figures.barplot.properties.xAxis, y: q2.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'Black': 'fill-purple', 'White': 'fill-mint'}" :chart-legend="['Black drivers', 'White drivers']">
              <h4>{{ q2.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <p class="text-body-4">
                As previously noted above, police officers often did not give an MVC reason for their stops in 2022 and 2023.  Furthermore, the Defender’s review of a separate dataset  found that police routinely miscoded MVC stops for tint, mistakenly omitting the MVC reason for a large but unknown number of those stops, skewing the tint stops numbers down dramatically.
              </p>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-12"/>
        <section>
          <h2 id="part2" class="text-heading-3 text-left pt-10 mb-6">How has Driving Equality impacted traffic stops?</h2>
          <QuestionHeader>
            <h3>Driving Equality came into effect on March 3, 2022. After Driving Equality, how many traffic stops did Philadelphia police make for the 8 reasons covered by the law? Show primary reasons for traffic stops by <span class="whitespace-nowrap"><SelectTimeGranularity v-model="selectedTimeGranularity"/>.</span></h3>
          </QuestionHeader>
          <Answer v-if="q3" :arrow="true">
            <Graph :graph-data="q3.figures.barplot.data" :axis-properties="{x: q3.figures.barplot.properties.xAxis, y: q3.figures.barplot.properties.yAxis}" stack-name="group" :quarterlyXAxisTicks="true">
              <h4>{{ q3.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <p class="text-body-4">
                See <a href="driving-equality#7" class="text-hyperlink-blue" target="_bla">What is Driving Equality?</a> to learn about the 8 reasons covered by the law. Importantly, Philadelphia police can still stop drivers for registration and lighting violations that are <u>not</u> covered by Driving Equality. For example, Philadelphia police can stop drivers for having all lights out, but police cannot stop drivers for a single broken bulb or light.</p>
            </AnswerText>
          </Answer>
        </section>
        <HorizontalLine class="my-12"/>
        <section>
          <QuestionHeader>
            <h3>How often do Philadelphia police stop drivers for operational<Tooltip term="Operational"/> violations? Are there racial disparities<Tooltip term="Disparity"/> in these traffic stops? When Philadelphia police gave a reason, how often did police stop people of different races for operational violations in <span class="whitespace-nowrap"><SelectYear v-model="q1Year"/>?</span></h3>
          </QuestionHeader>
          <Answer v-if="q4" :arrow="true">
            <Graph :graph-data="q4.figures.barplot.data" :axis-properties="{x: q4.figures.barplot.properties.xAxis, y: q4.figures.barplot.properties.yAxis}">
              <h4>{{ q4.figures.barplot.properties.title }}</h4>
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
const selectedNeighborhoodMajority = ref('Non-white')
const selectedTimeGranularity = ref('quarter')
const q1Year = ref(2022)
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
      race: "Non-white",
    },
    options
  })
)
watch(q2Params, async () => { refreshQ2() }, { deep: true })
console.log(q2.value)

const q3Params = ref([selectedTimeGranularity])
const { data: q3, refresh: refreshQ3 } = await useAsyncData('q3',
  () => $fetch(`${config.public.apiBaseUrl}/reasons/reasons-deo-impacts`, {
    params: {
      time_aggregation: selectedTimeGranularity.value,
    },
    options
  })
)
watch(q3Params, async () => { refreshQ3() }, { deep: true })
console.log(q3.value)

const q4Params = ref([q1Year])
const { data: q4, refresh: refreshQ4 } = await useAsyncData('q4',
  () => $fetch(`${config.public.apiBaseUrl}/reasons/reasons-operational`, {
    params: {
      year: q1Year.value,
    },
    options
  })
)
watch(q4Params, async () => { refreshQ4() }, { deep: true })
console.log(q4.value)
</script>
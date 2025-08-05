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
          <Answer>
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

useHead({
  title: 'How many stops do police make, and who do they stop?',
})

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

const q1AParams = ref([selectedLocation, selectedTimeGranularity])
const { data: q1A, refresh: refreshQ1A } = await useAsyncData('q1A',
  () => $fetch(`${config.public.apiBaseUrl}/stops/num-stops`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      time_aggregation: selectedTimeGranularity.value,
    },
    options
  })
)
watch(q1AParams, async () => { refreshQ1A() }, { deep: true })

const q1BParams = ref([selectedLocation, q1BQuarterStart, q1BQuarterEnd])
const { data: q1B, refresh: refreshQ1B } = await useAsyncData('q1B',
  () => $fetch(`${config.public.apiBaseUrl}/stops/num-stops-time-slice`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      start_qyear: q1BQuarterStart.value.toParamString(),
      end_qyear: q1BQuarterEnd.value.toParamString(),
    },
    options
  })
)
watch(q1BParams, async () => { refreshQ1B() }, { deep: true })

const q1CParams = ref([selectedLocation, q1CQuarters])
const { data: q1C, refresh: refreshQ1C } = await useAsyncData('q1C',
  () => $fetch(`${config.public.apiBaseUrl}/stops/seasonal`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      q_over_year_select: q1CQuarters.value.map(q => getQuarterParam(q)),
    },
    options
  })
)
watch(q1CParams, async () => { refreshQ1C() }, { deep: true })

const q2AParams = ref([selectedLocation, q1BQuarterStart, q1BQuarterEnd, q2ADemographicCategory])
const { data: q2A, refresh: refreshQ2A } = await useAsyncData('q2A',
  () => $fetch(`${config.public.apiBaseUrl}/stops/by-demographic-category`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      start_qyear: q1BQuarterStart.value.toParamString(),
      end_qyear: q1BQuarterEnd.value.toParamString(),
      demographic_category: getDemographicGroupParam(q2ADemographicCategory.value),
    },
    options
  })
)
watch(q2AParams, async () => { refreshQ2A() }, { deep: true })

const q2BParams = ref([selectedLocation, q1BQuarterStart, q1BQuarterEnd])
const { data: q2B, refresh: refreshQ2B } = await useAsyncData('q2B',
  () => $fetch(`${config.public.apiBaseUrl}/stops/most-frequent-stops`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      start_qyear: q1BQuarterStart.value.toParamString(),
      end_qyear: q1BQuarterEnd.value.toParamString(),
    },
    options
  })
)
watch(q2BParams, async () => { refreshQ2B() }, { deep: true })

const q2CParams = ref([selectedLocation, q1BQuarterStart, q1BQuarterEnd, q2CGroup1AgeRange, q2CGroup2AgeRange, q2CGroup1Gender, q2CGroup2Gender, q2CGroup1Race, q2CGroup2Race])
const { data: q2C, refresh: refreshQ2C } = await useAsyncData('q2C',
  () => $fetch(`${config.public.apiBaseUrl}/stops/group-comparison`, {
    params: {
      age_group1: q2CGroup1AgeRange.value,
      gender_group1: q2CGroup1Gender.value,
      racial_group1: q2CGroup1Race.value,
      age_group2: q2CGroup2AgeRange.value,
      gender_group2: q2CGroup2Gender.value,
      racial_group2: q2CGroup2Race.value,
      location: getLocationParam(selectedLocation.value),
      start_qyear: q1BQuarterStart.value.toParamString(),
      end_qyear: q1BQuarterEnd.value.toParamString(),
    },
    options
  })
)
watch(q2CParams, async () => { refreshQ2C() }, { deep: true })
</script>

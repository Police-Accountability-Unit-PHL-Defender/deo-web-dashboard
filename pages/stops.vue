<template>
  <LayoutPageHeader>
    <template #header>
      How many stops do police make, and who do they stop?
    </template>
    <template #image>
      <img class="w-full h-full object-cover object-[0%_20%]" src="~/assets/images/stops.jpg" alt="Closeup of police lights at night"/>
    </template>
    <template #quote>
      <Quote author="Pastor Carl Day" source="https://www.facebook.com/CMThomasPHL/videos/578497320999248">
        <template #quoteText>
          <p>
            As a Black man, you’re just awaiting that moment. You’ll sit in the car and you’re just waiting for that time for the red and blue lights to come on.
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
                How many stops do police make?
              </a>
            </li>
            <li>
              <a href="#part2" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-white -rotate-90"/>
                Who are police stopping in traffic stops?
              </a>
            </li>
          </ul>
        </nav>
    
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-10 mb-6">How many stops do police make?</h2>
          <QuestionHeader>
            <h3>How many traffic stops<Tooltip term="Traffic Stop"/> did Philadelphia police make in <SelectLocation v-model="selectedLocation"/>, by <SelectTimeGranularity v-model="selectedTimeGranularity"/> ?</h3>
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
            <h3>
              In <SelectLocation v-model="selectedLocation"/>, from the start of <SelectQuarter2 v-model="q1BQuarterStart" item-label-end="start" /> through the end of <SelectQuarter2 v-model="q1BQuarterEnd" item-label-end="end"/>,
              <span v-if="q1B" class="result-text" v-html="q1B.text[0]"></span>
            </h3>
          </QuestionHeader>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <QuestionHeader>
            <h3>Does traffic enforcement change depending on the time of year? How many traffic stops do Philadelphia police make in certain times of year in <SelectLocation v-model="selectedLocation"/>?</h3>
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
        <HorizontalLine class="mt-16"/>
        <section>
          <h2 id="part2" class="text-heading-3 text-left pt-10 mb-6">Who are police stopping in traffic stops?</h2>
          <QuestionHeader>
            How often did Philadelphia police stop people of different <SelectDemographicCategory v-model="q2ADemographicCategory" :is-plural="true" /> from the start of <SelectQuarter2 v-model="q1BQuarterStart" item-label-end="start"/> through the end of <SelectQuarter2 v-model="q1BQuarterEnd" item-label-end="end"/>, in <SelectLocation v-model="selectedLocation"/>?
          </QuestionHeader>
          <Answer>
            <div v-if="q2A">
              <Graph :graph-data="q2A.figures.barplot.data" :axis-properties="{x: q2A.figures.barplot.properties.xAxis, y: q2A.figures.barplot.properties.yAxis}">
                <h4 class="max-w-[550px] mx-auto">{{ q2A.figures.barplot.properties.title }}</h4>
              </Graph>
            </div>
          </Answer>
        </section>
        <HorizontalLine class="my-16"/>
        <section>
          <QuestionHeader>
            <h3>Which demographic groups did Philadelphia police most frequently stop in <SelectLocation v-model="selectedLocation"/> from the start of <SelectQuarter2 v-model="q1BQuarterStart" item-label-end="start"/> through the end of <SelectQuarter2 v-model="q1BQuarterEnd" item-label-end="end"/>?</h3>
          </QuestionHeader>
          <Answer :arrow="true">
            <div v-if="q2B">
              <QuestionHeader>
                <div v-html="q2B.text[1]" class="result-text"></div>
              </QuestionHeader>
              <div class="border border-neutral-400 pt-6">
                <h4 class="text-center text-body-2 font-semibold text-primary-800">{{ q2B.text[0] }}</h4>
                <div class="deo-table mt-6 text-body-3">
                  <div class="relative w-full">
                    <table class="w-full">
                      <thead class="w-full">
                        <tr>
                          <th class="w-1/4 font-medium">Gender</th>
                          <th class="w-1/4 font-medium">Age Range</th>
                          <th class="w-1/4 font-medium">Race</th>
                          <th class="w-1/4 font-medium">% of Stops</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div class="w-full border-b border-neutral-400" :class="{'h-[400px] overflow-y-scroll': isTableShowingAll}, 'h-[280px] overflow-y-hidden'">
                    <table class="text-body-3 relative w-full">
                      <tbody class="w-full">
                        <tr v-for="row in q2B.tables.demo">
                          <td class="w-1/4">{{ row['gender'] }}</td>
                          <td class="w-1/4">{{ row['age range'] }}</td>
                          <td class="w-1/4">{{ row['race'] }}</td>
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
        <HorizontalLine class="my-16"/>
        <section>
          <QuestionHeader>
            How many times did Philadelphia police stop one demographic group compared to another in <SelectLocation v-model="selectedLocation"/> from the start of <SelectQuarter2 v-model="q1BQuarterStart" item-label-end="start"/> through the end of <SelectQuarter2 v-model="q1BQuarterEnd" item-label-end="end"/>?
          </QuestionHeader>
          <div class="max-w-2xl mt-10 mb-6">
            <div class="text-label-2 text-left">Select two demographic groups and compare</div>
            <div class="grid grid-cols-2 gap-4 mt-6">
              <div class="col-span-1 flex flex-col gap-4 text-body-3 font-medium">
                <h4 class="text-body-3 font-medium flex gap-2 items-center">
                  Group 1
                  <div class="demographic-group-square bg-primary-600"></div>
                </h4>
                <SelectAgeGroups v-model="q2CGroup1AgeRanges"/>
                <SelectGenders v-model="q2CGroup1Genders"/>
                <SelectRaces v-model="q2CGroup1Races"/>
              </div>
              <div class="col-span-1 flex flex-col gap-4 text-body-3 font-medium">
                <h4 class="text-body-3 font-medium flex gap-2 items-center">
                  Group 2
                  <div class="demographic-group-square bg-red"></div>
                </h4>
                <SelectAgeGroups v-model="q2CGroup2AgeRanges"/>
                <SelectGenders v-model="q2CGroup2Genders"/>
                <SelectRaces v-model="q2CGroup2Races"/>
              </div>
            </div>
          </div>
          <Answer>
            <div v-if="q2C">
              <Graph :graph-data="q2C.figures.barplot.data" :axis-properties="{x: q2C.figures.barplot.properties.xAxis, y: q2C.figures.barplot.properties.yAxis}" group-name="group" :group-classes="{'Group 1': 'fill-primary-600', 'Group 2': 'fill-red'}">
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
import QuestionHeader from '~/components/QuestionHeader.vue';
import Graph from '~/components/Graph.vue';
import SelectLocation from '~/components/SelectLocation.vue'
import SelectTimeGranularity from '~/components/SelectTimeGranularity.vue'
import HorizontalLine from '~/components/ui/HorizontalLine.vue';
import Button from '~/components/ui/Button.vue';
import Tooltip from '~/components/ui/Tooltip.vue';

const selectedLocation = ref('Philadelphia')
const selectedTimeGranularity = ref('year')
const q1BQuarterStart = ref(new Quarter(2023, QuarterMonths['Jan-Mar']))
const q1BQuarterEnd = ref(new Quarter(2023, QuarterMonths['Oct-Dec']))
const q1CQuarters = ref(['Jan-Mar'])
const q2ADemographicCategory = ref('race')
const q2CGroup1AgeRanges = ref(['25-34'])
const q2CGroup2AgeRanges = ref(['25-34'])
const q2CGroup1Genders = ref(['Male'])
const q2CGroup2Genders = ref(['Male'])
const q2CGroup1Races = ref(['Black'])
const q2CGroup2Races = ref(['White'])

const isTableShowingAll = ref(false)

const q1AParams = ref([selectedLocation, selectedTimeGranularity])
const { data: q1A, refresh: refreshQ1A } = await useAsyncData('q1A',
  () => $fetch(`${apiBaseUrl}/stops/num-stops`, {
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
  () => $fetch(`${apiBaseUrl}/stops/num-stops-time-slice`, {
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
  () => $fetch(`${apiBaseUrl}/stops/seasonal`, {
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
  () => $fetch(`${apiBaseUrl}/stops/by-demographic-category`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      start_qyear: q1BQuarterStart.value.toParamString(),
      end_qyear: q1BQuarterEnd.value.toParamString(),
      demographic_category: q2ADemographicCategory.value,
    },
    options
  })
)
watch(q2AParams, async () => { refreshQ2A() }, { deep: true })

const q2BParams = ref([selectedLocation, q1BQuarterStart, q1BQuarterEnd])
const { data: q2B, refresh: refreshQ2B } = await useAsyncData('q2B',
  () => $fetch(`${apiBaseUrl}/stops/most-frequent-stops`, {
    params: {
      location: getLocationParam(selectedLocation.value),
      start_qyear: q1BQuarterStart.value.toParamString(),
      end_qyear: q1BQuarterEnd.value.toParamString(),
    },
    options
  })
)
watch(q2BParams, async () => { refreshQ2B() }, { deep: true })

const q2CParams = ref([selectedLocation, q1BQuarterStart, q1BQuarterEnd, q2CGroup1AgeRanges, q2CGroup2AgeRanges, q2CGroup1Genders, q2CGroup2Genders, q2CGroup1Races, q2CGroup2Races])
const { data: q2C, refresh: refreshQ2C } = await useAsyncData('q2C',
  () => $fetch(`${apiBaseUrl}/stops/group-comparison`, {
    params: {
      age_group1: q2CGroup1AgeRanges.value,
      gender_group1: q2CGroup1Genders.value,
      racial_group1: q2CGroup1Races.value,
      age_group2: q2CGroup2AgeRanges.value,
      gender_group2: q2CGroup2Genders.value,
      racial_group2: q2CGroup2Races.value,
      location: getLocationParam(selectedLocation.value),
      start_qyear: q1BQuarterStart.value.toParamString(),
      end_qyear: q1BQuarterEnd.value.toParamString(),
    },
    options
  })
)
watch(q2CParams, async () => { refreshQ2C() }, { deep: true })
</script>
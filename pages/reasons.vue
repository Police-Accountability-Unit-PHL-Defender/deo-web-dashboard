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
            <h3>When a reason was given, what is the racial breakdown for why police say they stopped people stopped in <SelectLocation v-model="selectedLocation"/> in <SelectYear v-model="q1AYear"/>?</h3>
          </QuestionHeader>
          <Answer v-if="q1A" :arrow="true">
            <Graph :graph-data="q1A.figures.barplot.data" :axis-properties="{x: q1A.figures.barplot.properties.xAxis, y: q1A.figures.barplot.properties.yAxis}">
              <h4>{{ q1A.figures.barplot.properties.title }}</h4>
            </Graph>
            <AnswerText>
              <span v-html="q1A.text[0]" class="result-text"></span>
            </AnswerText>
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

const selectedLocation = ref('Philadelphia')
const q1AYear = ref(2023)
// const selectedTimeGranularity = ref('year')
// const q1BDemographicCategory = ref('race')
// const q1BQuarterStart = ref(new Quarter(2023, QuarterMonths['Jan-Mar']))
// const q1BQuarterEnd = ref(new Quarter(2023, QuarterMonths['Oct-Dec']))
// const q3AEvent = ref('traffic stops')
// const selectedDistricts = ref(['District 25', 'District 05'])
</script>
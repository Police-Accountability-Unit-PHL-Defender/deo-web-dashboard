<template>
  <LayoutPageHeader>
    <template #header>
      Are young Black men traveling together targeted for traffic stops?
    </template>
    <template #image>
      <img class="w-full h-full object-cover object-center" src="~/assets/images/stops.jpg" alt="A street in Philadelphia at dusk"/>
      <div class="absolute inset-0 z-[1] bg-black opacity-60"></div>
    </template>
    <template #quote>
      <Quote author="Professor Lance Hannon" source="http://www88.homepage.villanova.edu/lance.hannon/TestimonyBills210635and210636Draft.pdf" backgroundClass="bg-[#E9D1F7]" quoteMarkClass="fill-violet" bold-color-class="text-violet" alignment="center">
        <template #quoteText>
          <p>
            I look forward to the day that I will see Philadelphia featured not as an example where numerous statistical tests all point to racial bias in policing practices, but rather as a national leader in evidence-based justice reform.
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
                How the veil-of-darkness test works
              </a>
            </li>
            <li>
              <a href="#part2" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                Who gets stopped, and who is traveling together?
              </a>
            </li>
            <li>
              <a href="#part3" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                What happens during the stop?
              </a>
            </li>
            <li>
              <a href="#part4" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                The veil of darkness itself
              </a>
            </li>
            <li>
              <a href="#part5" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                Model results
              </a>
            </li>
            <li>
              <a href="#part6" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                What this analysis cannot tell us
              </a>
            </li>
          </ul>
        </nav>

        <!-- ================= Intro ================= -->
        <section>
          <h2 id="part1" class="text-heading-3 text-left pt-10 mb-6">How the veil-of-darkness test works</h2>
          <AnswerText>
            <p class="text-body-4">
              In daylight, an officer can see who is in a car before deciding whether to pull it over. After dark, that
              is much harder: the officer can see headlights and a shape, but usually not the number, age, race or
              gender of the people inside. People's travel habits, by contrast, barely change at dusk &mdash; the same
              commute at 7:15pm looks the same in June and in December. What changes at dusk is what an officer can
              see.
            </p>
            <!-- Tooltip renders a <div>, which the HTML parser would hoist out of a <p>. -->
            <div class="text-body-4 mt-6">
              That difference is the test. If we compare traffic stops<Tooltip term="Traffic Stop"/> made just before
              nightfall with stops made just after nightfall at the same time of day, then the main thing that has
              changed is visibility. If the kinds of people police stop shift when the light goes, it is difficult to
              explain that shift by anything other than what officers could see. This design is known as the
              &ldquo;veil of darkness&rdquo;. The Model 2 specification below goes further and also holds the location
              of the stop constant.
            </div>
            <p class="text-body-4 mt-6">
              This page reproduces an analysis by Lance Hannon and Molly Biddle of Villanova University, published in
              2026 (<a href="https://doi.org/10.21428/cb6ab371.f1d81a4b" class="text-hyperlink-blue" target="_blank">doi.org/10.21428/cb6ab371.f1d81a4b</a>),
              using Philadelphia's own published traffic stop data for 2021 through 2024. Every figure below is drawn
              from that four-year window and from the evening hours the authors studied. Our sample counts land within
              about 5% of the published figures, and our Model 1
              coefficients<template v-if="model1MaxDelta !== null"> within
              {{ model1MaxDelta.toFixed(3) }} of theirs</template><template v-else> closely track
              theirs</template>, on a data snapshot roughly two years newer than the one the authors used.
            </p>
          </AnswerText>
        </section>

        <HorizontalLine class="my-12" :color="true"/>

        <!-- ================= Chart 1: motorists by race ================= -->
        <section>
          <h2 id="part2" class="text-heading-3 text-left mb-6">Who gets stopped, and who is traveling together?</h2>
          <QuestionHeader>
            <h3>How many young male motorists did Philadelphia police stop during the evening hours, by race?</h3>
          </QuestionHeader>
          <Answer v-if="chart1" :arrow="true">
            <Graph
              :graph-data="chart1.data"
              :axis-properties="{x: chart1.xAxis, y: chart1.yAxis}"
              bar-annotation-property="annotation"
              :minimum-container-width="640">
              <h4>{{ chart1.title }}</h4>
              <template #footer>
                <!-- Tooltip renders a <div>, which the HTML parser would hoist out of a <p>. -->
                <div class="text-caption text-neutral-800 pt-4 px-4 max-w-[720px] mx-auto">
                  Young male motorists (ages 18&ndash;29) stopped for a motor vehicle code<Tooltip term="MVC"/>
                  violation between 5:08pm and 8:35pm, 2021&ndash;2024. Counted per motorist.
                </div>
              </template>
            </Graph>
            <AnswerText>
              <p class="text-body-4">
                This gap on its own is not evidence of bias. Police decide where to deploy officers, and those decisions
                are driven largely by where crime is believed to be concentrated rather than by where traffic risk is
                highest. Sending more officers into some neighborhoods than others produces more stops of the people who
                live and drive in those neighborhoods, whatever each individual officer does. That mechanism &mdash;
                sometimes called neighborhood profiling &mdash; plausibly explains much of the difference above. The
                central results on this page are not cross-race comparisons at all: the frisk and ticket chart, the
                veil-of-darkness chart, and the headline model row all compare young Black men with young Black men,
                which removes the part of this problem that comes from Black and white motorists being stopped in
                different neighborhoods. The next chart and one model row do still compare across races, and are
                labelled where they appear. Only the Model 2 specification below controls for location directly.
              </p>
            </AnswerText>
          </Answer>
        </section>

        <HorizontalLine class="my-4 md:my-12"/>

        <!-- ================= Chart 2: group travel share ================= -->
        <section>
          <QuestionHeader>
            <h3>Of the young male motorists police stopped, how many were traveling in a car with more than one person in it?</h3>
          </QuestionHeader>
          <Answer v-if="chart2" :arrow="true">
            <Graph
              :graph-data="chart2.data"
              :axis-properties="{x: chart2.xAxis, y: chart2.yAxis}"
              bar-annotation-property="annotation"
              :minimum-container-width="640">
              <h4>{{ chart2.title }}</h4>
              <template #footer>
                <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[720px] mx-auto">
                  Share of stopped young male motorists (ages 18&ndash;29) who were in a car carrying more than one
                  person, 2021&ndash;2024, 5:08pm&ndash;8:35pm. Counted <strong>per motorist</strong>: the denominator is
                  people stopped, not stops. Counted per stop instead, both shares are materially lower, because a
                  multi-occupant stop contributes several motorists but only one stop.
                </p>
              </template>
            </Graph>
            <AnswerText>
              <p class="text-body-4">
                The obvious innocent explanation is that Black and white Philadelphians simply travel together at
                different rates. The paper's authors checked that against American Community Survey commuting data,
                which puts carpooling at roughly 14% for both Black and white Philadelphians. Different travel habits do
                not account for the difference above.
              </p>
              <p class="text-body-4 mt-6">
                This chart, like the one before it, is a comparison <em>across</em> races, and so carries the
                neighborhood-profiling caveat above. Everything from here on compares young Black men with young Black
                men, with one clearly marked exception in the model table.
              </p>
            </AnswerText>
          </Answer>
        </section>

        <HorizontalLine class="my-12" :color="true"/>

        <!-- ================= Chart 3: frisks and tickets ================= -->
        <section>
          <h2 id="part3" class="text-heading-3 text-left mb-6">What happens during the stop?</h2>
          <QuestionHeader>
            <h3>When police stop a young Black man, how often do they frisk<Tooltip term="Frisk"/> him, and how often do they ticket him &mdash; alone, compared with traveling with another young Black man?</h3>
          </QuestionHeader>
          <Answer v-if="chart3" :arrow="true">
            <Graph
              :graph-data="chart3.data"
              :axis-properties="{x: chart3.xAxis, y: chart3.yAxis}"
              group-name="group"
              :group-classes="{'Traveling alone': 'fill-mint bg-mint', 'Traveling with another young Black man': 'fill-purple bg-purple'}"
              :chart-legend="{'Traveling alone': 'Traveling alone', 'Traveling with another young Black man': 'Traveling with another young Black man'}"
              :minimum-container-width="640">
              <h4>{{ chart3.title }}</h4>
              <template #footer>
                <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[720px] mx-auto">
                  Young Black male motorists (ages 18&ndash;29) stopped 2021&ndash;2024, 5:08pm&ndash;8:35pm. Counted
                  <strong>per occupant</strong>: the denominator is motorists stopped, not stops.
                </p>
              </template>
            </Graph>
            <AnswerText>
              <!-- Tooltip renders a <div>, which the HTML parser would hoist out of a <p>. -->
              <div class="text-body-4">
                This is the sharpest contrast on the page. Stops of young Black men traveling with another young Black
                man have nearly triple the frisk rate<Tooltip term="Frisk rate"/> of stops of young Black men traveling
                alone &mdash; {{ fmtPct(chart3.groupFrisk) }} against {{ fmtPct(chart3.soloFrisk) }} &mdash; while the
                ticket rate is <em>lower</em>, {{ fmtPct(chart3.groupTicket) }} against
                {{ fmtPct(chart3.soloTicket) }}. These are raw shares with no controls, so they describe an association
                rather than establishing a cause. But if these stops were about enforcing the motor vehicle code, it is
                hard to see why the ticket rate would fall when a second young Black man is in the car.
              </div>
            </AnswerText>
          </Answer>
        </section>

        <HorizontalLine class="my-12" :color="true"/>

        <!-- ================= Chart 4: the veil ================= -->
        <section>
          <h2 id="part4" class="text-heading-3 text-left mb-6">The veil of darkness itself</h2>
          <QuestionHeader>
            <h3>At each time of evening, how often were stops of young Black men stops of a car carrying more than one person &mdash; in daylight, and after dark?</h3>
          </QuestionHeader>
          <Answer v-if="chart4" :arrow="true">
            <Graph
              :graph-data="chart4.data"
              :axis-properties="{x: chart4.xAxis, y: chart4.yAxis}"
              group-name="group"
              :group-classes="{'Daylight': 'fill-yellow bg-yellow', 'After dark': 'fill-purple bg-purple'}"
              :chart-legend="{'Daylight': 'Daylight', 'After dark': 'After dark'}"
              :minimum-container-width="1080"
              :margin="{bottom: 90}">
              <h4>{{ chart4.title }}</h4>
              <template #footer>
                <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[860px] mx-auto">
                  Stops of young Black male motorists (ages 18&ndash;29), 2021&ndash;2024, in 15-minute clock-time bins.
                  Counted <strong>per stop</strong>: each stop counts once regardless of how many people were in the
                  car, which mirrors what the models below predict. {{ chart4.suppressedBars }} bars are not shown. The
                  sample window starts at 5:08pm and ends at 8:35pm, so the earliest dark bin and the latest daylight bin
                  are clipped and rest on very few stops &mdash; {{ chart4.suppressedSummary }}. Percentages built on that few stops
                  swing widely enough to stretch the chart's vertical scale and flatten the real differences, so any
                  clock time with fewer than {{ MIN_BIN_STOPS }} stops on either side of the veil is left out here.
                  Hover any bar for its own stop count. The models below use every stop, including the ones behind the
                  two omitted bins.
                </p>
              </template>
            </Graph>
            <AnswerText>
              <p class="text-body-4">
                Each pair of bars is a single time of evening &mdash; the same clock time, in daylight and in darkness.
                That is possible because sunset moves through the year: at 7:15pm it is light in June and dark in
                December. Commuting patterns at 7:15pm are much the same in both months; the light is not. The gap
                between the two bars at the same clock time is what the whole test rests on, and across the evening the
                daylight bars sit higher in {{ chart4.daylightHigherBins }} of the {{ chart4.shownBins }} bins shown.
                The models below test whether that pattern survives controls.
              </p>
            </AnswerText>
          </Answer>
        </section>

        <HorizontalLine class="my-12" :color="true"/>

        <!-- ================= Model results ================= -->
        <section>
          <h2 id="part5" class="text-heading-3 text-left mb-6">Model results</h2>
          <AnswerText>
            <p class="text-body-4">
              The charts above show raw shares. The models below do the actual test: they hold clock time, day of week
              and year constant and ask what darkness alone does to the odds of a given kind of stop. An odds ratio below
              1 means the stop became <em>less</em> likely once officers could no longer see into the car &mdash; the
              direction that indicates officers were selecting on what they could see. A 95% confidence interval that
              does not include 1 means a result like this one would be unlikely if darkness made no difference at all.
            </p>
          </AnswerText>
          <div v-if="model1Rows.length" class="border border-neutral-400 pt-6 my-6">
            <h4 class="text-center text-body-2 font-semibold text-primary-800 px-4">
              Effect of darkness on stop composition, 2021&ndash;2024 (Model 1)
            </h4>
            <div class="deo-table mt-6 text-body-4 overflow-x-auto">
              <table class="w-full min-w-[720px]">
                <thead>
                  <tr>
                    <th class="font-medium">What the model predicts</th>
                    <th class="font-medium">Odds ratio for darkness<br/>(95% CI)</th>
                    <th class="font-medium">Our coefficient</th>
                    <th class="font-medium">Published coefficient</th>
                    <th class="font-medium">Stops</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in model1Rows" :key="row.key">
                    <td>
                      <div class="font-medium">{{ row.label }}</div>
                      <div class="text-caption text-neutral-800">{{ row.description }}</div>
                    </td>
                    <td class="whitespace-nowrap">
                      <template v-if="row.failed">Model failed to fit</template>
                      <template v-else>
                        {{ row.oddsRatio.toFixed(3) }}<br/>
                        <span class="text-caption text-neutral-800">({{ row.ciLow.toFixed(3) }}&ndash;{{ row.ciHigh.toFixed(3) }})</span>
                      </template>
                    </td>
                    <td class="whitespace-nowrap">{{ row.failed ? '—' : row.coef.toFixed(3) }}</td>
                    <td class="whitespace-nowrap">{{ row.paperCoef === null ? 'not published' : row.paperCoef.toFixed(3) }}</td>
                    <td class="whitespace-nowrap">{{ row.n.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <AnswerText v-if="passenger1 && party1 && placebo1">
            <p class="text-body-4">
              Among stops of young Black men, the odds that the stopped car was carrying another young Black man were
              {{ pctBelowOne(passenger1.oddsRatio) }} lower after dark than in daylight at the same clock time. Across
              stops of young Black and white men together, the odds that the person stopped was Black were
              {{ pctBelowOne(party1.oddsRatio) }} lower after dark. Both intervals exclude 1, so neither is comfortably
              explained by chance.
            </p>
            <p class="text-body-4 mt-6">
              The third row is a placebo test: the same model run on stops of young <em>white</em> men. Its odds ratio is
              {{ placebo1.oddsRatio.toFixed(3) }} with a confidence interval from
              {{ placebo1.ciLow.toFixed(3) }} to {{ placebo1.ciHigh.toFixed(3) }}, which spans 1, and a p-value of
              {{ placebo1.p.toFixed(2) }}. It is not statistically significant. That null result is part of the
              evidence, not a gap in it: whatever darkness does to the composition of stops of young Black men, it does
              not do to stops of young white men. Had the placebo also moved, the likely explanation would have been
              some general artifact of nightfall rather than anything about race.
            </p>
          </AnswerText>

          <div v-if="model2Rows.length" class="border border-neutral-400 pt-6 my-6">
            <h4 class="text-center text-body-2 font-semibold text-primary-800 px-4">
              The same models with fuller controls (Model 2)
            </h4>
            <div class="deo-table mt-6 text-body-4 overflow-x-auto">
              <table class="w-full min-w-[720px]">
                <thead>
                  <tr>
                    <th class="font-medium">What the model predicts</th>
                    <th class="font-medium">Odds ratio for darkness<br/>(95% CI)</th>
                    <th class="font-medium">Our coefficient</th>
                    <th class="font-medium">Published coefficient</th>
                    <th class="font-medium">Stops</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in model2Rows" :key="row.key">
                    <td>
                      <div class="font-medium">{{ row.label }}</div>
                      <div class="text-caption text-neutral-800">{{ row.description }}</div>
                    </td>
                    <td class="whitespace-nowrap">
                      <template v-if="row.failed">Model failed to fit</template>
                      <template v-else>
                        {{ row.oddsRatio.toFixed(3) }}<br/>
                        <span class="text-caption text-neutral-800">({{ row.ciLow.toFixed(3) }}&ndash;{{ row.ciHigh.toFixed(3) }})</span>
                      </template>
                    </td>
                    <td class="whitespace-nowrap">{{ row.failed ? '—' : row.coef.toFixed(3) }}</td>
                    <td class="whitespace-nowrap">{{ row.paperCoef === null ? 'not published' : row.paperCoef.toFixed(3) }}</td>
                    <td class="whitespace-nowrap">{{ row.n.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Tooltip renders a <div>, which the HTML parser would hoist out of a <p>. -->
            <div class="text-caption text-neutral-800 p-4 max-w-[860px] mx-auto">
              Model 2 adds police service area<Tooltip term="PSA"/> &mdash; identified by district <em>and</em> area
              number, since Philadelphia numbers its service areas 1&ndash;4 within each district &mdash; along with
              officer assignment and a summer indicator. Differences from the published version matter and we state them
              rather than bury them.
              First, our Model 2 <strong>omits the seasonality weight the source paper applies</strong>; the paper does
              not publish that weight's formula, so we could not reproduce it. Second, officer-assignment and service-area
              categories with fewer than {{ model2Detail.minUnitCount.toLocaleString() }} stops are collapsed into a
              single &ldquo;other&rdquo; category
              <template v-if="model2Detail.collapsedRange">({{ model2Detail.collapsedRange }} categories, depending on
              the model)</template>, because categories that rare can perfectly predict the outcome and break the fit.
              <template v-if="areaOtherShares.headlineMax !== null">In the two rows above the placebo, collapsing costs
              little: areas holding just {{ areaOtherShares.headlineMax.toFixed(1) }}% of stops or fewer end up in that
              &ldquo;other&rdquo; bucket, so the location control is doing real work.</template>
              <template v-if="areaOtherShares.placebo !== null && placebo2">The placebo row is the exception, and it is
              worth being blunt about: its {{ placebo2.n.toLocaleString() }} stops of young white men are spread across
              dozens of service areas, so areas holding
              {{ areaOtherShares.placebo.toFixed(0) }}% of those stops fall below the threshold and lose
              their own effect. That row's location control is largely hollow, and its Model 2 estimate should not be
              read as location-adjusted.</template>
              Treat these numbers as supporting detail. The Model 1 results above are the reproduction we stand behind.
              <template v-if="placebo2">
                Note that the placebo row here, though its odds ratio of {{ placebo2.oddsRatio.toFixed(3) }} looks larger
                than in Model 1, has a confidence interval of {{ placebo2.ciLow.toFixed(3) }} to
                {{ placebo2.ciHigh.toFixed(3) }} that also spans 1, and a p-value of {{ placebo2.p.toFixed(2) }}: it is
                not statistically significant either.
              </template>
            </div>
          </div>
        </section>

        <HorizontalLine class="my-12" :color="true"/>

        <!-- ================= Caveats ================= -->
        <section>
          <h2 id="part6" class="text-heading-3 text-left mb-6">What this analysis cannot tell us</h2>
          <AnswerText>
            <p class="text-body-4">
              <strong>The veil-of-darkness effects are modest in size.</strong> They shift the odds of a given kind of
              stop by roughly 10% to 25%. Statistically significant does not mean large. The big number on this page is
              the frisk-rate gap &mdash; nearly triple &mdash; while the veil-of-darkness coefficients are the cleanly
              identified ones, the ones where we can be most confident about <em>why</em> the difference exists. They are
              answering different questions and should not be read as one finding.
            </p>
            <p class="text-body-4 mt-6">
              <strong>The test is deliberately conservative.</strong> Streetlights, headlights and lit intersections mean
              darkness is never total; some cars are recognizable regardless of the light, and officers sometimes know a
              vehicle already; segregation means an officer can often infer who is likely to be in a car from where it is
              driving, with or without seeing inside; and existing research suggests Black drivers drive <em>more</em>
              carefully in high-visibility conditions, which would work against finding any daylight effect at all. Every
              one of those shrinks the measured difference between daylight and darkness, which means the test understates
              the role of visibility rather than overstating it.
            </p>
            <!-- Tooltip renders a <div>, which the HTML parser would hoist out of a <p>. -->
            <div class="text-body-4 mt-6">
              <strong>Philadelphia's segregation strains any cross-race comparison.</strong>
              <template v-if="blackStopsInMajorityWhiteDistricts !== null">In our sample, only
              {{ blackStopsInMajorityWhiteDistricts.toFixed(1) }}% of stops of young Black men happened in a
              majority-white police district<Tooltip term="District"/> &mdash; one where more than half of residents are
              white.</template><template v-else>Very few stops of young Black men happen in majority-white police
              districts<Tooltip term="District"/>.</template> So comparing Black
              and white motorists always means comparing different places as well as different people. That is why the
              paper's within-race test matters most: it holds race constant, compares young Black men with young Black
              men, and asks only what changes when officers can no longer see into the car.
            </div>
            <p class="text-body-4 mt-6">
              <strong>Recorded stop times are rounded.</strong>
              <template v-if="timeRounding">In our sample,
              {{ timeRounding.pct_multiple_of_5.toFixed(0) }}% of recorded stop times fall on a multiple of five minutes
              and {{ timeRounding.pct_multiple_of_15.toFixed(0) }}% on a quarter hour, far more than chance would
              produce (20% and 6.7%).</template><template v-else>Officers log times in round numbers far more often than
              chance would produce.</template> A stop logged at 7:30pm may therefore have happened somewhat earlier or
              later. Near the boundary between light and dark that rounding can put a stop on the wrong side of the
              veil, so the roughly 30-minute window between sunset and full dusk is excluded from the analysis
              altogether.
            </p>
            <p class="text-body-4 mt-6">
              <strong>How close this reproduction lands.</strong> Working from Philadelphia's published stop data on a
              snapshot roughly two years newer than the authors', our sample counts come within about 5% of the
              published figures and our Model 1
              coefficients<template v-if="model1MaxDelta !== null"> within {{ model1MaxDelta.toFixed(3) }} of the
              published ones</template><template v-else> closely track the published ones</template>. Our Model 2
              coefficients are further off, and deliberately so: it omits a weight the paper applies, as noted above.
              The original analysis is
              by Lance Hannon and Molly Biddle, Villanova University, 2026:
              <a href="https://doi.org/10.21428/cb6ab371.f1d81a4b" class="text-hyperlink-blue" target="_blank">https://doi.org/10.21428/cb6ab371.f1d81a4b</a>.
            </p>
          </AnswerText>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import Graph from '~/components/Graph.vue'
import QuestionHeader from '~/components/QuestionHeader.vue'
import HorizontalLine from '~/components/ui/HorizontalLine.vue'
import Tooltip from '~/components/ui/Tooltip.vue'
import { useDistrictsDemographics } from '~/composables/useDistrictsDemographics'
import { useVeilCube } from '~/composables/useVeilCube'
import {
  REPLICATION_YEARS,
  frisksAndTickets,
  groupTravelByClockBin,
  motoristsByRace,
  pctMotoristsInGroups,
  pctStopsInMajorityWhiteDistricts,
  restrictToYears,
  type ClockBinPoint,
  type VeilCube,
  type VeilModel,
} from '~/utils/veil'

useHead({
  title: 'Are young Black men traveling together targeted for traffic stops?',
})

const BLACK = 'Black - Non-Latino'
const WHITE = 'White - Non-Latino'
const RACE_LABEL: Record<string, string> = {
  [BLACK]: 'Black motorists',
  [WHITE]: 'White motorists',
}

const { data: veilBundle } = useVeilCube()
const { data: districtDemographics } = useDistrictsDemographics()

/**
 * The shipped cube spans 2014-2026 but every figure on this page is a
 * 2021-2024 replication figure, so restrict once here and feed this to
 * every selector. See `utils/veil.ts`.
 */
const cube = computed<VeilCube | null>(() => {
  const bundle = veilBundle.value
  if (!bundle) return null
  return restrictToYears(bundle.cube, REPLICATION_YEARS.from, REPLICATION_YEARS.to)
})

const YEARS_LABEL = `${REPLICATION_YEARS.from}–${REPLICATION_YEARS.to}`

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`
}

/** "12% lower" style phrasing for an odds ratio below 1. */
function pctBelowOne(oddsRatio: number): string {
  return `${Math.round((1 - oddsRatio) * 100)}%`
}

/** 1080 -> "6:00pm". Clock bins are minutes since midnight. */
function clockLabel(minutes: number): string {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const suffix = hour24 >= 12 ? 'pm' : 'am'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}:${String(minute).padStart(2, '0')}${suffix}`
}

// =========================================================================
// Chart 1: young male motorists stopped, by race. Per motorist.
// =========================================================================
const chart1 = computed(() => {
  const c = cube.value
  if (!c) return null
  const xAxis = 'Race of motorist'
  const yAxis = 'Number of Motorists Stopped'
  const counts = motoristsByRace(c)
  const data = [BLACK, WHITE].map((race) => ({
    group: null,
    [xAxis]: RACE_LABEL[race],
    [yAxis]: counts[race],
    annotation: counts[race].toLocaleString(),
    hover_text: [
      RACE_LABEL[race],
      `${counts[race].toLocaleString()} young male motorists stopped`,
      `${YEARS_LABEL}, 5:08pm–8:35pm`,
      '',
    ],
  }))
  return {
    xAxis,
    yAxis,
    title: `Young Male Motorists Stopped by PPD in the Evening Hours, ${YEARS_LABEL}`,
    data,
  }
})

// =========================================================================
// Chart 2: share of motorists traveling in a multi-occupant car. Per motorist.
// =========================================================================
const chart2 = computed(() => {
  const c = cube.value
  if (!c) return null
  const xAxis = 'Race of motorist'
  const yAxis = 'Percentage (%)'
  const pct = pctMotoristsInGroups(c)
  const data = [BLACK, WHITE].map((race) => ({
    group: null,
    [xAxis]: RACE_LABEL[race],
    [yAxis]: Math.round(pct[race] * 10) / 10,
    annotation: fmtPct(pct[race]),
    hover_text: [
      RACE_LABEL[race],
      `${fmtPct(pct[race])} of stopped motorists were in a car with more than one person`,
      `${YEARS_LABEL}, 5:08pm–8:35pm`,
      '',
    ],
  }))
  return {
    xAxis,
    yAxis,
    title: `Share of Stopped Young Male Motorists Traveling in a Multi-Occupant Car, ${YEARS_LABEL}`,
    data,
  }
})

// =========================================================================
// Chart 3: frisk and ticket rates, solo vs group, Black motorists. Per occupant.
// =========================================================================
const SOLO_LABEL = 'Traveling alone'
const GROUP_LABEL = 'Traveling with another young Black man'

const chart3 = computed(() => {
  const c = cube.value
  if (!c) return null
  const xAxis = 'What police did'
  const yAxis = 'Percentage (%)'
  const { solo, group } = frisksAndTickets(c, BLACK)

  const point = (label: string, outcome: string, rate: number, motorists: number) => ({
    group: label,
    [xAxis]: outcome,
    [yAxis]: Math.round(rate * 10) / 10,
    annotation: fmtPct(rate),
    hover_text: [
      label,
      outcome,
      `${fmtPct(rate)} of ${motorists.toLocaleString()} motorists`,
      '',
    ],
  })

  return {
    xAxis,
    yAxis,
    title: `Frisk and Ticket Rates for Young Black Male Motorists, Alone vs. Traveling Together, ${YEARS_LABEL}`,
    soloFrisk: solo.friskRate,
    soloTicket: solo.ticketRate,
    groupFrisk: group.friskRate,
    groupTicket: group.ticketRate,
    data: [
      point(SOLO_LABEL, 'Frisked', solo.friskRate, solo.motorists),
      point(GROUP_LABEL, 'Frisked', group.friskRate, group.motorists),
      point(SOLO_LABEL, 'Ticketed', solo.ticketRate, solo.motorists),
      point(GROUP_LABEL, 'Ticketed', group.ticketRate, group.motorists),
    ],
  }
})

// =========================================================================
// Chart 4: the veil. Group-travel share by clock time and lighting. Per stop.
//
// Graph.vue draws bars (grouped or stacked) and a single optional trendline;
// it has no two-series line mode, so the daylight/darkness contrast is drawn
// as a pair of bars per clock-time bin.
// =========================================================================
const LIGHTING_LABEL: Record<string, string> = {
  daylight: 'Daylight',
  dark: 'After dark',
}

/** Both sides of the veil. A bin missing either one is not a comparison. */
const LIGHTING_STATES = ['daylight', 'dark'] as const

/**
 * Minimum stops in BOTH lighting states for a clock bin to be plotted.
 *
 * The sample window is 17:08-20:35, so the 5:00pm dark bin (108 stops) and
 * the 8:30pm daylight bin (41 stops) are truncated. The 8:30pm daylight bin
 * reads 24.4% on those 41 stops, and because Graph.vue takes its y-axis
 * maximum from the data maximum, that one bar stretched the axis and
 * compressed the real 2-5 percentage-point signal in the well-populated
 * bins. A caption cannot undo that distortion, so the thin bins are dropped
 * instead. `utils/veil.test.ts` pins down that exactly these two bins fall
 * below this threshold on the real cube.
 */
const MIN_BIN_STOPS = 200

const chart4 = computed(() => {
  const c = cube.value
  if (!c) return null
  const xAxis = 'Time of evening'
  const yAxis = 'Percentage (%)'
  const points = groupTravelByClockBin(c, BLACK)

  // Group by clock bin so a bin is kept or dropped as a pair: half a pair
  // would read as a missing comparison rather than a thin one.
  const bins = new Map<number, ClockBinPoint[]>()
  for (const p of points) {
    const existing = bins.get(p.clockBin)
    if (existing) existing.push(p)
    else bins.set(p.clockBin, [p])
  }

  // A bin is only a veil-of-darkness comparison if BOTH lighting states are
  // present and both are thick enough. Testing thickness alone is not
  // sufficient: `Array.prototype.every` is vacuously true for a
  // single-element array, so a clock time observed in only one lighting
  // state would have been kept, drawn as a lone unpaired bar, counted in
  // `shownBins` and — having no counterpart to beat — never counted in
  // `daylightHigherBins`, quietly deflating the "12 of the 13 bins"
  // sentence. No such bin exists in the current cube; this closes the case
  // rather than relying on that staying true.
  const kept: ClockBinPoint[][] = []
  const suppressed: { point: ClockBinPoint; thin: boolean }[] = []
  for (const [, binPoints] of [...bins.entries()].sort((a, b) => a[0] - b[0])) {
    const hasBothStates = LIGHTING_STATES.every(
      (state) => binPoints.some((p) => p.lighting === state),
    )
    const allThick = binPoints.every((p) => p.stops >= MIN_BIN_STOPS)
    if (hasBothStates && allThick) {
      kept.push(binPoints)
      continue
    }
    for (const point of binPoints) {
      suppressed.push({ point, thin: point.stops < MIN_BIN_STOPS })
    }
  }

  const data = kept.flat().map((p) => {
    const label = LIGHTING_LABEL[p.lighting] ?? p.lighting
    return {
      group: label,
      [xAxis]: clockLabel(p.clockBin),
      [yAxis]: Math.round(p.pctGroupStops * 10) / 10,
      annotation: null,
      hover_text: [
        clockLabel(p.clockBin),
        label,
        `${fmtPct(p.pctGroupStops)} of stops were of a multi-occupant car`,
        `${p.stops.toLocaleString()} stops in this bin`,
        '',
      ],
    }
  })

  // How often daylight sits above dark, among the bins actually shown.
  const daylightHigherBins = kept.filter((binPoints) => {
    const day = binPoints.find((p) => p.lighting === 'daylight')
    const dark = binPoints.find((p) => p.lighting === 'dark')
    return day !== undefined && dark !== undefined && day.pctGroupStops > dark.pctGroupStops
  }).length

  const lightWord = (p: ClockBinPoint) => (p.lighting === 'dark' ? 'after dark' : 'in daylight')
  const suppressedSummary = suppressed
    .map(({ point, thin }) => (thin
      ? `${clockLabel(point.clockBin)} ${lightWord(point)} has only ${point.stops.toLocaleString()} stops`
      : `${clockLabel(point.clockBin)} appears only ${lightWord(point)}, with nothing to compare it against`))
    .join(', and ')

  return {
    xAxis,
    yAxis,
    title: `Share of Stops of Young Black Men That Were Multi-Occupant Cars, by Time of Evening and Light, ${YEARS_LABEL}`,
    data,
    shownBins: kept.length,
    daylightHigherBins,
    suppressedSummary,
    suppressedBars: suppressed.length,
  }
})

// =========================================================================
// Model results
// =========================================================================
interface ModelRow {
  key: string
  label: string
  description: string
  coef: number
  oddsRatio: number
  ciLow: number
  ciHigh: number
  p: number
  n: number
  paperCoef: number | null
  failed: boolean
  collapsedUnits: number
  minUnitCount: number
}

const MODEL_META: Record<string, { label: string; description: string }> = {
  has_black_passenger: {
    label: 'A stopped young Black man was traveling with another young Black man',
    description: 'Among stops of young Black male motorists',
  },
  party_is_black: {
    label: 'The young man police stopped was Black rather than white',
    description: 'Among stops of young Black and white male motorists',
  },
  placebo_white: {
    label: 'Placebo: a stopped young white man was traveling with another young white man',
    description: 'Among stops of young white male motorists',
  },
}

const MODEL_ORDER = ['has_black_passenger', 'party_is_black', 'placebo_white'] as const

function toRow(key: string, model: VeilModel | undefined): ModelRow | null {
  if (!model) return null
  const family = key.split('.')[0]
  const meta = MODEL_META[family]
  // `degenerate` is set by the pipeline when a fit blew up on a sparse
  // fixed-effect level; such a model is not a finding.
  const failed = (model as VeilModel & { degenerate?: boolean }).degenerate === true
    || model.converged !== true
  return {
    key,
    label: meta?.label ?? key,
    description: meta?.description ?? '',
    coef: model.coef,
    oddsRatio: model.odds_ratio,
    ciLow: Math.exp(model.coef - 1.96 * model.se),
    ciHigh: Math.exp(model.coef + 1.96 * model.se),
    p: model.p,
    n: model.n,
    paperCoef: model.paper_coef,
    failed,
    collapsedUnits: (model as VeilModel & { collapsed_units?: number }).collapsed_units ?? 0,
    minUnitCount: (model as VeilModel & { min_unit_count?: number }).min_unit_count ?? 0,
  }
}

function rowsForSpec(spec: 'model_1' | 'model_2'): ModelRow[] {
  const models = veilBundle.value?.cube?.models
  if (!models) return []
  return MODEL_ORDER
    .map((family) => toRow(`${family}.${spec}`, models[`${family}.${spec}`]))
    .filter((row): row is ModelRow => row !== null)
}

const model1Rows = computed(() => rowsForSpec('model_1'))
const model2Rows = computed(() => rowsForSpec('model_2'))

const byKey = (rows: ModelRow[], family: string) => rows.find((r) => r.key.startsWith(`${family}.`)) ?? null
const passenger1 = computed(() => byKey(model1Rows.value, 'has_black_passenger'))
const party1 = computed(() => byKey(model1Rows.value, 'party_is_black'))
const placebo1 = computed(() => byKey(model1Rows.value, 'placebo_white'))
const placebo2 = computed(() => byKey(model2Rows.value, 'placebo_white'))

/**
 * How far our Model 1 coefficients sit from the published ones — DERIVED,
 * never typed in.
 *
 * This page previously asserted "within 0.008" in two places. That was true
 * when it was written and false by the time it shipped: a cube rebuild moved
 * has_black_passenger.model_1 to -0.23295 against a published -0.242, a gap
 * of 0.00905, and the Model 1 table right below prints both numbers, so any
 * reader could subtract and catch it. Computing the bound from the same
 * models block the table renders means the sentence cannot drift again.
 *
 * Rounded UP to three decimals, deliberately: a bound that is rounded to
 * nearest could understate the true gap, and understating accuracy is the
 * failure mode that matters here.
 */
const model1MaxDelta = computed<number | null>(() => {
  const deltas = model1Rows.value
    .filter((row) => !row.failed && row.paperCoef !== null)
    .map((row) => Math.abs(row.coef - (row.paperCoef as number)))
  if (deltas.length === 0) return null
  return Math.ceil(Math.max(...deltas) * 1000) / 1000
})

/**
 * Share of stops of young Black men that happened in a majority-white
 * police district. Computed from our own cube rather than quoted: the
 * figure this page used to carry ("about 5%") had no source and no
 * computation behind it anywhere in the codebase. Ours is higher.
 */
const blackStopsInMajorityWhiteDistricts = computed<number | null>(() => {
  const c = cube.value
  const demographics = districtDemographics.value
  if (!c || !demographics) return null
  return pctStopsInMajorityWhiteDistricts(c, BLACK, demographics).pct
})

/** Measured stop-time rounding, carried on the cube. See `utils/veil.ts`. */
const timeRounding = computed(() => veilBundle.value?.cube?.time_rounding ?? null)

/**
 * Model 2's location control is real for the two headline rows and weak for
 * the placebo row, and the page has to say which is which. Areas holding
 * fewer than `min_unit_count` stops are folded into a single OTHER bucket;
 * the white-motorist subsample is small enough (about 5,400 stops spread
 * over 66 areas) that most of its areas fall below that line and lose their
 * own fixed effect. Reported as a share of ROWS, since that is what decides
 * whether the control is doing any work.
 */
const areaOtherShares = computed(() => {
  const models = veilBundle.value?.cube?.models
  const share = (key: string): number | null => {
    const value = models?.[key]?.other_row_share?.police_area
    return typeof value === 'number' ? value * 100 : null
  }
  const headline = ['party_is_black.model_2', 'has_black_passenger.model_2']
    .map(share)
    .filter((v): v is number => v !== null)
  return {
    headlineMax: headline.length ? Math.max(...headline) : null,
    placebo: share('placebo_white.model_2'),
  }
})

/** Collapsed-category counts for the Model 2 disclosure. */
const model2Detail = computed(() => {
  const rows = model2Rows.value
  const collapsed = rows.map((r) => r.collapsedUnits).filter((n) => n > 0)
  const minUnitCount = rows.find((r) => r.minUnitCount > 0)?.minUnitCount ?? 0
  if (collapsed.length === 0) return { collapsedRange: '', minUnitCount }
  const low = Math.min(...collapsed)
  const high = Math.max(...collapsed)
  return {
    collapsedRange: low === high ? String(low) : `${low}–${high}`,
    minUnitCount,
  }
})
</script>

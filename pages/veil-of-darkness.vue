<template>
  <LayoutPageHeader>
    <template #header>
      When police can see who's driving, who do they stop?
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
              <a href="#intra-trend" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                Does this pattern hold up year by year?
              </a>
            </li>
            <li>
              <a href="#part1" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                How the veil-of-darkness test works
              </a>
            </li>
            <li>
              <a href="#intra-lead" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                Study 1: who gets stopped, by age and gender?
              </a>
            </li>
            <li>
              <a href="#part2" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                Study 2: young Black men traveling together
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
              <a href="#fidelity" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                How close these reproductions land
              </a>
            </li>
            <li>
              <a href="#part6" class="deo_scroll text-hyperlink flex">
                <IconsChevron class="fill-black -rotate-90"/>
                What these analyses cannot tell us
              </a>
            </li>
          </ul>
        </nav>

        <!-- ================= Year-by-year trend (sits above the fixed reproduction) ================= -->
        <section v-if="intraracialByYear">
          <h2 id="intra-trend" class="text-heading-3 text-left pt-10 mb-6">Does this pattern hold up year by year?</h2>
          <AnswerText>
            <p class="text-body-4">
              Study 1 further down this page reproduces a published paper over one fixed window, pooling roughly four
              years of stops into a single estimate. That is the right way to reproduce a paper, but it cannot show
              whether the finding is steady or whether one unusual year is carrying it. So here the same models are
              fitted again, one calendar year at a time, from {{ trendYearsLabel }} &mdash; eight years further back
              than the published study reaches. Each dot is that year's estimate
              and each vertical bar is its 95% confidence interval &mdash; the range the true effect plausibly falls
              in. Where a bar crosses the dashed zero line, that year cannot distinguish the effect from no effect at
              all. Use the selector to look at any single year, or any combination.
            </p>
          </AnswerText>

          <div class="max-w-[320px] mt-6">
            <SelectYears v-model="selectedYears" :items="trendYearOptions"/>
          </div>

          <CoefficientGraph
            :estimates="trendData"
            :axis-properties="{x: 'Year', y: 'Effect of darkness (log-odds)'}"
            :group-classes="TREND_CLASSES"
            :chart-legend="TREND_LEGEND"
            :minimum-container-width="1080">
            <h4>Effect of darkness on who gets stopped, fitted one year at a time</h4>
            <template #footer>
              <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[630px] mx-auto">
                Below zero means that group is stopped <em>less</em> once officers can no longer see into the car;
                above zero, <em>more</em>. Each year is fitted on its own, using the same controls and the same
                seasonality weighting as the pooled analysis below, and all years share one inter-twilight window so
                that a year-to-year difference cannot be an artifact of a shifting comparison period. Hover any point
                for that year's odds and sample size.
                <template v-if="trendOverlapYear">
                  These are <strong>full calendar years</strong>, whereas the reproduction below runs
                  {{ intraracialWindowLabel }} &mdash; so its {{ trendOverlapYear }} covers only part of the year and
                  the two {{ trendOverlapYear }} figures are not the same quantity.
                </template>
                Everything before 2022 predates Driving Equality, which took effect in March that year.
                <template v-if="trendOffByDefault.length">
                  <strong>{{ trendOffByDefault.join(' and ') }} is fitted and can be switched on, but is off by
                  default</strong>: lockdowns and curfews changed when people drive in the evening, and this test
                  assumes travel patterns do not shift with the light. That assumption fails for that year in
                  particular, so it is a deliberate choice rather than part of the default picture.
                </template>
                From 2023 onward a smaller share of vehicle stops carries a recorded violation code (about 82%, against
                93&ndash;96% in every earlier year), so the sample is composed slightly differently either side of that
                break &mdash; another reason to read the overall pattern rather than year-to-year wiggles.
                2026 is left out because the data only runs through June, and a half year would cover only the lighter
                half of the daylight cycle. A single year holds a fraction of the pooled sample, so these
                intervals are correspondingly wider than the pooled ones.
              </p>
            </template>
          </CoefficientGraph>

          <AnswerText>
            <p class="text-body-4" v-if="trendHeadlineRun">
              <strong v-if="trendHeadlineRun.unbroken">Both headline findings hold in every one of the
              {{ trendYearOptions.length }} years.</strong>
              <strong v-else>The headline findings hold in {{ trendHeadlineRun.hits }} of
              {{ trendHeadlineRun.total }} year-and-group estimates.</strong>
              Across {{ trendYearOptions[0] }}&ndash;{{ trendYearOptions[trendYearOptions.length - 1] }}, young men are
              stopped significantly less often once it is dark and older women significantly more often, without a
              single exception and without a single year reversing direction. That run spans two mayors, a pandemic,
              the introduction of Driving Equality, and a halving of the city's overall stop volume. Whatever produces
              this pattern, it is neither a recent development nor an artifact of one unusual year.
            </p>
            <p class="text-body-4 mt-6" v-if="trendOlderFemaleSpread">
              <strong>The size of each effect moves around, and the recent direction is not a trend.</strong> The
              older-woman estimate has ranged between {{ trendOlderFemaleSpread.min.toFixed(2) }} and
              {{ trendOlderFemaleSpread.max.toFixed(2) }} across the series, averaging
              {{ trendOlderFemaleSpread.mean.toFixed(2) }}. It is lower in
              {{ trendOlderFemaleSpread.last.year }} ({{ trendOlderFemaleSpread.last.coef.toFixed(2) }}) than in the
              years just before it, but
              <template v-if="!trendOlderFemaleSpread.lastIsOutsideEarlierRange">that figure sits inside the range
              earlier years already covered, and the highest values in the whole series are the ones immediately
              preceding it</template><template v-else>it now sits below every earlier year in the series</template>.
              Read over the full period this looks like a return toward the middle of the range rather than a decline.
              An earlier version of this page, written when only the most recent years had been fitted, described it as
              a possible weakening; the longer series does not support that reading.
            </p>
            <p class="text-body-4 mt-6">
              <strong>The other two groups behave quite differently from each other, and neither is a finding.</strong>
              Older men are detectable in just {{ trendOlderMale.hits }} of {{ trendOlderMale.total }} years, with the
              estimate falling on both sides of zero &mdash; the shape of noise. Young women are different: significant
              in {{ trendYoungFemale.hits }} of {{ trendYoungFemale.total }} years
              ({{ trendYoungFemale.years.join(', ') }}), essentially flat in the rest, and
              <template v-if="!trendYoungFemale.anyNegative">never appreciably negative in any year</template><template
              v-else>negative in at least one year</template>. That is weaker than an established effect but not
              obviously nothing, and it is why the pooled model reports no result for this group rather than a small
              one. With {{ trendTestCount }} estimates on this chart, a handful of isolated hits is expected at the
              usual threshold, so none of this should be cited as a finding about young women &mdash; only as a reason
              the question stays open.
            </p>
          </AnswerText>
        </section>

        <HorizontalLine class="my-12" :color="true"/>

        <!-- =================
             How the test works. Deliberately ahead of BOTH studies: this page
             leads with results, and a reader meeting a finding before the
             reasoning that licenses it has no way to judge it. Everything
             shared by the two reproductions -- the premise, the two papers,
             how to read a coefficient -- is stated once, here, and never
             restated in a study's own section.
             ================= -->
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
              &ldquo;veil of darkness&rdquo;.
            </div>
          </AnswerText>

          <h3 class="text-label-1 mt-10">The two studies reproduced on this page</h3>
          <AnswerText>
            <p class="text-body-4 mt-4">
              This page reproduces two separate papers by Lance Hannon and Molly Biddle of Villanova University, both
              applying that test to Philadelphia's own published traffic stop data.
            </p>
            <p class="text-body-4 mt-6">
              <strong>Study 1 &mdash; age and gender</strong>, published in 2025 in the <em>American Journal of
              Criminal Justice</em>
              (<a href="https://doi.org/10.1007/s12103-025-09879-8" class="text-hyperlink-blue" target="_blank">doi.org/10.1007/s12103-025-09879-8</a>).
              It asks an <em>intraracial</em> question: among stops of Black motorists, does darkness change the age
              and gender of the person pulled over? It compares Black motorists with Black motorists and does not
              involve white motorists at all.
            </p>
            <p class="text-body-4 mt-6">
              <strong>Study 2 &mdash; group travel</strong>, published in 2026
              (<a href="https://doi.org/10.21428/cb6ab371.f1d81a4b" class="text-hyperlink-blue" target="_blank">doi.org/10.21428/cb6ab371.f1d81a4b</a>).
              It asks whether a stopped young Black man was traveling with another young Black man, and it includes one
              comparison across races.
            </p>
            <p class="text-body-4 mt-6">
              <strong>The two are not comparable to one another.</strong> Different samples, different years, different
              geographies and different questions: Study 1 covers Black adults of any age and either gender in
              Philadelphia's majority-Black police districts<Tooltip term="District"/>; Study 2 covers young men only,
              city-wide. A coefficient from one cannot be set beside a coefficient from the other, and the sample sizes
              are not versions of the same number.
            </p>
          </AnswerText>

          <h3 class="text-label-1 mt-10">How to read the numbers on this page</h3>
          <AnswerText>
            <p class="text-body-4 mt-4">
              The charts of raw shares describe what the data looks like. The models do the actual test: they hold
              clock time, day of week and year constant and ask what darkness alone does to the odds of a given kind of
              stop. Two ways of writing the same result appear below. An <strong>odds ratio</strong> below 1 means the
              stop became <em>less</em> likely once officers could no longer see into the car &mdash; the direction
              that indicates officers were selecting on what they could see; above 1 means more likely. A
              <strong>coefficient</strong> is the same quantity on a scale where zero, rather than one, means no
              effect, so a negative coefficient and an odds ratio below 1 say the same thing. In both cases a 95%
              confidence interval that does not reach the no-effect mark means a result like this one would be unlikely
              if darkness made no difference at all.
            </p>
          </AnswerText>
        </section>

        <HorizontalLine class="my-12" :color="true"/>

        <!-- ================= Study 1: age & gender (Hannon & Biddle 2025) ================= -->
        <section>
          <h2 id="intra-lead" class="text-heading-3 text-left pt-10 mb-6">
            Study 1: When police can see who's driving, who do they stop?
          </h2>
          <AnswerText>
            <p class="text-body-4">
              Among traffic stops of Black motorists, does daylight change the <em>age and gender</em> of the person
              who gets pulled over? This compares stops of Black motorists in daylight with stops of Black motorists
              after dark, and asks whether the mix of who is stopped shifts when officers can no longer see into the
              car before deciding to pull it over.
            </p>
            <p class="text-body-4 mt-6">
              The sample is narrow and stated plainly: {{ intraracialSample?.n.toLocaleString() ?? 'about 75,900' }}
              stops of a single Black adult occupant, initiated for a motor vehicle code<Tooltip term="MVC"/>
              violation, during evening hours, in Philadelphia's majority-Black police
              districts<Tooltip term="District"/> ({{ intraracialDistrictsLabel }}), from
              {{ intraracialWindowLabel }}.
            </p>
          </AnswerText>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <LineGraph
              v-for="panel in intraracialPanels"
              :key="panel.key"
              :graph-data="panel.data"
              :axis-properties="{x: 'Lighting', y: 'Percentage (%)'}"
              :group-classes="{[panel.key]: 'stroke-purple fill-purple bg-purple'}"
              group-name="group"
              :y-scale-domain-max="panel.yScaleDomainMax"
              :minimum-container-width="480">
              <h4>{{ panel.title }}</h4>
              <template #footer>
                <p class="text-caption text-neutral-800 pt-4 px-4 max-w-[480px] mx-auto">{{ panel.footer }}</p>
              </template>
            </LineGraph>
          </div>

          <AnswerText v-if="intraracialModels">
            <p class="text-body-4 mt-6">
              Two of these four results move, and they move in opposite directions. Darkness cuts the odds that a
              stopped Black driver is a young man by about
              {{ pctBelowOne(intraracialModels.young_male.odds_ratio) }} (p&nbsp;{{ fmtP(intraracialModels.young_male.p_value) }}),
              and raises the odds that the stopped driver is an older woman by about
              {{ pctAboveOne(intraracialModels.older_female.odds_ratio) }} (p&nbsp;{{ fmtP(intraracialModels.older_female.p_value) }}).
              Those two results are the near-inverse of each other: when officers can see less, young men make up a
              smaller share of who gets stopped and older women make up a larger share.
            </p>
            <p class="text-body-4 mt-6">
              <strong>The other two groups show no detected effect, and that is part of the finding, not a gap in
              it.</strong> Darkness does not move the odds that a stopped Black driver is a young woman
              (p&nbsp;{{ fmtP(intraracialModels.young_female.p_value) }}) or an older man
              (p&nbsp;{{ fmtP(intraracialModels.older_male.p_value) }}) &mdash; both confidence intervals span 1, and
              neither should be read as a small effect. If darkness were driving some general shift in who
              gets stopped, it is difficult to explain why it would move two of the four groups and leave the other two
              untouched. The pattern is specific to young men and, inversely, older women, and it appears nowhere else
              in this model.
            </p>
            <p class="text-body-4 mt-6">
              The fitted coefficients behind these four panels, set against the published ones, are in the model
              results below.
            </p>
          </AnswerText>
        </section>

        <HorizontalLine class="my-12" :color="true"/>

        <!-- ================= Study 2: group travel (Hannon & Biddle 2026) ================= -->
        <section>
          <h2 id="part2" class="text-heading-3 text-left pt-10 mb-6">
            Study 2: Young Black men traveling together
          </h2>
          <AnswerText>
            <p class="text-body-4">
              The rest of the page reproduces the 2026 paper: young Black men only, 2021&ndash;2024, city-wide, asking
              whether a stopped driver was traveling with another young Black man. Every figure from here on is drawn
              from that four-year window and from the evening hours the authors studied.
            </p>
          </AnswerText>

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
                  car, which mirrors what the models below predict. {{ chart4.suppressedBins }} clock times are not
                  shown. The sample window starts at 5:08pm and ends at 8:35pm, so the earliest dark bin and the latest
                  daylight bin are clipped and rest on very few stops &mdash; {{ chart4.suppressedSummary }}. Percentages
                  built on that few stops swing widely enough to stretch the chart's vertical scale and flatten the real
                  differences, so any clock time with fewer than {{ MIN_BIN_STOPS }} stops on either side of the veil is
                  left out here. Hover any bar for its own stop count. The models below use every stop, including the
                  ones behind the omitted clock times.
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

        <!-- =================
             Model results for BOTH studies, gathered in one place. The two
             tables sit under their own study headings and are labelled with
             their own samples: they are different models on different data
             and must never read as rows of one analysis.
             ================= -->
        <section>
          <h2 id="part5" class="text-heading-3 text-left mb-6">Model results</h2>
          <AnswerText>
            <p class="text-body-4">
              Both studies' fitted models are collected here, each against the figures its paper published. See
              &ldquo;How to read the numbers&rdquo; above for what a coefficient, an odds ratio and a confidence
              interval mean here.
            </p>
          </AnswerText>

          <h3 class="text-label-1 mt-10">Study 1: age and gender among Black motorists</h3>
          <div v-if="intraracialTableRows.length" class="border border-neutral-400 pt-6 my-6">
            <h4 class="text-center text-body-2 font-semibold text-primary-800 px-4">
              Effect of darkness on who gets stopped, among Black motorists (Hannon &amp; Biddle 2025, Table 1)
            </h4>
            <div class="deo-table mt-6 text-body-4 overflow-x-auto">
              <table class="w-full min-w-[720px]">
                <thead>
                  <tr>
                    <th class="font-medium">What the model predicts</th>
                    <th class="font-medium">Our coefficient</th>
                    <th class="font-medium">Our SE</th>
                    <th class="font-medium">Published coefficient</th>
                    <th class="font-medium">Significant?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in intraracialTableRows" :key="row.key">
                    <td>{{ row.label }}</td>
                    <td class="whitespace-nowrap">{{ row.coef.toFixed(3) }}</td>
                    <td class="whitespace-nowrap">{{ row.se.toFixed(3) }}</td>
                    <td class="whitespace-nowrap">{{ row.paperCoef === null ? 'not published' : row.paperCoef.toFixed(3) }}</td>
                    <td class="whitespace-nowrap">{{ row.significant ? `Yes (p ${fmtP(row.p)})` : `No (p ${fmtP(row.p)})` }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <h3 class="text-label-1 mt-10">Study 2: young Black men traveling together</h3>
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
                      <div class="font-medium">
                        {{ row.label }}<sup v-if="row.locationControlHollow" aria-hidden="true">&dagger;</sup>
                      </div>
                      <div class="text-caption text-neutral-800">{{ row.description }}</div>
                      <!--
                        The daggered warning lives in the ROW, not only in the
                        caption below the table. A reader who scans the table
                        and moves on — which is what readers do with tables —
                        would otherwise see three rows of equal standing.
                      -->
                      <div v-if="row.locationControlHollow" class="text-caption text-neutral-800 mt-1">
                        &dagger; Location control
                        {{ areaControlWording(row.areaOtherShare ?? 0).adjective }} &mdash;
                        {{ areaControlWording(row.areaOtherShare ?? 0).caveat }}. See the note below the table.
                      </div>
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
              officer assignment and a summer indicator. It also holds the location of the stop constant, which Model 1
              does not. Differences from the published version matter and we state them rather than bury them.
              First, our Model 2 <strong>omits the seasonality weight the source paper applies</strong>. The 2026 paper
              does not publish that weight's formula, but we later obtained it from a different paper the authors cite,
              Knode et al. (2024), and it is applied to the Study 1 models above. The
              2026 Model 2 here has not been refit with it, so its figures predate that and still lack the weight.
              Second, officer-assignment and service-area
              categories with fewer than {{ model2Detail.minUnitCount.toLocaleString() }} stops are collapsed into a
              single &ldquo;other&rdquo; category
              <template v-if="model2Detail.collapsedRange">({{ model2Detail.collapsedRange }} categories, depending on
              the model)</template>, because categories that rare can perfectly predict the outcome and break the fit.
              <template v-if="areaOtherShares.headlineMax !== null">In the two rows above the placebo, collapsing costs
              little: areas holding just {{ areaOtherShares.headlineMax.toFixed(1) }}% of stops or fewer end up in that
              &ldquo;other&rdquo; bucket, so the location control is doing real work.</template>
              <template v-if="placeboAreaControl && placebo2">&#32;The placebo row &mdash; marked &dagger; above &mdash; is
              the exception, and it is worth being blunt about: its {{ placebo2.n.toLocaleString() }} stops of young
              white men are spread across dozens of service areas, so areas holding
              {{ placeboAreaControl.share.toFixed(0) }}% of those stops fall below the threshold and lose
              their own effect. That row's location control is {{ placeboAreaControl.adjective }}, and
              {{ placeboAreaControl.caveat }}.</template>
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

        <!-- =================
             Reproduction fidelity for both studies, in one place. This claim
             was previously made three times -- twice for the 2026 paper in
             near-identical wording -- which is how one copy drifted out of
             step with the other in an earlier revision.
             ================= -->
        <section>
          <h2 id="fidelity" class="text-heading-3 text-left mb-6">How close these reproductions land</h2>
          <AnswerText>
            <p class="text-body-4">
              Both reproductions work from Philadelphia's published stop data on a snapshot roughly two years newer
              than the one each set of authors used. OpenDataPhilly revises records, so exact agreement is not the
              standard; landing close on both sample counts and coefficients is.
            </p>
            <p class="text-body-4 mt-6">
              <strong>Study 1 (age and gender).</strong> Our sample is
              {{ intraracialSample?.n.toLocaleString() ?? 'about 75,900' }} stops against the paper's published
              76,274<template v-if="intraracialSamplePctDiff !== null">, a difference of about
              {{ Math.abs(intraracialSamplePctDiff).toFixed(2) }}%</template>. Every one of the six coefficients in the
              Study 1 table above lands
              <template v-if="intraracialMaxDelta !== null">within {{ intraracialMaxDelta.toFixed(3) }} of</template>
              <template v-else>close to</template>
              the corresponding published figure in Table 1.
            </p>
            <p class="text-body-4 mt-6">
              <strong>Study 2 (group travel).</strong> Our sample counts come within about 5% of the published figures
              and our Model 1 coefficients<template v-if="model1MaxDelta !== null"> within
              {{ model1MaxDelta.toFixed(3) }} of the published ones</template><template v-else> closely track the
              published ones</template>. Model 2 omits a weight the paper applies, as described in the note under that
              table, so it is not quite the same model &mdash; how far its estimates sit from the published ones is not
              a measure of how well this reproduction lands.
            </p>
          </AnswerText>
        </section>

        <HorizontalLine class="my-12" :color="true"/>

        <!-- =================
             Limitations for both studies. Previously split between a block
             inside the Study 1 section and this one, with the pre-stop
             selection limit stated in both.
             ================= -->
        <section>
          <h2 id="part6" class="text-heading-3 text-left mb-6">What these analyses cannot tell us</h2>
          <AnswerText>
            <p class="text-body-4">
              <strong>They only see the decision to stop.</strong> Every veil-of-darkness design can detect selection
              on what officers could see <em>before</em> deciding to pull a car over, and nothing else. None of it
              speaks to what happens once the stop begins. Nor is any of it evidence about the total volume of stops:
              the outcome in each model is what <em>kind</em> of stop occurred, not how many.
            </p>
            <p class="text-body-4 mt-6">
              <strong>The veil-of-darkness effects are modest in size.</strong> They shift the odds of a given kind of
              stop by roughly 10% to 30%. Statistically significant does not mean large. The big number on this page is
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
              <template v-if="blackStopsInMajorityWhiteDistricts !== null">&#32;In our sample, only
              {{ blackStopsInMajorityWhiteDistricts.toFixed(1) }}% of stops of young Black men happened in a
              majority-white police district<Tooltip term="District"/> &mdash; one where more than half of residents are
              white.</template><template v-else>&#32;Very few stops of young Black men happen in majority-white police
              districts<Tooltip term="District"/>.</template> So comparing Black
              and white motorists always means comparing different places as well as different people. That is why the
              within-race tests matter most: they hold race constant &mdash; young Black men against young Black men in
              Study 2, Black motorists against Black motorists in Study 1 &mdash; and ask only what changes when
              officers can no longer see into the car.
            </div>
            <p class="text-body-4 mt-6">
              <strong>Recorded stop times are rounded.</strong>
              <template v-if="timeRounding">&#32;In our sample,
              <!--
                One decimal on the quarter-hour figure, deliberately: toFixed(0)
                rendered the measured 19.83% as "20%", the same numeral as the
                multiple-of-five CHANCE baseline in the same sentence, so the
                sentence scanned as a contradiction.
              -->
              {{ timeRounding.pct_multiple_of_5.toFixed(0) }}% of recorded stop times fall on a multiple of five minutes
              and {{ timeRounding.pct_multiple_of_15.toFixed(1) }}% on a quarter hour, far more than chance would
              produce (20% and 6.7%).</template><template v-else>&#32;Officers log times in round numbers far more often than
              chance would produce.</template> A stop logged at 7:30pm may therefore have happened somewhat earlier or
              later. Near the boundary between light and dark that rounding can put a stop on the wrong side of the
              veil, so the roughly 30-minute window between sunset and full dusk is excluded from the analysis
              altogether.
            </p>
          </AnswerText>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import CoefficientGraph from '~/components/CoefficientGraph.vue'
import Graph from '~/components/Graph.vue'
import LineGraph from '~/components/LineGraph.vue'
import SelectYears from '~/components/SelectYears.vue'
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
  type VeilIntraracialGroup,
  type VeilIntraracialLighting,
  type VeilIntraracialYearEstimate,
  type VeilModel,
} from '~/utils/veil'

useHead({
  title: "When police can see who's driving, who do they stop?",
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

// =========================================================================
// Intraracial lead section: age & gender (Hannon & Biddle 2025).
//
// Unlike every other selector on this page, this reads `intraracial`
// straight off the cube bundle rather than through a `utils/veil.ts`
// selector — Task 4 shipped it pre-aggregated (sample, six fitted models,
// eight daylight/dark probabilities), so there is no row-level aggregation
// left to do here.
// =========================================================================
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "2022-01-01" -> "January 2022". */
function monthYearLabel(isoDate: string): string {
  const [year, month] = isoDate.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`
}

/** Hannon & Biddle (2025), p.1083: the paper's published sample size. */
const INTRARACIAL_PAPER_N = 76_274

const intraracial = computed(() => veilBundle.value?.cube?.intraracial ?? null)
const intraracialSample = computed(() => intraracial.value?.sample ?? null)
const intraracialModels = computed(() => intraracial.value?.models ?? null)

// =========================================================================
// Year-by-year trend, sitting ABOVE the reproduction.
//
// A SEPARATE sample from `intraracialSample`: full calendar years 2021-2025
// against the paper's January 2022 - August 2025. 2025 therefore appears in
// both and is not the same quantity in each -- a full year here, eight
// months there -- which the caption states outright. Nothing in this block
// feeds the reproduction's figures.
// =========================================================================
const intraracialByYear = computed(() => intraracial.value?.by_year ?? null)

const TREND_LABEL: Record<VeilIntraracialGroup, string> = {
  young_male: 'Young man (18–29)',
  young_female: 'Young woman (18–29)',
  older_male: 'Older man (30+)',
  older_female: 'Older woman (30+)',
}

// Four hues from the site palette, checked as a set rather than picked by
// eye: worst all-pairs separation is ΔE 9.4 under deutan simulation and
// 25.6 for normal vision, both clear of the floors. Two of them sit under
// 3:1 against the chart surface, which is why the legend below is not
// optional -- it is the relief that makes them identifiable.
const TREND_CLASSES: Record<string, string> = {
  [TREND_LABEL.young_male]: 'stroke-purple fill-purple bg-purple',
  [TREND_LABEL.young_female]: 'stroke-red fill-red bg-red',
  [TREND_LABEL.older_male]: 'stroke-yellowgreen fill-yellowgreen bg-yellowgreen',
  [TREND_LABEL.older_female]: 'stroke-highlight fill-highlight bg-highlight',
}

const TREND_LEGEND: Record<string, string> = Object.fromEntries(
  Object.values(TREND_LABEL).map((label) => [label, label]),
)

const trendYearOptions = computed<string[]>(() =>
  (intraracialByYear.value?.years ?? []).map(String),
)

/**
 * The cube loads lazily, so the years are unknown at setup and the default
 * selection has to be filled in once they arrive. Only seeded while the
 * selection is empty, so a reader's own choice is never overwritten by a
 * later re-evaluation.
 */
const selectedYears = ref<string[]>([])
watch(intraracialByYear, (byYear) => {
  if (byYear && selectedYears.value.length === 0) {
    // `default_years`, not every year: 2020 is selectable but off by
    // default. See the type's comment and the caption beneath the chart.
    selectedYears.value = byYear.default_years.map(String)
  }
}, { immediate: true })

/** Years present in the data but not shown until the reader asks for them. */
const trendOffByDefault = computed<number[]>(() => {
  const byYear = intraracialByYear.value
  if (!byYear) return []
  const shown = new Set(byYear.default_years)
  return byYear.years.filter((y) => !shown.has(y))
})

const trendData = computed(() => {
  const byYear = intraracialByYear.value
  if (!byYear) return []
  const chosen = new Set(selectedYears.value)
  return byYear.estimates
    .filter((e) => chosen.has(String(e.year)))
    .map((e) => ({
      x: String(e.year),
      group: TREND_LABEL[e.outcome],
      value: e.coef,
      ciLo: e.ci_lo,
      ciHi: e.ci_hi,
      // The axis is in log-odds, which is the unit the table further down
      // reports; the tooltip carries the readable form of the same number.
      hoverText: [
        `${TREND_LABEL[e.outcome]}, ${e.year}`,
        e.coef >= 0
          ? `${pctAboveOne(e.odds_ratio)} higher odds after dark`
          : `${pctBelowOne(e.odds_ratio)} lower odds after dark`,
        `95% interval ${e.ci_lo.toFixed(2)} to ${e.ci_hi.toFixed(2)} (p ${fmtP(e.p_value)})`,
        `${e.n.toLocaleString()} stops`,
      ],
    }))
})

/** "2021–2025", from the trend window rather than asserted in the page's voice. */
const trendYearsLabel = computed(() => {
  const years = intraracialByYear.value?.years ?? []
  return years.length ? `${years[0]}–${years[years.length - 1]}` : ''
})

/** The paper's window ends mid-2025; the trend's 2025 is a whole year. */
const trendOverlapYear = computed<number | null>(() => {
  const end = intraracialSample.value?.window_end
  return end ? Number(end.slice(0, 4)) : null
})

/** An estimate's interval clears the no-effect mark in its own right. */
function isSignificant(e: VeilIntraracialYearEstimate): boolean {
  return e.ci_lo > 0 || e.ci_hi < 0
}

function estimatesFor(outcome: VeilIntraracialGroup): VeilIntraracialYearEstimate[] {
  return (intraracialByYear.value?.estimates ?? []).filter((e) => e.outcome === outcome)
}

/**
 * The two headline outcomes across every year fitted.
 *
 * `unbroken` is the page's strongest claim -- every year, both groups,
 * interval clear of zero -- so it is computed rather than asserted. If a
 * future data vintage broke the run, the sentence below stops claiming it.
 */
const trendHeadlineRun = computed(() => {
  const series = [...estimatesFor('young_male'), ...estimatesFor('older_female')]
  if (!series.length) return null
  const hits = series.filter(isSignificant).length
  return { hits, total: series.length, unbroken: hits === series.length }
})

/**
 * Older women across the whole series. This replaces an earlier "the effect
 * appears to be weakening" claim written when only 2021-2025 was fitted:
 * over twelve years the estimate oscillates with no trend, and the recent
 * fall sits inside the band the series has always occupied. Kept as derived
 * values so the wording cannot outlive the data that justified it.
 */
const trendOlderFemaleSpread = computed(() => {
  const series = estimatesFor('older_female')
  if (series.length < 3) return null
  const coefs = series.map((e) => e.coef)
  const min = Math.min(...coefs)
  const max = Math.max(...coefs)
  const last = series[series.length - 1]
  return {
    min,
    max,
    mean: coefs.reduce((a, b) => a + b, 0) / coefs.length,
    last,
    // Is the latest year actually outside the range the earlier years
    // already covered? If not, "declining" is not a claim the data supports.
    lastIsOutsideEarlierRange:
      last.coef < Math.min(...series.slice(0, -1).map((e) => e.coef)),
  }
})

/** How often each pooled-null outcome reaches significance on its own. */
function nullOutcomeSummary(outcome: VeilIntraracialGroup) {
  const series = estimatesFor(outcome)
  const hits = series.filter(isSignificant)
  return {
    hits: hits.length,
    total: series.length,
    years: hits.map((e) => e.year),
    // Sign consistency separates "scattered noise" from "weak but real".
    allSameSign: hits.length > 0 && hits.every((e) => e.coef > 0 || hits.every((h) => h.coef < 0)),
    anyNegative: series.some((e) => e.coef < -0.01),
  }
}

const trendYoungFemale = computed(() => nullOutcomeSummary('young_female'))
const trendOlderMale = computed(() => nullOutcomeSummary('older_male'))
const trendTestCount = computed(() => intraracialByYear.value?.estimates.length ?? 0)

interface IntraracialTableRow {
  key: string
  label: string
  coef: number
  se: number
  paperCoef: number | null
  p: number
  significant: boolean
}

const INTRARACIAL_OUTCOME_LABELS: Record<string, string> = {
  is_young: 'Stopped driver is under 30 (any gender)',
  is_male: 'Stopped driver is male (any age)',
  young_male: 'Stopped driver is under 30 and male',
  young_female: 'Stopped driver is under 30 and female',
  older_male: 'Stopped driver is 30 or older and male',
  older_female: 'Stopped driver is 30 or older and female',
}

const INTRARACIAL_OUTCOME_ORDER = [
  'is_young', 'is_male', 'young_male', 'young_female', 'older_male', 'older_female',
]

/**
 * All six intraracial outcomes, not just the four charted panels: `is_young`
 * and `is_male` are fitted and shipped on the cube but were read by nothing
 * on the page before this table existed. Every field is read off
 * `intraracialModels` (the cube) and `paper_coef` on each model (also
 * cube-sourced, ultimately from `veil.models.INTRARACIAL_TARGETS`) --
 * neither our numbers nor the paper's are typed in here.
 */
const intraracialTableRows = computed<IntraracialTableRow[]>(() => {
  const models = intraracialModels.value
  if (!models) return []
  return INTRARACIAL_OUTCOME_ORDER
    .filter((key) => models[key])
    .map((key) => {
      const model = models[key]
      return {
        key,
        label: INTRARACIAL_OUTCOME_LABELS[key] ?? key,
        coef: model.coef,
        se: model.se,
        // `?? null`, not a bare read: a cube built before this table shipped
        // (paper_coef/paper_se are new fields) carries `undefined` here, not
        // `null`, and every `=== null` check below the table would then miss
        // it and crash on `.toFixed()`. Coercing once here means the rest of
        // this file can treat "no published figure" as exactly one value.
        paperCoef: model.paper_coef ?? null,
        p: model.p_value,
        significant: model.p_value < 0.05,
      }
    })
})

/**
 * How far our six intraracial coefficients sit from Table 1 -- DERIVED, so
 * the "within 0.012" sentence below the table cannot drift the way the page
 * previously drifted on the 2026 Model 1 sentence (see `model1MaxDelta`).
 */
const intraracialMaxDelta = computed<number | null>(() => {
  const deltas = intraracialTableRows.value
    .filter((row) => row.paperCoef !== null)
    .map((row) => Math.abs(row.coef - (row.paperCoef as number)))
  if (deltas.length === 0) return null
  return Math.ceil(Math.max(...deltas) * 1000) / 1000
})

/** Our sample size against the paper's published 76,274, as a signed percentage. */
const intraracialSamplePctDiff = computed<number | null>(() => {
  const n = intraracialSample.value?.n
  if (!n) return null
  return ((n - INTRARACIAL_PAPER_N) / INTRARACIAL_PAPER_N) * 100
})

const intraracialDistrictsLabel = computed(() => {
  const districts = intraracialSample.value?.districts
  return districts ? districts.join(', ') : '12, 14, 16, 18, 19, 22, 35, 39'
})

const intraracialWindowLabel = computed(() => {
  const sample = intraracialSample.value
  if (!sample) return 'January 2022 to August 2025'
  return `${monthYearLabel(sample.window_start)} to ${monthYearLabel(sample.window_end)}`
})

interface IntraracialPanel {
  key: VeilIntraracialGroup
  title: string
  yScaleDomainMax: number
  footer: string
  data: Array<{ group: string; Lighting: string; 'Percentage (%)': number; hover_text: string[] }>
}

/**
 * Each panel's own y-axis ceiling. The four groups' probabilities span
 * roughly 9%-50%, so a single shared domain (as the group-travel chart
 * below uses) would flatten three of the four panels into apparently flat
 * lines. Set with headroom above each group's own max, not derived from
 * all four at once.
 *
 * `isNull` marks the two groups where darkness does not move the odds
 * (young_female, older_male) -- see `test_the_two_null_results_stay_null`
 * in pipeline/tests/test_intraracial.py. The panel title and footer both
 * say so; a reader skimming just the chart grid should not need the prose
 * paragraph below it to know which two results are null.
 */
const PANEL_META: Record<VeilIntraracialGroup, { title: string; yScaleDomainMax: number; isNull: boolean }> = {
  young_male: { title: 'Stopped driver is under 30 and male', yScaleDomainMax: 30, isNull: false },
  young_female: {
    title: 'Stopped driver is under 30 and female (no statistically significant change)',
    yScaleDomainMax: 12,
    isNull: true,
  },
  older_male: {
    title: 'Stopped driver is 30 or older and male (no statistically significant change)',
    yScaleDomainMax: 60,
    isNull: true,
  },
  older_female: { title: 'Stopped driver is 30 or older and female', yScaleDomainMax: 22, isNull: false },
}

const PANEL_ORDER: VeilIntraracialGroup[] = ['young_male', 'young_female', 'older_male', 'older_female']

const LIGHTING_X_LABEL: Record<VeilIntraracialLighting, string> = {
  daylight: 'Daylight',
  dark: 'After dark',
}

/**
 * Footer caption for one intraracial panel: the two probabilities plotted,
 * stated as model-adjusted predicted probabilities (not raw shares -- see
 * `:354` for the same distinction made about the 2026 charts), the p-value
 * driving the null/non-null label, and what the change means in words.
 */
function intraracialFooter(key: VeilIntraracialGroup, daylightPct: number, darkPct: number): string {
  const model = intraracialModels.value?.[key]
  const pText = model ? `p ${fmtP(model.p_value)}` : 'p not available'
  const base = `Model-adjusted predicted probability that a stopped Black driver falls in this group, ` +
    `holding clock time, day of week, year, police area, assigned unit and season fixed at their sample ` +
    `average or most common level: ${fmtPct(daylightPct)} in daylight versus ${fmtPct(darkPct)} after dark (${pText}).`
  if (PANEL_META[key].isNull) {
    return `${base} Darkness does not move this probability by a statistically detectable amount.`
  }
  const verb = darkPct > daylightPct ? 'raises' : 'lowers'
  return `${base} Darkness ${verb} this probability, part of the shift described above.`
}

const intraracialPanels = computed<IntraracialPanel[]>(() => {
  const probabilities = intraracial.value?.probabilities
  if (!probabilities) return []
  return PANEL_ORDER.map((key) => {
    const points = probabilities.filter((p) => p.group === key)
    const meta = PANEL_META[key]
    const daylightPct = points.find((p) => p.lighting === 'daylight')?.pct ?? 0
    const darkPct = points.find((p) => p.lighting === 'dark')?.pct ?? 0
    return {
      key,
      title: meta.title,
      yScaleDomainMax: meta.yScaleDomainMax,
      footer: intraracialFooter(key, daylightPct, darkPct),
      data: (['daylight', 'dark'] as const).map((lighting) => {
        const point = points.find((p) => p.lighting === lighting)
        const pct = point?.pct ?? 0
        return {
          group: key,
          Lighting: LIGHTING_X_LABEL[lighting],
          'Percentage (%)': pct,
          hover_text: [
            meta.title.replace(' (no statistically significant change)', ''),
            LIGHTING_X_LABEL[lighting],
            `${fmtPct(pct)} model-adjusted predicted probability`,
          ],
        }
      }),
    }
  })
})

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`
}

/** "12% lower" style phrasing for an odds ratio below 1. */
function pctBelowOne(oddsRatio: number): string {
  return `${Math.round((1 - oddsRatio) * 100)}%`
}

/** "29% higher" style phrasing for an odds ratio above 1. */
function pctAboveOne(oddsRatio: number): string {
  return `${Math.round((oddsRatio - 1) * 100)}%`
}

/** p-values render as "< .001" below that floor, else to three decimals. */
function fmtP(p: number): string {
  return p < 0.001 ? '< .001' : `= ${p.toFixed(3)}`
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
  const lightWord = (p: ClockBinPoint) => (p.lighting === 'dark' ? 'after dark' : 'in daylight')

  const kept: ClockBinPoint[][] = []
  // One entry per DROPPED clock time, carrying the reason it was dropped.
  // Per-bin rather than per-bar, because a bin dropped for thinness still
  // has a well-populated half, and describing that half as unpaired would be
  // wrong.
  const suppressed: string[] = []
  for (const [bin, binPoints] of [...bins.entries()].sort((a, b) => a[0] - b[0])) {
    const missingState = LIGHTING_STATES.some(
      (state) => !binPoints.some((p) => p.lighting === state),
    )
    const thin = binPoints.filter((p) => p.stops < MIN_BIN_STOPS)
    if (!missingState && thin.length === 0) {
      kept.push(binPoints)
      continue
    }
    if (missingState) {
      suppressed.push(
        `${clockLabel(bin)} appears only ${binPoints.map(lightWord).join(' and ')}, with nothing to compare it against`,
      )
    } else {
      suppressed.push(
        thin
          .map((p) => `${clockLabel(bin)} ${lightWord(p)} has only ${p.stops.toLocaleString()} stops`)
          .join(' and '),
      )
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

  return {
    xAxis,
    yAxis,
    title: `Share of Stops of Young Black Men That Were Multi-Occupant Cars, by Time of Evening and Light, ${YEARS_LABEL}`,
    data,
    shownBins: kept.length,
    daylightHigherBins,
    suppressedSummary: suppressed.join(', and '),
    suppressedBins: suppressed.length,
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
  /**
   * Share of this fit's rows whose police_area folded into OTHER, or null for
   * a model_1 fit (no location term). Drives the table's daggered warning.
   */
  areaOtherShare: number | null
  /** True when the location control is too hollow to present unqualified. */
  locationControlHollow: boolean
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
  const share = areaOtherShare(key)
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
    areaOtherShare: share,
    locationControlHollow: share !== null && share > HOLLOW_AREA_SHARE,
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
  const headline = ['party_is_black.model_2', 'has_black_passenger.model_2']
    .map(areaOtherShare)
    .filter((v): v is number => v !== null)
  return {
    headlineMax: headline.length ? Math.max(...headline) : null,
    placebo: areaOtherShare('placebo_white.model_2'),
  }
})

/**
 * Percentage of a model_2 fit's ROWS whose police_area folded into OTHER.
 * Null for model_1 fits, which have no location term at all.
 */
function areaOtherShare(key: string): number | null {
  const value = veilBundle.value?.cube?.models?.[key]?.other_row_share?.police_area
  return typeof value === 'number' ? value * 100 : null
}

/**
 * Above this share of rows in the OTHER area bucket, a Model 2 fit's location
 * control is not meaningfully doing its job and the row must be marked in the
 * table rather than only discussed in the caption below it.
 *
 * The adjective the caption uses is DERIVED from the measured share, not
 * hard-coded. It previously read "largely hollow" unconditionally while the
 * percentage next to it was computed, so a future data vintage that pushed
 * the placebo's share down to, say, 8% would have rendered "areas holding 8%
 * ... largely hollow" — self-contradicting, with nothing failing. See
 * `areaControlWording`.
 */
const HOLLOW_AREA_SHARE = 20
/** Below this, collapsing is cheap enough to call the control sound. */
const SOUND_AREA_SHARE = 10

/** Wording for a Model 2 row's location control, scaled to the measured share. */
function areaControlWording(share: number): { adjective: string; caveat: string } {
  if (share > HOLLOW_AREA_SHARE) {
    return {
      adjective: 'largely hollow',
      caveat: 'this estimate should not be read as location-adjusted',
    }
  }
  if (share > SOUND_AREA_SHARE) {
    return {
      adjective: 'materially weakened',
      caveat: 'this estimate is only partly location-adjusted',
    }
  }
  return {
    adjective: 'largely intact',
    caveat: 'this estimate is location-adjusted like the rows above it',
  }
}

/** Derived wording for the placebo row's location-control disclosure. */
const placeboAreaControl = computed(() => {
  const share = areaOtherShares.value.placebo
  return share === null ? null : { share, ...areaControlWording(share) }
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

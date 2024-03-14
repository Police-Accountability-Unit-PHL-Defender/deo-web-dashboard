<template>
  <LayoutPageHeader>
    <template #header>
      About the Data
    </template>
    <template #image>
      <img class="w-full h-full object-cover" src="~/assets/images/data.jpg" alt="A street in Philadelphia"/>
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

  <div class="layout-container text-body-2">
    <div class="grid-container">
      <div class="faq col-span-8 md:col-start-3">
        <h2 class="text-heading-3 text-center mt-20 mb-4">About the Dashboard</h2>
        <ol>
          <FaqQuestion id="1" question="What datasets are in this dashboard?">
            <p>The datasets in this dashboard are: </p>
            <ul>
              <li><a href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">Traffic
                  stops</a> by the Philadelphia Police Department (PPD)</li>
              <li>The <a href="https://opendataphilly.org/datasets/vision-zero-high-injury-network/" target="_blank">Vision Zero
                  High Injury Network</a>, or Philadelphia streets with the highest rates of fatalities and serious injuries per
                mile</li>
              <li><a href="https://data.census.gov/table?g=050XX00US42101$1400000&d=DEC+Demographic+Profile"
                  target="_blank">Census demographics</a> of Philadelphia</li>
              <li><a href="https://opendataphilly.org/datasets/shooting-victims/" target="_blank">Shootings</a> in Philadelphia
              </li>
              <li>Maps of <a href="https://opendataphilly.org/datasets/police-service-areas/" target="_blank">Police Service
                  Areas</a>, <a href="https://opendataphilly.org/datasets/police-districts/" target="_blank">Police Districts</a>,
                and <a href="https://opendataphilly.org/datasets/police-divisions/" target="_blank">Police Divisions</a> </li>
            </ul>
          </FaqQuestion>
          <FaqQuestion id="2" question="What does this dashboard mean by “traffic stops”?">
            <p>For ease of understanding, this dashboard uses the term “traffic stops” for all Philadelphia Police Department
              (PPD) vehicle stops. While the majority of PPD vehicle stops are for traffic violations, approximately 2% of vehicle
              stops are for other police actions, such as criminal investigations. The <a
                href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">traffic
                stops</a> dataset does not differentiate between stops for traffic infractions and other types of vehicle stops.
            </p>
          </FaqQuestion>
          <FaqQuestion id="3" question="What benefits could this dashboard have, and for whom?">
            <p>This dashboard aims to make traffic stop and public safety data more transparent and interactive, with a particular
              focus on racial disparities in policing. By exploring this dashboard, Philadelphians can better understand how
              traffic stops impact their communities. Journalists and researchers can study policing patterns throughout the city.
              Community leaders, policymakers, and legal professionals can contextualize the harmful impacts of racially biased
              policing in the city to advocate for change.</p>
          </FaqQuestion>
          <FaqQuestion id="4" question="Does this dashboard contain any personally identifiable information?">
            <p>No. This dashboard uses only anonymized public datasets which contain no personally identifiable information.
              Public <a href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">traffic stop
                data</a> does not identify either police officers or the people they stopped. Public <a
                href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">traffic stop
                data</a> also anonymizes the location of stops by listing the block number rather than the exact address. Data on
              <a href="https://opendataphilly.org/datasets/shooting-victims/" target="_blank">shootings</a> has basic demographic
              details of the people involved in shootings. Data on <a href="https://opendataphilly.org/datasets/crime-incidents/"
                target="_blank">crime incidents</a> has no information on the people involved, and data on <a
                href="https://opendataphilly.org/datasets/arrests/" target="_blank">arrests</a> includes only the purported race
               of the person arrested. <a
                href="https://data.census.gov/table?g=050XX00US42101$1400000&d=DEC+Demographic+Profile"
                target="_blank">Census data</a> and the <a
                href="https://opendataphilly.org/datasets/vision-zero-high-injury-network/" target="_blank">Vision Zero High
                Injury Network</a> never publish personally identifiable information.</p>
          </FaqQuestion>
          <FaqQuestion id="5" question="Is the code for this dashboard open-source?">
            <p>Yes, all code for this dashboard is open-source and available to the public on <a href="https://github.com/Police-Accountability-Unit-PHL-Defender" target="_blank">Github</a>. </p>
          </FaqQuestion>
          <FaqQuestion id="6" question="How does this dashboard represent race, ethnicity, and gender?">
            <p>This dashboard derives data on race, ethnicity, and gender from two datasets: <a
      href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">traffic stop
      data</a> and <a href="https://data.census.gov/table?g=050XX00US42101$1400000&d=DEC+Demographic+Profile"
      target="_blank">Census data</a>.</p>
  <ul>
    <li>In traffic stop data: The race, ethnicity, and gender of drivers and passengers is based on limited categories
      reported by police. Based on police perception, officers report drivers’ and passengers’ genders as “Male” or
      Female,” and their race as “American Indian,” “Asian,” “Black-Latino,” “Black Non-Latino,” “Unknown,”
      “White-Latino,” or “White Non-Latino.” </li>
    <li>In Census data: Race and ethnicity are based on self-identification. Racial identities include “American Indian
      or Alaska Native,” “Asian,” “Black or African American,” “Native Hawaiian or Other Pacific Islander,” “Some Other
      Race,” “Two or More Races,” or “White.” Census data separates ethnicity from race, identifying people as either
      “Hispanic or Latino” or “Not Hispanic or Latino.” Census data does not include gender; it represents people’s sex
      as either “Male” or “Female.”</li>
  </ul>
  <p>To connect traffic stop data and Census data, this dashboard represents gender, race, and ethnicity in the
    following ways:</p>
  <ul>
    <li>This dashboard is limited to representing drivers’ and passengers’ genders as “Male” or “Female.” Although these
      two genders are not inclusive of all gender identities, they are the only available choices reported by
      Philadelphia police.</li>
    <li>This dashboard includes race and ethnicity together, representing people as “Asian,” “Black,” “Latino,” “White,”
      and “All Other Races.” </li>
    <li>Consistent with widely-used Census analyses, this dashboard represents Latino identity as a person’s predominant
      racial and ethnic identity. For example:</li>
  </ul>
  <ul>
    <li>If traffic stop data identifies a driver or passenger as “Black-Latino,” this dashboard represents them as
      “Latino.” This distinction is similar to the Census representation of Latino identity “<a
        href="https://www.census.gov/library/stories/2021/08/improved-race-ethnicity-measures-reveal-united-states-population-much-more-multiracial.html"
        target="_blank">alone or in combination with another group</a>.” </li>
    <li>If traffic stop data identifies a driver or passenger as “Black Non-Latino,” this dashboard represents them as
      “Black.” </li>
    <li>If traffic stop data identifies a driver or passenger as “White Non-Latino,” this dashboard represents them as
      “White.”</li>
  </ul>
  <ul>
    <li>Since the Census has a wider range of racial identities than traffic stop data, this dashboard’s “All Other
      Races” category includes the Census’s wider range of identities. </li>
  </ul>
  <ul>
    <li>Drivers and passengers identified as “American Indian” by Philadelphia police represent 0.3% of traffic stops,
      so this limited sample size is too small for this dashboard to analyze on its own.  </li>
  </ul>
          </FaqQuestion>
        </ol>

        <h2 class="text-heading-3 text-center mt-18 mb-4 pt-6">Since Driving Equality</h2>
        <ol start="7">
          <FaqQuestion id="7" question="Who manages the traffic stop data, and how is data collected?">
            <p><a href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">Traffic stop
      data</a> is managed by the Philadelphia Police Department (PPD) and available publicly on OpenDataPhilly. The data
    is collected from Vehicle and Pedestrian Investigation forms, also called 75-48As, which PPD is required to create
    any time they stop a vehicle (see <a
      href="https://www.phillypolice.com/assets/directives/D12.11-ComplaintOrIncidentReport.pdf" target="_blank">PPD
      Directive 12.11</a>, Appendix “B”). The forms include more than 70 fields and contain information about who was
    stopped and why. OpenDataPhilly anonymizes, cleans, and restricts some of those fields and releases the remaining
    information publicly. </p>
          </FaqQuestion>
          <FaqQuestion id="8" question="How often is the traffic stop data updated, and how far back does it go?">
            <p>The Philadelphia Police Department (PPD) updates the <a
      href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">traffic stop
      data</a> daily, but there is a two-week lag before data is made public on OpenDataPhilly for PPD’s operational
    approval processes. The public traffic stop data goes back to January 1, 2014.</p>
          </FaqQuestion>
          <FaqQuestion id="9" question="What information is in the traffic stop data?">
            <p>The public <a href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">traffic
      stop data</a> includes: </p>
  <ul>
    <li>whether the stop was of a pedestrian or vehicle (this dashboard only analyzes vehicle stops) </li>
    <li>the age, gender, race, and ethnicity of people stopped </li>
    <li>the date and time of the stop </li>
    <li>the location of the stop to the nearest block </li>
    <li>the police district and police service area (PSA) where police made the stop </li>
    <li>whether police frisked, searched, or recovered contraband from a driver, passenger, or vehicle</li>
    <li>whether police arrested anyone during the stop</li>
  </ul>
  <p>To comply with the <a
      href="https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-285029#JD_12-201"
      target="_blank">Driving Equality companion data ordinance</a>, the Philadelphia Police Department (PPD) has begun
    to make more data public on OpenDataPhilly, including the reason(s) for some traffic stops and whether police found
    a weapon during the stop. </p>
          </FaqQuestion>
          <FaqQuestion id="10" question="What is the Bailey data, and is the public traffic stop data in this dashboard the same as the Bailey data?">
            <p>No, it is not the same. These two datasets are related but distinct. The public <a
      href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">traffic stop
      data</a> in this dashboard is released on OpenDataPhilly and only includes a subset of the data that police
    collect on each stop. A more comprehensive dataset, known as the Bailey dataset, is confidential and is compiled as
    required by the settlement agreement in the class-action lawsuit <a
      href="https://www.aclupa.org/en/cases/bailey-et-al-v-city-philadelphia-et-al" target="_blank">Bailey, et al. v.
      City of Philadelphia</a> (2010). The confidential Bailey dataset contains more information than the PPD publishes
    publicly, including personally identifiable information and information about the officers who made each stop.</p>
          </FaqQuestion>
          <FaqQuestion id="11" question="What are the limitations of the traffic stop data?">
            <p>The race, ethnicity, and gender of drivers and passengers in traffic stop data is based on what is reported by
    police, rather than how the person identifies. Police officers might not always accurately perceive or properly
    document information about the stops they make and the people they stop for a variety of reasons including human
    error. </p>
  <p>To comply with the <a
      href="https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-285029#JD_12-201"
      target="_blank">Driving Equality companion data ordinance</a>, the Philadelphia Police Department (PPD) has begun
    to make more traffic stop data public on OpenDataPhilly, including partial information on the reason for each
    traffic stop and whether police found a gun during the stop. However, the PPD is slowly complying with the data requirements, resulting in missing reasons for some traffic stops in the data set at the time of this dashboard’s publication. In addition, for a period of time, OpenDataPhilly recorded the reasons for some traffic stops in 2021. However, that data was subsequently removed from OpenDataPhilly. To perform some analyses, this dashboard uses a saved version of 2021 data that includes the stops with stop reasons.</p>
  <p>Additionally, the data also has some information that is unreliable. For example, the data includes the latitude
    and longitude of each stop, but the coordinates sometimes <a
      href="https://www.inquirer.com/news/philadelphia/police-crime-data-maps-disney-world-20220922.html"
      target="_blank">wrongly point to Disney World</a> or Erie, PA. </p>
  <p>While imperfect, <a href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/"
      target="_blank">traffic stop data</a> is the most comprehensive information publicly available on police traffic
    enforcement in Philadelphia.</p>
          </FaqQuestion>
          <FaqQuestion id="12" question="Was the traffic stop data cleaned before analysis?">
            <p>Yes. Because the <a href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/"
      target="_blank">traffic stop data</a> contains one row per individual who has interacted with police during a
    vehicle or pedestrian stop, this dashboard filters the data to analyze only vehicle stops, then groups the data from
    a per-individual to per-vehicle basis. This dashboard uses the data from a per-vehicle basis to count the number of
    stops, such as stops within a location, stops across a time period, or stops of different demographic groups. For
    stops involving more than one person, the traffic stop data does not clarify who is a driver or passenger, so this
    dashboard estimates the driver’s demographic information by choosing the first individual listed as part of the
    stop. </p>
  <p>The Defender has performed an in-depth analysis of traffic stop data in the past and determined that the majority
    of traffic stops consist of a driver and no passengers. When there is one passenger—the second most likely scenario
    after no passengers—that person is the same race as the driver in the majority of stops. The Defender did not see
    significant variation in the racial or gender demographics of people stopped, even when choosing the second person
    listed in a stop as the driver.   </p>
          </FaqQuestion>
          <FaqQuestion id="13" question="How does this dashboard measure frisks, searches, and intrusions?">
            <p>Frisks and searches are fields within the <a
      href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">traffic stop
      data</a>. “Intrusions” are not a field in the dataset. Rather, this is a term used in this dashboard to reflect
    both searches and frisks as intrusions by police on  drivers, passengers, and vehicles. In this dashboard:</p>
  <ul>
    <li>A “frisk” refers to a traffic stop where police frisk the vehicle, any passenger, and/or the driver. Frisks are
      stops involving at least one frisk. </li>
    <li>A “search” refers to a traffic stop where police search the vehicle, any passenger, and/or the driver. Searches
      are stops involving at least one search. </li>
    <li>An “intrusion” refers to a traffic stop where police frisk and/or search a vehicle, any passenger, and/or the
      driver. Intrusions are stops involving at least one frisk and/or search.</li>
    <li>Because “frisk” and “search” have specific legal meanings, a person or vehicle could be frisked and/or searched.
       </li>
    <li>When discussing age, gender, race, and ethnicity in regard to all intrusions, this dashboard refers to the
      demographic information for the vehicle’s driver.</li>
  </ul>
          </FaqQuestion>
          <FaqQuestion id="14" question="Where can I download traffic stop data and any associated documentation?">
            <p>Traffic stop data is public and can be downloaded from OpenDataPhilly’s <a
      href="https://opendataphilly.org/datasets/vehicle-pedestrian-investigations/" target="_blank">Vehicle and
      Pedestrian Investigations</a> dataset. To analyze traffic stops, the data must be filtered to exclude pedestrian
    stops. The data documentation can be found <a
      href="https://metadata.phila.gov/#home/datasetdetails/571787614fc865407e3cf2b4/representationdetails/571787614fc865407e3cf2b8/"
      target="_blank">here</a>.</p>
          </FaqQuestion>
        </ol>

        <h2 class="text-heading-3 text-center mt-18 mb-4 pt-6">High Injury Network Data</h2>
        <ol start="15">
          <FaqQuestion id="15" question="What is the High Injury Network?">
            <p>The <a href="https://phl.maps.arcgis.com/apps/MapSeries/index.html?appid%3D2a51d5357e24439996f2aa9cdeae72b9"
      target="_blank">High Injury Network</a> (HIN) refers to the Philadelphia streets with the highest rates of
    fatalities and serious injuries per mile. The HIN represents 12% of all roadways in the city where 80% of fatal
    crashes or serious accidents happen. <a href="https://visionzerophl.com/" target="_blank">Vision Zero</a>, a task
    force created by Mayor Jim Kenney in 2016, maintains HIN data. Vision Zero released the most recent HIN data in 2020
    based on Street Centerline data from the Philadelphia Streets Department and 2014-2018 traffic crash data from
    PennDOT. </p>
          </FaqQuestion>
          <FaqQuestion id="16" question="How does this dashboard join High Injury Network data to traffic stop data?">
            <p>This dashboard uses the police-provided latitude and longitude of each traffic stop to count how many stops took
    place on the High Injury Network (HIN). In this dashboard, any traffic stop that is within approximately 10 meters
    of an HIN roadway is considered to be “on” the HIN. Importantly, this HIN analysis only includes traffic stops with
    valid location data. For example, this analysis excludes traffic stop data that is erroneously geocoded to a null
    location or to a single location in Erie, PA (42.2243359, -80.50237161).</p>
          </FaqQuestion>
          <FaqQuestion id="17" question="Where can I download the High Injury Network data and any associated documentation?">
            <p>High Injury Network (HIN) data is public and can be downloaded from OpenDataPhilly’s <a
      href="https://opendataphilly.org/datasets/vision-zero-high-injury-network/" target="_blank">Vision Zero High
      Injury Network</a> dataset. HIN methodology can be found <a
      href="https://phl.maps.arcgis.com/apps/MapSeries/index.html?appid=2a51d5357e24439996f2aa9cdeae72b9"
      target="_blank">here</a>. </p>
          </FaqQuestion>
        </ol>

        <h2 class="text-heading-3 text-center mt-18 mb-4 pt-6">Census Data</h2>
        <ol start="18">
          <FaqQuestion id="18" question="Who manages the Census data, and how is data collected?">
            <p>The U.S. Census Bureau manages all Census data including the 2020 <a
      href="https://data.census.gov/table?g=050XX00US42101$1400000&d=DEC+Demographic+Profile"
      target="_blank">Census data</a> used in this dashboard. Once a decade, population data is collected via a national
    network of Census workers who survey nearly everyone in the U.S. </p>
          </FaqQuestion>
          <FaqQuestion id="19" question="When was the Census data last updated?">
            <p>The Philadelphia <a
      href="https://data.census.gov/table?g=050XX00US42101$1400000&d=DEC+Demographic+Profile"
      target="_blank">demographic data</a> used in this dashboard comes from the 2020 Census. Data was collected from
    March 12, 2020 until October 15, 2020 and was made public on April 26, 2021. </p>
          </FaqQuestion>
          <FaqQuestion id="20" question="Which Census information is used in this analysis?">
            <p>The only Census data used in this dashboard is <a
      href="https://data.census.gov/table?g=050XX00US42101$1400000&d=DEC+Demographic+Profile"
      target="_blank">demographic data</a> on Philadelphia residents’ racial and ethnic identities, grouped at the
    census tract level. This dashboard also matches Census tracts to their respective Philadelphia Police Department
    (PPD) police service areas (PSAs).</p>
          </FaqQuestion>
          <FaqQuestion id="21" question="How does this dashboard join Census data to traffic stop data?">
            <p>Census data is based on small neighborhood blocks called census tracts, while traffic stop data is organized into
    police districts and the police service areas (PSAs) within districts. To map census tracts onto PSAs, this
    dashboard uses a common statistical method known as the “centroid” method. Using Census shapefiles, this dashboard
    looks at the geographic coordinates of the centerpoint (or “centroid”) of each census tract. If the centroid of a
    census tract falls within a PSA, then that census tract’s demographic data is considered to be the demographic data
    of the PSA.</p>
          </FaqQuestion>
          <FaqQuestion id="22" question="Why does this dashboard not compare the racial demographics of neighborhoods to the racial demographics of people stopped by police?">
            <p>This dashboard avoids comparing who lives in a neighborhood to who police stop on the roads within that
    neighborhood. This is for several reasons, including: </p>
  <ul>
    <li>The people driving in a neighborhood may not live there.</li>
    <li>Not all neighborhood residents drive.</li>
    <li>Police don’t solely stop neighborhood residents.</li>
    <li>Income and race can bias who drives where. </li>
  </ul>
  <p>Citywide, it may be useful to compare who lives in Philadelphia to who police stop in Philadelphia, but at the
    neighborhood level, such comparisons may be problematic. </p>
          </FaqQuestion>
          <FaqQuestion id="23" question="How does this dashboard calculate majority-white districts?">
            <p>This dashboard has some visualizations that sort police districts by the percentage of residents who are white, per
    Census data. In these visualizations, District 77 is excluded, as this district is the Philadelphia International
    Airport, has no residents, and thus has no Census data.</p>
          </FaqQuestion>
          <FaqQuestion id="24" question="Where can I download Census data and any associated documentation?">
            <p>A citywide demographic profile of Philadelphia can be downloaded from the <a
      href="https://data.census.gov/table?g=050XX00US42101&d=DEC+Demographic+Profile" target="_blank">U.S.
      Census Bureau</a>. Demographic data for each Philadelphia census tract can be downloaded from the <a
      href="https://data.census.gov/table?g=050XX00US42101$1400000&d=DEC+Demographic+Profile"
      target="_blank">U.S. Census Bureau</a>. </p>
  <p>This <a
      href="https://github.com/ssuffian/censusify-philly/blob/main/scripts/Explanation%20of%20Mapping%20Census%20Data%20to%20Police%20Geographies.ipynb"
      target="_blank">Github repository</a> explains how to download Census data and map it to Philadelphia police
    service areas (PSAs). </p>
          </FaqQuestion>

          <h2 class="text-heading-3 text-center mt-18 mb-4 pt-6">Shootings Data</h2>
          <FaqQuestion id="25" question="Who manages the shootings data, and how is data collected?">
            <p><a href="https://opendataphilly.org/datasets/shooting-victims/" target="_blank">Shootings data</a> is managed by
    the Statistics Unit of the Philadelphia Police Department (PPD) and is collected from PPD reports. </p>
          </FaqQuestion>
          <FaqQuestion id="26" question="When is the shootings data updated, and how far back does it go?">
            <p><a href="https://opendataphilly.org/datasets/shooting-victims/" target="_blank">Shootings data</a> is updated daily
    with a one-day lag, or up to a three-day lag on the weekends, before data is made public on OpenDataPhilly. The data
    goes back to January 1, 2015.</p>
          </FaqQuestion>
          <FaqQuestion id="27" question="What information is in the shootings data?">
            <p><a href="https://opendataphilly.org/datasets/shooting-victims/" target="_blank">Shootings data</a> includes: the
    date and time of the shooting; the latitude, longitude, block, and police district where the shooting happened; the
    race, ethnicity, gender, and age of any person(s) shot; the type of wound; whether the shooting was fatal; whether
    the alleged shooter was injured or killed; whether a police officer was involved in the shooting; and the crime code
    of the shooting.</p>
          </FaqQuestion>
          <FaqQuestion id="28" question="What are the limitations of the shootings data?">
            <p><a href="https://opendataphilly.org/datasets/shooting-victims/" target="_blank">Shootings data</a> only includes
    incidents in which someone was shot; it does not record incidents in which shots were fired but no one was hit. Some
    data may not be updated; for example, data may not reflect that some people initially characterized as wounded may
    later succumb to their injuries. Data on whether a shooter was injured may not be accurate. These limitations are
    sporadic and assumed to be insignificant.</p>
          </FaqQuestion>
          <FaqQuestion id="29" question="Where can I download shooting data and any associated documentation?">
            <p>Shooting data is public and can be downloaded from OpenDataPhilly’s <a
      href="https://opendataphilly.org/datasets/shooting-victims/" target="_blank">Shootings</a> dataset. The
    documentation can be found <a
      href="https://metadata.phila.gov/#home/datasetdetails/5719551277d6389f3005a610/representationdetails/5719551277d6389f3005a614/?view_287_page=1"
      target="_blank">here</a>. </p>
          </FaqQuestion>
        </ol>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
ol {
  @apply pl-6;

  & > li {
    list-style: decimal;
    list-style-position: outside;
  }
}
ul {
  list-style: disc;
  @apply m-0 pl-5;
  & > li {
    @apply my-4
  }
}
details {
  @apply -ml-6 pl-6 border-b border-neutral-600;
  & > summary {
    list-style: none;
    @apply relative cursor-pointer py-4 pr-8;

    &::marker, &::-webkit-details-marker {
      display: none;
    }

    &::after {
      content: "";
      background-image: url('~/assets/icons/chevron.svg');
      background-repeat: no-repeat;
      @apply absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8;
    }
  }
  &[open] {
    @apply pb-4;

    & > summary {
      @apply font-medium;

      &::after {
        @apply transform rotate-180;
      }
    }
  }

  p {
    @apply mb-4;
  }
}
a {
  @apply underline text-primary-600 hover:text-primary-800;
}
table.timeline {
  th {
    @apply font-medium w-[10em] align-top border border-neutral-400 p-2;
  }
  td {
    @apply border border-neutral-400 p-2;
  }
}
</style>
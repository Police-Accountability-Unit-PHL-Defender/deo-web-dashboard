import { reportingPeriods } from '~/utils/reportingPeriods'

function getPreviousQuarter() {
    const now = new Date();
    let year = now.getFullYear();
    const month = now.getMonth() + 1; // Months are 0-indexed
    let quarter = Math.ceil(month / 3);

    return Quarter.fromParamString(`${year}-Q${quarter}`).getPreviousQuarter().toParamString();
}

export default defineNuxtPlugin(() => {
    // mostRecentQuarter = (current calendar quarter) - 1. Mirrors the
    // computation in deo_backend/models.py:MOST_RECENT_QUARTER.
    //
    // The e2e parity harness pins this (and the year derived from it) so a
    // local build can be compared against a production site that was built in
    // an earlier quarter. Never set these in a real deploy.
    const pinned = useRuntimeConfig().public.pinnedMostRecentQuarter;
    const mostRecentQuarter = pinned || getPreviousQuarter();
    // Keep the calendar/pin as a ceiling. Defaults and selectable periods
    // come from the data, including when a refresh is missed.
    const coverage = useRuntimeConfig().public.cubeQuarters;
    const stops = reportingPeriods(coverage.stops, mostRecentQuarter);
    const reasons = reportingPeriods(coverage.reasons, mostRecentQuarter);
    useState('mostRecentQuarter', () => mostRecentQuarter);
    useState('stopsQuarters', () => stops.available);
    useState('latestStopsQuarter', () => stops.latest);
    useState('deoYears', () => reasons.completeYears.filter(year => year >= 2022));
});

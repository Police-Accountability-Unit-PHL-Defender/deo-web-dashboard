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
    // DEO_YEARS = list(range(2022, current_year)) — full calendar years
    // since the Driving Equality Ordinance took effect.
    const currentYear = pinned
        ? Number(pinned.split('-Q')[0])
        : new Date().getFullYear();
    const deoYears = [];
    for (let y = 2022; y < currentYear; y += 1) deoYears.push(y);
    useState('mostRecentQuarter', () => mostRecentQuarter);
    useState('deoYears', () => deoYears);
});

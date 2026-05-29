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
    const mostRecentQuarter = getPreviousQuarter();
    // DEO_YEARS = list(range(2022, current_year)) — full calendar years
    // since the Driving Equality Ordinance took effect.
    const currentYear = new Date().getFullYear();
    const deoYears = [];
    for (let y = 2022; y < currentYear; y += 1) deoYears.push(y);
    useState('mostRecentQuarter', () => mostRecentQuarter);
    useState('deoYears', () => deoYears);
});

function getPreviousQuarter() {
    const now = new Date();
    let year = now.getFullYear();
    const month = now.getMonth() + 1; // Months are 0-indexed
    let quarter = Math.ceil(month / 3);

    return Quarter.fromParamString(`${year}-Q${quarter}`).getPreviousQuarter().toParamString();
}

export default defineNuxtPlugin(async (nuxtApp) => {
    const runtimeConfig = useRuntimeConfig();
    const fallbackQuarter = getPreviousQuarter();
    // Mirror deo_backend/models.py: DEO_YEARS = list(range(2022, current_year))
    // i.e. complete years since DEO came into effect (2022) up to but not
    // including the current year. Derived, not hardcoded.
    const currentYear = new Date().getFullYear();
    const fallbackDeoYears = [];
    for (let y = 2022; y < currentYear; y += 1) fallbackDeoYears.push(y);
    useState('mostRecentQuarter', () => fallbackQuarter);
    useState('deoYears', () => fallbackDeoYears);

    try {
        const response = await fetch(`${runtimeConfig.public.apiBaseUrl}/settings`);

        if (!response.ok) {
            throw new Error(`API returned status: ${response.status}`);
        }
        const data = await response.json();

        useState('mostRecentQuarter').value =  data.mostRecentQuarter || fallbackQuarter;
        useState('deoYears').value =  data.deoYears || fallbackDeoYears;
        console.info(`Data most recently updated for quarter: ${data.mostRecentQuarter}`);
        console.info(`Data most recently updated for deoYears: ${data.deoYears}`);
    } catch (error) {
        console.error(`Failed to fetch mostRecentQuarter. Using fallback value: ${fallbackQuarter}`, error.message);
    }
});

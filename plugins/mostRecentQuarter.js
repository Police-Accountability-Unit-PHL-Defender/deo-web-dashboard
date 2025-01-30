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
    const fallbackDeoYears = [2022, 2023];
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

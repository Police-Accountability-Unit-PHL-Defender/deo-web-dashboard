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
    useState('mostRecentQuarter', () => fallbackQuarter);

    try {
        const response = await fetch(`${runtimeConfig.public.apiBaseUrl}/settings`);

        if (!response.ok) {
            throw new Error(`API returned status: ${response.status}`);
        }
        const data = await response.json();

        // Provide the value globally via useState
        useState('mostRecentQuarter', () => data.mostRecentQuarter || fallbackQuarter);
        console.info(`Data most recently updated for quarter: ${data.mostRecentQuarter}`);
    } catch (error) {
        console.error(`Failed to fetch mostRecentQuarter. Using fallback value: ${fallbackQuarter}`, error.message);
    }
});

/** CARTO Positron when configured; keyless OSM for unconfigured local builds. */
export function mapBasemap(apiKey: string = '') {
  const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  return apiKey
    ? {
        url: `https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`,
        attribution: `${osmAttribution}, &copy; <a href="https://carto.com/attributions">CARTO</a>`,
      }
    : {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: osmAttribution,
      }
}

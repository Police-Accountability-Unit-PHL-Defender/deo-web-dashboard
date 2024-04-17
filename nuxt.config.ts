// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.scss'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  app: {
    head: {
      title: 'Traffic Stops in Philadelphia',
      link: [
        { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css' },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap" },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' },
        { rel: 'manifest', href: '/favicon/site.webmanifest' }
      ],
      // og image
      meta: [
        { hid: 'og:image', property: 'og:image', content: 'https://driving-equality.phillydefenders.org/og-image.jpg' },
        { hid: 'og:image:width', property: 'og:image:width', content: '1200' },
        { hid: 'og:image:height', property: 'og:image:height', content: '630' },
        { hid: 'og:image:type', property: 'og:image:type', content: 'image/png' },
        { hid: 'og:image:alt', property: 'og:image:alt', content: 'Traffic Stops in Philadelphia' },
        { hid: 'twitter:image', name: 'twitter:image', content: 'https://driving-equality.phillydefenders.org/og-image.jpg' },
        { hid: 'twitter:image:width', name: 'twitter:image:width', content: '1200' },
        { hid: 'twitter:image:height', name: 'twitter:image:height', content: '630' },
        { hid: 'twitter:image:alt', name: 'twitter:image:alt', content: 'Traffic Stops in Philadelphia' },
        { hid: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
      ],
      script: [
        { src: 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_API_BASE_URL || 'https://deo-fastapi.onrender.com',
      mostRecentQuarter: process.env.NUXT_MOST_RECENT_QUARTER || '2023-Q4'
    }
  }
})

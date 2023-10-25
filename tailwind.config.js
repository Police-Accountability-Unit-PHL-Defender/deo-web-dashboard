/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    colors: {
      "white": "#FFFFFF",
      "black": "#000000",
      "primary": {
        default: "#263797",
        800: "#263797",
        600: "#364ED7",
        400: "#60D9FF",
        200: "#C0EEFD",
        100: "#F2FCFF",
      },
      "neutral": {
        100: "#F5F5F5",
        200: "#E9E9E9",
        400: "#7C7C7C",
        600: "#6A6A6A",
        800: "#393939",
      },
      "highlight": "#00B8FF",
      "error": "#EE1616",
    },
    spacing: {
      0: "0",
      1: "0.25rem",
      2: "0.5rem",
      3: "0.75rem",
      4: "1rem",
      5: "1.25rem",
      6: "1.5rem",
      7: "1.75rem",
      8: "2rem",
      9: "2.25rem",
      10: "2.5rem",
      12: "3rem",
      14: "3.5rem",
      16: "4rem",
      20: "5rem",
      24: "6rem",
      28: "7rem",
      32: "8rem",
      40: "10rem",
      48: "12rem",
      56: "14rem",
    },
    extend: {},
  },
  plugins: [],
}


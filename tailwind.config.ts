import type { Config } from 'tailwindcss';

// Clean, mostly-white theme (inspired by the shared reference image).
//   Base      white cards on a very light lavender-grey page
//   Indigo    #5B5CE6   primary: buttons, titles, bars, active states
//   Orange    #F2763F   accent: gauge, pending, small highlights
//   Lime      #D9F28F   one "pop" card
//   Navy      #23264A   text and dark surfaces
// Token names are unchanged so every page picks up the new look automatically.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sunset: '#EEF0F8', // page background: very light lavender-grey
        cocoa: { DEFAULT: '#23264A', 800: '#161938' }, // text, sidebar, dark buttons (navy)
        tangerine: '#F2763F', // orange accent
        grape: '#5B5CE6', // indigo primary
        lilac: '#E3E4FD', // summary strip: light indigo tint
        orchid: '#A9AAF7', // lighter indigo (second segment colour)
        apricot: '#FFE9DC', // light peach tint
        mango: '#FFFFFF', // white card
        lime: '#D9F28F', // lime pop card
        'lime-dark': '#4E6B0F',
        cream: '#FFFFFF', // empty states
        lavender: '#FFFFFF', // filters, light cards
      },
      fontFamily: {
        display: ['"Fredoka Variable"', '"Plus Jakarta Sans Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans Variable"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

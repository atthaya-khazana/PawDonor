import type { Config } from 'tailwindcss';

// Palette taken from the "Pet Care" dashboard concept:
// orange page, dark cocoa sidebar, pastel purple / orange / pink / green cards.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sunset: '#FFBB5C',
        cocoa: { DEFAULT: '#340705', 800: '#4d0f0b' },
        tangerine: '#F97316',
        grape: '#4C1D95',
        lilac: '#E4CCFF',
        orchid: '#F0B3E0',
        apricot: '#FF9F55',
        mango: '#FFB85C',
        lime: '#C6E07A',
        'lime-dark': '#5B7A12',
        cream: '#FFFCD9',
        lavender: '#F8F3FF',
      },
      fontFamily: {
        display: ['"Bagel Fat One"', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk Variable"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

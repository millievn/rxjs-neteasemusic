/**
 * color theme
 * @link { https://uxdesign.cc/dark-mode-ui-design-the-definitive-guide-part-1-color-53dcfaea5129}
 */

// const colors = require('tailwindcss/colors');
const colors = require('material-ui-colors');

module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    colors,
    extend: {
      zIndex: {
        '-10': '-10',
      },
      animation: {
        'spin-30s': 'spin 30s linear infinite',
      },
      transitionDuration: {
        8000: '8000ms',
      },
      transitionProperty: {
        width: 'width',
      },
    },
  },
  variants: {
    extend: {
      animation: ['hover', 'focus'],
    },
  },
  plugins: [],
};

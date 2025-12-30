/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{njk,md}", "./**/*.svg", "!./node_modules/**"],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        body: '#a8a8a8',
        muted: '#888888',
        subtle: '#555555',
      },
      fontFamily: {
        sans: ['Inter', 'Inter UI', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['Cabinet Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

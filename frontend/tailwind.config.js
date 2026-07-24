/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F17',
          card: '#131B2E',
          accent: '#1E293B',
          border: '#1E293B',
        },
        brand: {
          primary: '#6366F1',
          secondary: '#8B5CF6',
          cyan: '#06B6D4',
        }
      },
    },
  },
  plugins: [],
}

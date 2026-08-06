/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // ConnectSphere matte charcoal theme tokens
        app: '#0D0F14',            // Main background
        surface: '#14181F',        // Card background
        nav: '#101319',            // Sidebar & topbar navigation background
        hover: '#1A1F28',          // Subtle hover state
        raised: '#14181F',         // Form input / well background
        overlay: '#161B23',        // Dropdown menu background

        // ConnectSphere muted accent palette
        accent: {
          DEFAULT: '#A66BFF',      // Dusty Orchid
          hover: '#9552FF',
          soft: 'rgba(166, 107, 255, 0.12)',
        },
        rose: {
          DEFAULT: '#D97FA6',      // Soft Rose
          soft: 'rgba(217, 127, 166, 0.12)',
        },
        amber: {
          DEFAULT: '#D9A441',      // Warm Amber
          soft: 'rgba(217, 164, 65, 0.12)',
        },
        sage: {
          DEFAULT: '#7BAA82',      // Muted Sage
          soft: 'rgba(123, 170, 130, 0.12)',
        },
        coral: {
          DEFAULT: '#D66B6B',      // Muted Coral
          soft: 'rgba(214, 107, 107, 0.12)',
        },
        primary: '#F4F5F7',        // White text
        secondary: '#9EA4AF',      // Muted text
      },
      borderColor: {
        DEFAULT: 'rgba(255, 255, 255, 0.05)',
        subtle: 'rgba(255, 255, 255, 0.08)',
        active: 'rgba(166, 107, 255, 0.3)',
      },
      borderRadius: {
        xl: '14px',
        lg: '10px',
      },
      boxShadow: {
        // Very soft shadows only — no glows
        card: '0 2px 8px -2px rgba(0, 0, 0, 0.4)',
        lift: '0 12px 24px -8px rgba(0, 0, 0, 0.5)',
        menu: '0 16px 36px -8px rgba(0, 0, 0, 0.65)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
        'slide-up': 'slide-up 200ms ease-out both',
        'slide-in-right': 'slide-in-right 200ms ease-out both',
      },
    },
  },
  plugins: [],
}

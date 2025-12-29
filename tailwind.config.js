/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#60a5fa',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f9fafb',
        },
        border: '#e5e7eb',
      },
    },
  },
  plugins: [],
}

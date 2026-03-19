/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chatgpt: {
          main: '#343541',
          dark: '#202123',
          light: '#444654',
          text: '#ececf1',
          gray: '#c5c5d2',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

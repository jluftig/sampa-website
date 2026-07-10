/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#26A69A", // Teal (decorative/large text only — fails AA at body sizes)
        "primary-text": "#0F766E", // Darker teal for text/links/buttons — ~5.5:1 on white (AA)
        accent: "#9C27B0", // Purple
        background: "#F8F9FA", // Soft White
        text: "#1E2A38", // Slate
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        '4xl': '2.5rem',
        '5xl': '3.5rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.{html,js}",
    "./**/*.{html,js}",
    "!./node_modules/**"
  ],
  theme: {
    extend: {
      colors: {
        bg0: "#0D0D0D",
        bg1: "#151515",
        text0: "#FFFFFF",
        text1: "#B0B0B0",
        brand: { 500:"#FF6B00", 400:"#FFB347" },
        accent:{ 500:"#00C2FF" }
      },
      boxShadow: {
        glow:   "0 0 24px rgba(255,107,0,.35)",
        glowLg: "0 0 36px rgba(255,107,0,.45)"
      },
      fontFamily: {
        sans:    ["Inter","ui-sans-serif","system-ui","-apple-system","Segoe UI","Roboto","Helvetica","Arial","sans-serif"],
        display: ["Poppins","Inter","ui-sans-serif","system-ui"]
      },
      borderRadius: { '2xl':'1rem' }
    },
  },
  plugins: [],
}

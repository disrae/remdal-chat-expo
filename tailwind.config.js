/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0052a3",
        secondary: "#009ddc",
        tertiary: "#fdc400",
        base: "#ddd",
        dark: "#333",
        light: "#eee"
      },
    },
  },
  plugins: [],
};
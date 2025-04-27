/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#00529e",
        secondary: "#009ddc",
        tertiary: "#fdc400",
      },
    },
  },
  plugins: [],
};

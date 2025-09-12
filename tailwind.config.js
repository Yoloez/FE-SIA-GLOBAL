/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],

  // ━━━━━━  v4 preset – this line must exist ━━━━━━
  presets: [require("nativewind/preset")],

  theme: {
    extend: {},
  },
  plugins: [],
};

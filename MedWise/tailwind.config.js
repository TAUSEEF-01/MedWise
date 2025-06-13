/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        medical: {
          blue: "#2563eb",
          green: "#059669",
          red: "#dc2626",
          orange: "#f59e0b",
        },
      },
      fontFamily: {
        "space-mono": ["SpaceMono", "monospace"],
      },
    },
  },
  plugins: [],
};

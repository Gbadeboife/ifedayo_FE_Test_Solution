/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontSize: {
      xxs: "0.5rem",
      xs: "0.75rem",
      sm: "0.875rem",
      base: "0.9rem",
      xl: "1rem",
      "2xl": "1.25rem",
      "3xl": "1.5rem",
      "4xl": "1.953rem",
      "5xl": "2.441rem",
      "6xl": "3.114rem",
      "7xl": "4rem",
    },
    extend: {
      borderRadius: {
        pill: "100vw",
        circle: "50%",
      },
      colors: { primary: "#33d4b7", "primary-dark": "#0D9895" },
    },
  },
  plugins: [require("@headlessui/tailwindcss", "@tailwindcss/forms")],
};

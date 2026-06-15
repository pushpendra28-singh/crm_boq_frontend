/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2d7a27",
        "primary-light": "#4caf50",
        "primary-bright": "#76c442",
        "primary-dark": "#1e5c1a",
        navy: "#0d2137",
        "navy-light": "#1a3a5c",
        dark: "#1a1a1a",
        "gray-soft": "#f5f5f0",
        "gray-card": "#e8e8e0",
        "green-soft": "#f0f7ee",
        "green-pale": "#eef5e8",
      },
      fontFamily: {
        heading: ["'Montserrat'", "Manrope"],
        body: ["'Open Sans'", "Manrope"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.14)",
      },
    },
  },
  plugins: [],
};

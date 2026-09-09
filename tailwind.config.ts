import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      transitionDuration: {
        '250': '250ms',
      },
      colors: {
        amazon: {
          dark: "#131921",
          light_dark: "#232f3e",
          subnav: "#232f3e",
          yellow: "#febd69",
          orange: "#f08804",
          orange_hover: "#e47911",
          blue_light: "#007185",
          blue_hover: "#c7511f",
          gray_bg: "#eaeded",
          border: "#3a4553",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "var(--font-bengali)", "Inter", "sans-serif"],
        bengali: ["var(--font-bengali)", "'Hind Siliguri'", "'Noto Sans Bengali'", "sans-serif"],
        outfit: ["var(--font-outfit)", "'Outfit'", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

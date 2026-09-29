import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#131921",
          ink: "#0f1111",
          slate: "#232f3e",
          amber: "#f59e0b",
          amberHover: "#d97706",
          gold: "#febd69",
          teal: "#007185",
          tealHover: "#c7511f",
          sky: "#eaeded",
        },
        price: "#b12704",
        stock: "#067d62",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-bengali)", "system-ui", "sans-serif"],
        bengali: ["var(--font-bengali)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,17,17,.08), 0 2px 8px rgba(15,17,17,.06)",
        pop: "0 8px 30px rgba(15,17,17,.18)",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { fadeIn: "fadeIn .18s ease-out", shimmer: "shimmer 1.4s infinite" },
    },
  },
  plugins: [],
};

export default config;

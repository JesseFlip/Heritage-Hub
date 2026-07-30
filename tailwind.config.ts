import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#b91c1c", 2: "#f97316" },
        accent: "#7c3aed",
      },
      maxWidth: { app: "520px" },
      boxShadow: {
        soft: "0 1px 2px rgba(28,25,23,.06),0 8px 24px rgba(28,25,23,.08)",
      },
    },
  },
  plugins: [],
};

export default config;

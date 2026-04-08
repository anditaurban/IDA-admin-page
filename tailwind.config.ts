import type { Config } from "tailwindcss";
import tailwindForms from "@tailwindcss/forms";
import tailwindContainerQueries from "@tailwindcss/container-queries";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#4040d4",
        "primary-dark": "#3030b0",
        "background-light": "#f8f9fc",
        "background-dark": "#13131f",
        "surface-dark": "#1c1c2e",
        "teal-accent": "#00BCD4",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-manrope)", "sans-serif"],
      },
      boxShadow: {
        'soft': '0 20px 40px -10px rgba(64, 64, 212, 0.15)',
        'glow': '0 0 40px -10px rgba(64, 64, 212, 0.3)',
      },
    },
  },
  plugins: [
    tailwindForms,
    tailwindContainerQueries,
    require('@tailwindcss/typography'), 
  ],
};
export default config;
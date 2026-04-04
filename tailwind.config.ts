import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5BA4CF",
        secondary: "#D4B4B3",
        tertiary: "#2C5F7A",
        neutral: {
          DEFAULT: "#8BA8B8",
          dark: "#5A7280"
        },
        background: "#EBF4FA",
        surface: "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-poppins)"],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
};

export default config;

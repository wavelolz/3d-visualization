import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 30px 70px rgba(32, 26, 18, 0.16)",
      },
      colors: {
        canvas: "#efe8dc",
        ink: "#1f1812",
        sand: "#ded2be",
        accent: "#bf5d2d",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        serif: ["var(--font-instrument-serif)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;


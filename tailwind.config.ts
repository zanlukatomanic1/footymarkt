import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0b0d",
          elevated: "#111316",
          card: "#15181c",
        },
        border: {
          DEFAULT: "#1f2329",
          strong: "#2a3038",
        },
        ink: {
          DEFAULT: "#e6e8eb",
          muted: "#8a9099",
          dim: "#565d66",
        },
        brand: {
          DEFAULT: "#22c55e",
          dim: "#16a34a",
          glow: "rgba(34,197,94,0.15)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;

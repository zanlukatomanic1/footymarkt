import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        page:    "#070707",
        card:    "#141414",
        element: "#1a1a1a",
        sidebar: "#0a0a0a",
        topbar:  "#0f0f0f",
        // Borders
        line:    "#1e1e1e",
        "line-subtle": "#1a1a1a",
        "line-strong": "#2a2a2a",
        "line-muted":  "#222",
        // Text
        "ink-bright": "#ffffff",
        ink:          "#e0e0e0",
        "ink-muted":  "#888888",
        "ink-dim":    "#4a4a4a",
        "ink-faint":  "#3a3a3a",
        "ink-ghost":  "#2e2e2e",
        "ink-silent": "#2a2a2a",
        "ink-dead":   "#2a2a2a",
        // Brand
        brand: "#00ff87",
        // Secondary accent
        accent: "#4d7cff",
        // Ranks
        gold:   "#FFD700",
        silver: "#a8a8a8",
        bronze: "#cd8a3a",
      },
      fontFamily: {
        sans:    ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-dm-mono)", "monospace"],
        display: ["var(--font-syne)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

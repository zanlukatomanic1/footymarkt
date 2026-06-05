import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        page:    "var(--color-page)",
        card:    "var(--color-card)",
        element: "var(--color-element)",
        sidebar: "var(--color-sidebar)",
        topbar:  "var(--color-topbar)",
        // Borders
        line:    "var(--color-line)",
        "line-subtle": "var(--color-line-subtle)",
        "line-strong": "var(--color-line-strong)",
        "line-muted":  "var(--color-line-muted)",
        // Text
        "ink-bright": "var(--color-ink-bright)",
        ink:          "var(--color-ink)",
        "ink-muted":  "var(--color-ink-muted)",
        "ink-dim":    "var(--color-ink-dim)",
        "ink-faint":  "var(--color-ink-faint)",
        "ink-ghost":  "var(--color-ink-ghost)",
        "ink-silent": "var(--color-ink-silent)",
        "ink-dead":   "var(--color-ink-dead)",
        // Brand
        brand: "var(--color-brand)",
        // Secondary accent
        accent: "var(--color-accent)",
        // Ranks
        gold:   "var(--color-gold)",
        silver: "var(--color-silver)",
        bronze: "var(--color-bronze)",
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

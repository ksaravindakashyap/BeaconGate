import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-gowun-batang)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-gowun-batang)", "ui-monospace", "monospace"],
      },
      colors: {
        background: "var(--bg)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border: "var(--border)",
        "border-soft": "var(--border-soft)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-muted": "var(--accent-muted)",
        "accent-foreground": "var(--accent-foreground)",
        success: "var(--success)",
        "success-muted": "var(--success-muted)",
        warn: "var(--warn)",
        "warn-muted": "var(--warn-muted)",
        danger: "var(--danger)",
        "danger-muted": "var(--danger-muted)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "calc(var(--radius) - 2px)",
        md: "var(--radius)",
        lg: "calc(var(--radius) + 4px)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
};

export default config;

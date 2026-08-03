import type { Config } from "tailwindcss";

function withOpacity(varName: string): string {
  // Tailwind's Config type only allows string color values, but at
  // runtime it happily accepts a function returning a color string
  // (this is how CSS-variable-based theming with opacity support is
  // documented to work). The cast below is just to satisfy tsc during
  // `next build`'s type-check — Tailwind itself never sees TypeScript.
  return (({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${varName}) / ${opacityValue})`;
    }
    return `rgb(var(${varName}))`;
  }) as unknown as string;
}

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        home: {
          bg: withOpacity("--color-bg"),
          card: withOpacity("--color-card"),
          cardHover: withOpacity("--color-card-hover"),
          border: withOpacity("--color-border"),
          text: withOpacity("--color-text"),
          dim: withOpacity("--color-dim"),
          accent: withOpacity("--color-accent"),
          accentSoft: withOpacity("--color-accent-soft"),
          sage: withOpacity("--color-sage"),
          coral: withOpacity("--color-coral"),
        },
      },
      fontFamily: {
        sans: ["var(--font-main)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 24px -8px rgba(0,0,0,0.45)",
        softSm: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 10px -4px rgba(0,0,0,0.4)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { opacity: "0.25" },
          "40%": { opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out both",
        pulseDot: "pulseDot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clip: {
          bg: "#f6f7fb",
          surface: "#ffffff",
          border: "#e2e8f0",
          muted: "#64748b",
          dark: {
            bg: "#050505",
            surface: "#0E0E0E",
            border: "#1F1F1F",
            muted: "#8B8B8B",
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-accent": "var(--bg-accent)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        stroke: "var(--stroke)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        "accent-3": "var(--accent-3)",
      },
      fontFamily: {
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
        display: ['"Fraunces"', '"Times New Roman"', "serif"],
      },
      boxShadow: {
        card: "0 12px 24px rgba(35, 30, 22, 0.08)",
      },
    },
  },
  plugins: [],
};

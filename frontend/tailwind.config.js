/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Professional 60-30-10 Color Harmony: Indigo (primary), Red (accent), Slate (neutral)

        // Primary - Indigo (60% of design) - Main surfaces and backgrounds
        indigo: {
          50: "#f0f4ff",
          100: "#e6ecff",
          200: "#c7d5ff",
          300: "#a8bfff",
          400: "#7a99ff",
          500: "#5b73ff", // Primary brand color
          600: "#4f5fd4", // Hover state
          700: "#3d47a8",
          800: "#2d3680",
          900: "#1f2554",
          950: "#141830",
        },

        // Accent - Red (30% of design) - Calls-to-action, highlights, alerts
        red: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444", // Red accent for buttons and highlights
          600: "#dc2626", // Hover state
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#7f1d1d",
        },

        // Neutral - Slate (10% of design) - Borders, dividers, subtle elements
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          150: "#eef2f5",
          200: "#e2e8f0",
          250: "#d4dae3",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },

        // Success - Emerald for success states
        emerald: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e", // Success accent
          600: "#16a34a", // Hover state
          700: "#15803d",
          800: "#166534",
          900: "#145231",
          950: "#052e16",
        },

        // Warning colors
        yellow: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // Warning base
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        green: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e", // Success base
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#145231",
        },
        blue: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6", // Info base
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FF5000", // Shopee orange
          foreground: "#FFFFFF", // White text on orange
          dark: "#E64600", // Darker shade for hover states
          light: "#FF7A40", // Lighter shade for highlights
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#FF5000", // Shopee orange as accent
          foreground: "#FFFFFF",
          dark: "#E64600", // Darker shade for hover states
          light: "#FF7A40", // Lighter shade for highlights
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        shopee: {
          orange: "#FF5000",
          light: "#FFFFFF",
          dark: "#333333",
          gray: "#F5F5F5",
          orange_dark: "#E64600", // Darker orange for dark mode
          orange_light: "#FF7A40", // Lighter orange for highlights
          dark_bg: "#1A1A1A", // Dark background for dark mode
          dark_card: "#262626", // Dark card background for dark mode
          dark_border: "#404040", // Dark border for dark mode
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-20px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        blob: "blob 7s infinite",
        float: "float 6s ease-in-out infinite",
      },
      utilities: {
        ".animation-delay-2000": {
          "animation-delay": "2s",
        },
        ".animation-delay-3000": {
          "animation-delay": "3s",
        },
        ".animation-delay-4000": {
          "animation-delay": "4s",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;

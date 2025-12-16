import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Helios Dune Palette - Desert/Sand vibes
        helios: {
          gold: "#C9A76C",      // Primary - Desert Gold
          sand: "#B8956A",      // Accent - Warm Sand
          light: "#DFC9A3",     // Highlight - Light Sand
          earth: "#9A7B4F",     // Dark - Earth tone
          cream: "#F6F0E8",     // Warm white - Dune Cream
          stone: "#D4CFC8",     // Warm gray - Stone
        },
        // Extended dune palette
        dune: {
          50: "#FAF7F2",
          100: "#F6F0E8",
          200: "#EDE4D6",
          300: "#DFC9A3",
          400: "#C9A76C",
          500: "#B8956A",
          600: "#9A7B4F",
          700: "#7D6340",
          800: "#5E4A30",
          900: "#3F3220",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "helios-gradient": "linear-gradient(135deg, #C9A76C 0%, #B8956A 50%, #9A7B4F 100%)",
        "dune-gradient": "linear-gradient(135deg, #DFC9A3 0%, #C9A76C 50%, #B8956A 100%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "sun-rays": "sunRays 60s linear infinite",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "border-glow": "borderGlow 2s ease-in-out infinite",
        "success-burst": "successBurst 0.5s ease-out forwards",
        "float-up": "floatUp 0.4s ease-out forwards",
        "spin-slow": "spinSlow 8s linear infinite",
        "counter-tick": "counterTick 0.3s ease-out",
        "fire-flicker": "fireFlicker 0.5s ease-in-out infinite",
        "gradient-flow": "gradientFlow 3s ease infinite",
        "bounce-in": "bounceIn 0.4s ease-out forwards",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(201, 167, 108, 0.2), 0 0 40px rgba(201, 167, 108, 0.1)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(201, 167, 108, 0.4), 0 0 80px rgba(201, 167, 108, 0.2)",
          },
        },
        sunRays: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(201, 167, 108, 0.2)" },
          "50%": { borderColor: "rgba(201, 167, 108, 0.5)" },
        },
        successBurst: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        counterTick: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        fireFlicker: {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "25%": { opacity: "0.9", filter: "brightness(1.1)" },
          "50%": { opacity: "1", filter: "brightness(0.95)" },
          "75%": { opacity: "0.95", filter: "brightness(1.05)" },
        },
        gradientFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "50%": { transform: "scale(1.02)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glowPulse: {
          "0%, 100%": { filter: "drop-shadow(0 0 10px rgba(201, 167, 108, 0.3))" },
          "50%": { filter: "drop-shadow(0 0 25px rgba(201, 167, 108, 0.6))" },
        },
      },
      boxShadow: {
        "helios": "0 0 30px rgba(201, 167, 108, 0.3)",
        "helios-lg": "0 0 50px rgba(201, 167, 108, 0.4)",
        "helios-glow": "0 0 20px rgba(201, 167, 108, 0.2), 0 0 40px rgba(201, 167, 108, 0.1)",
        "dune": "0 0 30px rgba(184, 149, 106, 0.25)",
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [],
};
export default config;

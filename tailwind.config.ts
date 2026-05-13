import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "spotify-green": "#1DB954",
        "spotify-black": "#191414",
        "swipe-bg": "#0A0A0A",
        "card-bg": "#111118",
        "keep": "#1DB954",
        "remove": "#E91E8C",
        "subtext": "#B3B3B3",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-green": "pulseGreen 0.6s ease-out",
        "pulse-magenta": "pulseMagenta 0.6s ease-out",
        "heart-burst": "heartBurst 0.5s ease-out forwards",
        "streak-pop": "streakPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "card-enter": "cardEnter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "shimmer": "shimmer 2s linear infinite",
        "bar1": "bar1 1.2s ease-in-out infinite",
        "bar2": "bar2 1.0s ease-in-out infinite",
        "bar3": "bar3 1.4s ease-in-out infinite",
        "bar4": "bar4 0.9s ease-in-out infinite",
        "bar5": "bar5 1.1s ease-in-out infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseGreen: {
          "0%": { boxShadow: "0 0 0 0 rgba(29,185,84,0.7)" },
          "70%": { boxShadow: "0 0 0 20px rgba(29,185,84,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(29,185,84,0)" },
        },
        pulseMagenta: {
          "0%": { boxShadow: "0 0 0 0 rgba(233,30,140,0.7)" },
          "70%": { boxShadow: "0 0 0 20px rgba(233,30,140,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(233,30,140,0)" },
        },
        heartBurst: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.4)" },
          "100%": { transform: "scale(1)" },
        },
        streakPop: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        cardEnter: {
          "0%": { transform: "scale(0.9) translateY(20px)", opacity: "0.5" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        bar1: { "0%,100%": { height: "8px" }, "50%": { height: "28px" } },
        bar2: { "0%,100%": { height: "16px" }, "50%": { height: "40px" } },
        bar3: { "0%,100%": { height: "12px" }, "50%": { height: "36px" } },
        bar4: { "0%,100%": { height: "20px" }, "50%": { height: "32px" } },
        bar5: { "0%,100%": { height: "10px" }, "50%": { height: "24px" } },
      },
      backgroundImage: {
        "keep-gradient": "linear-gradient(135deg, #1DB954, #17a349)",
        "remove-gradient": "linear-gradient(135deg, #E91E8C, #c4176e)",
        "card-gradient": "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

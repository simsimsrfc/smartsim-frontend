import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds (sombres)
        bg: {
          app: "#050B0E",
          sidebar: "#061014",
          main: "#071116",
          elevated: "#0B171C",
          card: "#0E1A20",
          "card-hover": "#12232A",
          soft: "#101F26",
        },
        // Brand vert football
        brand: {
          DEFAULT: "#35E75A",
          hover: "#42F56A",
          dark: "#0F3D1F",
          muted: "#153D24",
        },
        // Texte
        fg: {
          DEFAULT: "#F4F8F5",
          secondary: "#AEB8B3",
          muted: "#6F7C78",
          disabled: "#44504D",
        },
        // Accents
        gold: "#F5C542",
        warn: "#FFB020",
        danger: "#FF4D4D",
        info: "#5D8CFF",
        // Probabilités
        prob: {
          high: "#35E75A",
          medium: "#F5C542",
          low: "#FF4D4D",
        },
      },
      borderColor: {
        soft: "rgba(255,255,255,0.06)",
        medium: "rgba(255,255,255,0.10)",
        strong: "rgba(255,255,255,0.16)",
        green: "rgba(53,231,90,0.35)",
      },
      backgroundImage: {
        "gradient-card":
          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.018) 100%)",
        "gradient-card-green":
          "linear-gradient(135deg, rgba(53,231,90,0.18) 0%, rgba(8,18,13,0.95) 70%)",
        "gradient-sidebar-active":
          "linear-gradient(135deg, rgba(53,231,90,0.28) 0%, rgba(53,231,90,0.10) 100%)",
        "gradient-stadium":
          "linear-gradient(180deg, rgba(4,10,12,0.15) 0%, rgba(4,10,12,0.78) 100%)",
        "gradient-app":
          "linear-gradient(180deg, #071116 0%, #050B0E 100%)",
      },
      boxShadow: {
        card:
          "0 12px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
        "card-hover":
          "0 18px 50px rgba(0,0,0,0.38), 0 0 24px rgba(53,231,90,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
        sidebar: "8px 0 32px rgba(0,0,0,0.35)",
        "green-soft": "0 0 18px rgba(53,231,90,0.18)",
        "green-strong": "0 0 32px rgba(53,231,90,0.32)",
        button: "0 8px 24px rgba(53,231,90,0.18)",
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Satoshi",
          "Manrope",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tightx: "-0.03em",
      },
    },
  },
  plugins: [],
};
export default config;

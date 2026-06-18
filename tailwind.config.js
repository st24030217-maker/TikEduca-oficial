/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/app.js"
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: "#FF007F",
          cyan: "#00E5FF",
          purple: "#9B00FF",
          yellow: "#FFE500",
        },
        dark: {
          base: "#030612",
          deep: "#060B1A",
          card: "#0A1128",
          border: "#0D1635",
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        rajdhani: ["Rajdhani", "sans-serif"],
        space: ["Space Grotesk", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        scan: "scan 3s linear infinite",
        glitch: "glitch 4s steps(1) infinite",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "spin-slow": "spin 20s linear infinite",
      },
    },
  },
  plugins: [],
}

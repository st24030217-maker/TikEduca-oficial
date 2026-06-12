// TikEduca 2.0 Global Configuration
const CONFIG = {
  // Apps Script Endpoint URL
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzAn1j0lKi-kIsKTp-RTpkTOkWWMeJq2HMIHZDm0jGIB8pl3mNGoSHb_Ld4s7EPxkia4A/exec",

  // WhatsApp Organizer Contact Number
  ORGANIZER_WA: "5213349004784",

  // Date constants
  EVENT_DATE: "2026-10-03T08:00:00", // Start of the congress
  HOTEL_CHECKIN_DATE: "2026-10-03",   // Base date for hotel check-in
  EVENT_DATE_TEXT: "3 y 4 de Octubre 2026",
  
  // Ticket Prices
  TICKET_PRICES: {
    congreso: 1300,
    maestrofest: 1000,
    combo: 1800
  },
  
  // Ticket Display Names
  TICKET_NAMES: {
    congreso: "Congreso",
    maestrofest: "Maestro Fest",
    combo: "Congreso + Maestro Fest"
  },

  // Hotel Room Prices
  HOTEL_PRICES: {
    sencilla: 1706,
    doble: 2006,
    suite: 2706
  }
};

// Tailwind CSS Configuration
window.tailwind = window.tailwind || {};
window.tailwind.config = {
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
};

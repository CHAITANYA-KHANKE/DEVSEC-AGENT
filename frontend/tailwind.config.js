/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0D1117",
        surface: "#161B22",
        surface2: "#1C2128",
        border: "#30363D",
        border2: "#21262D",
        primary: "#7EE787",
        secondary: "#3FB950",
        muted: "#8B949E",
        text: "#F0F6FC",
        cream: "#F2E8CF",
        critical: "#FF4D4D",
        high: "#FF9F43",
        medium: "#F2C94C",
        success: "#3FB950",
      },
      fontFamily: {
        sans: ["Inter","system-ui","sans-serif"],
        heading: ["Space Grotesk","Inter","sans-serif"],
        mono: ["JetBrains Mono","monospace"],
        serif: ["Instrument Serif","Newsreader","serif"],
      },
      boxShadow: {
        'retro': '6px 6px 0px #30363D',
        'retro-sm': '4px 4px 0px #30363D',
        'retro-primary': '6px 6px 0px #7EE787',
        'retro-primary-sm': '4px 4px 0px #7EE787',
      },
      animation: {
        'marquee': 'marquee 22s linear infinite',
        'scan': 'scan 3s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'grain': 'grain 8s steps(10) infinite',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(200%)' } },
        blink: { '0%,50%': { opacity: '1' }, '51%,100%': { opacity: '0' } },
        grain: { '0%,100%': { transform: 'translate(0,0)' }, '10%': { transform: 'translate(-5%,-10%)' } }
      }
    }
  },
  plugins: [],
}

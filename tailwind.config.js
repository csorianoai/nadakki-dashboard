/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Quantum Core Colors
        'quantum': {
          void: '#000008',
          dark: '#0a0f1e',
          neural: '#141925',
        },
        'core': {
          financial: '#00E5FF',
          risk: '#FF3D71',
          ops: '#7CFFB2',
          customer: '#FFD166',
          regtech: '#C77DFF',
        },
        'glass': {
          primary: 'rgba(10, 15, 30, 0.95)',
          secondary: 'rgba(15, 20, 35, 0.92)',
          border: 'rgba(255, 255, 255, 0.15)',
          hover: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        quantum: ['Orbitron', 'monospace'],
        neural: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'quantum-pulse': 'quantum-pulse 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'quantum-pulse': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px currentColor' },
          '50%': { boxShadow: '0 0 40px currentColor, 0 0 60px currentColor' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        'quantum': '60px',
        'neural': '30px',
      },
    },
  },
  plugins: [],
};

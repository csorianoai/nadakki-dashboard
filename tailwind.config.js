/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'forge-primary': 'var(--forge-primary)',
        'forge-primary-hover': 'var(--forge-primary-hover)',
        'forge-primary-active': 'var(--forge-primary-active)',
        'forge-accent': 'var(--forge-accent)',
        'forge-bg': 'var(--forge-bg)',
        'forge-surface': 'var(--forge-surface)',
        'forge-surface-elevated': 'var(--forge-surface-elevated)',
        'forge-surface-hover': 'var(--forge-surface-hover)',
        'forge-text': 'var(--forge-text)',
        'forge-text-muted': 'var(--forge-text-muted)',
        'forge-text-subtle': 'var(--forge-text-subtle)',
        'forge-border': 'var(--forge-border)',
        'forge-border-hover': 'var(--forge-border-hover)',
        'forge-success': 'var(--forge-success)',
        'forge-warning': 'var(--forge-warning)',
        'forge-danger': 'var(--forge-danger)',
        'forge-info': 'var(--forge-info)',
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
        sans: ['var(--forge-font-sans)', 'Inter', 'sans-serif'],
        display: ['var(--forge-font-display)', 'Inter', 'sans-serif'],
        forgeMono: ['var(--forge-font-mono)', 'JetBrains Mono', 'monospace'],
        quantum: ['Orbitron', 'monospace'],
        neural: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'forge-pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'forge-shimmer': 'forge-shimmer 2s ease-in-out infinite',
        'forge-float': 'forge-float 3s ease-in-out infinite',
        'quantum-pulse': 'quantum-pulse 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'forge-shimmer': {
          '0%, 100%': { backgroundPosition: '-200% 0' },
          '50%': { backgroundPosition: '200% 0' },
        },
        'forge-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
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

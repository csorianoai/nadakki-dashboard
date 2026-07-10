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
        // ─────────────────────────────────────────────────────────
        // PERMANENT LEGACY ALIASES — components/credit-hub tree consumes
        // these tokens directly. The Forge redesign (Phases 1–7) replaced
        // higher-level surfaces by composition; the underlying
        // components/credit-hub primitives remained out of scope per project
        // guardrails. As long as those components ship to production, these
        // aliases must resolve.
        //
        // Dual var(): prefer v3.2 custom properties on .forge-app; fall back
        // to styles/forge-tokens-v2.css portal variables outside .forge-app.
        //
        // To remove: migrate or replace components/credit-hub with
        // components/forge equivalents, then verify grep is empty:
        //   Get-ChildItem -Path app,components -Recurse `
        //     -Include *.tsx,*.ts `
        //     | Select-String -Pattern '(bg|text|border|ring|from|to|via)-forge-(primary|bg|surface-elevated|surface-hover|border|border-hover|text|text-muted|text-subtle)' `
        //     | Where-Object { $_.Path -notmatch 'components\\credit-hub' }
        // and then delete this block + styles/forge-tokens-v2.css.
        // ─────────────────────────────────────────────────────────
        'forge-primary': 'var(--forge-brand-500, var(--forge-primary))',
        'forge-primary-hover': 'var(--forge-brand-600, var(--forge-primary-hover))',
        'forge-primary-active': 'var(--forge-brand-700, var(--forge-primary-active))',
        'forge-accent': 'var(--forge-accent-gold, var(--forge-accent))',
        'forge-bg': 'var(--forge-surface-page, var(--forge-bg))',
        'forge-surface': 'var(--forge-surface-card, var(--forge-surface))',
        'forge-surface-elevated': 'var(--forge-surface-raised, var(--forge-surface-elevated))',
        'forge-surface-hover': 'var(--forge-surface-sunken, var(--forge-surface-hover))',
        'forge-text': 'var(--forge-gray-800, var(--forge-text))',
        'forge-text-muted': 'var(--forge-gray-500, var(--forge-text-muted))',
        'forge-text-subtle': 'var(--forge-gray-400, var(--forge-text-subtle))',
        'forge-border': 'var(--forge-gray-200, var(--forge-border))',
        'forge-border-hover': 'var(--forge-gray-300, var(--forge-border-hover))',
        'forge-success': 'var(--forge-success-500, var(--forge-success))',
        'forge-warning': 'var(--forge-warning-500, var(--forge-warning))',
        'forge-danger': 'var(--forge-danger-500, var(--forge-danger))',
        'forge-info': 'var(--forge-info-500, var(--forge-info))',
        /* v3.2 institutional tokens (inherit from .forge-app — see styles/forge-tokens-v2.css) */
        forgeBrand: {
          50: 'var(--forge-brand-50)',
          100: 'var(--forge-brand-100)',
          200: 'var(--forge-brand-200)',
          300: 'var(--forge-brand-300)',
          400: 'var(--forge-brand-400)',
          500: 'var(--forge-brand-500)',
          600: 'var(--forge-brand-600)',
          700: 'var(--forge-brand-700)',
          800: 'var(--forge-brand-800)',
          900: 'var(--forge-brand-900)',
          950: 'var(--forge-brand-950)',
        },
        forgeGray: {
          50: 'var(--forge-gray-50)',
          100: 'var(--forge-gray-100)',
          200: 'var(--forge-gray-200)',
          300: 'var(--forge-gray-300)',
          400: 'var(--forge-gray-400)',
          500: 'var(--forge-gray-500)',
          600: 'var(--forge-gray-600)',
          700: 'var(--forge-gray-700)',
          800: 'var(--forge-gray-800)',
          900: 'var(--forge-gray-900)',
        },
        forgeSurface: {
          page: 'var(--forge-surface-page)',
          card: 'var(--forge-surface-card)',
          raised: 'var(--forge-surface-raised)',
          sunken: 'var(--forge-surface-sunken)',
          overlay: 'var(--forge-surface-overlay)',
        },
        forgeSuccess: {
          50: 'var(--forge-success-50)',
          500: 'var(--forge-success-500)',
          700: 'var(--forge-success-700)',
        },
        forgeWarning: {
          50: 'var(--forge-warning-50)',
          500: 'var(--forge-warning-500)',
          700: 'var(--forge-warning-700)',
        },
        forgeDanger: {
          50: 'var(--forge-danger-50)',
          500: 'var(--forge-danger-500)',
          700: 'var(--forge-danger-700)',
        },
        forgeInfo: {
          50: 'var(--forge-info-50)',
          500: 'var(--forge-info-500)',
          700: 'var(--forge-info-700)',
        },
        forgeNeutral: {
          50: 'var(--forge-neutral-50)',
          500: 'var(--forge-neutral-500)',
          700: 'var(--forge-neutral-700)',
        },
        forgeAccent: {
          gold: 'var(--forge-accent-gold)',
          teal: 'var(--forge-accent-teal)',
        },
        forgeViz: {
          1: 'var(--forge-viz-1)',
          2: 'var(--forge-viz-2)',
          3: 'var(--forge-viz-3)',
          4: 'var(--forge-viz-4)',
          5: 'var(--forge-viz-5)',
          6: 'var(--forge-viz-6)',
        },
        cockpit: {
          bg: '#0a0a0f',
          surface: '#111118',
          border: '#1e1e2e',
          text: '#e5e5ef',
          muted: '#8b8b99',
          accent: '#a78bfa',
          ok: '#22c55e',
          warn: '#eab308',
          err: '#ef4444',
        },
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
        /* Nested var() so routes without .forge-app (e.g. app/credit/*) still get sensible fallbacks */
        sans: ['var(--forge-font-body, var(--forge-font-sans, Inter))', 'Inter', 'sans-serif'],
        display: [
          'var(--forge-font-display, var(--forge-font-display-opt, Georgia))',
          'Georgia',
          'serif',
        ],
        forgeMono: [
          'var(--forge-font-mono, var(--forge-font-mono-opt, ui-monospace))',
          'ui-monospace',
          'monospace',
        ],
        quantum: ['Orbitron', 'monospace'],
        neural: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        cockpitSans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        cockpitMono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'forge-pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'forge-shimmer': 'forge-shimmer 2s ease-in-out infinite',
        'forge-float': 'forge-float 3s ease-in-out infinite',
        'quantum-pulse': 'quantum-pulse 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'growBar': 'growBar 1.2s ease-out forwards',
        'fabGlow': 'fabGlow 3s ease-in-out infinite',
        'critGlow': 'critGlow 2s ease-in-out infinite',
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
        'growBar': {
          from: { width: '0' },
        },
        'fabGlow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139,92,246,0.4), 0 0 40px rgba(139,92,246,0.15)' },
          '50%': { boxShadow: '0 0 28px rgba(139,92,246,0.55), 0 0 56px rgba(139,92,246,0.25)' },
        },
        'critGlow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(244,63,94,0.3)' },
          '50%': { boxShadow: '0 0 16px rgba(244,63,94,0.5)' },
        },
      },
      backdropBlur: {
        quantum: '60px',
        neural: '30px',
      },
      borderRadius: {
        'forge-sm': 'var(--forge-radius-sm)',
        'forge-md': 'var(--forge-radius-md)',
        'forge-lg': 'var(--forge-radius-lg)',
        'forge-pill': 'var(--forge-radius-pill)',
      },
      fontSize: {
        'forge-xs': ['var(--forge-text-xs)', { lineHeight: 'var(--forge-leading-normal)' }],
        'forge-sm': ['var(--forge-text-sm)', { lineHeight: 'var(--forge-leading-normal)' }],
        'forge-base': ['var(--forge-text-base)', { lineHeight: 'var(--forge-leading-normal)' }],
        'forge-md': ['var(--forge-text-md)', { lineHeight: 'var(--forge-leading-normal)' }],
      },
      boxShadow: {
        'forge-xs': 'var(--forge-shadow-xs)',
        'forge-sm': 'var(--forge-shadow-sm)',
        'forge-md': 'var(--forge-shadow-md)',
        'forge-lg': 'var(--forge-shadow-lg)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.tabular-nums': { 'font-variant-numeric': 'tabular-nums' },
      });
    },
  ],
};

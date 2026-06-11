# PWA Validation Report — Nadakki Credit

## Build Checks
- [x] `npm run build` — PASS
- [x] `npx tsc --noEmit` — PASS (0 errors)

## W3C PWA Installability Checklist
- [x] `manifest.json` valid JSON with `id` field
- [x] Icons: 192px + 512px PNG present (maskable purpose)
- [x] 8 icon sizes: 72, 96, 128, 144, 152, 192, 384, 512
- [x] Apple touch icon: 180x180 PNG
- [x] iOS splash screen: 1290x2796 PNG
- [x] HTTPS: Vercel automatic
- [x] Service Worker registered (`/sw.js`)
- [x] `start_url` within `scope`
- [x] `display: "standalone"`
- [x] `id: "/?source=pwa"`

## Fintech Security
- [x] ALL `/api/*` = NetworkOnly
- [x] ALL `/dashboard/*`, `/forge/*`, `/dealer/*`, `/bank/*`, `/credit-hub/*` = NetworkOnly
- [x] ALL `/auth/*`, `/login*`, `/session*` = NetworkOnly
- [x] ALL `/applications*`, `/decision*`, `/scoring*`, `/documents*`, `/uploads*` = NetworkOnly
- [x] ALL `/tenants*`, `/admin/*`, `/market-intel/*` = NetworkOnly
- [x] SW intercepts only GET requests (no POST/PUT/DELETE/PATCH)
- [x] `skipWaiting: false` (no mid-transaction refresh)
- [x] `clientsClaim: false`
- [x] Auth tokens not cacheable (memory + localStorage, not in SW scope)

## WCAG AA Accessibility
- [x] User zoom NOT blocked (maximumScale: 5)
- [x] Touch targets >= 44x44px (CSS layer base rule)
- [x] Font-size >= 16px on inputs (iOS zoom prevention without blocking)
- [x] Safe area iOS support (env() padding)
- [x] `overscroll-behavior-y: contain`

## App Router Compliance
- [x] Offline page at `app/offline/page.tsx` (NOT `_offline`)
- [x] PWAClientProvider as Client Component (no `dynamic()` ssr:false)
- [x] All `window` access guarded with `typeof window !== "undefined"` or inside `useEffect`

## Capacitor Readiness
- [x] No hardcoded `http://localhost` in source code (only in design docs)
- [x] No hardcoded `https://dashboard.nadakki` in source code (only in docs)
- [x] No SSR `window` assumptions (all guarded)
- [x] PWAClientProvider pattern allows easy Capacitor swap

## Install Prompt Engagement
- [x] 3-visit minimum before showing
- [x] 30-second delay on page
- [x] 30-day dismissal persistence (localStorage)
- [x] Bottom banner (non-intrusive, not popup)

## Vercel Headers
- [x] `/sw.js`: no-cache, must-revalidate
- [x] `/workbox-*.js`: immutable, 1-year cache
- [x] `/manifest.json`: 1-hour cache, must-revalidate

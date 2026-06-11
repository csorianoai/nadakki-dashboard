# PWA Audit — Nadakki Dashboard

## Environment
- **Next.js**: 16.2.4 (App Router)
- **React**: 19.2.4
- **Node**: 25.5.0
- **Deploy**: Vercel (HTTPS automatic)
- **Build**: `next build --webpack`

## Existing PWA State (Pre-F1)

| Asset | Status | Issues |
|-------|--------|--------|
| `public/manifest.json` | Exists | Marketing-focused (not fintech), scope="/", no `id` field, SVG icons only |
| `public/sw.js` | Exists (manual) | Caches `/api` responses (INSECURE), `skipWaiting()` (UNSAFE for fintech), no GET-only filter on cache writes, `cacheFirst` on all navigation |
| `public/offline.html` | Exists | Plain HTML, not App Router page |
| `public/icons/` | 2 SVGs | Not valid for PWA installability (need PNG) |
| `components/pwa/PWAPrompt.tsx` | Exists | Good UX but no engagement heuristic |
| `hooks/usePWA.ts` | Exists | Good SSR-safe hook, registers manual SW |
| `app/hooks/usePWA.ts` | Duplicate | Simpler version, not used by PWAPrompt |
| `next-pwa@5.6.0` | In package.json | NOT configured in next.config.js, incompatible with Next.js 16 |

## Security Issues Found
1. Manual `sw.js` caches `/api` responses with network-first (stores in dynamic cache)
2. `skipWaiting()` + `clients.claim()` = mid-transaction SW takeover risk
3. `cacheFirst` applied to ALL non-API navigation (including `/dashboard`, `/forge`)
4. No method filtering on cache PUT (POST responses could be cached)

## Auth Architecture
- **Type**: Custom JWT (not NextAuth)
- **Access token**: Memory only (good)
- **Refresh token**: `localStorage` (not HttpOnly cookie)
- **No cookies used**: Cookie security audit N/A — tokens are in-memory + localStorage

## Strategy Decision

**Selected**: `@ducanh2912/next-pwa` (next-pwa v2)

**Reasoning**:
- `next-pwa@5.6.0` (v1 by @nicegoodthings) is unmaintained, incompatible with Next.js 15+
- `@ducanh2912/next-pwa` is the maintained fork, supports Next.js 14-16, App Router, Workbox 7
- Generates Workbox-based SW with proper runtimeCaching, replaces the insecure manual SW
- `serwist` is an alternative but `@ducanh2912/next-pwa` has better stability for production

**Rejected alternatives**:
- `serwist`: More complex setup, less production battle-testing
- Manual SW: Current manual SW has security issues, Workbox provides tested caching strategies
- Keep `next-pwa@5.6.0`: Incompatible with Next.js 16

## Risk Assessment
- **Low**: Library swap (drop-in config in next.config.js)
- **Low**: Manifest update (additive changes)
- **Medium**: SW replacement (must verify all sensitive routes are NetworkOnly)
- **Mitigated**: Icons are additive (new PNG files alongside existing SVG)

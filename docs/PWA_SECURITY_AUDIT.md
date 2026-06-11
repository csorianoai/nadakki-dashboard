# PWA Security Audit — Nadakki Credit

## Service Worker Caching Rules

| Route Pattern | Handler | Safe? |
|---|---|---|
| `/api/*` | NetworkOnly | YES |
| `/(auth\|login\|logout\|session)/*` | NetworkOnly | YES |
| `/(dashboard\|dealer\|bank\|forge\|credit-hub)/*` | NetworkOnly | YES |
| `/(applications\|decision\|scoring\|documents\|uploads)/*` | NetworkOnly | YES |
| `/(tenants\|admin\|market-intel)/*` | NetworkOnly | YES |
| `/_next/static/*` | CacheFirst | YES (immutable build assets) |
| `/_next/image?*` | StaleWhileRevalidate | YES (public images) |
| `/icons/*` | CacheFirst | YES (static icons) |
| `/fonts/*` | CacheFirst | YES (static fonts) |
| `/manifest.json` | NetworkFirst | YES (public config) |
| `/offline` | CacheFirst | YES (static offline page) |

## HTTP Method Filtering
- All runtimeCaching rules specify `method: "GET"`
- POST/PUT/DELETE/PATCH requests are never intercepted by the SW
- This prevents accidental re-application of credit transactions

## Service Worker Lifecycle
- `skipWaiting: false` — SW does not auto-activate during active sessions
- `clientsClaim: false` — new SW waits for controlled pages to close
- This prevents mid-application refresh for dealers processing credit applications

## Auth Token Security
- **Access token**: Stored in memory only (not cached by SW)
- **Refresh token**: Stored in localStorage with key `nadakki_refresh_token_v2`
- **No HttpOnly cookies used**: Auth is JWT-based, not cookie-based
- SW does not cache any `/api/v1/auth/*` responses (NetworkOnly)
- localStorage is not accessible from the SW context

## Cache Security Verification (Post-Build)
```
ALL ROUTES:
  NetworkFirst              "/"
  NetworkOnly               /^https?:\/\/[^/]+\/api\/.*/i
  NetworkOnly               /^https?:\/\/[^/]+\/(auth|login|logout|session)(\/.*)?$/i
  NetworkOnly               /^https?:\/\/[^/]+\/(dashboard|dealer|bank|forge|credit-hub)(\/.*)?$/i
  NetworkOnly               /^https?:\/\/[^/]+\/(applications|decision|scoring|documents|uploads)(\/.*)?$/i
  NetworkOnly               /^https?:\/\/[^/]+\/(tenants|admin|market-intel)(\/.*)?$/i
  CacheFirst                /\/_next\/static\/.*/i
  StaleWhileRevalidate      /\/_next\/image\?.*/i
  CacheFirst                /\/icons\/.*/i
  CacheFirst                /\/fonts\/.*/i
  NetworkFirst              /\/manifest\.json$/i
  CacheFirst                /\/offline$/i

SECURITY VIOLATIONS: 0
```

## Vercel Headers
- `/sw.js`: `Cache-Control: public, max-age=0, must-revalidate` (always fresh)
- `/workbox-*.js`: `Cache-Control: public, max-age=31536000, immutable`
- `/manifest.json`: `Cache-Control: public, max-age=3600, must-revalidate`

## Manifest Security
- `scope: "/dashboard"` — restricts PWA navigation to dashboard subtree
- `start_url: "/dashboard"` — PWA opens to authenticated area
- No `prefer_related_applications` — no external app store redirects

# NADAKKI Dashboard

## Windows Dev Stability

Disable Turbopack on Windows to avoid SST lock (os error 1224) causing phantom 404s:

- Add `NEXT_DISABLE_TURBOPACK=1` to `.env.local`, or
- Run `npm run dev:stable` (uses webpack instead of turbopack)

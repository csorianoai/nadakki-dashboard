# C4 — Smoke Evidence

**Status:** PARTIAL — implementation verified locally; authenticated preview smoke pending credentials  
**Branch:** `feat/credit-hub-final-wiring`  
**Date:** 2026-07-08

## Local verification (automated)

| Check | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm run build:webpack` | PASS |
| `jest` (final-wiring, DemoModeBanner, bank dashboard) | PASS (9 tests) |
| `rg d3b00111 app/ components/ lib/credit-hub` | 0 matches |

## Wiring delivered (pre-smoke)

| # | Item | Status |
|---|------|--------|
| G1 | Goals API wired (`DealerGoals`, `BankGoals`) | CODE |
| C2 | `is_demo` from `/api/v2/auth/me` → `tenantConfig` | CODE |
| B2 | Bank detail → `expediente/full` (+ fallback) | CODE |
| B11 | Stipulations tab on bank expediente | CODE |
| B8 | Auction intel — no mock; handback doc if empty | DOC |

## Authenticated preview smoke (manual)

**Blocked:** no `SMOKE_EMAIL` / `SMOKE_PASSWORD` in `.env.local`.  
Use `demo.admin@nadakki-demo.com` on Vercel preview after PR deploy.

### Checklist

| # | Step | PASS/FAIL | Screenshot |
|---|------|-----------|------------|
| 1 | Banner **MODO DEMO** on `/credit-hub/dealer` and `/credit-hub/bank` | PENDING | — |
| 2 | Bank KPIs — seeded numbers | PENDING | — |
| 3 | Bank bandeja — Pedro Antonio Martinez / Toyota RAV4 | PENDING | — |
| 4 | Bank metas — 4 goals from API (not hardcoded 120M) | PENDING | — |
| 5 | Bank funnel / analytics tiles | PENDING | — |
| 6 | Bank ranking (4 lenders) | PENDING | — |
| 7 | Dealer pipeline | PENDING | — |
| 8 | Dealer goals — API targets | PENDING | — |
| 9 | Dealer comparador — Wendy Altagracia / Hyundai Elantra score 540 | PENDING | — |
| 10 | Expediente `d3b05eed-0000-0000-0000-000000000001` + stipulations tab | PENDING | — |
| 11 | Monthly payment anti-phantom | PENDING | — |
| 12 | Non-demo tenant — no banner | PENDING | — |

### Seed personas (HANDOFF v2)

- **Pedro Antonio Martinez** / Toyota RAV4 — app `d3b05eed-0000-0000-0000-000000000001`
- **Wendy Altagracia** / Hyundai Elantra score 540 — verify in dealer list/detail

### How to run smoke + screenshots

```bash
export SMOKE_EMAIL="demo.admin@nadakki-demo.com"
export SMOKE_PASSWORD="<password>"
export PREVIEW_URL="https://<vercel-preview>"

node tools/credit-hub-c4-smoke.mjs
```

Screenshots output: `docs/credit-hub-demo/screenshots/c4/`

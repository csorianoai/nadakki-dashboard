# Auction Intel — Handback (if empty 200 with seed)

**Date:** 2026-07-08  
**Branch:** `feat/credit-hub-final-wiring`  
**Executor:** Cursor (GR-12)

## Probe result (unauthenticated)

```http
GET https://nadakki-ai-suite.onrender.com/api/v2/credit/analytics/auction-intel
X-Tenant-ID: d3b00111-0000-0000-0000-000000d3b001
```

**Response:** `401 Unauthorized` — endpoint mounted; JWT required to inspect body.

## Required authenticated capture (for Claude Code if panel empty)

Login as `nadakki-demo` tenant (`demo.admin@nadakki-demo.com` or equivalent), then:

```bash
TOKEN="<jwt>"
TENANT="d3b00111-0000-0000-0000-000000d3b001"
BASE="https://nadakki-ai-suite.onrender.com"

curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT" \
  -H "X-Actor-Role: bank_admin" \
  "$BASE/api/v2/credit/analytics/auction-intel" | jq .
```

### If response is HTTP 200 with empty aggregates

Record and hand back:

| Field | Value |
|-------|-------|
| Request URL | full URL + query |
| Request headers | `Authorization` (redacted), `X-Tenant-ID`, `X-Actor-Role` |
| Response status | 200 |
| Response body | paste JSON |
| Tenant | `nadakki-demo` |
| Seed expectation | HANDOFF v2 B8 — offers with ACCEPTED/DECLINED mix |

**Frontend behavior:** `AuctionIntel.tsx` shows ROADMAP empty sub-panels when fields missing; **no mock fallback** (C3-bis).

## Action for backend

If body is `{}` or zeroed metrics despite seed, investigate `auction-intel` aggregation against `application_offers` for `SEED-DEMO-*` trace IDs.

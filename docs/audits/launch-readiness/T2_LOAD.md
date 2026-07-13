# T2 — Load Testing Report

**Date:** 2026-07-13  
**Target:** `https://nadakki-ai-suite.onrender.com`

---

## Tool status

| Tool | Status |
|------|--------|
| k6 (Grafana) | **BLOCKED** — not installed |
| Locust | **BLOCKED** — not installed |
| curl baseline (10 samples) | ✅ Executed |

**Full T2.1–T2.6 scenarios require k6/Locust + authenticated journey scripts.** This report documents partial baseline and external blockers.

---

## T2.1 — Baseline single-user (partial)

**Endpoint:** `GET /api/v2/credit/health`  
**Samples:** 10 sequential requests from audit host (MIA region)

| Metric | Value |
|--------|-------|
| P50 | ~456 ms |
| P95 | ~1414 ms (cold start outlier) |
| Min | 252 ms |
| Max | 1414 ms |

**Note:** First request hit Render cold-start (~1.4s). Steady-state ~300–500ms.

**Full journey (10 applications):** **NOT EXECUTED** — requires dealer JWT + wizard automation.

---

## T2.2–T2.6 — Graduated load scenarios

| Scenario | Target | Status |
|----------|--------|--------|
| 50 concurrent × 15 min | Degradation curve | **BLOCKED** |
| 100 concurrent × 15 min | — | **BLOCKED** |
| 200 concurrent × 15 min | Day peak | **BLOCKED** |
| 400 concurrent × 15 min | Realistic peak | **BLOCKED** |
| 700 concurrent × 5 min | Stress | **BLOCKED** |
| 5 req/s × 1 hour sustained | Normal day | **BLOCKED** |
| 20 req/s × 30 min | Peak | **BLOCKED** |
| 60 req/s × 15 min | Stress | **BLOCKED** |
| 100 req/s × 5 min | Worst case | **BLOCKED** |
| 50 concurrent 2MB uploads | Storage | **BLOCKED** |
| DB pool saturation | PgBouncer | **BLOCKED** |
| Failure modes (kill instance, corrupt conn) | Chaos | **BLOCKED** |

---

## Infrastructure context (from code review)

| Component | Current state | Launch risk |
|-----------|---------------|-------------|
| Rate limiting | In-memory per `X-Tenant-ID`, 100 req/min | **P1** — not shared across Render instances |
| Connection pool | Render Postgres (tier unknown) | **P1** — PgBouncer not deployed |
| Document storage | `S3_ENABLED` flag; filesystem fallback on Render | **P1** — ephemeral disk risk |
| Read replica | Not configured | P2 — analytics load on primary |

---

## Recommended k6 script skeleton (for human execution)

```javascript
// scripts/load/credit-hub-baseline.js — to be added
import http from 'k6/http';
import { check } from 'k6';
export const options = { vus: 50, duration: '15m' };
export default function () {
  const res = http.get('https://nadakki-ai-suite.onrender.com/api/v2/credit/health');
  check(res, { 'status 200': (r) => r.status === 200, 'p95<3s': (r) => r.timings.duration < 3000 });
}
```

---

## Gate T2 verdict

**NOT MET** — Full load matrix not executed.  
**Partial evidence:** Health endpoint steady-state ~300–500ms supports **low-traffic pilot (6 tenants)** but does **not** certify 400 concurrent / 20 req/s peak.

**Recommendation for controlled launch:**
- Proceed with **6-tenant cohort only** if T1/T3 gates pass
- Execute k6 graduated tests in Render staging mirror **before wave 2 expansion**
- HOLD expansion if P95 > 1s for 24h (per launch contract)

**STOP condition not triggered:** No evidence of collapse at 30% peak (test not run).

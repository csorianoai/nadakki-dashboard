# Camino A — Status Tracker (Launch 20–26 July 2026)

**Updated:** 2026-07-13  
**Path:** Full hardening + controlled launch

---

## Day 1 complete

| Item | Status | Artifact / PR |
|------|--------|---------------|
| PR #324 P0 tenant guard | ✅ **MERGED** (#324) | `useTenant.ts` fail-closed prod |
| Next.js 16.2.10 bump | 🟡 PR open | [#325](https://github.com/csorianoai/nadakki-dashboard/pull/325) |
| Locust installed | ✅ | `nadakki-ai-suite/.venv` |
| Baseline 1VU load test | ✅ | T2_LOAD_RESULTS.md — 0% errors, P95 ~180ms |
| 50 VU load test | ⚠️ **Rate limit break** | 98% fail on credit health (100 req/min) |
| Kill-switch API | 🟡 PR open | `nadakki-ai-suite` feat/camino-a-kill-switch-flags |
| CREDIT_HUB flags service | 🟡 Same PR | Uses `tenant_feature_flags` table |
| Infra budget doc | ✅ | CAMINO_A_INFRA_BUDGET.md — **awaiting Ramon GO** |

---

## Awaiting Ramon GO (budget)

| Item | Est. cost | Blocker |
|------|-----------|---------|
| Postgres Pro + PgBouncer | ~US$85/mo | Purchase |
| S3 nadakki-documents | ~US$10/mo | AWS account |
| Sentry WhatsApp alerts | $0 if plan includes | Config |

---

## Day 2–3 queue

- [ ] Merge #325 (Next.js)
- [ ] Merge backend kill-switch PR + apply migration 091
- [ ] **Raise rate limits** (T4.4) then re-run T2.2–T2.6
- [ ] JWT fixtures for 10-app journey test

---

## Day 7 launch (20–26 July)

- 6 pilot tenants with `CREDIT_HUB_TENANT_ENABLED=false` pre-seeded
- Ramon flips flags to `true` on GO
- Daily monitoring × 2 weeks

# Camino A — Infra budget approval required (Ramon GO)

**Date:** 2026-07-13  
**Status:** AWAITING_BUDGET_GO

---

## 1. Render Postgres Pro upgrade

| Item | Estimate |
|------|----------|
| Current tier | Render Postgres (standard) — verify in Render dashboard |
| **Postgres Pro** | ~**US$85/month** (Render list price; confirm in billing) |
| Includes | Higher connection limit, automated backups, point-in-time recovery (plan-dependent) |

**Actions on GO:**
1. Render Dashboard → Database → Upgrade to Pro
2. Configure backup interval **6 hours**
3. Run restore drill to staging branch (document RTO/RPO)
4. Enable PgBouncer on Render (included in Pro workflow)

**RTO/RPO targets (to validate post-upgrade):**
- RPO: ≤ 6h (backup interval)
- RTO: ≤ 2h (manual restore runbook)

---

## 2. AWS S3 — nadakki-documents

| Item | Estimate |
|------|----------|
| S3 Standard storage (100 GB pilot) | ~US$2.30/month |
| PUT/GET requests (10k/month) | ~US$0.50/month |
| Versioning overhead | ~20% storage |
| **Total pilot estimate** | ~**US$5–15/month** |

**Actions on GO:**
1. Create bucket `nadakki-documents` (region: us-east-1 or sa-east-1 per latency)
2. Enable versioning + SSE-S3 or KMS
3. Set `FERNET_MASTER_KEY` in Render (already supported in `s3_document_storage.py`)
4. Set `S3_ENABLED=true`, `DOCUMENT_STORAGE_S3=false` per tenant until pilot activation
5. Migration script: `scripts/migrate_documents_to_s3.py` (to be added in PR)

**Rollback:** `S3_ENABLED=false` + `DOCUMENT_STORAGE_S3=false` → filesystem fallback

---

## 3. Sentry alerts (no incremental cost if plan includes alerts)

| Alert | Channel | Trigger |
|-------|---------|---------|
| P0 cross-tenant probe fail | Email + WhatsApp (Ramon) | Custom metric (to implement) |
| Error rate > 2% | Email | Sentry Issues spike |
| Auth bypass pattern | Email | `missing_auth` spike filter |

**Action:** Configure in Sentry project `nadakki-ai-suite` → Alerts → Ramon contact.

---

## 4. Cloudflare WAF Pro (optional)

| Item | Estimate |
|------|----------|
| Cloudflare Pro | ~US$20/month |
| Benefit | Advanced rate limiting, WAF rules |

**Current:** Cloudflare free tier active on backend (cf-ray headers confirmed).

---

## Total incremental monthly (on full Camino A infra)

| Service | USD/month |
|---------|-----------|
| Postgres Pro | ~85 |
| S3 pilot | ~10 |
| Cloudflare Pro (optional) | ~20 |
| **Total** | **~95–115** |

**Awaiting:** Explicit Ramon GO before any purchase or upgrade.

# T1.2 — Secrets & Leaks Scan

**Date:** 2026-07-13  
**Repos:** `nadakki-dashboard`, `nadakki-ai-suite`

---

## Tool execution status

| Tool | Status | Notes |
|------|--------|-------|
| TruffleHog (`--depth=all`) | **BLOCKED** | CLI not installed on audit host |
| gitleaks (extended config) | **BLOCKED** | CLI not installed on audit host |
| Manual grep (high-entropy patterns) | **EXECUTED** | See findings below |
| `.env.example` coverage audit | **EXECUTED** | See matrix below |

**Recommendation:** Run TruffleHog + gitleaks in GitHub Actions `security-scan.yml` before GO. Historical scan required for launch contract.

---

## Manual grep findings

| ID | Sev | Finding | File | Detail |
|----|-----|---------|------|--------|
| **P1-SEC-001** | P1 | Hardcoded E2E password default | `e2e/dealer/helpers.ts:4` | `LOGIN_PWD = process.env.E2E_PASSWORD ?? "%QvPAyTLk0ERJu0x"` — credential in VCS |
| P2-SEC-001 | P2 | E2E email default | `e2e/dealer/helpers.ts:3` | `ramon@nadakki.com` — PII in test helper |
| P3-SEC-001 | P3 | `GROQ_API_KEY` env reference (no value) | `lib/agents/llm/llm-client.ts` | Reads env only — OK |
| P3-SEC-002 | P3 | Synthetic bank credentials in onboarding UI | `hooks/useTenantOnboarding.tsx` | Empty placeholders only — OK |

**No live `sk_live`, `AKIA*`, or PEM private keys found in tracked source.**

---

## `.env.example` vs production coverage

### Frontend (`nadakki-dashboard/.env.example`)

| Variable | In example | Required prod | Gap |
|----------|------------|---------------|-----|
| `BACKEND_URL` | ✅ | ✅ | — |
| `NEXT_PUBLIC_DEFAULT_TENANT_ID` | ✅ | ⚠️ **Must NOT be set in prod** | Documented risk only; no prod guard in example |
| `NEXT_PUBLIC_NADAKKI_API_URL` | ✅ | ✅ | — |
| `NEXT_PUBLIC_DASHBOARD_URL` | ✅ | ✅ | — |
| `NEXT_PUBLIC_SENTRY_DSN` | ✅ (empty) | ✅ for telemetry | — |
| `NEXT_PUBLIC_ENABLE_TELEMETRY` | ✅ | ✅ | — |
| `NEXT_PUBLIC_BANK_PILOT_UI` | ✅ | ✅ | — |
| `NEXT_PUBLIC_CH_NOTIFICATIONS` | ✅ | ✅ | — |
| `NEXT_PUBLIC_FF_FORGE_MONETIZACION` | ❌ | Off in prod | **Missing from example** |
| `NEXT_PUBLIC_FORGE_TEST_TENANT` | ❌ | Never in prod | **Missing from example** |
| `NEXT_PUBLIC_FM_USE_API` | ❌ | Keep false | **Missing from example** |
| `NEXT_PUBLIC_BACKEND_URL` | ❌ | Alt to BACKEND_URL | **Missing from example** |

### Backend (`.env.example` in nadakki-ai-suite)

Key production secrets (never in repo): `JWT_SECRET`, `DATABASE_URL`, `FERNET_MASTER_KEY`, `AWS_*`, `SENTRY_DSN`, `CREDIT_ADMIN_API_TOKEN`.

**Verified:** No `.env` or `.env.production` committed in either repo (gitignore enforced).

---

## Gate T1.2 verdict

**CONDITIONAL PASS** — No confirmed secret leak in tracked files.  
**Blockers for full PASS:** TruffleHog/gitleaks not executed; P1-SEC-001 hardcoded E2E password must be removed before external audit.

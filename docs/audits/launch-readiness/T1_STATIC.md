# T1.1 — Static Analysis Report

**Program:** NADAKKI Credit Hub Dealer–Bank Launch Readiness v2.0  
**Date:** 2026-07-13  
**Repos:** `nadakki-dashboard` (frontend), `nadakki-ai-suite` (backend)  
**Executor:** Autonomous audit track T1

---

## Executive summary

| Gate | Status | Notes |
|------|--------|-------|
| **P0 residual = 0** | **FAIL** | 1 open P0 (tenant env fallback). 1 backend test flake (P1). |
| ESLint `--max-warnings=0` | **PASS** | Scoped lint script clean |
| TypeScript strict (`tsc --noEmit`) | **PASS** | Zero errors |
| Bandit (backend credit paths) | **PASS w/ findings** | 0 High, 19 Medium, 28 Low |
| Semgrep (7 rulesets) | **BLOCKED** | `semgrep` CLI not installed; not run |

---

## Frontend — nadakki-dashboard

### ESLint
```
npm run lint  →  PASS (exit 0, max-warnings=0)
```
Scope: agent registry + legacy `app/(bank)/` paths. **Gap:** Credit Hub `app/(forge)/credit-hub/**` not in lint script scope.

### TypeScript strict
```
npm run typecheck  →  PASS (exit 0)
```

### npm audit (`--production`)
**8 vulnerabilities** (1 low, 5 moderate, 2 high):

| Package | Severity | Issue | Fix |
|---------|----------|-------|-----|
| `next@16.2.4` | **High** | Multiple CVEs (middleware bypass, XSS, DoS, cache poisoning) | Upgrade to `16.2.10` |
| `serialize-javascript` (via `@ducanh2912/next-pwa`) | **High** | RCE + DoS | PWA dependency chain; evaluate `next-pwa` pin |
| `postcss` (via next) | Moderate | XSS in stringify | Resolved with next upgrade |
| `@babel/core` | Low | Arbitrary file read via source map | `npm audit fix` |

**Classification:** P1 — upgrade `next` to 16.2.10 before launch cohort.

### Semgrep
**BLOCKED** — `semgrep` not available on host. CI alternative: `.github/workflows/security-scan.yml` (if configured). Recommend running in GitHub Actions before GO.

---

## Backend — nadakki-ai-suite

### Bandit (`-ll` on `routers`, `services/credit`, `backend/middleware`)

| Severity | Count |
|----------|-------|
| High | **0** |
| Medium | 19 |
| Low | 28 |

Representative Medium findings (SQL string construction in ORM-adjacent code, `try/except pass`, hardcoded bind patterns). No Critical injection paths in credit router hot paths. Full JSON artifact: run `bandit -r routers services/credit -f json`.

### pip-audit (`requirements.txt --strict`)
**Source:** `pip-audit-json/pip-audit.json` (last CI artifact)

| Package | CVE | Severity | Fix available |
|---------|-----|----------|---------------|
| `ecdsa@0.19.2` (transitive via `python-jose`) | CVE-2024-23342 / PYSEC-2026-1325 | Medium (timing side-channel) | **No fix** — upstream considers out of scope |

All other 120+ pinned deps: **0 vulns**.

**Classification:** P2 — document allowlist; JWT verify path does not use `SigningKey.sign_digest()` in hot path.

### pytest security suites (static contract tests)

| Suite | Result |
|-------|--------|
| `tests/security/test_pentest_v4.py` | **40 passed**, 1 xfailed |
| `tests/security/test_tenant_isolation_contract.py` | **862 passed** (cross-tenant spoof matrix) |
| `tests/security/test_auth_bypass.py` | **1 failed** — `test_bank_decide_accepts_valid_jwt_after_claim` (flaky/event-loop) |

---

## Findings register (P0–P3)

| ID | Sev | Finding | Location | Fix | Timeline |
|----|-----|---------|----------|-----|----------|
| **P0-FE-001** | **P0** | `NEXT_PUBLIC_DEFAULT_TENANT_ID` silent fallback when session unset — tenant isolation bypass in Credit Hub | `lib/credit-hub/hooks/useTenant.ts:26-27` | Fail-closed in production: `apiTenantId = sessionTenantId only` | **<24h** — PR prepared |
| P1-FE-001 | P1 | ESLint scope excludes Credit Hub forge routes | `package.json` lint script | Extend lint glob to `app/(forge)/credit-hub/**` | <7d |
| P1-FE-002 | P1 | `next@16.2.4` high-severity CVEs | `package.json` | Bump to `16.2.10` | <48h |
| P1-FE-003 | P1 | Hardcoded E2E password default in repo | `e2e/dealer/helpers.ts:4` | Require `E2E_PASSWORD` env, no default | <48h |
| P1-BE-001 | P1 | Auth bypass test flake | `tests/security/test_auth_bypass.py` | Stabilize async fixture | <7d |
| P2-BE-001 | P2 | `ecdsa` timing CVE, no upstream fix | transitive | Allowlist + monitor | Post-launch |
| P2-FE-001 | P2 | Semgrep not run locally | tooling | CI gate | Pre-GO |
| P3-FE-001 | P3 | DEMO dashboard KPI substitution | `DealerDashboardView`, `BankDashboardView` | Empty states + `DataTruthBadge` | Product wave 2 |

---

## Gate T1 verdict

**NOT MET** — 1 residual P0 (`P0-FE-001`).  
**Action:** Merge P0 fix PR before cohort activation. Re-run T1.1 after fix.

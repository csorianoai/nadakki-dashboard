# T1.3 — Dependencies & Supply Chain

**Date:** 2026-07-13

---

## Tool execution status

| Tool | Status |
|------|--------|
| `npm audit --production` | ✅ Executed |
| `npm outdated` | ✅ Executed |
| `pip-audit --strict` | ✅ Artifact from CI (`pip-audit-json/pip-audit.json`) |
| OWASP Dependency-Check | **BLOCKED** — not installed |
| Snyk | **BLOCKED** — no API token on host |

---

## Frontend (`nadakki-dashboard`)

### npm audit summary (production deps)
- **8 vulnerabilities:** 1 low, 5 moderate, 2 high
- **Primary risk:** `next@16.2.4` — 12 linked GHSA advisories
- **Fix path:** `next@16.2.10` (patch, non-breaking within 16.x)

### npm outdated (breaking-change risk)

| Package | Current | Latest | Breaking? |
|---------|---------|--------|-----------|
| `next` | 16.2.4 | 16.2.10 | No — **patch upgrade recommended** |
| `eslint` | 8.57.1 | 10.7.0 | Yes — defer |
| `tailwindcss` | 3.4.19 | 4.3.2 | Yes — defer |
| `zod` | 3.25.76 | 4.4.3 | Yes — defer |
| `@sentry/react` | 10.53.1 | 10.65.0 | No — minor bump OK |
| `typescript` | 5.9.3 | 7.0.2 | Yes — defer |

### Classification
| ID | Sev | Action |
|----|-----|--------|
| P1-DEP-001 | P1 | Upgrade `next` → 16.2.10 pre-launch |
| P2-DEP-002 | P2 | Pin/review `@ducanh2912/next-pwa` → `serialize-javascript` chain |
| P3-DEP-003 | P3 | Schedule `@sentry/react` minor bump |

---

## Backend (`nadakki-ai-suite`)

### pip-audit (strict, 130 packages scanned)
- **Vulnerable packages:** 1 (`ecdsa` transitive)
- **CVE-2024-23342:** Minerva timing attack on P-256 — **no fix version**
- Mitigation: JWT verification uses `python-jose` decode path; not `ecdsa.SigningKey.sign_digest()` hot path

### Supply chain controls in repo
- `requirements.txt` pinned versions ✅
- `infra/security/pip_audit_allowlist.txt` — CVE exceptions documented
- CI: `.github/workflows/security-scan.yml` — pip-audit advisory (`continue-on-error`)

---

## Gate T1.3 verdict

**CONDITIONAL PASS** — No unmitigated Critical/High in backend. Frontend `next` patch required (P1).  
Full OWASP DC / Snyk scan deferred to CI with credentials.

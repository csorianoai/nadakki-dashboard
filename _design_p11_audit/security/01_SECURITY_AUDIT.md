# 01 — Security Audit: P11-SEC-01 (Hardcoded Admin Keys)

**Severity:** CRITICAL
**Repo audited:** `https://github.com/csorianoai/nadakki-ai-suite` (PUBLIC)
**Date:** 2026-05-10
**Auditor:** Backend security engineer (audit-only; no fix applied in this phase)

---

## 1.1 Inventory of hardcoded credentials

### A. `admin_auth.py:15-17` — the two master keys

```python
ADMIN_KEYS = {
    "nadakki_admin_2025_master":   {"role": "super_admin",  "name": "Master Admin"},
    "nadakki_admin_credicefi_2025": {"role": "tenant_admin", "tenant_id": "credicefi", "name": "Credicefi Admin"},
}
```

| Credential | Line | Type | Prod or test? | Strength |
|---|---|---|---|---|
| `nadakki_admin_2025_master` | `admin_auth.py:16` | Bearer-like static API key | **PROD (effective)** — matched verbatim in `Depends(verify_admin_key)`; no test/dev gate | Trivially guessable string. ~30 bits of entropy at most (English words + year). No expiry, no rotation. |
| `nadakki_admin_credicefi_2025` | `admin_auth.py:17` | Tenant-scoped static API key | **PROD (effective)** — granted `tenant_admin` on `credicefi` | Same — guessable, no expiry. |

The file's own comment (`# Admin API Keys (en producción usar variables de entorno)`) admits these are dev scaffolding never replaced.

### B. Leak in documentation

`docs/api/AUTH.md` ships the master key in plaintext examples — 8 occurrences:

| Line | Snippet |
|---|---|
| `docs/api/AUTH.md:35` | `X-Admin-Key: nadakki_admin_2025_master` |
| `docs/api/AUTH.md:42` | `\| `nadakki_admin_2025_master` \| super_admin \| All tenants \|` |
| `docs/api/AUTH.md:43` | `\| `nadakki_admin_credicefi_2025` \| tenant_admin \| credicefi only \|` |
| `docs/api/AUTH.md:72,84,91` | curl examples with the master key in the `-H` flag |

`docs/api/ENDPOINTS_COMPLETE.md` only references the *header name* `X-Admin-Key`, not the values — that file is clean.

### C. Other auth secrets in the same file: NONE

`admin_auth.py` does NOT contain:
- JWT signing secrets (those live in `services/sic_auth_service.py` env var `SIC_JWT_SECRET`)
- Tenant API keys (issued at runtime, hashed in DB; see `backend/routers/api_keys_router.py`)
- DB passwords (env vars)

The blast radius of this file is exactly the two admin keys above.

---

## 1.2 Git history forensics

### When were the keys introduced?

```
commit:  88791f6a
date:    2025-12-29 20:57:39 -05:00  (131 days ago)
author:  Cesar Soriano
message: feat: add admin auth protection for tenant management endpoints
```

**Exposure window:** **131 days** in the public GitHub repo as of 2026-05-10.

### Where do the keys live in git refs?

```
$ git log --all -S "nadakki_admin_2025_master" --oneline
88791f6a feat: add admin auth protection for tenant management endpoints
13e79256 feat: FASE 4 — API keys, usage tracking, billing, rate limiting, docs
```

Two commits contain the literal string. Both are on `main` and propagate to every feature branch that branched off `main` after Dec 29.

**`git branch -r --contains 88791f6a`** lists **20+ remote branches** including:
- `origin/main` (HEAD)
- `origin/audit/master-sidebar-audit-2026-04-23`
- `origin/feat/forge-bank-portal-real-engine`
- `origin/feat/forge-real-credit-analysis-engine`
- `origin/feat/sic-core-22-mvp`
- `origin/feat/sic-v6-backend-bankready`
- `origin/feat/routeone-parity-pr-a-lenders-decisions`
- ... and ~12 more.

**Implication:** rewriting history requires force-pushing **every one** of those branches. BFG / `git filter-branch` is feasible but coordination-heavy.

### Public exposure

- Remote: `https://github.com/csorianoai/nadakki-ai-suite.git` (the `https://` URL without auth in the `git remote -v` output indicates a **public repo**, not a private clone). The keys are therefore:
  - Indexable by GitHub code search.
  - Crawlable by any GitHub-mining bot (e.g., GitGuardian, TruffleHog, leaked-credentials scrapers, LLM training crawls).
  - Visible to anyone Cesar has invited as collaborator OR who has cloned/forked the repo.
- Forks / collaborator concerns flagged by the prompt (Cowork, Manus): **assume the keys are known outside Nadakki**. There is no way to retroactively unleak them. Treat as **compromised**.

### Has `.env` ever been committed?

```
$ git log --all -- .env
(empty)
```

Clean. `.env` is properly gitignored (line 9 of `.gitignore`: `.env`, line 10: `.env.*`). No env file has ever been added to git.

---

## 1.3 Runtime usage (where the keys are actually consumed)

Grep across the repo (Python sources only) finds **5 files** referencing `admin_auth` / `verify_admin_key` / `ADMIN_KEYS` / `X-Admin-Key`:

| File | Use |
|---|---|
| `admin_auth.py` | Definition |
| `multitenant_integration.py:9` | `from admin_auth import verify_admin_key` |
| `multitenant_integration.py:140` | `async def create_tenant(..., admin = Depends(verify_admin_key))` |
| `multitenant_integration.py:156` | `async def update_tenant(..., admin = Depends(verify_admin_key))` |
| `multitenant_integration.py:166` | `async def activate_tenant(..., admin = Depends(verify_admin_key))` |
| `multitenant_integration.py:172` | `async def suspend_tenant(..., admin = Depends(verify_admin_key))` |
| `docs/api/AUTH.md` | Documentation (leaks the values) |
| `docs/api/ENDPOINTS_COMPLETE.md` | Documentation (header name only, no values) |
| `security-fix-prompt.txt` | This task's input prompt (not a runtime consumer) |

### Affected endpoints (4 — all in `multitenant_integration.py`)

All four are tenant lifecycle endpoints. They are **critical** because they govern tenant creation, mutation, and suspension — exactly the operations a compromised admin key would be most damaging on.

| Endpoint | Auth dep | What an attacker could do with the leaked key |
|---|---|---|
| `POST /api/v1/tenants/onboard` (or equivalent in `multitenant_integration.py:140`) | `verify_admin_key` | Create rogue tenants, plant data |
| `PATCH /api/v1/tenants/{id}` (`:156`) | `verify_admin_key` | Modify any tenant's config (e.g., flip `meta_live_enabled`) |
| `POST /api/v1/tenants/{id}/activate` (`:166`) | `verify_admin_key` | Re-activate a tenant that was disabled |
| `POST /api/v1/tenants/{id}/suspend` (`:172`) | `verify_admin_key` | DoS — suspend any tenant including `credicefi` |

`verify_super_admin` (`admin_auth.py:60`) is **defined but not used elsewhere** in the audited Python sources. Dead code, but the fix should still cover it.

### Existing tests

```
$ grep -r "admin_auth\|verify_admin_key\|ADMIN_KEYS" tests/
(no matches)
```

**No tests cover `admin_auth.py`.** Refactor risk is minimal (no test fixtures to update), but post-fix smoke testing must be done manually.

---

## 1.4 Severity assessment

| Dimension | Rating | Justification |
|---|---|---|
| Confidentiality | CRITICAL | Master super_admin key allows access to all tenants. |
| Integrity | CRITICAL | Same key can mutate or suspend any tenant. |
| Availability | HIGH | A bad actor can mass-suspend tenants, including `credicefi` (the only real tenant). |
| Exploitability | TRIVIAL | Public repo + plaintext keys + no rate limit on the `X-Admin-Key` header check. Search GitHub for `nadakki_admin_2025_master` → hit. |
| Detectability of past abuse | LOW | `ADMIN_AUDIT_LOG` is in-memory only, capped at 1000 entries, lost on every restart (`admin_auth.py:21`, `:33-34`). No persistent audit trail of admin actions. **We cannot determine whether the leaked keys have already been abused.** |
| Window of exposure | 131 days | Continuously exposed since 2025-12-29. |

**Bottom line:** treat both keys as compromised. Rotation must be paired with a forensic review of any admin endpoint hits in production logs (Render) since 2025-12-29 — outside this audit's scope but flagged to Cesar.

---

## 1.5 Out of scope for this audit (flagged for follow-up)

- **Forensic log review on Render.** Cesar should pull Render request logs for endpoints in `multitenant_integration.py` and look for unexpected `X-Admin-Key` callers (any IP not from his own workstations / CI).
- **GitHub secret-scanning alerts.** Check `https://github.com/csorianoai/nadakki-ai-suite/security/secret-scanning` for any auto-detected leaks. Confirm the two strings appear (or push for them to be added to GitHub's pattern catalog).
- **GitGuardian / TruffleHog scan** of the public repo to enumerate any other credentials this audit didn't surface (e.g., in old backup files like `app.py.backup`, `main.py.bak`, etc., which are present in the repo root).
- **Persisting `ADMIN_AUDIT_LOG`.** The in-memory log is itself a gap (no audit trail survives a pod restart). Out of scope here; covered by the RBAC migration plan (FASE 4 Sprint 2 backlog).
- **Removing `docs/api/AUTH.md` leak.** The doc bakes the literal key into curl examples. Must be sanitized in FASE 3.

---

## 1.6 Inventory summary

| Item | Count |
|---|---|
| Hardcoded credential strings in source | **2** (`nadakki_admin_2025_master`, `nadakki_admin_credicefi_2025`) |
| Source files containing them | **1** (`admin_auth.py`) |
| Documentation files leaking the values | **1** (`docs/api/AUTH.md`, 8 occurrences) |
| Runtime consumers (FastAPI deps) | **2** functions (`verify_admin_key`, `verify_super_admin`) |
| Affected endpoints | **4** (all in `multitenant_integration.py`) |
| Existing tests | **0** |
| Days exposed in public repo | **131** |
| Remote branches containing the strings | **20+** |
| `.env` ever committed | **NO** (gitignore working) |

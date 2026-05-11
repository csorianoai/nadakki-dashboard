# 03 — Fix Summary: P11-SEC-01

**Status:** Fix applied, branch created, NOT pushed.
**Date:** 2026-05-10
**Branch:** `fix/p11-sec-01-rotate-admin-keys` (backend repo)
**Commit:** `7b8d3672`

---

## What changed

### `admin_auth.py` (refactored)

| Before | After |
|---|---|
| Hardcoded `ADMIN_KEYS = {"nadakki_admin_2025_master": ...}` dict | `_build_key_table()` reads `ADMIN_KEY_SUPER`, `ADMIN_KEY_BACKUP`, and any `ADMIN_KEY_<TENANT_SLUG>` from `os.environ` at import time |
| Silent fallback if misconfigured | `ENVIRONMENT=production` + no keys → `RuntimeError` at import. Dev with no keys → endpoints return 503. |
| 2 fixed tenants | Tenant keys discovered by env-var prefix. Adding a tenant = one env var, no code change. |
| Endpoint behavior | **Unchanged** — same `X-Admin-Key` header, same 401/403 semantics, same dependency signatures. |

### `.env.example` (extended)

Added a documented section with 3 new placeholders (`ADMIN_KEY_SUPER`, `ADMIN_KEY_BACKUP`, `ADMIN_KEY_CREDICEFI`), generation instructions, and a warning never to reuse the rotated strings.

### Files NOT changed (intentionally)

- `multitenant_integration.py` — consumers of `verify_admin_key`. API contract is identical, so no consumer change needed.
- `docs/api/AUTH.md` — still references the old keys in 8 places. Out of scope per the fix rules. The rotated keys won't work against the running app, so the doc is misleading but not exploitable. Flagged as follow-up below.
- `.gitignore` — `.env` and `.env.*` already covered.
- Tests — none existed for `admin_auth.py`; smoke tested manually in FASE 4.

---

## New keys generated

Three fresh 256-bit URL-safe tokens are in `_design_p11_audit/security/NEW_KEYS_TEMP.md` (this directory, dashboard repo, **untracked**). That file is intentionally temporary; Cesar must delete it after copying the values to Render.

| Env var | Role | Tenant scope |
|---|---|---|
| `ADMIN_KEY_SUPER` | super_admin | all |
| `ADMIN_KEY_CREDICEFI` | tenant_admin | credicefi |
| `ADMIN_KEY_BACKUP` | super_admin (break-glass) | all |

---

## Verification done (FASE 4)

| Check | Result |
|---|---|
| `admin_auth.py` imports cleanly in dev with no keys (warns) | ✅ |
| Loads correctly when env vars are set | ✅ |
| `RuntimeError` at import if `ENVIRONMENT=production` and no keys | ✅ |
| Endpoints return 503 in dev with no keys | ✅ |
| `verify_admin_key` accepts new keys | ✅ |
| `verify_admin_key` rejects old keys with 403 | ✅ |
| `verify_admin_key` rejects missing header with 401 | ✅ |
| `verify_super_admin` blocks non-super roles with 403 | ✅ |
| `grep` for old key strings in `admin_auth.py` | 0 matches |
| Commit contains only `admin_auth.py` + `.env.example` | ✅ |
| Branch not pushed | ✅ |

---

## ACTION REQUIRED FROM CESAR (do in this order)

### STEP 1 — Read the new keys

Open `C:\Users\cesar\Projects\nadakki-dashboard\_design_p11_audit\security\NEW_KEYS_TEMP.md`. Three keys listed.

### STEP 2 — Copy to Render env vars

1. Render dashboard → `nadakki-ai-suite` service → Environment
2. Add three vars (values from `NEW_KEYS_TEMP.md`):
   - `ADMIN_KEY_SUPER`
   - `ADMIN_KEY_BACKUP`
   - `ADMIN_KEY_CREDICEFI`
3. Save.

### STEP 3 — Update local `.env`

```bash
cd C:\Users\cesar\Projects\nadakki-ai-suite\nadakki-ai-suite
# append the three lines from NEW_KEYS_TEMP.md to .env
# .env is gitignored, no risk of committing
```

### STEP 4 — Save to password manager

1Password / Bitwarden / whatever you use. Title: "Nadakki admin keys (rotated 2026-05-10)".

### STEP 5 — DELETE the temp file

```powershell
Remove-Item "C:\Users\cesar\Projects\nadakki-dashboard\_design_p11_audit\security\NEW_KEYS_TEMP.md"
```

Or `del` / `rm` — whatever your shell prefers. The keys are now in Render + local `.env` + password manager. They MUST leave the dashboard repo.

### STEP 6 — Restart Render deployment

Either trigger a manual deploy or restart the service. The new env vars take effect at process start.

### STEP 7 — Smoke test prod

```bash
# Should succeed (200)
curl -i -H "X-Admin-Key: <ADMIN_KEY_SUPER_VALUE>" https://<your-render-url>/api/v1/admin/audit-log

# Should fail (403)
curl -i -H "X-Admin-Key: nadakki_admin_2025_master" https://<your-render-url>/api/v1/admin/audit-log
```

### STEP 8 — Merge

```bash
cd C:\Users\cesar\Projects\nadakki-ai-suite\nadakki-ai-suite
git checkout main
git merge --no-ff fix/p11-sec-01-rotate-admin-keys
git push origin main
```

Or open a PR if the project prefers that workflow.

### STEP 9 — (Optional but recommended) Forensic review

Pull Render request logs since 2025-12-29 for endpoints in `multitenant_integration.py` (`/api/v1/tenants/*`). Look for unexpected callers (any IP not from your workstations / CI). The leaked master key has been live for 131 days; this confirms whether it was ever used by an unauthorized party.

### STEP 10 — (Optional) Notify Cowork / Manus teams

If they had the old keys (per the prompt context), notify them through a secure channel (1Password share, in-person, signal — NOT chat / email / GitHub) that the keys rotated. Share the new key only with whoever genuinely needs admin access.

### STEP 11 — (Optional) Sanitize `docs/api/AUTH.md`

Replace the 8 plaintext occurrences of `nadakki_admin_2025_master` / `nadakki_admin_credicefi_2025` with `<your-admin-key>` placeholders. Add a banner: "Never commit real values." Can ship as a separate PR.

### STEP 12 — (Optional) Git history rewrite

The leaked strings still live in git history. The remediation plan recommends leaving history alone (rotation made them useless) — but if you need forensic cleanliness for SOC2 / regulators, run BFG:

```bash
echo 'nadakki_admin_2025_master==>REDACTED' >  /tmp/replacements.txt
echo 'nadakki_admin_credicefi_2025==>REDACTED' >> /tmp/replacements.txt
# in a fresh mirror clone:
java -jar bfg.jar --replace-text /tmp/replacements.txt
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

Coordinate with anyone who has open PRs — they will need to rebase/re-clone.

---

## Open items (not blocking this fix)

| Item | Owner | Why deferred |
|---|---|---|
| Sanitize `docs/api/AUTH.md` | Cesar / follow-up PR | Out of scope per fix rules (only `admin_auth.py` + `.env.example`). Keys already useless. |
| Git history rewrite (BFG) | Cesar decides | Operationally expensive, low real-world payoff once keys are rotated. |
| Persist `ADMIN_AUDIT_LOG` to DB | Sprint 2 (RBAC migration) | Covered by FASE 4 of the RBAC plan. |
| Adopt vault / secrets manager | Sprint 2+ | Tracked in `_design_p11_audit/rbac/04_RBAC_MIGRATION_PLAN.md`. |
| GitHub secret-scanning alert review | Cesar | Check repo security tab. |
| Forensic review of Render logs | Cesar | Step 9 above. |

---

## Files in this audit

| Path | Purpose |
|---|---|
| `_design_p11_audit/security/01_SECURITY_AUDIT.md` | Inventory + forensics |
| `_design_p11_audit/security/02_REMEDIATION_PLAN.md` | Options compared, rotation plan |
| `_design_p11_audit/security/03_FIX_SUMMARY.md` | This document |
| `_design_p11_audit/security/NEW_KEYS_TEMP.md` | **DELETE AFTER STEP 5** |

| Path (backend repo, on `fix/p11-sec-01-rotate-admin-keys`) | Purpose |
|---|---|
| `admin_auth.py` | Env-driven loader |
| `.env.example` | Documented placeholders |

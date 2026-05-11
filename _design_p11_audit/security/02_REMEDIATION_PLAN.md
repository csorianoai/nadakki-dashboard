# 02 — Remediation Plan: P11-SEC-01

**Input:** `01_SECURITY_AUDIT.md`
**Goal:** stop the active leak, rotate the compromised keys, and harden the loader so the same mistake cannot recur.

---

## 2.1 Technical options compared

### Option A — Env vars + `.env.example` (recommended)

**What:** read keys from `os.getenv(...)` at module load; ship a `.env.example` with placeholder names; hard-fail on startup if any admin key env var is missing in production. Documentation is sanitized.

| Dimension | Detail |
|---|---|
| Time to implement | ~25 min coding + ~10 min validation |
| Risk | LOW. Existing `.gitignore` already covers `.env`. No new infra. |
| Reversibility | Trivial — revert the commit. |
| Coverage of the bug | Stops the *source-code* leak (the main bleeding wound). |
| What it does NOT fix | Existing keys in git history. Existing keys in `docs/api/AUTH.md`. → addressed by rotation (2.2) and doc sanitization (FASE 3). |

### Option B — Vault / secrets manager (AWS SSM, HashiCorp Vault, Doppler, Render Secret Groups)

**What:** move keys into a managed secrets store; the app fetches them at boot via SDK.

| Dimension | Detail |
|---|---|
| Time to implement | ~4-8 hours (SDK integration + IAM/credentials for the vault itself + boot-time wiring + rollback path) |
| Risk | MEDIUM. New external dependency at boot. If vault is down, app cannot start. |
| Reversibility | Harder — you've committed to a new dependency. |
| Coverage of the bug | Same as A for the source-code leak; adds defense-in-depth (rotation, audit, central revocation). |

**Verdict:** overkill for this fix's 45-60 min budget. Right move for Sprint 2+.

### Option C — Hybrid: env vars now, vault later (recommended for the program, not for this fix)

**What:** ship Option A in this PR. Document Vault adoption as a Sprint 2 backlog item once the RBAC migration is in place. New keys live under `platform_superadmin` role + JWT, with vault-backed signing secret.

| Dimension | Detail |
|---|---|
| Time to implement (this fix) | Same as A — ~35 min |
| Risk | LOW for the fix, deferred for the vault step |
| Reversibility | Same as A |
| Coverage of the bug | Same as A; explicit follow-up path |

**Chosen:** **Option C** — execute Option A in FASE 3 of this task; queue the vault discussion for the Sprint 2 planning that's already drafted in `_design_p11_audit/rbac/04_RBAC_MIGRATION_PLAN.md` § 4.4.

---

## 2.2 Key rotation plan

The leaked strings (`nadakki_admin_2025_master`, `nadakki_admin_credicefi_2025`) are **compromised** and MUST NOT be reused — not even as the initial value of the new env var. Generate fresh, high-entropy secrets.

### Generation (this fix does it)

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

That yields a 43-character URL-safe string (~256 bits of entropy). We generate **3** keys:
- `ADMIN_KEY_SUPER` — replaces `nadakki_admin_2025_master`
- `ADMIN_KEY_CREDICEFI` — replaces `nadakki_admin_credicefi_2025`
- `ADMIN_KEY_BACKUP` — break-glass key, never logged into normal channels; stored in Cesar's password manager only

The keys are written **only** to `_design_p11_audit/security/NEW_KEYS_TEMP.md`, which lives in the dashboard repo (NOT the backend repo) and is intended to be deleted by Cesar immediately after copying to Render.

### Distribution

| Destination | How | Who |
|---|---|---|
| Render env vars (prod) | Render dashboard → Service → Environment → Add Env Var | Cesar, after reading `NEW_KEYS_TEMP.md` |
| Local `.env` (dev) | `echo "ADMIN_KEY_SUPER=..." >> .env` (the file is gitignored) | Cesar on his workstation |
| `.env.example` | Add placeholder lines (`ADMIN_KEY_SUPER=changeme`) | This fix |
| Password manager backup | 1Password / Bitwarden item titled "Nadakki admin keys (rotated 2026-05-10)" | Cesar |
| Slack / email | **NEVER** — these channels are not secure enough |

### Deprecation of old keys

The moment the code loads keys from env vars instead of the `ADMIN_KEYS` dict, the old hardcoded strings stop authorizing requests **on the running instance** — they are simply not in the loaded set. No explicit "revocation" step is needed at the app layer.

However:
- Git history retains the old strings. They will not work against the running app, but anyone who saved them can still try them (they'll get 403). Optional cleanup: BFG rewrite (see 2.3).
- `docs/api/AUTH.md` retains the old strings. FASE 3 will overwrite that file with sanitized examples.

### Communicating to stakeholders

| Stakeholder | Action |
|---|---|
| Cesar | Owns the fix, copies new keys to Render, deletes `NEW_KEYS_TEMP.md` |
| Cowork team | If they have a script/curl that uses the old key for tenant ops, they will get 403 after Render restart. Communicate the new key via 1Password share or in-person, NOT in chat history. |
| Manus team | Same as Cowork — if they have keys saved, notify and re-share through a secure channel. |
| Operators / on-call | Update their runbook with the new env var names (not values). |

For everyone else (frontend devs, designers, QA): no action needed — they don't touch admin endpoints.

---

## 2.3 Git history cleanup

Three approaches, ordered from most pragmatic to most thorough:

### Approach 1 — Do nothing (most pragmatic) **— recommended**

**Rationale:**
- The old keys, once removed from the running app, are useless. The app rejects them with 403.
- Rewriting history on a public 20-branch repo is operationally expensive: every collaborator and CI must re-clone or reset; open PRs from branched commits may break.
- The keys' real-world risk after rotation is zero (assuming they aren't reused as actual current secrets elsewhere — confirmed by audit; they aren't).
- GitHub's secret scanning will keep flagging them, but that's noise, not harm.

**Action:** rotate keys + sanitize docs + leave history alone.

### Approach 2 — BFG Repo Cleaner (if forensic cleanliness is required)

```bash
# 1. Mirror clone
git clone --mirror https://github.com/csorianoai/nadakki-ai-suite.git
cd nadakki-ai-suite.git

# 2. BFG replace
echo 'nadakki_admin_2025_master==>REDACTED' >  replacements.txt
echo 'nadakki_admin_credicefi_2025==>REDACTED' >> replacements.txt
java -jar bfg.jar --replace-text replacements.txt

# 3. Cleanup + force push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**Costs:**
- 20+ open branches need force-push coordination.
- Every collaborator does `git fetch && git reset --hard origin/<branch>` or re-clone.
- Any open PR referencing a rewritten commit becomes orphaned.
- Time: ~1-2 hours including coordination.

**Recommended only if:** Cesar has confirmed/suspects active abuse, or compliance (SOC2 / regulator) requires the strings out of history.

### Approach 3 — `git filter-branch` (legacy, discouraged)

Same outcome as BFG, slower, more error-prone. Skip.

### Decision

**Approach 1** for this fix. Document Approach 2 as the contingency in the FASE 5 instructions for Cesar.

---

## 2.4 Hardening (beyond minimum fix)

Items the fix in FASE 3 SHOULD include (small additions that prevent recurrence):

1. **Hard-fail on missing env vars in production**: if `ENVIRONMENT == "production"` (read from existing `ENVIRONMENT` env var in `.env.example`), startup must raise `RuntimeError` if any admin key var is unset. Prevents accidental "no admin keys configured" deploys.
2. **No fallback to hardcoded defaults** under any circumstance. In dev, missing vars mean admin endpoints return 503 (`"Admin auth not configured"`), not "use these dev defaults."
3. **Hash-then-compare** instead of plaintext membership check. Store SHA-256 hashes of the keys in env vars and compare hashes at request time. *(Stretch — adds ~10 lines; do it now if time permits.)*
4. **Length check on incoming `X-Admin-Key`** to short-circuit obvious brute force.
5. **Sanitize `docs/api/AUTH.md`** — replace literal keys with `<your-admin-key>` placeholders. Add a banner: "Never commit real values."

Items 1, 2, 5 are mandatory for FASE 3. Items 3 and 4 are stretch goals if the 60-min budget allows.

---

## 2.5 What FASE 3 will actually change

| Path | Change |
|---|---|
| `admin_auth.py` | Replace static `ADMIN_KEYS` dict with env-driven loader. Hard-fail if `ENVIRONMENT=production` and any key unset. |
| `.env.example` | Add `ADMIN_KEY_SUPER`, `ADMIN_KEY_CREDICEFI`, `ADMIN_KEY_BACKUP` lines with `changeme` placeholders. |
| `docs/api/AUTH.md` | Replace literal key values with `<your-admin-key>` placeholders. Add a "Never commit real values" warning. |
| `.gitignore` | **No change** — already covers `.env` and `.env.*`. |
| `tests/` | **No change** — no existing tests. Smoke test runs manually in FASE 4. |
| `_design_p11_audit/security/NEW_KEYS_TEMP.md` | **NEW**, in the DASHBOARD repo, NOT the backend. Contains the 3 fresh keys for Cesar to copy into Render. Cesar deletes after copy. |

No other files are touched. No code path other than `admin_auth.py`'s loader changes — endpoints, dependencies, and behavior are byte-identical from the outside.

---

## 2.6 Pre-flight checklist for FASE 3

- [ ] On `main`, working tree clean for `admin_auth.py`
- [ ] `.env.example` exists (yes — `8.example` reviewed; just needs additive lines)
- [ ] `.env` is gitignored (yes — `.gitignore` lines 9-11)
- [ ] No tests reference `admin_auth.py` (confirmed)
- [ ] `git status` clean enough that the fix commit only contains the intended files
- [ ] Branch name reserved: `fix/p11-sec-01-rotate-admin-keys`

All preconditions hold. Proceeding to FASE 3.

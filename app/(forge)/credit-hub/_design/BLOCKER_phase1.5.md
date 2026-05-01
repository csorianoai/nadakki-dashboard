# Phase 1.5 Blocker — `DEFAULT_CREDIT_TENANT_ID` resolution

## Status

**Awaiting Cesar decision** — investigation complete; **no code change** applied to `creditCore.ts` in this task.

---

## Investigation summary

| Area | Result |
|------|--------|
| **Frontend** (`nadakki-dashboard`) — `0a91ee98` | **11** path hits (constant, `.env.example`, tests, docs, design docs, PowerShell tools). |
| **Frontend** — `366b3c6c-a899-4320-805e-5c1d7c896f74` | **0** (Cesar memory UUID for “Credicefi” does **not** appear in this repo). |
| **Frontend** — `550e8400-e29b-41d4-a716-446655440099` (Banco Piloto pilot) | **0** |
| **Frontend** — `550e8400-e29b-41d4-a716-446655440000` (RFC nil example) | **0** |
| **Backend** (`nadakki-ai-suite`, read-only) — `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` | **4** hits: `tools/credit-hub/validate-bank-portal.ps1`, `validate-credit-analysis-engine.ps1`, `credit_core_ui_audit.md` (mirror of frontend), plus **`validation_output.txt`** showing **default tenant** from API. |
| **Backend** — Banco Piloto UUID | **Canonical pilot id:** `550e8400-e29b-41d4-a716-446655440099` in `docs/credit/SECOND_TENANT_PILOT.md`, `config/credit/tenants/550e8400-e29b-41d4-a716-446655440099.json`, `tools/credit/validate_credit_multitenant.ps1`. |
| **Backend** — `366b3c6c-a899-4320-805e-5c1d7c896f74` | Present as **`sf-rentals-nadaki-excursions`** in `release_verification_report.json` and `services/tenant_marketing_key.py`; **not** as Credicefi slug in those artifacts. |
| **`.env.example` (dashboard)** | `NEXT_PUBLIC_DEFAULT_TENANT_ID=0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` |
| **`.env.local` (dashboard)** | Not present in workspace (expected gitignored or absent). |
| **Seeds / SQL** | No `migrations/` hit for these UUIDs in the grep pass; Credit pilot is **config-file** driven per `SECOND_TENANT_PILOT.md`. |

Raw path listing: `_design/_inventory/blocker_grep_results.txt`

---

## Evidence (high-signal excerpts)

### 1) Control plane / API: Credicefi UUID = `0a91ee98…`

From `nadakki-ai-suite/validation_output.txt` (truncated JSON body):

```text
"default_tenant":{"id":"0a91ee98-2dbe-46d0-a43c-3fc2dbd42242","name":"CrediCefi","slug":"credicefi","plan":"pro"}
```

This ties **`0a91ee98-2dbe-46d0-a43c-3fc2dbd42242`** to **name CrediCefi** and **slug credicefi** — i.e. it is **not** an orphan string: it matches the product’s primary pilot tenant in a real API response capture.

### 2) Backend: Banco Piloto RD UUID = `550e8400…0099` (not `…0000`)

`nadakki-ai-suite/docs/credit/SECOND_TENANT_PILOT.md`:

- **Tenant ID (header):** `550e8400-e29b-41d4-a716-446655440099`
- **Display name:** Banco Piloto RD  
- Config: `config/credit/tenants/550e8400-e29b-41d4-a716-446655440099.json` (read: `display_name: Banco Piloto RD`).

The UUID ending in **`440099`** is the repo’s **versioned** second-tenant pilot. The RFC nil UUID ends in **`440000`** — that value appears **nowhere** as Banco Piloto in either repo; rejecting it was correct.

### 3) Documentation inconsistency (366b… labeled “Credicefi”)

`nadakki-ai-suite/docs/legal_phase2_completion_report.md` line 5:

```text
**Tenant piloto:** Credicefi (UUID 366b3c6c-a899-4320-805e-5c1d7c896f74)
```

But `nadakki-ai-suite/release_verification_report.json` associates the same UUID with:

```text
"tenant_slug":"sf-rentals-nadaki-excursions"
```

and `services/tenant_marketing_key.py` maps `366b3c6c-a899-4320-805e-5c1d7c896f74` → `sf-rentals-nadaki-excursions`.

**Conclusion:** **Do not** use `366b3c6c-a899-4320-805e-5c1d7c896f74` as the Credit Hub `DEFAULT_CREDIT_TENANT_ID` without reconciling these documents — for **Credit / Forge**, **`0a91ee98…`** is the consistent Credicefi tenant id.

### 4) Frontend constant (unchanged)

`lib/credit-hub/types/creditCore.ts` (unchanged in this investigation):

```ts
export const DEFAULT_CREDIT_TENANT_ID = "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242";
```

(still carries `@deprecated` from Phase 1 — see **Proposal** below.)

---

## Pattern classification

**Pattern D — Something else** (with concrete substructure):

1. **`0a91ee98-2dbe-46d0-a43c-3fc2dbd42242`** is the **canonical Credicefi** tenant UUID for **Credit / default API** usage (frontend + backend tools + control-plane snapshot). It is **not** “Banco Piloto” and **not** an orphan invented only in the dashboard.

2. **Banco Piloto RD** is **versioned in the backend** as **`550e8400-e29b-41d4-a716-446655440099`** (config + pilot doc + multitenant script), **not** the RFC `…440000` value from the Phase 1.5 prompt.

3. **Cesar’s memory** (“Credicefi = 366b…”) **does not match** the Credit default tenant id in `validation_output.txt` and **conflicts** with marketing/control-plane mapping of `366b…` to **sf-rentals-nadaki-excursions** in `release_verification_report.json` / `tenant_marketing_key.py`. Treat **366b…** as **untrusted for Credit defaults** until Legal doc vs marketing data is reconciled **outside** this blocker.

---

## Proposed resolution (for Cesar to accept or reject)

| Option | Action | When to choose |
|--------|--------|----------------|
| **A — Keep primary pilot default (recommended baseline)** | Leave `DEFAULT_CREDIT_TENANT_ID` = **`0a91ee98-2dbe-46d0-a43c-3fc2dbd42242`**. Remove or narrow **`@deprecated`** JSDoc: this value is **canonical Credicefi**, not a throwaway; Phase 8 can still replace the *mechanism* (env-only, no constant) without implying the UUID was wrong. | Default dev/staging should behave as **Credicefi** when no tenant is selected. |
| **B — Default to Banco Piloto for Credit Hub only** | After explicit approval, set constant (and `.env.example` / tests / scripts) to **`550e8400-e29b-41d4-a716-446655440099`** — the **only** repo-backed Banco Piloto Credit id found. **Never** use `…440000`. | Product wants Forge/Credit local dev to hit **Piloto** first. |
| **C — No constant in Phase 8** | Defer; Phase 8 `ForgeBrandingProvider` + env mandate **no** hardcoded fallback; remove constant when all paths use auth/env. | Aligns with long-term multi-tenant purity. |

**Not recommended:** Swapping to **`366b3c6c-a899-4320-805e-5c1d7c896f74`** for Credit without a cross-team doc fix — evidence ties it to **sf-rentals-nadaki-excursions** in repo JSON, not Credicefi.

---

## Files that would be touched if Cesar approves an option

*(Line numbers approximate; verify in editor before edit.)*

| Option | Files |
|--------|--------|
| **A** | `lib/credit-hub/types/creditCore.ts` (JSDoc only), optionally `TOKEN_MIGRATION_MAP.md` / `TENANT_CONTEXT_EXTENSION.md` wording. |
| **B** | `lib/credit-hub/types/creditCore.ts`, `.env.example`, `tests/credit-hub/api/creditCoreClient.test.ts`, `docs/credit-hub/SESSION_4_REAL_DATA_REPORT.md`, `tools/credit-hub/*.ps1`, any copy that says “final fallback” for the old UUID. |
| **C** | Phase 8 scope: `useTenant.ts`, `creditCore.ts` removal, docs — per `TENANT_CONTEXT_EXTENSION.md`. |

**Backend follow-up (separate PR):** Correct `docs/legal_phase2_completion_report.md` if Credicefi UUID line is wrong vs `validation_output.txt` / marketing mappings.

---

## Risk if proposal is wrong

| Mistake | Risk |
|---------|------|
| Set default to **wrong UUID** | Credit API calls hit wrong `X-Tenant-ID` → empty queues, 403s, or cross-tenant data if checks fail open. |
| Use **RFC nil `…440000`** | No repo support; meaningless tenant; debugging noise. |
| Rely on **366b…** as Credicefi for Credit | May bind to **sf-rentals** marketing tenant per JSON — Legal/product mismatch. |

---

## Unblocked when

Cesar picks **A**, **B**, or **C** (or a variant, e.g. “B for local only via `.env.local`, never commit”). Implementer applies the chosen option in a **separate** commit after greenlight.

# BLOCKER — Phase 1.5 — Banco Piloto RD `tenant_id`

**Date:** 2026-05-01  
**Raised by:** Phase 1.5 execution (token migration map)

## Request

Replace `DEFAULT_CREDIT_TENANT_ID` in `lib/credit-hub/types/creditCore.ts` with the **Banco Piloto RD** tenant UUID `550e8400-e29b-41d4-a716-446655440000`.

## What was verified

- Repo-wide search (`app/`, `components/`, `lib/`, `hooks/`, `docs/`, `*.ts`, `*.tsx`, `*.md`, `*.json`) for `550e8400` returned **no** canonical tenant record tying that UUID to Banco Piloto RD.
- That UUID is the widely published **RFC / example “nil” UUID**, not evidence of a production tenant row.
- The repository’s **documented** Credit Hub / pilot default remains `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` (see `.env.example`, `tests/credit-hub/api/creditCoreClient.test.ts`, `docs/credit-hub/SESSION_4_REAL_DATA_REPORT.md`).

## Decision

**Do not** change `DEFAULT_CREDIT_TENANT_ID` until Cesar supplies the **canonical** Banco Piloto RD `tenant_id` from the database or internal tenant registry (and it is committed or documented in-repo).

## Unblocked when

- A verified UUID (or removal of the fallback in Phase 8 per `TENANT_CONTEXT_EXTENSION.md`) is confirmed.

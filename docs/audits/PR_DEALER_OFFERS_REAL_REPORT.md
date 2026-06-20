# PR — Dealer Offers: real multi-lender list, compare & select

**Branch:** `feat/dealer-offers-real`
**Base:** `origin/main` @ `5d6cbaf`
**Scope:** 100% frontend (`nadakki-dashboard`). Backend (`nadakki-ai-suite`) NOT touched.

---

## STATUS: DONE · RISK: MEDIUM · RECOMMENDATION: APPROVE

Closes the frontend gap where the dealer saw **one** offer embedded in the dossier
(`application_payload.bank_decision.terms`) and the "Aceptar oferta" button called the
**bank-namespace** legacy endpoint `accept-decision`. The dealer now lists, compares and
selects among the **real competing offers** from the multi-lender backend that already
exists and is E2E-proven (4 banks responding, 4 offers persisted, selection →
`OFFER_SELECTED`).

---

## Previous state (the bug)
- `DealerApplicationDetailView.tsx` derived a single offer via `extractPayload()` reading
  `data.raw.application_payload.bank_decision.terms` → one "Oferta aprobada" card only.
- `handleAcceptOffer()` did a manual `fetch` to
  `POST /api/v2/credit/applications/{id}/accept-decision` — an endpoint in the **bank**
  namespace (`routers/bank/applications_detail_router.py`), with no `offer_id` (it cannot
  know there are multiple competing offers).
- Net effect: the dealer could not compare lenders nor choose which bank to accept,
  breaking the core broker/multi-bank business model.

## Backend used (existing, NOT created/modified)
| Endpoint | Base path | Notes |
|---|---|---|
| `GET /credit/applications/{id}/offers` (`offers_router.py`) | **`/credit`** (NO `/api/v2`) | Lists offers. Query `limit`/`offset`. Returns `{ application_id, tenant_id, offers[], pagination }`. |
| `POST /api/v2/credit/applications/{id}/offers/{offer_id}/accept` (`offer_acceptance_router.py`) | **`/api/v2/credit`** | Accept a specific offer. Idempotent. Returns `application_state`, `previous_application_state`, `siblings_not_selected`, typed errors. |

Offer shape is the canonical **TP-005** ("Tier 1 approved 2026-05-15",
`services/credit/canonical_offer.py`). `nadakki-ai-suite` was not modified.

## Decisions (hypotheses)
- **H1 → new file `lib/credit-hub/api/offersClient.ts`.** The list endpoint's base path
  (`/credit`) does NOT match `CREDIT_CORE_BASE` (`/api/v2/credit`). Rather than
  parameterizing the existing `creditCoreFetch` (more invasive, risks the other 6 callers),
  a dedicated client replicates the same fetch/timeout/error shape with `OFFERS_BASE = "/credit"`
  and **reuses the shared `CreditCoreApiError`** so callers handle errors uniformly. **TRUE.**
- **H2 → `acceptOffer` lives in `creditCoreClient.ts`** via the existing `creditCoreFetch`
  (base path matches `/api/v2/credit`). **TRUE.**
- **H3 → list of all offers.** Component now fetches `listOffers()` and renders every offer
  with comparable fields (lender, amount, APR, term, monthly payment). **TRUE.**
- **H4 → per-offer selection.** Each selectable offer has its own "Seleccionar esta oferta"
  button calling `acceptOffer({ tenantId, applicationId, offerId })`. **TRUE.**
- **H5 → reflect `not_selected` via refetch.** On success we refetch the offers list
  (small, ≤4 rows) **and** the dossier. Refetch was chosen over optimistic mutation because
  it guarantees canonical `accepted`/`not_selected` statuses from the backend with minimal
  code; `siblings_not_selected` is surfaced in the success message ("Otras N ofertas quedaron
  descartadas"). **TRUE.**
- **H6 → `accept-decision` no longer called from this component** (grep confirms zero
  references); the backend file is untouched (and out of this repo). **TRUE.**
- **H7 → accepted state.** If any offer has `status === "accepted"`, it is highlighted as
  "Elegida", the rest shown as "No seleccionada", and no action buttons render (no
  re-accepting). **TRUE.**
- **H8 → independent loading/error/empty.** `useApplicationOffers` is a separate `useQuery`
  with its own `loading`/`error` states; empty list renders no offers section (early-stage
  apps keep the existing "Estado de tu solicitud" card). **TRUE.**
- **H9 → pagination params pass-through.** `listOffers` only sends `limit`/`offset` when
  explicitly provided, so backend defaults (20/0) are respected. No paginated UI yet. **TRUE.**

Lender display: no authoritative `lender_code → bank name` dictionary exists in the codebase
(only a title-case prettifier in legacy `components/credit/OfferComparisonCards.tsx`), so the
same lightweight prettifier is replicated rather than inventing bank names.

Types live in a new `lib/credit-hub/types/offers.ts` (creditCore.ts already carries the
application/event/stats shapes).

## Files changed
| File | Change |
|---|---|
| `lib/credit-hub/types/offers.ts` (new) | `CreditOffer`, `CreditOfferStatus`, `OffersListResponse`, `OfferAcceptResult`, `AcceptedOfferDetail` |
| `lib/credit-hub/api/offersClient.ts` (new) | `listOffers()` against `/credit` base path |
| `lib/credit-hub/api/creditCoreClient.ts` | `acceptOffer()` via existing `creditCoreFetch` |
| `lib/credit-hub/api/normalizers.ts` | `normalizeOffer`, `normalizeOffers`, `normalizeOfferAcceptResult` (defensive) |
| `lib/credit-hub/hooks/useApplicationOffers.ts` (new) | offers list hook (separate query state) |
| `lib/credit-hub/hooks/queryKeys.ts` | `creditCoreOffers` key |
| `components/credit-hub/dealer/DealerApplicationDetailView.tsx` | replace single-offer card + `accept-decision` fetch with offers list + per-offer accept |
| `tests/credit-hub/api/offersClient.test.ts` (new) | listOffers: success, params, empty, defensive null, error |
| `tests/credit-hub/api/creditCoreClient.test.ts` | acceptOffer: success, idempotent, typed error |
| `tests/credit-hub/dealer/DealerApplicationDetailView.test.tsx` | multi-offer render, empty, loading, error, accept success+refetch, accept error, accepted/not_selected |
| `docs/audits/PR_DEALER_OFFERS_REAL_REPORT.md` (new) | this report |

## Tests
- `npm run typecheck` → **PASS** (exit 0; `_handoff/` excluded via PR-INFRA-1, no workaround).
- `npm run lint` → **PASS** (exit 0).
- `npm run build` → **PASS** (exit 0).
- Targeted: **27/27 pass** across `offersClient.test.ts`, `creditCoreClient.test.ts`,
  `DealerApplicationDetailView.test.tsx`, `normalizers.test.ts`.

## Risk
- **Business — before:** dealer could not compare or choose between competing banks →
  broke the core multi-lender broker model and used a bank-side endpoint incorrectly.
- **Business — after:** dealer sees all competing offers, compares them, and accepts a
  specific one via the correct dealer endpoint with explicit `offer_id`; siblings auto
  marked not_selected; accepted state is honest and non-reversible in UI.
- **Technical — MEDIUM:** new client + hook + UI wiring touching the dealer detail view.
  Mitigated by: backend already E2E-proven and unchanged; defensive normalizers (no invented
  fields/zeros); explicit loading/error/empty/accepted states; reuse of shared error type;
  27 targeted tests; typecheck/lint/build green. The empty/early-stage path is preserved
  (no offers section when the list is empty).

## Recommendation — APPROVE
Frontend-only change that connects to existing, proven backend and removes the incorrect
bank-namespace dependency from the dealer flow.

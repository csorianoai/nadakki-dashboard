# PR — Retire legacy dealer offers flow, consolidate into Credit Hub

**Branch:** `chore/retire-legacy-offers-flow`
**Base (documented):** stacked on **`origin/feat/dealer-offers-real` @ `5f10f096`** (PR #153),
because PR #153 was **NOT yet merged** when this ran (`gh pr view 153` → `state: OPEN`,
`mergedAt: null`). PR #153 introduces the `/credit-hub` offers files that the port steps target,
so branching from `main` would make the port impossible and leave `main` with no working
multi-offer UI. **All diffs in this report are measured against `origin/feat/dealer-offers-real`,
not `origin/main`.** This PR must merge **after** #153.

**Scope:** evaluation + consolidation. One source of truth for the dealer offers flow
(`/credit-hub`), legacy tree removed, high-value UX ported.

---

## STATUS: DONE · RISK: MEDIUM · RECOMMENDATION: APPROVE (merge after #153)

## PASO 5 — Decision table (written before touching code)
| Legacy piece | Decision | Justification |
|---|---|---|
| **Confirmation modal** (`SelectionConfirmModal`) | **PORT** | Accepting an offer is **irreversible** (siblings auto `not_selected`, app → `OFFER_SELECTED`). PR #153 fires `acceptOffer()` directly on button click with no confirmation. An explicit confirm step is real safety UX. Ported as a new `components/credit-hub/dealer/OfferConfirmModal.tsx` using `CreditOffer` (PR #153 type) + the repo's `ui/dialog` primitive — NOT the legacy file/type. |
| **Post-accept validation** (`application_id`/`tenant_id` match) | **PORT** | Real defense against a crossed/corrupted response being treated as success. Ported into `acceptOffer()` in `creditCoreClient.ts`: after normalizing, if the echoed `offer.application_id`/`offer.tenant_id` are present and don't match the request, throw `CreditCoreApiError`. |
| **Polling 5s** (`useOffers` `refetchInterval`) | **PORT (adapted, conditional)** | Live competing offers/counteroffers can arrive while the dealer watches. Legacy polled unconditionally forever; ported into `useApplicationOffers` as a **conditional** `refetchInterval` (5s) that **stops once an offer is `accepted`** (nothing more to poll after `OFFER_SELECTED`). Safer than the legacy. |
| **Toasts with retry** (`sonner`, via legacy page) | **DISCARD** | PR #153's detail view already shows **inline** success + inline error with the real backend `detail`, and the select button re-enables on error (retry by clicking again). Adding `sonner` toasts would diverge from the inline-state pattern used across the credit-hub dealer view. |
| **`lenderLabel()` title-case** | **DISCARD (already present)** | PR #153 already replicated this prettifier in `DealerApplicationDetailView.tsx`. Re-porting would duplicate. |
| **Legacy types** (`types/credit-offers.ts`, incl. `Dispatch*`) | **DISCARD** | `Offer`/`OffersResponse` are superseded by `lib/credit-hub/types/offers.ts` (PR #153). The `Dispatch*`/`LenderCode` types have **zero consumers** anywhere in the repo outside the legacy tree (grep evidence below). |

## H1 — CORS bug in `useOffers.ts`: CONFIRMED (real, not false positive)
- `hooks/useOffers.ts` L28-30: `BACKEND_URL = process.env.NEXT_PUBLIC_NADAKKI_API_URL ?? "https://nadakki-ai-suite.onrender.com"`, and L55-64 builds `new URL(path, BACKEND_URL)` → an **absolute cross-origin** URL from the browser.
- `.env.example` L24 sets `NEXT_PUBLIC_NADAKKI_API_URL=https://nadakki-ai-suite.onrender.com` — so even when the env var **is** set, the URL is still the absolute Render host. Either way (set or fallback) the browser request is cross-origin and bypasses the Next.js BFF same-origin proxy (`app/api/v2/[[...path]]/route.ts`).
- The sibling `hooks/useSelectOffer.ts` L23-27 documents the exact fix (Audit #4.1 / PR #109): "Always use relative URLs in the browser so requests route through the Next.js BFF same-origin proxy instead of hitting the Render backend directly (which rejects the OPTIONS preflight)." `useOffers.ts` **never received this fix**. It also sends only `X-Tenant-ID`, **no Bearer token**.
- Conclusion: the legacy read path was duplicated **and broken** in production for any direct navigation. PR #153's `offersClient.ts` uses a correct same-origin relative path.

## H5/H6 — Orphan confirmation (evidence)
Exhaustive consumer grep for `useOffers | useSelectOffer | OfferComparisonCards | SelectionConfirmModal | credit-offers | OffersResponse | DispatchMulti | DispatchResult | LenderCode | MOCK_OFFERS_2_LENDERS` returned **only** files inside the legacy tree:
- `hooks/useOffers.ts`, `hooks/useSelectOffer.ts`, `components/credit/OfferComparisonCards.tsx`,
  `components/credit/SelectionConfirmModal.tsx`, `app/credit/[id]/offers/page.tsx`,
  `app/credit/[id]/confirmation/page.tsx`, `types/credit-offers.ts`, `docs/frontend/mock-data.ts`,
  and two tests (`__tests__/app/credit/[id]/offers/page.test.tsx`, and one describe block in
  `tests/api/cors-decision-routing.test.ts`).
- **Zero** references from `app/(forge)/credit-hub/**`, nav, or any production code outside the tree.
- `lib/credit-api.ts` only **mentions** `useOffers` in a comment (L550) and uses the env var for its own base URL — it does **not** import the legacy hooks/types. Not a real consumer.
- `next.config.js`: **no** redirect to `/credit/[id]/offers` or `/credit/[id]/confirmation`.
- Nuance vs the "no tests" assumption: there **is** a dedicated legacy page test (deleted with the page) and one shared CORS-guard describe block referencing `useSelectOffer` (surgically removed). So H5 "zero consumers" holds for production; tests are handled.

**Why NO redirect is needed here (unlike PRs #147-149):** those legacy routes (`/credit/dealer/:id`,
`/credit/bank`, etc.) had **1:1 standalone modern URLs** to redirect to. The offers list in
`/credit-hub` is **not a standalone route** — it's an inline section inside the dealer application
detail view (`/credit-hub/dealer/applications/[id]`). There is no `/credit-hub/.../offers` URL to
redirect to, the legacy routes were never in any nav, and they're broken (H1). A redirect would
point nowhere meaningful, so direct deletion is correct and safe here.

## Files removed (9)
- `app/credit/[id]/offers/page.tsx`
- `app/credit/[id]/confirmation/page.tsx`
- `components/credit/OfferComparisonCards.tsx`
- `components/credit/SelectionConfirmModal.tsx`
- `hooks/useOffers.ts`  ← the CORS-broken read hook (H1)
- `hooks/useSelectOffer.ts`
- `types/credit-offers.ts`  ← incl. unused `Dispatch*`/`LenderCode` types
- `docs/frontend/mock-data.ts`  ← legacy test fixture, only consumed by the deleted test
- `__tests__/app/credit/[id]/offers/page.test.tsx`  ← legacy page test

`app/credit/[id]/page.tsx` (the bare overview, **not** part of the offers flow) is intentionally
kept. The `app/credit/[id]/` directory therefore is **not** empty after removal — no dir cleanup.

## Files modified / created to port value
- **CREATED** `components/credit-hub/dealer/OfferConfirmModal.tsx` — explicit confirmation modal,
  rewritten with `CreditOffer` + `ui/dialog` + ch-btn styling (port of legacy SelectionConfirmModal).
- **MODIFIED** `components/credit-hub/dealer/DealerApplicationDetailView.tsx` — the select button now
  opens the confirm modal; `acceptOffer()` is called only on confirm. Removed stale comment ref to
  the deleted `OfferComparisonCards.tsx`.
- **MODIFIED** `lib/credit-hub/api/creditCoreClient.ts` — `acceptOffer()` now rejects a crossed
  response whose echoed `application_id`/`tenant_id` don't match the request (port of legacy
  post-accept validation), only when those fields are present.
- **MODIFIED** `lib/credit-hub/hooks/useApplicationOffers.ts` — conditional 5s `refetchInterval`
  (stops once an offer is `accepted`); polling decision extracted as the testable pure helper
  `offersRefetchInterval`.
- **MODIFIED** `tests/api/cors-decision-routing.test.ts` — removed the `useSelectOffer` describe
  block (its target file is gone); left a note pointing to the new acceptance path.
- **CREATED/MODIFIED tests** — `tests/credit-hub/hooks/useApplicationOffers.test.ts` (polling
  helper), `creditCoreClient.test.ts` (+2 validation cases), `DealerApplicationDetailView.test.tsx`
  (modal-before-accept, cancel-no-accept, confirm-accepts).

## Tests
- **typecheck:** PASS (`tsc --noEmit`, after clearing stale `.next/types` from deleted routes).
- **lint:** PASS (repo `npm run lint` + explicit `eslint` on all changed files, `--max-warnings 0`).
- **build:** PASS (`next build --webpack`; deleted routes gone, `/credit/[id]` retained).
- **targeted jest:** PASS — 5 suites / 37 tests:
  `DealerApplicationDetailView.test.tsx`, `creditCoreClient.test.ts`, `useApplicationOffers.test.ts`,
  `offersClient.test.ts`, `cors-decision-routing.test.ts`.

## Hypotheses
- **H1** (CORS bug in `useOffers.ts`): **TRUE** — absolute cross-origin URL, confirmed.
- **H2** (#153 covers all but the confirmation modal): **TRUE** (modal was the main gap; polling +
  post-accept validation were secondary gaps, now also ported).
- **H3** (5s polling is valuable): **TRUE, ported with improvement** (now conditional/stops when settled).
- **H4** (post-accept id/tenant validation worth porting): **TRUE** — ported into `acceptOffer()`.
- **H5** (nothing outside the legacy tree depends on it): **TRUE for production**; two test files
  touched the tree and were handled (one deleted, one surgically trimmed).
- **H6** (safe to retire whole tree, no redirect needed): **TRUE** — no nav/redirect references; no
  standalone modern URL to redirect to (offers are inline in `/credit-hub` detail view).

## Before / After
- **Before:** TWO implementations of multi-lender offers — the live `/credit-hub` inline section
  (PR #153, correct same-origin) and an orphaned, CORS-broken `/credit/[id]/offers` page tree.
- **After:** ONE source of truth in `/credit-hub`, now including the legacy's high-value UX
  (explicit confirmation modal, post-accept id/tenant validation, conditional live polling); the
  legacy tree is fully removed.

## Risk
**MEDIUM** — touches the (still-unmerged) PR #153 dealer view to add a confirm modal + polling, and
removes 9 legacy files. Mitigated by: exhaustive orphan grep, no production consumers outside the
tree, no redirect needed (documented), ported pieces rewritten against PR #153 types/clients (not
copied), and full test coverage. Stacked-PR dependency on #153 is the main process risk.

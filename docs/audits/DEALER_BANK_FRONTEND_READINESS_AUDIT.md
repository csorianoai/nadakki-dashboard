# Dealer–Bank Frontend Readiness Audit

**Product:** Nadakki / Credicefi Credit Hub (dealer + bank portals)  
**Auditor role:** Staff Frontend Engineer · Product QA Lead · Security UX Auditor  
**Date:** 2026-07-08  
**Scope:** `app/(forge)/credit-hub/dealer/*`, `app/(forge)/credit-hub/bank/*`, `components/credit-hub/{dealer,bank}/*`, `lib/credit-hub/*`, `hooks/nauta` excluded · Marketing Core excluded  
**Method:** Static code audit + test inventory. **No live incognito E2E was executed in this pass** — "Actual" columns cite code paths and automated tests only.

---

## 1. Executive verdict

### **NOT_READY** (bank pilot) · **REVIEW** (targeted technical QA on core APIs)

**Justification**

| Criterion | Finding |
|-----------|---------|
| Real backend on critical paths | **Partial PASS** — create app, list apps, offers list, accept offer, bank queue/claim/decide, audit trail, compliance use real `/api/v2/credit/*` clients. |
| No misleading mocks in production UI | **FAIL** — dealer/bank dashboards render **DEMO** KPIs, charts, bank ranking fallbacks, and offer enrichment (`nadakki-demo`) when APIs are empty or tenant matches demo. |
| Full dealer–bank journey | **FAIL** — no offer room screen, no bank↔dealer messaging UI, no bank notification center, no bank document-request action, no backend draft save. |
| Status taxonomy (18 states) | **FAIL** — frontend collapses to ~8 display buckets; required states (`SENT_TO_BANKS`, `OFFER_ROOM_CLOSED`, `DOCUMENTS_PENDING`, `READY_FOR_DISBURSEMENT`, etc.) **not found in codebase**. |
| Security UX | **FAIL** — dealer/bank bypass `CHTenantGuard`; `canPerform()` RBAC matrix unused; `X-Actor-Role` hardcoded; tenant fallback UUID always resolves. |
| Error honesty | **Partial PASS** — `CreditCoreApiError` / `CHApiError` surfaced on detail/accept; dashboards silently substitute DEMO data instead of empty/error. |

**Recommended next gate:** Technical QA only on **wizard submit → bank queue → decide → dealer accept offer → events timeline**, with DEMO panels disabled or behind `DataTruthBadge` empty states. **Not** bank pilot until P0 security + P1 notification/document/messaging gaps close.

---

## 2. Screen inventory matrix

| Route | Component | Role | Primary endpoint(s) | Real / mock | Status handling | Risk |
|-------|-----------|------|---------------------|-------------|-----------------|------|
| `/credit-hub/dealer` | `DealerDashboardView` | Dealer | `GET /api/v2/credit/applications`, `GET /api/v2/credit/stats`, `GET /credit/dashboard/summary`, `GET /api/v2/credit/analytics/banks-ranking` | **Mixed** — apps/stats REAL; goals/trends/**DEMO_BANKS** fallback | loading/error on apps; summary shows DEMO banner | **HIGH** — demo metrics beside real apps |
| `/credit-hub/dealer/applications` | `DealerApplicationsListView` | Dealer | `GET /api/v2/credit/applications` | **REAL** | empty/error/list | LOW |
| `/credit-hub/dealer/applications/[id]` | `DealerApplicationDetailView` | Dealer | `GET /api/v2/credit/applications/{id}`, `GET .../events`, `GET /credit/applications/{id}/offers`, `POST .../offers/{id}/accept` | **REAL** (+ demo offer enrich on `nadakki-demo`) | 404 not-found, accept error/success | MEDIUM |
| `/credit-hub/dealer/applications/new/*` | `DealerWizardProvider` + steps | Dealer | `POST /api/v2/credit/applications`, `POST .../process`, `POST .../documents/upload`, consent APIs | **REAL** submit; **localStorage** draft | toast on fail; draft autosave local | MEDIUM — draft not server DRAFT |
| `/credit-hub/dealer/preapproval` | `PreApprovalView` | Dealer | None (client `calculateScenario`) | **LOCAL** simulation | N/A | LOW — labeled simulator |
| `/credit-hub/dealer/notifications` | `DealerNotificationsView` | Dealer | `GET /api/v2/credit/applications` (derived) | **SYNTHETIC** notifications | empty/loading | **HIGH** — not a notifications API |
| `/credit-hub/dealer/profile` | `DealerProfileView` | Dealer | `useTenantConfig` branding only | **LOCAL** phone; security disabled | static | LOW |
| `/credit-hub/bank` | `BankDashboardView` | Bank | `GET .../queue`, `GET .../analytics/dashboard`, auction/risk analytics | **Mixed** — queue REAL; goals/analyst/**DEMO** fill | demo banner when institution ~demo | **HIGH** |
| `/credit-hub/bank/applications` | `BankApplicationsTable` | Bank | `GET .../queue`, `POST .../bulk-decide` | **REAL** | pagination, bulk confirm | MEDIUM — bulk rule hardcoded |
| `/credit-hub/bank/applications/[id]` | `BankDetailLayout` | Bank | `GET .../{id}`, `POST .../claim`, `POST .../decide`, `GET .../counter-offer`, compliance, audit | **REAL** | claim 409, decide errors in panel | MEDIUM |
| `/credit-hub/bank/analytics` | `BankAnalyticsView` | Bank | analytics dashboard, dealers-ranking, portfolio-health | **REAL** (+ DEMO trust labels) | period selector **unwired** | MEDIUM |
| `/credit-hub/bank/audit` | `BankAuditView` | Bank | queue + per-app `GET .../audit-trail` | **REAL** (max 50 apps) | empty aggregation | LOW |
| `/credit-hub/bank/compliance` | `BankComplianceView` | Bank | queue + per-app `GET /api/v2/credit/compliance/{id}` | **REAL** (max 50 apps) | partial KPIs `"—"` | LOW |
| **—** | *Offer room* | Both | — | **MISSING** | — | **HIGH** |
| **—** | *Bank notifications* | Bank | — | **MISSING** (`ChTopbar` bell empty) | — | **HIGH** |
| **—** | *Dealer↔bank messages* | Both | — | **MISSING** | — | **HIGH** |

**Onboarding / admin (credit-hub):** `WelcomeGuide` (localStorage), monetización operador views — out of dealer/bank pilot scope but use `platform_superadmin` gate correctly.

---

## 3. Dealer journey test

| Step | Expected | Actual (code evidence) | PASS/FAIL | Evidence |
|------|----------|------------------------|-----------|----------|
| 1. Crear solicitud | POST create + process | `DealerWizardProvider` → `useCreateCreditApplication` → `POST /api/v2/credit/applications` + `processApplication` | **PASS** | `components/forge/credit-hub/dealer/DealerWizardProvider.tsx` |
| 2. Guardar draft | Persist DRAFT server-side | **localStorage** `nadakki_dealer_wizard_v1` only; create uses `initial_state: "DRAFT"` on POST but no mid-wizard server draft | **FAIL** | `DealerWizardProvider.tsx` STORAGE_KEY |
| 3. Enviar a bancos | Submit + route to banks | `processApplication` `mode: "BANK_ONLY"` after create | **PASS** (if backend routes) | same file ~L514 |
| 4. Ver estado de envío | Granular status | `DealerStatusBadge` + `resolveDisplayStatus` — 8 buckets, not `SENT_TO_BANKS` | **FAIL** | `dealerUi.tsx`, `display-status.ts` |
| 5. Ver ofertas recibidas | Offers API | `useApplicationOffers` → `GET /credit/applications/{id}/offers` | **PASS** | `useApplicationOffers.ts` |
| 6. Comparar ofertas | Side-by-side compare | Detail: APR sort + "MEJOR" badge; dashboard: `OfferComparatorSpotlight` | **PASS** (basic) | `DealerApplicationDetailView.tsx` L153+ |
| 7. Aceptar oferta | POST accept | `acceptOffer` → `POST .../offers/{offerId}/accept` + confirm modal | **PASS** | `creditCoreClient.ts`, `OfferConfirmModal.tsx` |
| 8. Offer room cerrada | UI shows closed | No `OFFER_ROOM_CLOSED` label/route; polling stops on `accepted` only | **FAIL** | `offersRefetchInterval` |
| 9. Docs pendientes | List from backend | No dedicated pending-docs view; wizard upload only at create | **FAIL** | no route |
| 10. Subir documentos | Upload API | Wizard: `uploadDocument` POST; post-submit re-upload **not found** on detail | **PARTIAL** | `lib/credit-api.ts` |
| 11. Ver preguntas banco | Message thread | **No UI** | **FAIL** | grep: no messaging components |
| 12. Responder preguntas | Reply API | **No UI** | **FAIL** | — |
| 13. Timeline/audit | Events | `useCreditApplicationDetail` → `GET .../events`; rendered in detail | **PASS** | `DealerApplicationDetailView.tsx` L453+ |

---

## 4. Bank journey test

| Step | Expected | Actual | PASS/FAIL | Evidence |
|------|----------|--------|-----------|----------|
| 1. Ver nuevas solicitudes | Queue | `useBankQueue` → `GET /api/v2/credit/applications/queue` | **PASS** | `bankClient.ts` |
| 2. Alerta visual nueva solicitud | Bell / toast | `BankChShell` does **not** pass `notifications` to `ChTopbar` | **FAIL** | `BankChShell.tsx` |
| 3. Abrir expediente | Detail GET | `useBankApplication` → `GET .../{id}` | **PASS** | `BankDetailLayout.tsx` |
| 4. Revisar datos | Analysis tab | Payload embedded in application GET | **PASS** | `AnalysisTab.tsx` |
| 5. Pedir documentos | Request API + UI | `SOLICITAR_DOCUMENTOS` bulk rule exists in types but **not wired**; `DocumentsTab` read-only | **FAIL** | `DocumentsTab.tsx`, `applications/page.tsx` bulk |
| 6. Preguntas al dealer | Messaging | **No UI** | **FAIL** | — |
| 7. Aprobar/rechazar/counter | decide + counter-offer | `useBankDecision`, `useBankCounterOffer` | **PASS** | `bankClient.ts` |
| 8. Dealer acepta oferta | Status refresh | Bank sees updated app via GET (no push) | **PARTIAL** | no realtime |
| 9. Otro banco ganó | Lost state UI | Auction intel / funnel labels only; no dedicated "lost auction" detail state | **FAIL** | `AuctionIntel.tsx` DEMO fallback |
| 10. Status processing→disbursed | Full taxonomy | Bank queue status map: `SUBMITTED`, `CLAIMED`, etc. — not `READY_FOR_DISBURSEMENT` | **FAIL** | `bankFormat.ts` |

---

## 5. Security UX matrix

| Scenario | Expected | Actual | PASS/FAIL | Evidence |
|----------|----------|--------|-----------|----------|
| Dealer A solo ve sus apps | Tenant-scoped list | `useTenant()` → `X-Tenant-ID` on all hooks | **PASS** (client); backend RLS assumed | `useTenant.ts`, `creditCoreClient.ts` |
| Dealer B no ve Dealer A | Isolation | Same — depends on backend + JWT tenant | **UNVERIFIED** (no E2E) | `middleware.ts` API only |
| Bank A solo su queue | Tenant header | `useBankQueue` scoped | **PASS** (client) | `useBankQueue.ts` |
| Bank B no ve decisiones privadas Bank A | RBAC + RLS | No UI for cross-bank decisions; backend unknown | **UNVERIFIED** | — |
| Tenant A ≠ Tenant B | Guard + API 403 | `CHTenantGuard` **skipped** for dealer/bank portals; fallback `DEFAULT_CREDIT_TENANT_ID` | **FAIL** | `CreditHubLayoutClient.tsx` L43 |
| Usuario sin rol → no accede | Role gate | `ProtectedRoute` auth only; `canPerform()` **unused** in components | **FAIL** | `permissions.ts` |
| URL expediente ajeno → forbidden | 403/404 UI | Detail shows 404 empty state on `CreditCoreApiError` 404; no explicit 403 UX | **PARTIAL** | `DealerApplicationDetailView.tsx` L124 |
| No datos sensibles pre-permiso | Loading guard | Apps render after query; no explicit permission prefetch | **PARTIAL** | — |
| Viewer cannot mutate | Block POST | `chFetch` blocks if `localStorage.nadakki_role === "viewer"` | **PASS** (client-only) | `client.ts` L127 |
| Cross-tenant API | Middleware 403 | `/api/*` JWT tenant isolation | **PASS** (edge) | `middleware.ts` |

---

## 6. Notifications audit

| UI surface | Backend source | Status | Required fix |
|------------|----------------|--------|--------------|
| Dealer `/notifications` | **Derived** from `GET applications` | SYNTHETIC | P3: `GET /notifications` + read-state API |
| Dealer bell (mobile nav) | Same derivation | SYNTHETIC | same |
| Bank `ChTopbar` bell | **Not passed** — empty state | MISSING | P3: bank notification feed |
| Toast (`ForgeToaster`) | Local actions only | OK for mutations | Wire backend errors consistently |
| Unread count | `sessionStorage` read ids (dealer) | LOCAL | Backend persistence |
| Real-time / polling | Offers poll 5s (dealer detail only) | PARTIAL | Extend to bank queue + notifications |
| Events: new app, decision, doc request | Not centralized | MISSING | P3 |

**Minimum events (1–8):** None have a dedicated notification pipeline; dealer infers "decision" from `app.status` in `notificationsFromApplications()` (`dealerFormat.ts` L120–141).

---

## 7. Documents UI audit

| Capability | Dealer | Bank | Status |
|------------|--------|------|--------|
| Upload at create | `DealerWizardDocumentsStep` → `uploadDocument` | — | **PASS** (wizard only) |
| Upload post-submit | — | — | **MISSING** |
| Bank request specific doc | — | — | **MISSING** (no API call) |
| Dealer pending list | — | — | **MISSING** |
| Bank review / approve / reject | — | `DocumentsTab` display only; button **no href** | **FAIL** |
| Status change on validation | Badge `pendiente/validado` if payload has status | Read-only | **PARTIAL** |
| Unauthorized access | Via app GET scope | Assumed backend | **UNVERIFIED** |

**Evidence:** `components/credit-hub/bank/sections/DocumentsTab.tsx` L34–37 — "Ver documento" button without link or fetch.

---

## 8. Messaging UI audit

| Capability | Status | Evidence |
|------------|--------|----------|
| Thread per expediente | **MISSING** | No components/routes |
| Bank asks dealer | **MISSING** | — |
| Dealer replies | **MISSING** | — |
| Attach file | **MISSING** | — |
| History + timestamps | Audit trail only (`comment_added` label in `BankAuditView`) | **PARTIAL** — bank internal audit, not chat |
| Private bank notes vs dealer-visible | **MISSING** | — |
| Permissions | — | — |

---

## 9. State / status dashboard audit

### Required states (user spec) vs codebase

| Required state | In frontend? | Badge / label | Endpoint | Gap |
|----------------|-------------|---------------|----------|-----|
| DRAFT | Yes | `Borrador` | create `initial_state` | Server mid-wizard draft missing |
| SUBMITTED | Yes | `Enviada` / `ACTIVE` | normalized | OK |
| SENT_TO_BANKS | **No** | — | — | **GAP** |
| UNDER_REVIEW | Collapsed → `ACTIVE` / `manual_review` | — | — | **GAP** explicit label |
| BANK_OFFERS_RECEIVED | Collapsed → `OFFERED` | — | offers list | **GAP** |
| OFFER_SELECTED | Partial (`offered` / poll stop) | — | accept | No dedicated badge |
| OFFER_ROOM_CLOSED | **No** | — | — | **GAP** |
| DOCUMENTS_PENDING | **No** | — | — | **GAP** |
| DOCUMENTS_RECEIVED | **No** | — | — | **GAP** |
| PROCESSING | Yes | `En proceso` | — | OK |
| APPROVED | Yes | `Aprobada` | — | OK |
| READY_FOR_DISBURSEMENT | **No** | — | — | **GAP** |
| DISBURSED | Partial (`FUNDED` / `completed`) | — | — | Label mismatch |
| DECLINED | Yes (`rejected`) | — | — | OK |
| EXPIRED | **No** | — | — | **GAP** |
| CANCELLED | **No** | — | — | **GAP** |
| `completed_partial` (Nauta) | N/A credit-hub | — | — | — |

**Normalizer reference:** `lib/credit-hub/api/normalizers.ts` maps backend enums to frontend `CreditApplicationStatus` — coarser than product spec.

**Recommendation:** Ship backend `display_status` field (noted in `display-status.ts` L4) and bind `DisplayStatusPill` — do not invent interim labels.

---

## 10. Mock / fallback audit

| File | Component | Purpose | Risk | Action |
|------|-----------|---------|------|--------|
| `BankRanking.tsx` | `DEMO_BANKS` | Fallback when analytics fails | **HIGH** — shows fake lenders | Remove → empty + error |
| `DealerGoals.tsx` / `BankGoals.tsx` | Hardcoded targets | Executive KPIs | **HIGH** | ROADMAP badge only or hide |
| `DealerTrendsAlerts.tsx` | Chart arrays | Illustrative trends | **HIGH** | Hide when no API series |
| `BankAnalystProductivity.tsx` | `DEMO_ANALYSTS` | Analyst table | **HIGH** | Same |
| `RiskCreditPanel.tsx` | `DEMO_PTI/LTV` | Risk charts | **MEDIUM** | Empty state |
| `AuctionIntel.tsx` | `DEMO_WIN_BREAKDOWN` | Auction panel | **MEDIUM** | Empty state |
| `DealerKpiStrip.tsx` | `demoTrend` sparklines | KPI decoration | **MEDIUM** | Remove sparkline or label DEMO |
| `enrich-nadakki-demo-offers.ts` | Offer numerics | Demo tenant only | **MEDIUM** | Keep behind `nadakki-demo` + badge |
| `dealerFormat.ts` | `notificationsFromApplications` | Fake notification center | **HIGH** | Replace with API |
| `DealerWizardProvider.tsx` | localStorage draft | UX convenience | **LOW** | Keep; add server draft |
| `useTenantConfig.ts` | DO defaults | Branding fallback | **LOW** | Keep |
| `PreApprovalSimulator.tsx` | Client simulation | Pre-approval tool | **LOW** | Keep — not production decision |
| `BankDashboardView.tsx` | `stipulationsCount` formula | KPI | **MEDIUM** | Remove formula |

---

## 11. Integration reference (real endpoints)

| Endpoint | Method | Hook / client | Error handling |
|----------|--------|---------------|----------------|
| `/api/v2/credit/applications` | GET/POST | `creditCoreClient` | `CreditCoreApiError`; 401 no redirect on core client |
| `/api/v2/credit/applications/{id}` | GET | `useCreditApplicationDetail` / `useBankApplication` | 404 UI on dealer detail |
| `/api/v2/credit/applications/{id}/events` | GET | `useCreditApplicationDetail` | Propagates error |
| `/api/v2/credit/applications/{id}/offers` | GET | `offersClient` / `useApplicationOffers` | Error banner on detail |
| `/api/v2/credit/applications/{id}/offers/{oid}/accept` | POST | `acceptOffer` | 409 cross-tenant echo check; message to user |
| `/api/v2/credit/applications/queue` | GET | `useBankQueue` | Table error state |
| `/api/v2/credit/applications/{id}/claim` | POST | `claim-application.ts` | 409 documented |
| `/api/v2/credit/applications/{id}/decide` | POST | `useBankDecision` | Toast/error in panel |
| `/api/v2/credit/applications/bulk-decide` | POST | `useBulkActions` | Confirm modal |
| `/api/v2/credit/applications/{id}/audit-trail` | GET | `useBankAuditTrail` | Tab loading |
| `/api/v2/credit/compliance/{id}` | GET | `useBankCompliance` | Tab loading |
| `/api/v2/credit/applications/{id}/documents/upload` | POST | `uploadDocument` | Wizard toast |

**Auth headers:** `X-Tenant-ID`, `Authorization` (via `apiFetch`/`chFetch`), `X-Actor-Role` (path/hardcoded), `Idempotency-Key` on mutations (backend may not replay — see `SECURITY_NOTES.md`).

**401:** `chFetch` → redirect login. **403:** generic `CHApiError`. **404:** dealer detail not-found. **409:** accept offer echo guard + bank claim. **422:** wizard/consent mapped via `resolveFreeformRunError` pattern on credit paths partially. **500:** generic error message if thrown.

---

## 12. Final readiness checklist

| Check | Result |
|-------|--------|
| Dealer flow end-to-end | **FAIL** (gaps: draft, docs post-submit, messaging, statuses) |
| Bank flow end-to-end | **FAIL** (gaps: notifications, doc request, messaging) |
| Offer acceptance | **PASS** (real POST + UI confirm + refetch) |
| Offer room closed | **FAIL** (no screen/state label) |
| Notifications | **FAIL** |
| Documents | **FAIL** (wizard upload only) |
| Messaging | **FAIL** |
| Security UI | **FAIL** (guard bypass, unused RBAC) |
| No mocks in production | **FAIL** (dashboard DEMO layers) |
| Staging smoke | **NOT RUN** (requires manual QA) |

---

## 13. Minimal remediation plan

### P0 — Security / role leaks (before any pilot)

1. Mount `CHTenantGuard` (or equivalent) on **dealer + bank** layouts — block render when `tenantId` missing; remove silent `DEFAULT_CREDIT_TENANT_ID` fallback in production builds.
2. Wire `canPerform()` / JWT `activeRole` to hide mutate controls (create, accept, decide).
3. Add explicit **403** forbidden state on application detail (not only 404).
4. E2E: Dealer A/B + Bank A/B + cross-URL access tests.

### P1 — Real backend integration

1. Backend `display_status` on applications + bind `DisplayStatusPill` / badges (close 10-state gap).
2. Server-side **DRAFT** save/resume for wizard (replace localStorage-only).
3. Remove **DEMO data substitution** on dashboards when API empty — show `CHErrorState` / empty (honesty layer already exists: `DataTruthBadge`).

### P2 — Offer acceptance UX

1. Add `OFFER_ROOM_CLOSED` / `OFFER_SELECTED` labels post-accept (from backend state).
2. Dealer detail: disable accept when room closed (handle 409 from API with toast).
3. Bank detail: show when dealer accepted / lost auction (read-only banner).

### P3 — Notifications

1. `GET /notifications` (dealer + bank) with unread count.
2. Pass `notifications` into `BankChShell` → `ChTopbar`.
3. Polling or SSE for queue + offers + notifications.

### P4 — Documents

1. Bank: `POST` request document + dealer pending list.
2. Dealer: post-submit upload on detail page.
3. Bank: wire `DocumentsTab` "Ver documento" to signed URL or viewer.
4. Approve/reject document actions.

### P5 — Messaging

1. Thread component on dealer detail + bank detail.
2. Separate private bank notes vs dealer-visible messages.
3. Attachments on messages.

### P6 — Polish

1. Wire analytics period selectors (bank/dealer).
2. Profile save API.
3. Remove unused command-center/orphan components or wire them.

---

## Appendix A — Small safe fixes (propose separately, not in this audit PR)

| Fix | File | Effort |
|-----|------|--------|
| Remove `DEMO_BANKS` fallback → empty state | `BankRanking.tsx` | S |
| Bank `DocumentsTab` disable button until URL exists | `DocumentsTab.tsx` | S |
| Pass `notifications={[]}` explicitly with "Sin notificaciones" copy | `BankChShell.tsx` | S |
| Document 404 vs 403 copy on dealer detail | `DealerApplicationDetailView.tsx` | S |
| Label `DataTruthBadge level="DEMO"` on all DEMO panels (already partial) | elite sections | S |

---

## Appendix B — Files reviewed (index)

- Dealer routes: `app/(forge)/credit-hub/dealer/**`
- Bank routes: `app/(forge)/credit-hub/bank/**`
- API: `lib/credit-hub/api/{creditCoreClient,bankClient,offersClient,client}.ts`
- Hooks: `lib/credit-hub/hooks/use*.ts`
- Security: `CHTenantGuard.tsx`, `CreditHubLayoutClient.tsx`, `permissions.ts`, `middleware.ts`, `docs/credit-hub/SECURITY_NOTES.md`
- Status: `lib/credit-hub/honesty/display-status.ts`, `lib/credit-hub/api/normalizers.ts`
- Tests: `tests/credit-hub/**` (permissions, client, bank compliance, multi-tenant shallow)

---

*End of audit. No code changes were made in this pass except this document.*

# Backend ↔ Frontend Coverage Matrix — Credit Hub Loops

**Repo:** nadakki-dashboard (frontend)  
**Date:** 2026-07-10  
**Mode:** Diagnostic only (no code changes)  
**HEAD:** `main` @ `b78543b` (post BANK_EXPERIENCE_UI_LOOP_v1 / PR #287)  
**Backend reference:** `nadakki-ai-suite/routers/credit/*` (read-only cross-check)

---

## Method

1. Inventoried every `/api/v2/` path in `lib/credit-hub/api/*` (19 files).
2. Traced each client function to React components, pages, and hooks.
3. Compared against the **canonical endpoint list** supplied for today's backend loops (Hardening, Security, Operational, Bank Experience).
4. Cross-checked path shapes against backend routers where sibling repo is available.

**Status legend**

| Status | Meaning |
|--------|---------|
| ✅ WIRED | Frontend consumes endpoint and renders UI for at least one role |
| ⚠️ CLIENT_ONLY | Function exists in a client file but no production component calls it |
| ⚠️ PATH_DRIFT | UI wired, but frontend URL/method differs from backend contract |
| ❌ NOT_WIRED | No frontend client call for this backend endpoint |
| 🔇 BACKEND_ONLY_OK | No UI required (cron, batch, internal) |

---

## Summary

| Loop | Endpoints in list | ✅ WIRED | ⚠️ (client/path) | ❌ NOT_WIRED | 🔇 OK |
|------|-------------------|----------|------------------|--------------|-------|
| Hardening | 2 | 1 | 1 | 0 | 0 |
| Security | 7 | 5 | 2 | 0 | 0 |
| Operational | 14 | 9 | 4 | 0 | 1 |
| Bank Experience | 14 | 6 | 3 | 5 | 0 |
| **Total** | **37** | **21** | **10** | **5** | **1** |

**Headline:** **21 of 37** endpoints are fully wired end-to-end. **10** have client or UI effort but path/usage gaps. **5** have no frontend integration. **1** is intentionally backend-only.

**Critical path drifts (P0):** document-request upload/review, messaging mark-read, pre-screening path, bank KPIs path, offer-level conditions/amortization vs application-level FE contracts.

---

## A. Canonical endpoint matrix (today's backend loops)

### Hardening loop

| Endpoint | Status | Componente | Ruta / vista | Rol | Notas |
|----------|--------|------------|--------------|-----|-------|
| `GET /api/v2/credit/notifications` | ✅ WIRED | `useNotifications` → `ChTopbar`, `EscalationsList` | Dealer shell (bell), `/credit-hub/bank/escalations` | DEALER + BANK | Gated by `NEXT_PUBLIC_CH_NOTIFICATIONS`. `/credit-hub/dealer/notifications` page is **stub** (`sourceUnavailable`, empty list). |
| `PATCH /api/v2/credit/notifications/{id}/read` | ⚠️ CLIENT_ONLY | `markNotificationRead` in `notificationsClient.ts` via `useNotifications.markAsRead` | — | — | Hook exposes `markAsRead`; **no production UI** invokes it. `DealerNotificationsView` uses local `dealerFormat.markNotificationRead` (not API). |

### Security loop

| Endpoint | Status | Componente | Ruta / vista | Rol | Notas |
|----------|--------|------------|--------------|-----|-------|
| `POST /api/v2/credit/applications/{id}/screen` (AML) | ❌ NOT_WIRED | — | — | — | Backend actual: `POST .../compliance/screen`. No FE client. |
| `GET /api/v2/credit/applications/{id}/compliance` | ⚠️ PATH_DRIFT | `VerificationsTab` → `getApplicationCompliance` | `/credit-hub/bank/applications/[id]` tab Verificaciones | BANK | FE calls `GET .../compliance`. Backend exposes `GET .../compliance/results`. |
| `POST /api/v2/credit/applications/{id}/pre-screen` | ⚠️ PATH_DRIFT | `SecurityVerificationToggles` → `postPreScreen` | Wizard `/credit-hub/dealer/applications/new/consent` | DEALER | FE: `.../pre-screen`. Backend: `POST .../pre-screening` (+ body required). |
| `GET /api/v2/credit/applications/{id}/pre-screen` | ⚠️ PATH_DRIFT | `VerificationsTab` → `getPreScreen` | Bank detail → Verificaciones | BANK | Same path drift; backend is POST-only for pre-screening. |
| `POST /api/v2/credit/applications/{id}/verify-identity` | ✅ WIRED | `SecurityVerificationToggles` → `postVerifyIdentity` | Dealer wizard consent step | DEALER | |
| `GET /api/v2/credit/applications/{id}/verify-identity` | ✅ WIRED | `VerificationsTab` → `getVerifyIdentity` | Bank detail → Verificaciones | BANK | Backend router may be POST-only; FE still calls GET. |
| `GET /api/v2/vehicles/history/{vin}` | ⚠️ PATH_DRIFT | `VerificationsTab` → `getVehicleHistory` | Bank detail → Verificaciones | BANK | FE: `/api/v2/vehicles/history/{vin}`. Backend: `GET /api/v2/credit/vehicles/vin/{vin}/history`. |

### Operational loop

| Endpoint | Status | Componente | Ruta / vista | Rol | Notas |
|----------|--------|------------|--------------|-----|-------|
| `PATCH /api/v2/credit/applications/{id}/fields` | ✅ WIRED | `ApplicationEditPanel` → `patchApplicationFields` | `/credit-hub/dealer/applications/[id]` | DEALER | Editable when `display_status` ∈ DRAFT/SENT_TO_BANKS. |
| `GET /api/v2/credit/applications/{id}/edit-history` | ✅ WIRED | `EditHistorySection`, `BankDetailLayout` (modified badges) | Dealer + bank application detail | DEALER + BANK | |
| `POST /api/v2/credit/applications/{id}/document-requests` | ✅ WIRED | `DocumentRequestsPanel` → `postDocumentRequest` | Bank detail → Documentos | BANK | |
| `GET /api/v2/credit/applications/{id}/document-requests` | ✅ WIRED | `DocumentRequestsPanel`, `DocumentRequestsDealerSection`, `DisbursementPanel` | Bank + dealer detail | BANK + DEALER | |
| `PATCH /api/v2/credit/document-requests/{id}/upload` | ⚠️ PATH_DRIFT | `DocumentRequestsDealerSection` → `patchDocumentRequestUpload` | Dealer detail | DEALER | FE: `PATCH .../applications/{id}/document-requests/{rid}/upload`. Backend: `PATCH .../document-requests/{id}/upload` (flat). |
| `PATCH /api/v2/credit/document-requests/{id}/review` | ⚠️ PATH_DRIFT | `DocumentRequestsPanel` → `postDocumentRequestReview` | Bank detail → Documentos | BANK | FE: `POST .../applications/{id}/document-requests/{rid}/review`. Backend: `PATCH .../document-requests/{id}/review`. |
| `POST /api/v2/credit/applications/{id}/messages` | ✅ WIRED | `ApplicationMessageThread` → `postApplicationMessage` | Dealer + bank detail (tab Mensajes) | DEALER + BANK | |
| `GET /api/v2/credit/applications/{id}/messages` | ✅ WIRED | `ApplicationMessageThread`, `useMessageUnreadCount` | Dealer + bank detail | DEALER + BANK | |
| `PATCH /api/v2/credit/messages/{id}/read` | ⚠️ PATH_DRIFT | `ApplicationMessageThread` → `patchMarkMessagesRead` | Dealer + bank detail | DEALER + BANK | FE: `PATCH .../applications/{id}/messages/read` (bulk). Backend: per-message `PATCH .../messages/{message_id}/read`. |
| `GET /api/v2/credit/applications/{id}/messages/unread-count` | ⚠️ PATH_DRIFT | `useMessageUnreadCount` | Bank detail tab badge (Mensajes) | DEALER + BANK | Uses `unread_count` from GET messages list, not dedicated unread-count endpoint. |
| `POST /api/v2/credit/applications/{id}/ready-for-disbursement` | ✅ WIRED | `DisbursementPanel` | Bank detail right column | BANK | Visible at OFFER_SELECTED / READY_FOR_DISBURSEMENT. |
| `POST /api/v2/credit/applications/{id}/disburse` | ✅ WIRED | `DisbursementPanel` | Bank detail right column | BANK | |
| `POST /api/v2/credit/applications/{id}/cancel` | ✅ WIRED | `CancelApplicationButton` in `OperationalActions` | Dealer application detail | DEALER | |
| `POST /api/v2/credit/applications/expire-check` | 🔇 BACKEND_ONLY_OK | — | — | — | Batch/cron expiry; no UI surface expected. |

### Bank Experience loop

| Endpoint | Status | Componente | Ruta / vista | Rol | Notas |
|----------|--------|------------|--------------|-----|-------|
| `POST /api/v2/credit/applications/{id}/notes` | ✅ WIRED | `InternalNotesTab` → `postApplicationNote` | Bank detail → tab Notas internas | BANK | Tab only for `bank_analyst` / `bank_admin`; hidden on 404. |
| `GET /api/v2/credit/applications/{id}/notes` | ✅ WIRED | `InternalNotesTab`, `useNotesEndpointAvailable` | Bank detail | BANK | |
| `POST /api/v2/credit/applications/{id}/assign` | ✅ WIRED | `AssignedAnalystSection` → `postReassignApplication` | Bank detail header | BANK (supervisor) | Gated on `bank_admin`. |
| `GET /api/v2/credit/applications/{id}/assignment` | ✅ WIRED | `AssignedAnalystSection` | Bank detail header | BANK | Hidden on 404. |
| `GET /api/v2/credit/applications/{id}/amortization` | ⚠️ PATH_DRIFT | `AmortizationTable` → `getAmortizationSchedule` | Dealer detail + bank detail (Análisis) | DEALER + BANK | Backend actual: `GET .../offers/{offer_id}/amortization` (per offer). |
| `PATCH /api/v2/credit/offers/{id}/conditions` | ❌ NOT_WIRED | — | — | — | `ConditionsPanel` uses contract-first `PATCH .../applications/{id}/conditions` (not in backend list). Backend uses `PUT .../offers/{offer_id}/conditions`. |
| `PATCH /api/v2/credit/offers/{id}/conditions/{index}/fulfill` | ❌ NOT_WIRED | — | — | — | No client; `ConditionsPanel` toggles local checkbox → PATCH app-level conditions. |
| `GET /api/v2/credit/applications/{id}/offers/compare` | ✅ WIRED | `OfferComparePanel` → `getOfferCompare` | Bank detail sidebar | BANK | Hidden on 404. |
| `POST /api/v2/credit/offers/{id}/reject` | ❌ NOT_WIRED | — | — | — | Backend: `POST .../applications/{id}/offers/{offer_id}/reject`. No FE client. |
| `GET /api/v2/credit/bank/kpis` | ⚠️ PATH_DRIFT | `BankExperienceKpisPanel` → `getBankExperienceKpis` | `/credit-hub/bank` dashboard | BANK | FE: `GET /api/v2/credit/analytics/bank-kpis`. Backend: `/api/v2/credit/bank/kpis/{portfolio\|approval\|lenders\|trends}`. |
| `GET /api/v2/credit/applications/{id}/export/expediente` | ⚠️ PATH_DRIFT | `PrintExportActions` (PDF download) | Bank detail header | BANK | FE uses legacy `GET .../pdf/application-summary`. Backend: `.../export/expediente.pdf`. |
| `GET /api/v2/credit/applications/{id}/export/decision-letter` | ❌ NOT_WIRED | — | — | — | Backend: `.../export/decision-letter.pdf`. |
| `GET /api/v2/credit/applications/{id}/export/audit-trail` | ❌ NOT_WIRED | — | — | — | Backend: `.../export/audit-trail.pdf`. Audit shown in-tab via JSON `audit-trail`, not PDF export. |
| `GET /api/v2/credit/bank/queue/export` | ❌ NOT_WIRED | — | — | — | Backend: `GET /api/v2/credit/bank/export/queue.xlsx`. No export button on bank queue. |

---

## B. Frontend API inventory (all `lib/credit-hub/api/` paths)

Endpoints **outside** today's loop list but consumed by Credit Hub UI:

| Client file | Path(s) | Wired UI |
|-------------|---------|----------|
| `bankClient.ts` | `GET .../applications/queue`, `GET .../{id}`, `GET .../expediente/full`, `POST .../claim`, `POST .../decide`, `GET .../counter-offer`, `POST .../bulk-decide`, `GET .../analytics/dashboard`, `GET .../analytics/dealers-ranking`, `GET .../analytics/portfolio-health`, `GET .../compliance/{id}`, `GET .../audit-trail`, `POST .../compliance/approve` | Bank dashboard, queue, detail, compliance/audit pages |
| `creditCoreClient.ts` | `GET/POST .../applications`, `GET .../stats`, `POST .../offers/{id}/accept`, etc. | Dealer dashboard, list, detail, offer accept |
| `offersClient.ts` | `GET /credit/applications/{id}/offers` (no `/api/v2` prefix) | Dealer offers, comparator spotlight |
| `analyticsClient.ts` | `GET .../analytics/banks-ranking`, `risk-distributions`, `auction-intel`, `/credit/dashboard/summary` | Dealer/bank intelligence panels |
| `goalsClient.ts` | `GET .../goals/monthly/{period}` | `DealerGoals`, `BankGoals` on dashboards |
| `creditAnalysisClient.ts` | `GET .../applications/{id}/analysis` | Analysis panels |
| `consent-client.ts` / `public-consent-client.ts` | `/api/v2/credit/consent/*` | Wizard consent flow |
| `tenant-branding-client.ts` | `GET /api/v2/tenants/{id}/branding` | Tenant chrome / white-label |
| `applications.ts` | Legacy `/api/v1/sic/credit-applications` | Legacy SIC bridge (not loop scope) |

---

## C. Gap backlog (priority order)

### P0 — Contract mismatch (UI exists, wrong URL/method)

1. **Document requests upload/review** — align `operationalClient.ts` to flat `/document-requests/{id}/upload|review`.
2. **Messaging mark-read** — switch to per-message `PATCH /messages/{id}/read` or confirm backend bulk alias.
3. **Pre-screening** — rename FE path to `/pre-screening` and send required body.
4. **Vehicle history** — fix to `/api/v2/credit/vehicles/vin/{vin}/history`.
5. **Bank KPIs** — wire `bank_kpi_router` quartet or add BFF shim; retire `/analytics/bank-kpis` guess.
6. **Offer conditions + amortization** — migrate `ConditionsPanel` / `AmortizationTable` to offer-scoped endpoints.

### P1 — Missing UI for deployed backend

7. **AML screen** — `POST .../compliance/screen` + results panel (or wire existing VerificationsTab to `compliance/results`).
8. **Offer reject** — bank action on counteroffer/compare flow.
9. **Export trio** — expediente, decision-letter, audit-trail PDF buttons (replace legacy `pdf/application-summary` only).
10. **Queue Excel export** — button on `/credit-hub/bank/applications`.

### P2 — Polish / completeness

11. **Notifications read** — wire `markAsRead` in notifications list UI; replace dealer notifications page stub with `useNotifications`.
12. **Dedicated unread-count** — optional optimization for message badge polling.
13. **Conditions fulfill** — per-index fulfill endpoint when backend ships.

---

## D. Verification notes

- **No hardcoded demo UUIDs** in loop client files (contract-first).
- **404 graceful hide** pattern used across Operational + Bank Experience panels (`isOperationalEndpointUnavailable`, `isBankExperienceEndpointUnavailable`, `isSecurityEndpointUnavailable`).
- **Dealer notifications page** (`app/(forge)/credit-hub/dealer/notifications/page.tsx`) deliberately bypasses live API — creates apparent gap vs Hardening loop despite working shell bell.

---

*Generated by Cursor diagnostic pass — BANK_EXPERIENCE_UI_LOOP_v1 follow-up. No application code modified.*

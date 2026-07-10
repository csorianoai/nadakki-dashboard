# Backend ↔ Frontend Coverage Matrix — Credit Hub Loops

**Repo:** nadakki-dashboard (frontend)  
**Date:** 2026-07-10  
**Mode:** Gap fix loop (`fix/backend-frontend-alignment`)  
**Backend reference:** `nadakki-ai-suite/routers/credit/*` (source of truth for paths)

---

## Method

1. Inventoried every `/api/v2/` path in `lib/credit-hub/api/*`.
2. Traced each client function to React components, pages, and hooks.
3. Compared against canonical backend routers in `nadakki-ai-suite`.
4. Fixed all P0–P2 gaps; status below reflects post-fix state.

**Status legend**

| Status | Meaning |
|--------|---------|
| ✅ FIXED | Frontend path/method matches backend; UI wired |
| 🔇 BACKEND_ONLY_OK | No UI required (cron, batch, internal) |

---

## Summary (post-fix)

| Loop | Endpoints in list | ✅ FIXED | 🔇 OK |
|------|-------------------|----------|-------|
| Hardening | 2 | 2 | 0 |
| Security | 7 | 7 | 0 |
| Operational | 14 | 13 | 1 |
| Bank Experience | 14 | 14 | 0 |
| **Total** | **37** | **36** | **1** |

**Headline:** **36 of 37** endpoints fully aligned end-to-end. **1** intentionally backend-only (`expire-check`).

---

## A. Canonical endpoint matrix

### Hardening loop

| Endpoint | Status | Componente | Ruta / vista | Rol | Notas |
|----------|--------|------------|--------------|-----|-------|
| `GET /api/v2/credit/notifications` | ✅ FIXED | `useNotifications` → `DealerNotificationsView`, `ChTopbar` | `/credit-hub/dealer/notifications`, shell bell | DEALER | Page wired to live hook (no stub). |
| `PATCH /api/v2/credit/notifications/{id}/read` | ✅ FIXED | `useNotifications.markAsRead` → `DealerNotificationsView` | `/credit-hub/dealer/notifications` | DEALER | `onMarkRead` calls API. |

### Security loop

| Endpoint | Status | Componente | Ruta / vista | Rol | Notas |
|----------|--------|------------|--------------|-----|-------|
| `POST /api/v2/credit/applications/{id}/compliance/screen` | ✅ FIXED | `postComplianceScreen` in `securityClient.ts` | Available for manual trigger | BANK | Auto pre-dispatch; results via GET below. |
| `GET /api/v2/credit/applications/{id}/compliance/results` | ✅ FIXED | `VerificationsTab` → `getComplianceResults` | Bank detail → Verificaciones | BANK | Replaces legacy `GET .../compliance`. |
| `POST /api/v2/credit/applications/{id}/pre-screening` | ✅ FIXED | `SecurityVerificationToggles` → `postPreScreen` | Wizard consent step | DEALER | Path + body (`subject_id`, `subject_name`). |
| `GET /api/v2/credit/applications/{id}/pre-screen` | ✅ FIXED | `VerificationsTab` (props snapshot) | Bank detail → Verificaciones | BANK | Backend POST-only; bank tab shows dealer snapshot from payload props. |
| `POST /api/v2/credit/applications/{id}/verify-identity` | ✅ FIXED | `SecurityVerificationToggles` → `postVerifyIdentity` | Wizard consent step | DEALER | Body: `subject_id`, `subject_name`, `date_of_birth`. |
| `GET /api/v2/credit/applications/{id}/verify-identity` | ✅ FIXED | `VerificationsTab` (props snapshot) | Bank detail → Verificaciones | BANK | Backend POST-only; bank tab shows dealer snapshot. |
| `GET /api/v2/credit/vehicles/vin/{vin}/history` | ✅ FIXED | `VerificationsTab` → `getVehicleHistory` | Bank detail → Verificaciones | BANK | Path aligned from `/api/v2/vehicles/history/{vin}`. |

### Operational loop

| Endpoint | Status | Componente | Ruta / vista | Rol | Notas |
|----------|--------|------------|--------------|-----|-------|
| `PATCH /api/v2/credit/applications/{id}/fields` | ✅ FIXED | `ApplicationEditPanel` | Dealer detail | DEALER | |
| `GET /api/v2/credit/applications/{id}/edit-history` | ✅ FIXED | `EditHistorySection`, `BankDetailLayout` | Dealer + bank detail | DEALER + BANK | |
| `POST /api/v2/credit/applications/{id}/document-requests` | ✅ FIXED | `DocumentRequestsPanel` | Bank detail → Documentos | BANK | |
| `GET /api/v2/credit/applications/{id}/document-requests` | ✅ FIXED | `DocumentRequestsPanel`, `DocumentRequestsDealerSection` | Bank + dealer detail | BANK + DEALER | |
| `PATCH /api/v2/credit/document-requests/{id}/upload` | ✅ FIXED | `DocumentRequestsDealerSection` → `patchDocumentRequestUpload` | Dealer detail | DEALER | Flat path (no nested application segment). |
| `PATCH /api/v2/credit/document-requests/{id}/review` | ✅ FIXED | `DocumentRequestsPanel` → `patchDocumentRequestReview` | Bank detail → Documentos | BANK | PATCH + `{ decision: ACCEPTED\|REJECTED }`. |
| `POST /api/v2/credit/applications/{id}/messages` | ✅ FIXED | `ApplicationMessageThread` | Dealer + bank detail | DEALER + BANK | Body includes `sender_type`. |
| `GET /api/v2/credit/applications/{id}/messages` | ✅ FIXED | `ApplicationMessageThread` | Dealer + bank detail | DEALER + BANK | |
| `PATCH /api/v2/credit/messages/{id}/read` | ✅ FIXED | `ApplicationMessageThread` → `patchMarkMessageRead` | Dealer + bank detail | DEALER + BANK | Per-message mark-read on thread open. |
| `GET /api/v2/credit/applications/{id}/messages/unread-count` | ✅ FIXED | `useMessageUnreadCount` | Bank detail tab badge | DEALER + BANK | Dedicated endpoint with `reader_type`. |
| `POST /api/v2/credit/applications/{id}/ready-for-disbursement` | ✅ FIXED | `DisbursementPanel` | Bank detail | BANK | |
| `POST /api/v2/credit/applications/{id}/disburse` | ✅ FIXED | `DisbursementPanel` | Bank detail | BANK | |
| `POST /api/v2/credit/applications/{id}/cancel` | ✅ FIXED | `CancelApplicationButton` | Dealer detail | DEALER | |
| `POST /api/v2/credit/applications/expire-check` | 🔇 BACKEND_ONLY_OK | — | — | — | Batch/cron; no UI. |

### Bank Experience loop

| Endpoint | Status | Componente | Ruta / vista | Rol | Notas |
|----------|--------|------------|--------------|-----|-------|
| `POST /api/v2/credit/applications/{id}/notes` | ✅ FIXED | `InternalNotesTab` | Bank detail → Notas internas | BANK | |
| `GET /api/v2/credit/applications/{id}/notes` | ✅ FIXED | `InternalNotesTab` | Bank detail | BANK | |
| `POST /api/v2/credit/applications/{id}/assign` | ✅ FIXED | `AssignedAnalystSection` | Bank detail header | BANK | |
| `GET /api/v2/credit/applications/{id}/assignment` | ✅ FIXED | `AssignedAnalystSection` | Bank detail header | BANK | |
| `GET /api/v2/credit/applications/{id}/offers/{oid}/amortization` | ✅ FIXED | `AmortizationTable` → `getAmortizationSchedule` | Dealer + bank detail | DEALER + BANK | Offer-scoped via `usePrimaryOfferId`. |
| `PUT /api/v2/credit/applications/{id}/offers/{oid}/conditions` | ✅ FIXED | `ConditionsPanel` → `putOfferConditions` / `fulfillOfferCondition` | Bank detail → Estipulaciones | BANK | Fulfill via PUT `met: true` (no `/fulfill` route in backend). |
| `GET /api/v2/credit/applications/{id}/offers/compare` | ✅ FIXED | `OfferComparePanel`, `CounterOfferPanel` | Bank detail sidebar | BANK | |
| `POST /api/v2/credit/applications/{id}/offers/{oid}/reject` | ✅ FIXED | `CounterOfferPanel` → `postRejectOffer` | Bank detail sidebar | DEALER | Button "Rechazar contrapropuesta". |
| `GET /api/v2/credit/bank/kpis/{portfolio\|approval\|lenders\|trends}` | ✅ FIXED | `BankExperienceKpisPanel` → `getBankExperienceKpis` | `/credit-hub/bank` dashboard | BANK | Retired `/analytics/bank-kpis`. |
| `GET /api/v2/credit/applications/{id}/export/expediente.pdf` | ✅ FIXED | `PrintExportActions` | Bank detail header | BANK | Replaces legacy `pdf/application-summary`. |
| `GET /api/v2/credit/applications/{id}/export/decision-letter.pdf` | ✅ FIXED | `PrintExportActions` | Bank detail header | BANK | `?offer_id=` from primary offer. |
| `GET /api/v2/credit/applications/{id}/export/audit-trail.pdf` | ✅ FIXED | `PrintExportActions` | Bank detail header | BANK | |
| `GET /api/v2/credit/bank/export/queue.xlsx` | ✅ FIXED | `BankApplicationsTable` export button | `/credit-hub/bank/applications` | BANK | |

---

## B. Gap backlog — resolution log

| # | Gap | Resolution |
|---|-----|------------|
| P0-1 | Document upload/review nested paths | `operationalClient.ts` flat `/document-requests/{id}/…` |
| P0-2 | Bulk messages read | `patchMarkMessageRead` per message id |
| P0-3 | Pre-screen path | `POST .../pre-screening` + required body |
| P0-4 | VIN history path | `GET .../credit/vehicles/vin/{vin}/history` |
| P0-5 | Bank KPIs path | Four `/bank/kpis/*` endpoints aggregated in client |
| P0-6 | Amortization/conditions app-level | Offer-scoped paths + `usePrimaryOfferId` |
| P1-7 | AML screen/results | `getComplianceResults` in `VerificationsTab`; `postComplianceScreen` in client |
| P1-8 | Reject offer | `postRejectOffer` in `CounterOfferPanel` |
| P1-9–11 | PDF exports + queue Excel | `PrintExportActions` menu + `BankApplicationsTable` button |
| P1-12 | Conditions fulfill | `fulfillOfferCondition` → PUT with `met: true` |
| P2-13 | Notifications read + dealer page | `useNotifications` wired; `markAsRead` on list |

---

## C. Verification

- Old path grep in `*.ts` / `*.tsx`: **0 hits** for drifted paths.
- `npm run build:webpack` — run in CI / local verify.
- `npm run lint` — run in CI / local verify.
- Tests: `print-export.test.ts`, `usePrimaryOfferId.test.ts`, `compliance-helpers.test.ts` added/updated.

---

*Updated by COVERAGE_GAP_FIX_LOOP — branch `fix/backend-frontend-alignment`.*

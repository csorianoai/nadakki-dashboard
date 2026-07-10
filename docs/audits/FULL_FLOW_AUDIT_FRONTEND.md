# Full Flow Audit — Credit Hub Frontend (UI Real)

**Repo:** nadakki-dashboard  
**Date:** 2026-07-10  
**Mode:** Diagnostic only (no code changes)  
**Method:** Route inventory from `app/(forge)/credit-hub/**` + component/API trace (read-only)  
**HEAD:** `main` (post PR #288 alignment branch; audit reflects production components on main)

---

## Status legend

| Symbol | Meaning |
|--------|---------|
| ✅ COMPLETE | UI exists, wired to backend client, renders real data when API available |
| ⚠️ PARTIAL | Component exists; missing wiring, degraded path, or feature-flag/role gate |
| ❌ MISSING | No UI surface for this step |
| 🎭 STUB | Placeholder, mock, or session-only; no persistence API |
| 🔇 NOT_NEEDED | Not applicable to this actor or flow |

---

## Guard & shell model

| Layer | Applies to | Behavior |
|-------|------------|----------|
| `CreditHubLayoutClient` | All `/credit-hub/*` | i18n bootstrap; demo banner on bank/dealer/monetización |
| `ForgeCreditHubAppShell` | Root, admin, preview, components | `CHTenantGuard` only |
| `DealerChShell` | `/credit-hub/dealer/*` (except wizard) | `CHTenantGuard` → `CHPortalAccessGuard portal="dealer"` |
| `BankChShell` | `/credit-hub/bank/*` | `CHTenantGuard` → `CHPortalAccessGuard portal="bank"` |
| Wizard bare shell | `/credit-hub/dealer/applications/new/*` | No tenant/portal guard; minimal chrome (`DealerChShell` bypass) |
| `MonetizacionShell` | `/credit-hub/monetizacion/*` | Feature flag `NEXT_PUBLIC_FF_FORGE_MONETIZACION`; no portal guard |

**Dealer portal roles:** `dealer`, `credit_admin`, `tenant_admin`, `platform_superadmin`, `admin`  
**Bank portal roles:** `bank_analyst`, `bank_admin`, `compliance_officer`, `credit_admin`, `tenant_admin`, `platform_superadmin`, `admin`  
**Admin route (`/credit-hub/admin`):** no `CHPortalAccessGuard` — URL reachable without role check.

---

## 1. Route inventory

### 1.1 Dealer (`/credit-hub/dealer/*`)

| Route | Page component | Primary view / component | API clients | Role guard | Estado |
|-------|----------------|--------------------------|-------------|------------|--------|
| `/credit-hub/dealer` | `dealer/page.tsx` | `WelcomeGuide` + `DealerDashboardView` | `creditCoreClient` (list, stats); `analyticsClient` (summary, banks ranking); `goalsClient` | Dealer shell | ✅ COMPLETE (mixed REAL/DEMO panels) |
| `/credit-hub/dealer/applications` | `applications/page.tsx` | `DealerApplicationsListView` | `creditCoreClient.listApplications` | Dealer shell | ✅ COMPLETE |
| `/credit-hub/dealer/applications/[applicationId]` | `applications/[applicationId]/page.tsx` | `DealerApplicationDetailView` | `creditCoreClient`, `offersClient`, `operationalClient`, `bankExperienceClient` | Dealer shell | ✅ COMPLETE |
| `/credit-hub/dealer/applications/new` | `applications/new/page.tsx` | Redirect → `applicant` | — | Wizard (no guard) | ✅ COMPLETE |
| `/credit-hub/dealer/applications/new/applicant` | `.../applicant/page.tsx` | `StepApplicant` → `DealerWizardApplicantEmploymentStep` | `tenant-branding-client` (via config) | Wizard | ✅ COMPLETE |
| `/credit-hub/dealer/applications/new/co-borrower` | `.../co-borrower/page.tsx` | `DealerWizardCoBorrowerStep` | — | Wizard | ✅ COMPLETE / 🔇 skippable |
| `/credit-hub/dealer/applications/new/vehicle` | `.../vehicle/page.tsx` | `DealerWizardVehicleFinancialStep` | catalogs local | Wizard | ✅ COMPLETE |
| `/credit-hub/dealer/applications/new/documents` | `.../documents/page.tsx` | `DealerWizardDocumentsStep` | `lib/credit-api.uploadDocument` (post-submit) | Wizard | ✅ COMPLETE |
| `/credit-hub/dealer/applications/new/consent` | `.../consent/page.tsx` | `DealerWizardConsentStep` + `SecurityVerificationToggles` | `securityClient`, `consent-client`, `/api/credit-hub/client-metadata` | Wizard | ⚠️ PARTIAL |
| `/credit-hub/dealer/applications/new/complete` | `.../complete/page.tsx` | `StepComplete` | — | Wizard | ✅ COMPLETE |
| `/credit-hub/dealer/preapproval` | `preapproval/page.tsx` | `PreApprovalView` → `PreApprovalSimulator` | None (client math) | Dealer shell | 🎭 STUB (by design) |
| `/credit-hub/dealer/notifications` | `notifications/page.tsx` | `DealerNotificationsView` | `notificationsClient` via `useNotifications` | Dealer shell | ✅ COMPLETE / 🎭 if FF off or 404 |
| `/credit-hub/dealer/profile` | `profile/page.tsx` | `DealerProfileView` | branding only | Dealer shell | 🎭 STUB |

**Dealer detail sections** (`DealerApplicationDetailView` — vertical stack, no tab bar):

| Section | Component | API |
|---------|-----------|-----|
| Header + status badge | inline | `creditCoreClient.getApplication` |
| Pilot labels | `PilotLabelsRow` | payload |
| Operational banner | `OperationalStatusBanner` | `display_status` meta |
| Score / risk | `ScoreVisual`, `RiskBand` | dossier |
| Estado copy | inline | status |
| Ofertas multi-banco | inline cards + `OfferValidityBadge` | `offersClient.listOffers` |
| Documentos | `DealerApplicationDocumentsSection` | payload |
| Editar campos | `ApplicationEditPanel` | `operationalClient.patchApplicationFields` |
| Historial edición | `EditHistorySection` | `operationalClient.getEditHistory` |
| Docs solicitados banco | `DocumentRequestsDealerSection` | `operationalClient` doc requests |
| Mensajes | `ApplicationMessageThread` | `operationalClient` messages |
| Cliente / vehículo cards | inline | dossier |
| Timeline | inline | `creditCoreClient.getApplicationEvents` |
| Aceptar oferta | `OfferConfirmModal` | `creditCoreClient.acceptOffer` |
| Amortización | `AmortizationTable` | `bankExperienceClient.getAmortizationSchedule` (offer-scoped) |
| Acciones | `CancelApplicationButton` | `operationalClient.postCancelApplication` |

---

### 1.2 Bank (`/credit-hub/bank/*`)

| Route | Page component | Primary view | API clients | Role guard | Estado |
|-------|----------------|--------------|-------------|------------|--------|
| `/credit-hub/bank` | `bank/page.tsx` | `WelcomeGuide` + `BankDashboardView` | `bankClient` (queue, analytics); `bankExperienceClient` (KPIs); `goalsClient` | Bank shell | ✅ COMPLETE |
| `/credit-hub/bank/applications` | `applications/page.tsx` | `BankApplicationsTable` | `bankClient.getQueue`, `bulkDecide`; Excel `bankExperienceClient.bankQueueExcelPath` | Bank shell | ✅ COMPLETE |
| `/credit-hub/bank/applications/[applicationId]` | `applications/[applicationId]/page.tsx` | `BankDetailLayout` | `bankClient`, `bankExperienceClient`, `operationalClient`, `securityClient` | Bank shell | ✅ COMPLETE |
| `/credit-hub/bank/analytics` | `analytics/page.tsx` | `BankAnalyticsView` | `bankClient` analytics trio | Bank shell | ✅ COMPLETE |
| `/credit-hub/bank/compliance` | `compliance/page.tsx` | `BankComplianceView` | `bankClient` fan-out (≤50 apps) | Bank shell | ⚠️ PARTIAL (50-app cap) |
| `/credit-hub/bank/audit` | `audit/page.tsx` | `BankAuditView` | `bankClient` fan-out (≤50 apps) | Bank shell | ⚠️ PARTIAL (50-app cap) |
| `/credit-hub/bank/escalations` | `escalations/page.tsx` | `EscalationsList` | `notificationsClient` (filtered) | Bank shell + pilot FF | ⚠️ PARTIAL (no sidebar link) |

**Bank detail tabs** (`BankDetailLayout`):

| Tab | Sections | API |
|-----|----------|-----|
| Análisis | `AnalysisTab`, `AmortizationTable` | payload + offer amortization |
| Documentos · N | `DocumentsTab`, `DocumentRequestsPanel` | payload + `operationalClient` |
| Estipulaciones | `ConditionsPanel`, `StipulationsTab` | `bankExperienceClient` conditions + stipulations hook |
| Audit | `AuditTab` | `bankClient.getAuditTrail` |
| Compliance | `ComplianceTab` | `bankClient.getComplianceReport`, `approveCompliance` |
| Verificaciones | `VerificationsTab` (5 cards) | `securityClient` AML/VIN + declaración |
| Mensajes (unread) | `ApplicationMessageThread` | `operationalClient` |
| Notas internas | `InternalNotesTab` | `bankExperienceClient` notes (role + 404 probe) |

**Bank detail header / right rail:**

| UI | Component | API |
|----|-----------|-----|
| Print / export menu | `PrintExportActions` | PDF paths in `bankExperienceClient` |
| Analyst assignment | `AssignedAnalystSection` | `getApplicationAssignment`, `postReassignApplication` |
| Escalate KYC | `EscalateKycButton` | notifications |
| Decision | `DecisionPanel` | `bankClient.recordDecision` |
| Counter-offer panel | `CounterOfferPanel` | `getCounterOffer`, `getOfferCompare`, `postRejectOffer` |
| Offer compare | `OfferComparePanel` | `getOfferCompare` |
| Disbursement | `DisbursementPanel` | `operationalClient` disbursement + doc requests |

---

### 1.3 Admin (`/credit-hub/admin/*`)

| Route | Component | API | Guard | Estado |
|-------|-----------|-----|-------|--------|
| `/credit-hub/admin` | `AdminNetworkOsView` | `useTenantConfig` only | **None** | 🎭 STUB (7 ROADMAP tiles + REAL tenant card) |

No sub-routes under admin. No tenant/user/compliance management UI.

---

### 1.4 Root & misc

| Route | Component | Guard | Estado |
|-------|-----------|-------|--------|
| `/credit-hub` | Portal picker (`CreditHubHome`) | Tenant | ✅ COMPLETE |
| `/credit-hub/preview` | Forge component playground | None | 🎭 STUB (dev) |
| `/credit-hub/components` | Legacy primitives demo | None | 🎭 STUB (dev) |
| `/credit-hub/_design/shell-preview` | `ShellPreviewClient` | None | 🎭 STUB (design) |

---

### 1.5 Monetización (`/credit-hub/monetizacion/*`)

Gated by `NEXT_PUBLIC_FF_FORGE_MONETIZACION`. Data: fixtures (`USE_API=false`).

| Route | Page | Operador gate | Estado |
|-------|------|---------------|--------|
| `/credit-hub/monetizacion/dashboard` | P1 god-view | `platform_superadmin` | 🎭 STUB |
| `/credit-hub/monetizacion/ingresos` | P2 | `platform_superadmin` | 🎭 STUB |
| `/credit-hub/monetizacion/costo-margen` | P3 | `platform_superadmin` | 🎭 STUB |
| `/credit-hub/monetizacion/configuracion` | P4 | None | 🎭 STUB |
| `/credit-hub/monetizacion/metricas-banco` | P5 | None | 🎭 STUB |
| `/credit-hub/monetizacion/metricas-dealer` | P6 | None | 🎭 STUB |
| `/credit-hub/monetizacion/estado-cuenta` | P7 | None | 🎭 STUB |
| `/credit-hub/monetizacion/reconciliacion` | P8 | None | 🎭 STUB |
| `/credit-hub/monetizacion/sandbox` | Dev playground | None | 🎭 STUB (not in nav) |

---

## 2. Flujo dealer — 17 pasos

| Paso | Qué ve el dealer | Evidencia (componente / ruta) | API | Estado |
|------|------------------|-------------------------------|-----|--------|
| **1** | Dashboard: KPI strip, metas, comparador spotlight, pipeline, tabla recientes, alertas | `DealerDashboardView` `/credit-hub/dealer` | `getCreditStats`, `listApplications`, `getDashboardSummary`, `getMonthlyGoals` | ✅ COMPLETE |
| **2** | Nueva solicitud: wizard 5 rutas (applicant → co-borrower → vehicle → documents → consent) | `DealerWizardProvider` + `dealerWizardPaths.ts` | — | ✅ COMPLETE |
| **3** | Paso solicitante: identidad + empleo (nombre, cédula, DOB, dirección, ingresos, empleador…) | `DealerWizardApplicantEmploymentStep` | local validation `stepIsValid` | ✅ COMPLETE |
| **4** | Paso vehículo: producto, marca/modelo, precio, declaración jurada 5 preguntas + firma, LTV badge client-side | `DealerWizardVehicleFinancialStep`, `VehicleDeclarationSection`, `PreApprovalBadge` | payload only; LTV client calc | ✅ COMPLETE |
| **5** | Paso documentos: checkboxes tenant + archivos obligatorios `id_front`, `id_back`, `vehicle_documents` | `DealerWizardDocumentsStep`, `wizard-gates.ts` | file readiness gates | ✅ COMPLETE |
| **6** | Referencias: mínimo 3 (nombre, dirección, teléfono ≥10 dígitos), hasta 5 filas | Same documents step | `personalReferencesValid()` | ✅ COMPLETE |
| **7** | Consentimiento: presente (firma + 3 checkboxes) o remoto (SMS/email/OTP); toggles KYC + buró | `DealerWizardConsentStep`, `SecurityVerificationToggles` | `postVerifyIdentity`, `postPreScreen`, `consent-client` | ⚠️ PARTIAL — remote consent + security toggles need `?application_id=` before submit |
| **8** | Enviar: `createApplication` → `processApplication` (background) → upload files → redirect `complete?id=` | `DealerWizardProvider.submitApplication` | `creditCoreClient`, `uploadDocument` | ✅ COMPLETE |
| **9** | Mis solicitudes: cards, filtros (todas/enviadas/proceso/aprobadas/rechazadas), búsqueda | `DealerApplicationsListView` | `listApplications` | ✅ COMPLETE |
| **10** | Detalle: secciones verticales (score, estado, ofertas, docs, editar, timeline…) | `DealerApplicationDetailView` | dossier + events | ✅ COMPLETE |
| **11** | Ofertas: cards por lender, badge MEJOR (APR), vigencia; dashboard comparador spotlight | detail cards + `OfferComparatorSpotlight` | `listOffers` | ✅ COMPLETE |
| **12** | Aceptar oferta: modal confirmación → `acceptOffer` → mensaje siblings descartados | `OfferConfirmModal` | `acceptOffer` | ✅ COMPLETE |
| **13** | Amortización: tabla periodo/cuota/capital/interés/saldo (sin fecha si backend no la envía) | `AmortizationTable` | offer-scoped amortization | ✅ COMPLETE |
| **14** | Mensajes: thread dealer↔banco; campana topbar con poll 30s | `ApplicationMessageThread`, `ChTopbar` + `useNotifications` | `operationalClient` messages | ✅ COMPLETE |
| **15** | Docs solicitados por banco: lista estados, botón subir/re-subir | `DocumentRequestsDealerSection` | `patchDocumentRequestUpload` | ✅ COMPLETE |
| **16** | Post-aprobación: banner `OperationalStatusBanner` (cancel/disburse meta); sin UI desembolso dealer | `OperationalStatusBanner`, `CancelApplicationButton` | `display_status` | ⚠️ PARTIAL — dealer ve estado, no acciones de cierre |
| **17** | Notificaciones: página con tabs + campana; `markAsRead` API | `DealerNotificationsView`, `useNotifications` | `notificationsClient` | ✅ COMPLETE / 🎭 si FF off |

**Dealer gaps adicionales:**

- Co-deudor/garante: ruta extra no listada en los 17 pasos (`co-borrower`) — ✅ COMPLETE, skippable.
- Pre-aprobación simulador (`/preapproval`): 🎭 STUB client-side; puede prefill wizard vía `?preset=`.
- Perfil (`/profile`): 🎭 STUB session-only.
- Bank ranking panel en dashboard: ⚠️ PARTIAL — 404 → empty honest.
- Borrador: solo `localStorage`, sin API draft.
- Rechazar contrapropuesta dealer: ❌ MISSING en UI dealer (reject wired en `CounterOfferPanel` bank view con actor dealer).

---

## 3. Flujo banco — 15 pasos

| Paso | Qué ve el banco | Evidencia | API | Estado |
|------|-----------------|-----------|-----|--------|
| **1** | Dashboard: KPIs, cola spotlight, productividad analista, riesgo, auction intel, metas | `BankDashboardView` | queue + analytics + bank KPIs | ✅ COMPLETE |
| **2** | Cola: tabla priorizada, filtros local (estado/prioridad/score), paginación URL, bulk decide, export Excel | `BankApplicationsTable` | `getQueue`, `bulkDecide`, queue `.xlsx` | ✅ COMPLETE |
| **3** | Expediente: layout 2-col, tabs + rail decisión | `BankDetailLayout` | `getBankApplicationDetail` | ✅ COMPLETE |
| **4** | Tab análisis (overview): solicitante, vehículo, métricas LTV/PTI en `AnalysisTab` | `AnalysisTab` | payload `analysis` | ✅ COMPLETE |
| **5** | Tab documentos: adjuntos payload + solicitar/revisar docs | `DocumentsTab`, `DocumentRequestsPanel` | `operationalClient` | ✅ COMPLETE |
| **6** | Tab verificaciones: 5 cards (KYC snapshot, pre-screen snapshot, AML, VIN, declaración dealer) | `VerificationsTab` | `getComplianceResults`, `getVehicleHistory` | ⚠️ PARTIAL — KYC/pre-screen son snapshots props, no GET backend |
| **7** | Tab mensajes: thread + badge unread en tab label | `ApplicationMessageThread`, `useMessageUnreadCount` | messages + unread-count | ✅ COMPLETE |
| **8** | Tab notas internas: lista + composer categorías GENERAL/RIESGO/COMPLIANCE/SEGUIMIENTO | `InternalNotesTab` | notes endpoints; tab gated `bank_analyst`/`bank_admin` | ✅ COMPLETE |
| **9** | Decidir: panel Aprobar / Contraoferta / Rechazar + justificación | `DecisionPanel` | `recordDecision` → claim + decide | ✅ COMPLETE (`create_decision` permission) |
| **10** | Condiciones: checklist `met` por oferta + agregar; stipulations tab separado | `ConditionsPanel`, `StipulationsTab` | `fulfillOfferCondition` (PUT), stipulations hook | ✅ COMPLETE |
| **11** | Cierre: checklist docs + marcar listo desembolso + confirmar desembolso con referencia | `DisbursementPanel` | `postReadyForDisbursement`, `postDisburse` | ⚠️ PARTIAL — visible solo OFFER_SELECTED/READY; sin check `confirm_funding` permission |
| **12** | Comparador: tabla side-by-side ofertas activas | `OfferComparePanel` | `getOfferCompare` | ✅ COMPLETE |
| **13** | Analista asignado: header + modal reasignar (supervisor/admin) | `AssignedAnalystSection` | assignment endpoints | ✅ COMPLETE |
| **14** | Export: menú Expediente / Carta decisión / Audit trail PDF + Excel en cola | `PrintExportActions`, queue button | PDF + `.xlsx` paths | ✅ COMPLETE |
| **15** | Imprimir: `window.print()`; controles con clase `no-print` | `PrintExportActions` | browser print | ✅ COMPLETE |

**Bank gaps adicionales:**

- Header pill "En revisión" estático — no refleja `state`/`display_status` (⚠️ PARTIAL).
- Escalaciones `/bank/escalations` — ⚠️ PARTIAL (sin link sidebar; depende notifications).
- Compliance/audit globales — ⚠️ PARTIAL (máx. 50 solicitudes).
- `bank_supervisor` en helpers de notas/reassign pero no en `BANK_PORTAL_ROLES` — posible 403.
- Auto-claim silencioso al abrir detalle — puede fallar sin feedback.
- Counter-offer reject usa `actorRole: "dealer"` desde vista banco — ⚠️ PARTIAL semántica.

---

## 4. Flujo admin

| Pregunta | Respuesta | Estado |
|----------|-----------|--------|
| ¿Existe sección admin Credit Hub? | Sí: `/credit-hub/admin` → `AdminNetworkOsView` | 🎭 STUB |
| ¿Qué ve admin que dealer/banco no? | Hoy: tile ROADMAP ×7 + tenant card (mismo config que otros portales). Monetización P1–P3 god-view es exclusiva `platform_superadmin` (ruta separada). | ⚠️ PARTIAL |
| ¿Gestión tenants/usuarios/compliance global? | No hay UI. Matriz permisos `admin: ["*"]` no consumida. | ❌ MISSING |
| ¿Guard de rol en admin? | No — cualquier usuario autenticado con URL accede. | ❌ MISSING (security gap) |

**Admin exclusive surfaces (real today):**

| Surface | Who | Enforced |
|---------|-----|----------|
| Monetización P1–P3 cross-tenant KPIs | `platform_superadmin` | Client `operador-gate` |
| Entrada a ambos portales bank+dealer | `tenant_admin`, `admin`, `credit_admin` | `CHPortalAccessGuard` |
| `/credit-hub/admin` Network OS | Anyone with URL | Not enforced |

---

## 5. Gaps clasificados

### 5.1 Qué falta construir (❌ MISSING UI)

| Gap | Actor | Notas |
|-----|-------|-------|
| Portal cliente (`/credit-hub/customer`) | Customer | Marcado "coming soon" en hub picker |
| Admin: onboarding instituciones, RBAC, feature flags, billing | Admin | Tiles ROADMAP sin páginas |
| Dealer: rechazar contrapropuesta desde detalle dealer | Dealer | Solo en `CounterOfferPanel` (vista banco) |
| Admin: gestión usuarios / compliance global | Admin | Sin rutas |
| Dedicated escalations API list | Bank | Usa filtro sobre notifications |

### 5.2 Qué falta cablear (⚠️ PARTIAL wiring)

| Gap | Ubicación | Detalle |
|-----|-----------|---------|
| Remote consent en wizard greenfield | `DealerWizardConsentStep` | Requiere `application_id` antes de submit |
| Security toggles en consent | `SecurityVerificationToggles` | Mismo bloqueo `application_id` |
| KYC / pre-screen en Verificaciones banco | `VerificationsTab` | Backend POST-only; UI muestra snapshot props (vacío si dealer no corrió) |
| Bank ranking dealer dashboard | `BankRanking` | `getBanksRanking` 404 → empty |
| Disbursement permission | `DisbursementPanel` | No valida `confirm_funding` / `bank_admin` |
| Detail status pill | `BankDetailLayout` | Texto fijo "En revisión" |
| Global audit/compliance pages | `useBankGlobal*` hooks | Cap 50 apps |
| Escalaciones nav | `ChSidebar` bank | Ruta existe, no en menú |
| `bank_supervisor` role | `portal-access.ts` | Orphan vs notes/reassign helpers |

### 5.3 Qué es stub / mock (🎭 STUB)

| Surface | Ruta / componente |
|---------|-------------------|
| Pre-aprobación simulador | `/dealer/preapproval` |
| Perfil dealer | `/dealer/profile` |
| Admin Network OS tiles | `/credit-hub/admin` |
| Monetización completa | `/credit-hub/monetizacion/*` |
| Preview / components dev | `/credit-hub/preview`, `/components` |
| Wizard draft save | `localStorage` only |
| Customer portal card | `/credit-hub` picker |

### 5.4 Funcional y cableado (✅ highlights post-alignment)

| Area | Evidence |
|------|----------|
| Document requests flat paths | `operationalClient` + dealer/bank panels |
| Per-message read + unread-count | `ApplicationMessageThread` |
| Offer-scoped amortization/conditions | `usePrimaryOfferId` + panels |
| Bank KPIs quartet | `BankExperienceKpisPanel` |
| PDF export trio + queue Excel | `PrintExportActions`, `BankApplicationsTable` |
| Dealer notifications page | `useNotifications` + `markAsRead` |
| Multi-lender offers + accept | `DealerApplicationDetailView` |

---

## 6. API client map (Credit Hub UI)

| Client | Dealer surfaces | Bank surfaces |
|--------|-----------------|---------------|
| `creditCoreClient` | Dashboard, list, detail, wizard submit, accept | — |
| `offersClient` | Detail offers, comparator spotlight | — |
| `operationalClient` | Edit, docs, messages, cancel | Messages, doc requests, disbursement, edit history |
| `bankExperienceClient` | Amortization | Notes, assignment, conditions, compare, reject, KPIs, exports |
| `securityClient` | Wizard toggles | Verifications |
| `notificationsClient` | Page + topbar | Escalations filter |
| `bankClient` | — | Queue, detail, decide, analytics, compliance, audit |
| `analyticsClient` | Dashboard summary, bank ranking | — |
| `goalsClient` | DealerGoals | BankGoals |
| `consent-client` | Remote consent methods | — |

---

## 7. Key file index

| Purpose | Path |
|---------|------|
| Dealer routes | `app/(forge)/credit-hub/dealer/**/page.tsx` |
| Bank routes | `app/(forge)/credit-hub/bank/**/page.tsx` |
| Dealer shell / guard | `components/credit-hub/dealer/DealerChShell.tsx` |
| Bank shell / guard | `components/credit-hub/bank/BankChShell.tsx` |
| Portal RBAC | `lib/credit-hub/auth/portal-access.ts` |
| Permissions matrix | `lib/credit-hub/utils/permissions.ts` |
| Dealer detail | `components/credit-hub/dealer/DealerApplicationDetailView.tsx` |
| Bank detail | `components/credit-hub/bank/BankDetailLayout.tsx` |
| Wizard | `components/forge/credit-hub/dealer/DealerWizardProvider.tsx` |
| Coverage matrix (backend) | `docs/audits/BACKEND_FRONTEND_COVERAGE_MATRIX.md` |

---

*Generated by read-only component inspection — FULL_FLOW_AUDIT_FRONTEND. No application code modified.*

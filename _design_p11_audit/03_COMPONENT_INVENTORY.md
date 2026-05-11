# FASE 3 — Inventario componentes Forge + módulos `credit-hub`

**Fecha:** 2026-05-09  
**Repo:** `C:\Users\cesar\Projects\nadakki-dashboard`  
**Branch:** `main` @ `7504a03`

---

## Alcance

| Área | Archivos | LOC (aprox.) |
|------|-----------|----------------|
| `components/forge/**/*.tsx` | 49 | ~5 292 líneas |
| `lib/credit-hub/hooks/*.ts` | 26 | ~985 líneas |
| `lib/credit-hub/api/*.ts` | 10 | ~1 131 líneas |

**“Used in”:** número de archivos bajo `app/` + `components/` que contienen el identificador del componente (nombre del archivo en PascalCase). Incluye imports vía `@/components/forge` y rutas directas. No cuenta solo menciones en strings irrelevantes (heurística `\bName\b`).

**Exports:** la mayoría de primitivas UI se re-exportan desde `components/forge/index.ts`; layout y vistas grandes suelen importarse por ruta.

---

## A — `components/forge/**/*.tsx`

| Component (path relativo) | Lines | Used in (files) | Dependencias típicas | Notas |
|---------------------------|-------|-----------------|------------------------|-------|
| `credit-hub/BankApplicationDetailView.tsx` | 599 | 2 | Forge UI, hooks credit-hub, Next | Vista detalle banco — mayor archivo Forge. |
| `credit-hub/dealer/DealerWizardProvider.tsx` | 515 | 8 | React context, forge barrel, API crédito | Orquesta wizard dealer. |
| `credit-hub/dealer/DealerWizardApplicantEmploymentStep.tsx` | 345 | 2 | `@/components/forge` barrel | Paso formulario. |
| `layout/ForgeCreditHubCommandPalette.tsx` | 272 | 2 | CommandPalette, Modal, Button, navegación | Cmd+K Credit Hub. |
| `credit-hub/DealerApplicationStatusView.tsx` | 257 | 2 | Card, Skeleton, estado solicitud | Dealer tracking. |
| `credit-hub/dealer/DealerWizardCoBorrowerStep.tsx` | 214 | 2 | Input, Select, DateInput | |
| `credit-hub/dealer/DealerWizardVehicleFinancialStep.tsx` | 204 | 2 | Input, Select | |
| `ui/DataTable.tsx` | 193 | 7 | React, tipado tabla | Bandejas / listados. |
| `ui/CommandPalette.tsx` | 164 | 3 | Dialog pattern / radix-style | Base Cmd+K. |
| `credit-hub/dealer/DealerWizardChrome.tsx` | 140 | 2 | Modal, toast | Chrome wizard. |
| `layout/ForgeCreditHubSidebar.tsx` | 139 | 3 | Skeleton, segmentos persona | P10 sidebar 18 ítems. |
| `layout/ForgeAppSidebar.tsx` | 139 | 3 | Skeleton | Shell Legal/legacy. |
| `ui/Button.tsx` | 113 | 21 | React | Primitiva más reutilizada. |
| `ui/MicroChart.tsx` | 110 | 3 | Canvas / sparkline | KPI sparklines. |
| `layout/ForgeCreditHubAppShell.tsx` | 109 | 5 | Toast, TenantBrandingErrorBanner | Shell principal Credit Hub. |
| `credit-hub/dealer/DealerWizardDocumentsStep.tsx` | 98 | 2 | Form controls | |
| `ui/Drawer.tsx` | 97 | 4 | Overlay | |
| `ui/Tabs.tsx` | 81 | 9 | Headless tabs | |
| `ui/Textarea.tsx` | 81 | 7 | Input primitives | |
| `ui/Modal.tsx` | 79 | 9 | Focus trap | |
| `layout/ForgeCreditHubTopbar.tsx` | 78 | 3 | IconButton, Skeleton | |
| `ui/MoneyInput.tsx` | 78 | 3 | Locale / máscara | |
| `ui/TenantBrandingErrorBanner.tsx` | 76 | 2 | Branding hook | P10 branding. |
| `ui/Input.tsx` | 70 | 16 | ForwardRef input | |
| `ui/Select.tsx` | 69 | 15 | Lista opciones | |
| `ui/DateInput.tsx` | 68 | 5 | Fechas | |
| `ui/KpiCard.tsx` | 63 | 7 | MicroChart opcional | Paridad diseño KPI. |
| `layout/ForgeCommandPaletteContext.tsx` | 53 | 4 | React context | Estado paleta. |
| `layout/Sidebar.tsx` | 53 | 8 | Nav genérico | Comparte patrón con Forge sidebars. |
| `ui/AuditTimeline.tsx` | 50 | 5 | Timeline eventos | Audit bank page. |
| `ui/Checkbox.tsx` | 50 | 7 | Radix-like | |
| `ui/Avatar.tsx` | 49 | 3 | Imagen / iniciales | |
| `ui/RadioGroup.tsx` | 49 | 3 | Grupo opciones | |
| `ui/Switch.tsx` | 49 | 3 | Toggle | |
| `ui/EvidenceCard.tsx` | 42 | 4 | Card stack diseño | Clave para Forge V2 detalle. |
| `ui/Breadcrumb.tsx` | 41 | 3 | Navegación | |
| `ui/EmptyState.tsx` | 41 | 13 | Ilustración / copy | |
| `ui/ConsentCapture.tsx` | 40 | 3 | Compliance | |
| `ui/IconButton.tsx` | 36 | 6 | accesibilidad | |
| `credit-hub/dealer/DealerWizardConsentStep.tsx` | 34 | 2 | Checkbox / legal | |
| `ui/StatusPill.tsx` | 34 | 6 | Estados pipeline | |
| `ui/Badge.tsx` | 33 | 7 | etiquetas | |
| `layout/ForgeAppShell.tsx` | 32 | 4 | Legal layout | |
| `layout/ForgeAppTopbar.tsx` | 32 | 3 | Legal topbar | |
| `ui/Toast.tsx` | 31 | 12 | Sonner-style | Toasts globales. |
| `layout/Topbar.tsx` | 29 | 5 | Layout genérico | |
| `credit-hub/dealer/DealerNewApplicationLayoutClient.tsx` | 21 | 2 | Skeleton | Layout rutas `new`. |
| `ui/Card.tsx` | 21 | 12 | Contenedor | |
| `ui/Skeleton.tsx` | 21 | 20 | Loading | Muy usado P10. |

---

## B — `lib/credit-hub/hooks/*.ts` (resumen)

| Hook | Lines | Rol |
|------|-------|-----|
| `useTenantConfig.ts` | 152 | Config tenant / feature gates |
| `useConsentStatusPolling.ts` | 106 | Consent async |
| `useScenarioStore.ts` | 80 | Estado escenarios |
| `useCatalogs.ts` | 67 | Catálogos |
| `useBankDecision.ts` | 63 | Decisiones banco |
| `useCreditAnalysis.ts` | 44 | Análisis crédito |
| `useCreditApplicationDetail.ts` | 39 | Detalle solicitud |
| `useTenantBranding.ts` | 37 | Branding API |
| `useBankAnalytics.ts` | 36 | Analytics dashboard banco |
| `usePreApprovalSimulation.ts` | 34 | Simulación |
| `queryKeys.ts` | 29 | TanStack Query keys |
| `useCreateApplication.ts` | 28 | Alta solicitud |
| `useProcessCreditApplication.ts` | 27 | Pipeline |
| `useCreateCreditApplication.ts` | 26 | Variante create |
| `useApplication.ts` | 24 | Single application |
| `useHealth.ts` | 23 | Health checks |
| `useApplications.ts` | 23 | Lista apps |
| `useBulkActions.ts` | 22 | Acciones masivas |
| `usePortal.ts` | 19 | Portal dealer |
| `useCreditStats.ts` | 18 | Stats KPI |
| `useCreditApplications.ts` | 18 | Lista credit apps |
| `useTenant.ts` | 17 | Tenant metadata |
| `useBankQueue.ts` | 16 | Cola banco — **pareado con bandeja diseño** |
| `useFeatureFlag.ts` | 14 | Flags |
| `useConsentApi.ts` | 14 | Consent client |
| `useActorRole.ts` | 9 | RBAC UI |

---

## C — `lib/credit-hub/api/*.ts` (resumen)

| Módulo | Lines | Rol |
|--------|-------|-----|
| `creditCoreClient.ts` | 161 | Cliente núcleo `/api/v2/credit` |
| `tenant-branding-client.ts` | 148 | GET branding |
| `public-consent-client.ts` | 147 | Consent público |
| `normalizers.ts` | 143 | Shape API → UI |
| `client.ts` | 140 | HTTP base |
| `creditAnalysisClient.ts` | 115 | Análisis |
| `bankClient.ts` | 110 | Cola / decisiones banco |
| `consent-client.ts` | 109 | Consent privado |
| `applications.ts` | 45 | Helpers aplicaciones |
| `health.ts` | 13 | Ping |

---

## Resultado FASE 3

**FASE 3 COMPLETA — 49 componentes `.tsx` Forge catalogados** + **36 módulos** hooks/API listados (desglose completo hooks/api en tablas B–C).

**Archivo:** `_design_p11_audit/03_COMPONENT_INVENTORY.md`

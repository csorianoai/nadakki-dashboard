# Capacidades del Dealer Bank en el dashboard

Generado por `mapa_capacidades.ps1` el 2026-08-25 09:43.
dashboard `8e4deec4f352` - endpoints en staging: 951

## Como leer esto

Cada cliente API declara su propia constante base. Por ejemplo
`lib/credit-hub/api/creditCoreClient.ts` define `CREDIT_CORE_BASE = "/api/v2/credit"`,
asi que un path `/applications/{id}/offers/{offerId}/accept` resuelve a
`/api/v2/credit/applications/{id}/offers/{offerId}/accept`.

**Leer el path sin su base produce falsos negativos.** Paso tres veces.

- **OK** resuelve a un endpoint que existe en staging y alguna pantalla la usa
- **SIN-UI** el endpoint existe, ninguna pantalla la importa
- **ROTO** no resuelve a ningun endpoint de staging

Niveles superiores - probada con token (L3) y en navegador (L4) - los declara
el Loop A, no este script.

## Bases declaradas por cliente

| cliente | base |
|---|---|
| `lib/autos-portal/api.ts` | `/api/v1/autos` |
| `lib/autos-portal/financing-preset.ts` | `(sin constante local)` |
| `lib/autos-portal/hooks/useFinancingBridge.ts` | `(sin constante local)` |
| `lib/bank/document-preview-api.ts` | `(sin constante local)` |
| `lib/credit-hub/api/analyticsClient.ts` | `(sin constante local)` |
| `lib/credit-hub/api/applications.ts` | `(sin constante local)` |
| `lib/credit-hub/api/bankClient.ts` | `(sin constante local)` |
| `lib/credit-hub/api/bankExperienceClient.ts` | `(sin constante local)` |
| `lib/credit-hub/api/client.ts` | `(sin constante local)` |
| `lib/credit-hub/api/creditAnalysisClient.ts` | `/api/v2/credit` |
| `lib/credit-hub/api/creditCoreClient.ts` | `/api/v2/credit` |
| `lib/credit-hub/api/escalateClient.ts` | `(sin constante local)` |
| `lib/credit-hub/api/goalsClient.ts` | `(sin constante local)` |
| `lib/credit-hub/api/health.ts` | `(sin constante local)` |
| `lib/credit-hub/api/notificationsClient.ts` | `(sin constante local)` |
| `lib/credit-hub/api/offersClient.ts` | `/credit` |
| `lib/credit-hub/api/operationalClient.ts` | `(sin constante local)` |
| `lib/credit-hub/api/securityClient.ts` | `(sin constante local)` |

## DEALER

| estado | metodo | capacidad | endpoint resuelto | pantallas |
|---|---|---|---|---|
| SIN-UI | GET | `getBanksRanking` | `/api/v2/credit/analytics/banks-ranking` | 0 |
| OK | POST | `postCancelApplication` | `/api/v2/credit/applications/{}/cancel` | 1 |
| OK | GET | `getEditHistory` | `/api/v2/credit/applications/{}/edit-history` | 2 |
| OK | PATCH | `patchApplicationFields` | `/api/v2/credit/applications/{}/fields` | 1 |
| OK | POST | `postApplicationMessage` | `/api/v2/credit/applications/{}/messages` | 1 |
| OK | GET | `getApplicationMessages` | `/api/v2/credit/applications/{}/messages` | 1 |
| OK | GET | `getMessageUnreadCount` | `/api/v2/credit/applications/{}/messages/unread-count` | 1 |
| OK | GET | `getAmortizationSchedule` | `/api/v2/credit/applications/{}/offers/{}/amortization` | 1 |
| OK | POST | `postRejectOffer` | `/api/v2/credit/applications/{}/offers/{}/reject` | 2 |
| OK | POST | `postPreScreen` | `/api/v2/credit/applications/{}/pre-screening` | 1 |
| OK | POST | `postVerifyIdentity` | `/api/v2/credit/applications/{}/verify-identity` | 1 |
| OK | PATCH | `patchDocumentRequestUpload` | `/api/v2/credit/document-requests/{}/upload` | 1 |
| OK | PATCH | `patchMarkMessageRead` | `/api/v2/credit/messages/{}/read` | 1 |
| SIN-UI | GET | `getMessageUnreadSummary` | `/api/v2/credit/messages/unread-summary` | 0 |
| ROTO | GET | `getCreditNotifications` | `/api/v2/credit/notifications{}` | 0 |
| OK | PATCH | `markNotificationRead` | `/api/v2/credit/notifications/{}/read` | 1 |

## BANCO

| estado | metodo | capacidad | endpoint resuelto | pantallas |
|---|---|---|---|---|
| ROTO | GET | `getAuctionIntel` | `/api/v2/credit/analytics/auction-intel{}` | 0 |
| ROTO | GET | `getAnalytics` | `/api/v2/credit/analytics/dashboard{}` | 0 |
| SIN-UI | GET | `getDealersRanking` | `/api/v2/credit/analytics/dealers-ranking` | 0 |
| SIN-UI | GET | `getPortfolioHealth` | `/api/v2/credit/analytics/portfolio-health` | 0 |
| SIN-UI | GET | `getRiskDistributions` | `/api/v2/credit/analytics/risk-distributions` | 0 |
| OK | POST | `postReassignApplication` | `/api/v2/credit/applications/{}/assign` | 1 |
| OK | GET | `getApplicationAssignment` | `/api/v2/credit/applications/{}/assignment` | 1 |
| OK | GET | `getComplianceResults` | `/api/v2/credit/applications/{}/compliance/results` | 1 |
| SIN-UI | POST | `postComplianceScreen` | `/api/v2/credit/applications/{}/compliance/screen` | 0 |
| OK | POST | `postDisburse` | `/api/v2/credit/applications/{}/disburse` | 1 |
| OK | POST | `postDocumentRequest` | `/api/v2/credit/applications/{}/document-requests` | 1 |
| OK | GET | `getDocumentRequests` | `/api/v2/credit/applications/{}/document-requests` | 3 |
| OK | POST | `escalateOcrReview` | `/api/v2/credit/applications/{}/documents/{}/ocr/escalate-review` | 1 |
| OK | POST | `escalateKycReview` | `/api/v2/credit/applications/{}/kyc/escalate-review` | 1 |
| OK | POST | `postApplicationNote` | `/api/v2/credit/applications/{}/notes` | 1 |
| OK | GET | `getApplicationNotes` | `/api/v2/credit/applications/{}/notes` | 1 |
| OK | GET | `getOfferConditions` | `/api/v2/credit/applications/{}/offers/{}/conditions` | 1 |
| OK | PUT | `putOfferConditions` | `/api/v2/credit/applications/{}/offers/{}/conditions` | 1 |
| OK | GET | `getOfferCompare` | `/api/v2/credit/applications/{}/offers/compare` | 2 |
| OK | POST | `postReadyForDisbursement` | `/api/v2/credit/applications/{}/ready-for-disbursement` | 1 |
| OK | GET | `getBankExperienceKpis` | `/api/v2/credit/bank/kpis/portfolio` | 1 |
| OK | PATCH | `patchDocumentRequestReview` | `/api/v2/credit/document-requests/{}/review` | 1 |
| OK | GET | `getVehicleHistory` | `/api/v2/credit/vehicles/vin/{}/history` | 2 |

## Sin rol declarado

| estado | metodo | capacidad | endpoint resuelto | pantallas |
|---|---|---|---|---|
| ROTO | GET | `resolveCreditHubFetchUrl` | `/{}` | 3 |
| SIN-UI | PATCH | `transitionLead` | `/api/v1/autos/leads` | 0 |
| ROTO | GET | `listApplications` | `/api/v1/sic/credit-applications` | 0 |
| ROTO | POST | `createApplication` | `/api/v1/sic/credit-applications` | 1 |
| ROTO | GET | `getApplication` | `/api/v1/sic/credit-applications/{}` | 1 |
| SIN-UI | GET | `getHealth` | `/api/v1/sic/routeone/health` | 0 |
| OK | GET | `auditTrailPdfPath` | `/api/v2/credit/applications/{}/export/audit-trail.pdf` | 1 |
| OK | GET | `decisionLetterPdfPath` | `/api/v2/credit/applications/{}/export/decision-letter.pdf` | 1 |
| OK | GET | `expedientePdfPath` | `/api/v2/credit/applications/{}/export/expediente.pdf` | 1 |
| SIN-UI | POST | `recordDecision` | `/api/v2/credit/applications/{}` | 0 |
| OK | GET | `getApplication` | `/api/v2/credit/applications/{}` | 1 |
| SIN-UI | GET | `getApplicationForReview` | `/api/v2/credit/applications/{}` | 0 |
| SIN-UI | GET | `getApplicationAnalysis` | `/api/v2/credit/applications/{}/analysis` | 0 |
| SIN-UI | POST | `analyzeApplication` | `/api/v2/credit/applications/{}/analyze` | 0 |
| SIN-UI | GET | `getAuditTrail` | `/api/v2/credit/applications/{}/audit-trail` | 0 |
| OK | GET | `getCounterOffer` | `/api/v2/credit/applications/{}/counter-offer` | 1 |
| OK | GET | `getApplicationEvents` | `/api/v2/credit/applications/{}/events` | 1 |
| SIN-UI | GET | `getExpedienteFull` | `/api/v2/credit/applications/{}/expediente/full` | 0 |
| OK | POST | `acceptOffer` | `/api/v2/credit/applications/{}/offers/{}/accept` | 1 |
| OK | POST | `processApplication` | `/api/v2/credit/applications/{}/process` | 3 |
| SIN-UI | POST | `bulkDecide` | `/api/v2/credit/applications/bulk-decide` | 0 |
| ROTO | GET | `getQueue` | `/api/v2/credit/applications/queue{}` | 0 |
| OK | GET | `bankQueueExcelPath` | `/api/v2/credit/bank/export/queue.xlsx` | 1 |
| ROTO | GET | `getMonthlyGoals` | `/api/v2/credit/goals/monthly/{}{}` | 0 |
| SIN-UI | GET | `listOffers` | `/credit/applications/{}/offers` | 0 |
| ROTO | GET | `creditHubApplicationUrl` | `/credit-hub/dealer/applications/{}` | 1 |
| ROTO | GET | `useFinancingBridge` | `/credit-hub/dealer/applications/new/applicant` | 2 |
| ROTO | GET | `creditHubWizardUrl` | `/credit-hub/dealer/applications/new/applicant` | 0 |
| ROTO | GET | `bankDocumentThumbnailUrl` | `/download` | 0 |


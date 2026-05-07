# Verificación Sub-fase 2.4 Frontend Cases

**Repositorio:** `nadakki-dashboard`  
**Rama actual al auditar:** `legal-phase2/fix-fe-be-mismatches`  
**Commits de referencia:** incorpora `743efc0` (feat Sub-fase 2.4) + `ad87304` (merge PR #17) + `7a7bd5b` / `4985d5a` (alineación FE-BE disaster-mode y endpoints).  
**Backend probado:** `https://nadakki-ai-suite.onrender.com`  
**Tenant:** `366b3c6c-a899-4320-805e-5c1d7c896f74`  
**Fecha verificación:** 2026-05-07  

---

## 1. Resumen ejecutivo

| Ítem | Valor |
|------|--------|
| **Estado** | **YELLOW** (funcional y alineado con prod en puntos críticos; diferencias de nomenclatura checklist vs código y cobertura a11y por debajo del umbral arbitrario del checklist). |
| **Archivos críticos de rutas** | **12 / 13** esperados por checklist de páginas (falta `app/(forge)/legal/cases/[id]/layout.tsx`; existe `cases/layout.tsx` a nivel segmento). |
| **Hooks `hooks/legal/`** | **14** ficheros (cubre lista, detalle, timeline/eventos, documentos, estrategias, plazos, incidencias, riesgo, snapshots, relacionados, acciones, lock, ciclo de vida docs, modo degradado). |
| **Componentes `.tsx` en `components/legal/cases/`** | **30** |
| **Issues críticos** | **0** bloqueantes (≤ umbral escape). |

---

## 2. Archivos esperados vs encontrados

| Archivo esperado | Existe | Notas |
|------------------|:------:|-------|
| `app/(forge)/legal/cases/page.tsx` | Sí | Lista + enlace creación |
| `app/(forge)/legal/cases/new/page.tsx` | Sí | Wizard creación |
| `app/(forge)/legal/cases/[id]/page.tsx` | Sí | Detalle / overview |
| `app/(forge)/legal/cases/[id]/timeline/page.tsx` | Sí | Timeline |
| `app/(forge)/legal/cases/[id]/documents/page.tsx` | Sí | Documentos |
| `app/(forge)/legal/cases/[id]/strategy/page.tsx` | Sí | Estrategias multi-select |
| `app/(forge)/legal/cases/[id]/deadlines/page.tsx` | Sí | Plazos |
| `app/(forge)/legal/cases/[id]/issues/page.tsx` | Sí | Incidencias |
| `app/(forge)/legal/cases/[id]/risk/page.tsx` | Sí | Riesgo |
| `app/(forge)/legal/cases/[id]/snapshots/page.tsx` | Sí | Snapshots |
| `app/(forge)/legal/cases/[id]/related/page.tsx` | Sí | Relacionados |
| `app/(forge)/legal/cases/[id]/archive/page.tsx` | Sí | Archivo |
| `app/(forge)/legal/cases/[id]/layout.tsx` | **No** | Next.js usa `cases/layout.tsx` para pestañas Tareas/Expedientes |
| `lib/legal/cases/legal-cases-api.ts` | Sí | Cliente `/api/legal/*` |
| `lib/legal/cases/case-types.ts` | Sí | Tipos dominio |
| `messages/es/legal-cases.json` | Sí | **21 claves de primer nivel** en JSON |
| `app/providers/DisasterModeProvider.tsx` | Sí | Integrado en layout legal Forge |

---

## 3. Hooks (`hooks/legal/`)

Ficheros presentes:

- `useLegalCases.ts` → lista (equivalente a “useCases”).
- `useLegalCase.ts` → detalle (equivalente a “useCase”).
- `useCaseTimeline.ts` → eventos (`fetchTimeline` → `GET .../events`).
- `useCaseDocuments.ts`, `useCaseDocumentLifecycle.ts`.
- `useCaseStrategies.ts`.
- `useCaseDeadlines.ts`.
- `useCaseIssues.ts`.
- `useCaseRisk.ts`.
- `useCaseSnapshots.ts`.
- `useCaseRelated.ts` (equivalente a “relations”).
- `useCaseLock.ts`.
- `useCaseActions.ts`.
- `useDisasterMode.ts` (requiere `tenantId`; usado desde `DisasterModeProvider`).

No hay archivos con los nombres exactos `useCases.ts` / `useCaseRelations.ts`; la funcionalidad está cubierta con los nombres anteriores.

---

## 4. Componentes (`components/legal/cases/`)

**Conteo:** **30** archivos `.tsx`.

| Expectativa checklist | Implementación real |
|-----------------------|---------------------|
| CaseList / CaseListItem | `CaseList.tsx` + `CaseCard.tsx` (ítem = tarjeta) |
| CaseHeader (detalle) | `CaseDetailHeader.tsx` |
| CaseCreateWizard (3 pasos) | `CaseCreateWizard.tsx` |
| DeadlinesPanel + DeadlineOverrideModal | `CaseDeadlinesPanel.tsx` + `CaseDeadlineOverrideModal.tsx` |
| StrategiesPanel (multi-select) | `CaseStrategyMultiSelect.tsx` + `CaseStrategyCard.tsx` |
| DocumentsPanel | `CaseDocumentsList.tsx`, `CaseDocumentUploader.tsx`, modales ciclo de vida / OCR |
| IssuesPanel | `CaseIssuesPanel.tsx` + `CaseIssueReportModal.tsx` |
| RiskPanel | Vista en `risk/page.tsx` + `CaseRiskBadge` en cabecera |
| SnapshotsPanel | `CaseSnapshotsList.tsx` |
| LockPanel | `CaseLockBanner.tsx` (banner, no panel dedicado) |
| RelatedCasesPanel | `CaseRelatedCasesPanel.tsx` |
| CaseActionsMenu (disaster) | `CaseActionsMenu.tsx` + `useDisasterLevel()` |

---

## 5. i18n (`messages/es/legal-cases.json`)

- **Claves de primer nivel:** 21  
- **Muestra:** `list`, `nav`, `states`, `priority`, `case_types`, `wizard`, `actions`, `deadlines`, `strategy`, `documents`, `issues`, `snapshots`, `risk`, `confidence`, `lock`, `disaster_mode`, `compliance`, `actors`, `archive`, `related`, `timeline`  

---

## 6. Strings en inglés en UI (muestra rápida)

Búsqueda de literales `"Loading"`, `"Save"`, `"Cancel"`, `"Delete"`, `"Submit"` en `components/legal/cases/` y `app/(forge)/legal/cases/`: **sin coincidencias** en la pasada de verificación (los textos de botones provienen de JSON o cadenas en español).

---

## 7. Tipos (`lib/legal/cases/case-types.ts`)

Presentes: `CaseState`, `CaseType` (5 valores), `CaseTimelineEvent`, `CaseDeadline`, `CaseStrategy`, `CaseDocument`, `CaseIssue`, `DisasterLevel`, `LegalCase` (equivalente al “Case” del checklist; no hay alias `Case`).

---

## 8. Cliente API — funciones exportadas y checklist

Prefijo runtime: **`/api/legal`** → rewrite a **`/api/v1/legal`** (`next.config.js`).

| Checklist | En código | Notas |
|-----------|-----------|--------|
| fetchCases | `fetchCasesList` | OK |
| fetchCase | `fetchCaseDetail` | OK |
| createCase | `createCase` | OK |
| fetchTimeline / fetchEvents (C-1) | `fetchTimeline` llama **`GET .../events`** | No queda `/timeline` en URLs |
| fetchDocuments | `fetchDocuments` (GET detalle caso para `documents`) + `ingestDocument` POST | Backend también aceptó `GET .../documents` en smoke test |
| patchDocumentLifecycle + `/lifecycle` | `patchDocumentLifecycle` → **`.../documents/{id}/lifecycle`** PATCH | C-3 OK |
| fetchStrategies | `fetchStrategies` | OK |
| selectStrategy / generateStrategies | `postStrategiesSelect` | No hay nombre `generateStrategies` separado |
| fetchDeadlines | `fetchDeadlines` | OK |
| patchDeadlineOverride (C-2) | `postDeadlineOverride` usa **PATCH** en `/override` | Nombre engañoso (`post*`) pero verbo HTTP correcto |
| fetchIssues / patchIssue + resolve (C-4) | `fetchIssues`, `postIssue`, **`patchIssue` → `.../issues/{id}/resolve`** PATCH | C-4 OK |
| fetchRisk | `fetchRisk` | OK |
| fetchSnapshots | `fetchSnapshots`, `fetchSnapshotDetail`, `postSnapshot` | OK |
| fetchDisasterMode | `fetchDisasterMode(tenantId)` con header tenant | OK |

Funciones adicionales: acciones, lock, related, archive, verify_extracted_data, etc.

---

## 9. Mismatches FE-BE (C-1 a C-4)

| Fix | Criterio | Resultado |
|-----|----------|-----------|
| **C-1** | No usar `/timeline` en URL | **Cumplido** — `grep /timeline` en `legal-cases-api.ts`: **0** |
| **C-2** | Override de plazo no vía POST incorrecto | **Cumplido** — override con **PATCH** |
| **C-3** | Lifecycle en ruta explícita | **Cumplido** — `.../documents/.../lifecycle` |
| **C-4** | Resolución issues vía `/resolve` | **Cumplido** — `patchIssue` apunta a `/resolve` |

---

## 10. Rewrite Vercel / Next

En `next.config.js`:

```text
{ source: "/api/legal/:path*", destination: `${backendUrl}/api/v1/legal/:path*` }
```

Cumple el patrón esperado.

---

## 11. TanStack Query

`hooks/legal/*` usa `useQuery` / `useMutation` de `@tanstack/react-query` de forma consistente (invalidación en mutaciones donde aplica).

---

## 12. Accesibilidad (muestra)

Atributos `role=` o `aria-` en `components/legal/cases/`: **~31 coincidencias** repartidas en **15** ficheros (recuento por `grep`).  
**No alcanza** el umbral **>50** del checklist original; mejora recomendable en foco, `aria-live` y etiquetas en formularios densos.

---

## 13. DisasterMode

- `DisasterModeProvider` en `app/providers/DisasterModeProvider.tsx`.
- Integración: `app/(forge)/legal/LegalLayoutClient.tsx`.
- `useDisasterMode(tenantId)` + `fetchDisasterMode` con header `X-Tenant-ID`.
- `CaseActionsMenu` filtra acciones según `useDisasterLevel()`.

---

## 14. Compilación, build y tests (ejecutado en entorno de verificación)

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **0 errores** |
| `npm run build` | **exit 0** (Next 16; posibles avisos SWC según política del host) |
| `npx jest "__tests__/legal/"` | **29** suites, **81** tests **passed** |

---

## 15. Consistencia con backend en producción (smoke)

Con header `X-Tenant-ID: 366b3c6c-a899-4320-805e-5c1d7c896f74`:

| Endpoint | Resultado |
|----------|-----------|
| `GET /api/v1/legal/cases` | OK |
| `GET /api/v1/legal/meta/disaster-mode` | OK |
| Con `case_id` de la lista: `GET .../cases/{id}` | OK |
| `GET .../cases/{id}/events` | OK |
| `GET .../cases/{id}/deadlines` | OK |
| `GET .../cases/{id}/strategies` | OK |
| `GET .../cases/{id}/documents` | OK |
| `GET .../cases/{id}/issues` | OK |
| `GET .../cases/{id}/snapshots` | OK |

---

## 16. Issues encontrados (no bloqueantes)

1. **Rama:** el trabajo de alineación vive en `legal-phase2/fix-fe-be-mismatches`; para auditoría “solo 2.4” el merge esperado sería `main` o la rama `legal-phase2/2.4-frontend-cases` según política de release.  
2. **`[id]/layout.tsx`:** ausente; hay `cases/layout.tsx` con pestañas — aceptable en Next App Router.  
3. **Nombres API:** `postDeadlineOverride` debería renombrarse a `patchDeadlineOverride` por claridad.  
4. **A11y:** subir cobertura de `role`/`aria-*` por encima del objetivo del checklist si se exige formalmente.  
5. **Tipos:** no existe el alias de tipo `Case`; se usa `LegalCase` (coherente internamente).

---

## 17. Recomendaciones

1. Documentar en CONTRIBUTING o en spec que la rama canónica post-2.4 incluye `fix-fe-be-mismatches` hasta merge a `main`.  
2. Renombrar `postDeadlineOverride` → `patchDeadlineOverride` (export + imports).  
3. Ampliar pruebas de accesibilidad (axe o reglas eslint a11y) en componentes de formulario/modal.  
4. Opcional: añadir `app/(forge)/legal/cases/[id]/layout.tsx` solo si se necesita shell distinto por expediente.

---

## 18. Veredicto final

**YELLOW — listo para integración continua y pruebas manuales en prod**, con backend verificado en los endpoints usados por la UI; **no hay incumplimientos críticos** de los fixes C-1–C-4. El estado **no es GREEN** por: rama distinta a la nombrada en el checklist, ausencia de `[id]/layout.tsx` según lista estricta, y recuento de atributos a11y por debajo del umbral **>50** del propio checklist.

---

## 19. Referencia de commit del informe

Tras `git push`, el informe queda en:

`docs/legal/REPORTE_VERIFICACION_SUBFASE_2.4_FRONTEND.md`

URL GitHub (sustituir `<rama>` por la rama donde se haya hecho push, p. ej. `legal-phase2/fix-fe-be-mismatches`):

`https://github.com/csorianoai/nadakki-dashboard/blob/<rama>/docs/legal/REPORTE_VERIFICACION_SUBFASE_2.4_FRONTEND.md`

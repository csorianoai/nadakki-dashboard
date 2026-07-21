# Vercel Deploy Failures Audit — 2026-07-12

**Repo:** `csorianoai/nadakki-dashboard`  
**Auditor:** Cursor (read-only, sin fixes)  
**Branch local al auditar:** `finance-ui/f5-registry-crud` (HEAD `25f35f0`)  
**Duración investigación:** ~30 min

---

## Resumen ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Producción en Vercel está fallando **hoy**? | **NO** — último deploy Production **Ready** (commit `e260bea`, 2026-07-11) |
| ¿`npm run build` ejecuta tests? | **NO** — solo `next build --webpack` |
| ¿Los tests Jest bloquean el deploy de Vercel? | **NO** — Vercel no invoca `jest` en el build |
| ¿Los 5 tests nombrados en el brief existen en el repo? | **NO** — 0 archivos encontrados |
| ¿Cockpit / Finance Core causan los fallos? | **NO** — `tests/cockpit` 6/6 PASS; fallos son deuda Credit Hub / Legal / setup Jest |

---

## Deploy más reciente failed (Production)

> **Nota:** No es el deploy más reciente de `main` hoy. Es el último **failed** en Production dentro de la ventana investigada (2026-07-10).

| Campo | Valor |
|-------|-------|
| **URL** | https://nadakki-dashboard-o34wqbnhu-nadakki-ai-suite.vercel.app |
| **Deployment ID** | `dpl_FSSNWdQKmnreEC891ZUbgPPbGEFY` |
| **Commit** | `e5a4167` — `[COCKPIT-F4] QA transversal — admin layout bypass, checklist, deferred map (#293)` |
| **Timestamp** | 2026-07-10T21:12:57Z (≈4 días antes del audit) |
| **Duración** | **705 ms** |
| **Error resumido (card)** | Build terminó con status **Error** sin llegar a fase `npm run build` |

### Otros failed Production el mismo día (mismo patrón)

| URL | Commit | Duración |
|-----|--------|----------|
| `nadakki-dashboard-baan05lr0-…` | `01d97ab` | 738 ms |
| `nadakki-dashboard-hfijbkcaa-…` | — | 666 ms |
| `nadakki-dashboard-45onougea-…` | — | 624 ms |

**Diagnóstico:** Fallos ultra-cortos post-clone (sin `Running "vercel build"` en logs). Causa probable: **fallo transitorio de plataforma Vercel** o cancelación de deploy, **no** TypeScript ni Jest. El deploy siguiente (`e260bea`, 2026-07-11) compiló y desplegó correctamente en ~2 min.

---

## Deploy Production actual (Ready) — referencia

| Campo | Valor |
|-------|-------|
| **URL** | https://nadakki-dashboard-9f8bkyfjp-nadakki-ai-suite.vercel.app |
| **Commit** | `e260bea` — `hotfix(cockpit): allowlist /api/v1/cockpit in platformFetch` |
| **Timestamp** | 2026-07-11T01:21:43Z |
| **Status** | **Ready** |
| **Build** | `npm run build` → Next.js 16.2.4 webpack → **Build Completed** |

GitHub commit status para `e260bea`: Vercel context **success** — "Deployment has completed".

---

## Deploy Preview failed reciente (Finance UI — esperado en stack incompleto)

| Campo | Valor |
|-------|-------|
| **URL** | https://nadakki-dashboard-q8apjhad3-nadakki-ai-suite.vercel.app |
| **Branch** | `finance-ui/f1-nav-shell` |
| **Commit** | `a98fd23` |
| **Timestamp** | 2026-07-13T13:02:23Z |
| **Duración** | ~1 min (llegó a webpack compile) |

---

## Últimas 80 líneas del build log (Preview failed — Finance F1)

```
2026-07-13T13:02:48.930Z  > nadakki-dashboard@1.0.0 build
2026-07-13T13:02:48.930Z  > next build --webpack
2026-07-13T13:02:50.176Z  ▲ Next.js 16.2.4 (webpack)
2026-07-13T13:02:50.271Z  Creating an optimized production build ...
2026-07-13T13:03:46.915Z  Failed to compile.
2026-07-13T13:03:46.915Z
2026-07-13T13:03:46.915Z  ./app/(cockpit)/cockpit/finance/population/page.tsx
2026-07-13T13:03:46.916Z  Module not found: Can't resolve '@/components/cockpit/finance/population/PopulationView'
2026-07-13T13:03:46.916Z
2026-07-13T13:03:46.916Z  https://nextjs.org/docs/messages/module-not-found
2026-07-13T13:03:46.916Z
2026-07-13T13:03:46.916Z  ./app/(cockpit)/cockpit/finance/registry/page.tsx
2026-07-13T13:03:46.916Z  Module not found: Can't resolve '@/components/cockpit/finance/registry/RegistryView'
2026-07-13T13:03:46.916Z
2026-07-13T13:03:46.916Z  https://nextjs.org/docs/messages/module-not-found
2026-07-13T13:03:47.420Z
2026-07-13T13:03:47.420Z  > Build failed because of webpack errors
2026-07-13T13:03:47.618Z  Error: Command "npm run build" exited with 1
```

### Últimas líneas disponibles — Production failed (2026-07-10, sin build)

```
2026-07-10T21:13:03.087Z  Running build in Washington, D.C., USA (East) – iad1
2026-07-10T21:13:03.088Z  Build machine configuration: 4 cores, 8 GB
2026-07-10T21:13:03.210Z  Cloning github.com/csorianoai/nadakki-dashboard (Branch: main, Commit: e5a4167)
2026-07-10T21:13:04.917Z  Cloning completed: 1.707s
status  ● Error
```

*(Vercel CLI no expuso más líneas para estos deploys; duración <1s post-clone sugiere fallo de infraestructura, no de compilación.)*

---

## Tests que bloquean el build (si aplica)

| Pregunta | Respuesta |
|----------|-----------|
| ¿`npm run build` ejecuta tests? | **NO** |
| Script en `package.json` | `"build": "next build --webpack"` |
| ¿Jest en CI de Vercel? | **NO** observado en build logs |
| ¿Qué bloquea deploy cuando falla? | **Errores webpack/TypeScript** (`Module not found`, `Type error`) o fallos de plataforma pre-build |

**Conclusión:** Los 90 tests Jest failing **no bloquean** el pipeline de build de Vercel. Son deuda de CI local / futuro gate, no causa del deploy Production actual.

---

## Los 5 tests nombrados en el brief — NO ENCONTRADOS

Búsqueda en repo (`rg`, `jest --testPathPattern`, glob):

| Test solicitado | Resultado |
|-----------------|-----------|
| `ai-agents-panel.test.tsx` | **No existe** en el repositorio |
| `useSharedMe.test.tsx` | **No existe** |
| `ConfigDrawer.test.tsx` | **No existe** |
| `InitiativeKillProtocol.test.tsx` | **No existe** |
| `useAgentDetection.test.tsx` | **No existe** |

```text
npx jest ai-agents-panel useSharedMe ConfigDrawer InitiativeKillProtocol useAgentDetection
→ No tests found (0 matches en 5733 archivos)
```

**Hipótesis:** Los nombres corresponden a otro snapshot, otro repo, o tests eliminados/renombrados. El estado real del suite local es **38 suites failing** (ver clusters abajo), con causas distintas.

---

## Estado real del suite Jest (2026-07-13, local)

```
Test Suites: 38 failed, 273 passed, 311 total
Tests:       90 failed, 1230 passed, 1320 total
tests/cockpit: 6/6 PASS
```

### Clusters de fallo (causa raíz agrupada)

| Cluster | Suites aprox. | Causa raíz | Prioridad | Fix est. |
|---------|---------------|------------|-----------|----------|
| **A — AuthProvider ausente** | ~24 | Tests renderizan páginas que llaman `useAuth` sin wrapper | P2 | 4–6 h |
| **B — next/font sin mock** | ~5 | `GlobalForgeAppShell` importa `Inter()` de `next/font/google`; Jest no lo mockea | P2 | 1–2 h |
| **C — QueryClient ausente** | ~4 | Componentes React Query sin `QueryClientProvider` en test | P2 | 2 h |
| **D — crypto.subtle en jsdom** | 1 (`WizardContainer`) | `sha256Hex` usa `crypto.subtle.digest` no disponible en jsdom | P2 | 1 h |
| **E — Mocks/router frágiles** | ~3 | `router.replace is not a function`, assertion URL en `client.test.ts` | P2–P3 | 2 h |
| **F — Text matchers desactualizados** | ~3 | Legal / a11y — copy o estructura DOM cambió | P3 | 2 h |

**Dependencias:** Arreglar **Cluster B** (`jest.mock('next/font/google')`) puede desbloquear **5 suites** de una vez. **Cluster A** requiere helper `renderWithProviders` compartido — arreglarlo impacta **~24 suites**.

---

## Análisis por test (los 5 solicitados + sustitutos representativos)

### ai-agents-panel.test.tsx

| Campo | Valor |
|-------|-------|
| **Path** | — **archivo no existe** |
| **Última modificación** | N/A |
| **Traceback** | N/A |
| **Causa raíz** | Test ausente del codebase actual; posible confusión con otro proyecto o nombre antiguo |
| **Prioridad** | N/A |
| **Fix estimado** | 0 h (nada que arreglar aquí) |

### useSharedMe.test.tsx

| Campo | Valor |
|-------|-------|
| **Path** | — **archivo no existe** |
| **Causa raíz** | Idem |
| **Prioridad** | N/A |

### ConfigDrawer.test.tsx

| Campo | Valor |
|-------|-------|
| **Path** | — **archivo no existe** |
| **Causa raíz** | Idem |
| **Prioridad** | N/A |

### InitiativeKillProtocol.test.tsx

| Campo | Valor |
|-------|-------|
| **Path** | — **archivo no existe** |
| **Causa raíz** | Idem |
| **Prioridad** | N/A |

### useAgentDetection.test.tsx

| Campo | Valor |
|-------|-------|
| **Path** | — **archivo no existe** |
| **Causa raíz** | Idem |
| **Prioridad** | N/A |

---

### Sustituto representativo A — `credit-hub-home.test.tsx` (Cluster AuthProvider)

| Campo | Valor |
|-------|-------|
| **Path test** | `tests/credit-hub/foundation/pages/credit-hub-home.test.tsx` |
| **Código bajo test** | `app/(forge)/credit-hub/page.tsx` |
| **Última modificación prod** | Reciente: admin tile removido en Cockpit R5 (`87700b5`); test aún espera 4 portals |
| **Traceback (relevante)** | |
```
useAuth must be used within AuthProvider
  at useAuth (hooks/useAuth.ts:9:11)
  at useTenantConfig (lib/credit-hub/hooks/useTenantConfig.ts:124:29)
  at CreditHubHome (app/(forge)/credit-hub/page.tsx:12:28)
```
| **Causa raíz** | Mock/setup desactualizado — test no envuelve con `AuthProvider` tras refactor auth v2 |
| **Prioridad** | **P2** (no bloquea Vercel; bloquea confianza en CI) |
| **Fix estimado** | 0.5 h (este archivo) / 4–6 h (cluster completo con helper) |

### Sustituto representativo B — `BankDecisionPanel.test.tsx` (Cluster next/font)

| Campo | Valor |
|-------|-------|
| **Path test** | `tests/credit-hub/bank/components/BankDecisionPanel.test.tsx` |
| **Código bajo test** | `components/credit-hub/bank/BankDecisionPanel.tsx` → import chain → `GlobalForgeAppShell.tsx` |
| **Última modificación** | `7d50bbf` feat(forge): wire Sonner toasts |
| **Traceback (relevante)** | |
```
TypeError: (0 , google_1.Inter) is not a function
  at GlobalForgeAppShell.tsx:11:23
  at BankDecisionPanel.tsx:4:1
  at BankDecisionPanel.test.tsx:2:1
```
| **Causa raíz** | `jest.setup.tsx` no mockea `next/font/google`; suite falla antes de ejecutar tests |
| **Prioridad** | **P2** |
| **Fix estimado** | 1–2 h (mock global desbloquea 5 suites) |

### Sustituto representativo C — `WizardContainer.test.tsx` (Cluster crypto)

| Campo | Valor |
|-------|-------|
| **Path test** | `tests/credit-hub/content/wizard/WizardContainer.test.tsx` |
| **Código bajo test** | `lib/credit-hub/dealer/vehicle-declaration.ts` → `crypto.subtle.digest` |
| **Última modificación** | `1a36a70` fix(credit): wizard minimum docs |
| **Traceback (relevante)** | |
```
TypeError: Cannot read properties of undefined (reading 'digest')
  at sha256Hex (lib/credit-hub/dealer/vehicle-declaration.ts:101:35)
  at VehicleDeclarationSection.tsx:64:55
```
| **Causa raíz** | Setup jsdom — falta polyfill `crypto.subtle` en entorno Jest |
| **Prioridad** | **P2** |
| **Fix estimado** | 1 h |

---

## Regresión reciente?

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cambios cockpit/Finance Core rompieron los 5 tests nombrados? | **NO** — archivos inexistentes |
| ¿Cockpit tests afectados? | **NO** — `tests/cockpit` 6/6 PASS |
| ¿Commits cockpit tocan archivos de tests failing? | **Parcial indirecto** — `credit-hub/page.tsx` cambió (admin tile out); `credit-hub-home.test.tsx` puede necesitar actualización de assertions (3 portals vs 4), pero fallo primario es AuthProvider |
| ¿Finance Preview Vercel failed es regresión de main? | **NO** — es branch `finance-ui/f1` con imports a componentes de PRs posteriores en el stack; se resuelve al mergear F3/F5 o ajustar placeholders en F1 |

```text
git log --since="14 days ago" — commits cockpit: #290–#304, Finance F1–F5 (local branches)
Ninguno modifica: ai-agents-panel, useSharedMe, ConfigDrawer, InitiativeKillProtocol, useAgentDetection
```

---

## Recomendación

| Item | Detalle |
|------|---------|
| **Bloqueo real del deploy Production hoy** | **NO** — `main` @ `e260bea` está **Ready** |
| **Bloqueo deploy Preview Finance** | **SÍ** en ramas F1 aisladas — `Module not found` por stack incompleto; **no afecta main** |
| **Fix inmediato para producción** | Ninguno requerido para Vercel Production |
| **Deuda técnica no urgente** | 38 Jest suites failing — clusters A+B+C son el ROI más alto |
| **Total estimado horas** | **12–16 h** para suite verde completo; **2–3 h** para quick wins (mock next/font + AuthProvider helper) |

### Priorización sugerida

1. **`jest.mock('next/font/google')` en `jest.setup.tsx`** — porque desbloquea 5 suites con 1–2 h y es prerequisito de otros tests bank.
2. **Helper `renderWithAuthAndQuery()` compartido** — porque ~28 suites comparten el mismo error de providers.
3. **Polyfill `crypto.subtle` en jest.setup** — porque desbloquea wizard vehicle declaration tests.
4. **Actualizar `credit-hub-home.test.tsx`** — porque el portal Admin fue removido; assertions desactualizadas (P3/P2).
5. **Legal/a11y text matchers** — cosmético, P3.
6. **PR separado** — no mezclar con Finance Core backend/frontend merge.

### Secuencia acordada con el equipo

1. Completar merges backend Finance F2–F5 (#566 pendiente).
2. Arrancar frontend Finance desde `main` limpio post-backend.
3. Este audit → PR de fixes Jest/Vercel como ciclo aparte (no bloqueante).

---

## Archivos generados durante auditoría (read-only)

- `jest-results.json` — artefacto local de `npx jest --json`; puede borrarse; **no commitear**.

---

*Fin del audit. Sin fixes aplicados. Sin commits. Sin PRs.*

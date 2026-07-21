# 01 · RENDER TRUTH — ¿Qué componente se renderiza DE VERDAD?

> Auditoría SOLO LECTURA. Repo `nadakki-dashboard`, rama `main`, **HEAD = `22bf7c1`** (mismo commit que el usuario reporta desplegado en producción). Verificado con `git merge-base --is-ancestor 22bf7c1 HEAD` → 0 (es el HEAD exacto).

---

## 1. El texto literal de pantalla → archivo real

Búsqueda exacta (`grep`) de los textos que se ven en `/credit-hub/dealer`:

| Texto en pantalla | Archivo que lo contiene | Línea |
|---|---|---|
| `"Solicitudes activas"` | `components/credit-hub/dealer/DealerDashboardView.tsx` | 89, 102 |
| `"enviadas + en proceso"` (trendLabel) | `components/credit-hub/dealer/DealerDashboardView.tsx` | 89 |
| `${activeApps.length} en curso` | `components/credit-hub/dealer/DealerDashboardView.tsx` | 103 |
| `"Buenas tardes"` (saludo) | `lib/credit-hub/dealer/dealerFormat.ts` → `dealerGreeting()` | 64 |

**Conclusión literal:** el componente que produce la pantalla del dealer es
**`components/credit-hub/dealer/DealerDashboardView.tsx`**. El saludo lo aporta
`dealerGreeting(locale)` de `lib/credit-hub/dealer/dealerFormat.ts`.

> Hay OTROS archivos con "Buenas tardes" (`components/credit-hub/dealer/DashboardHero.tsx`,
> `utils/forge-dealer-dashboard-greeting.ts`, `components/credit/forge/DealerCommandHero.tsx`),
> pero **ninguno** contiene "Solicitudes activas" + "enviadas + en proceso". Esos son señuelos
> (ver §3 Duplicados).

---

## 2. Cadena de la ruta `/credit-hub/dealer`

```3:8:app/(forge)/credit-hub/dealer/page.tsx
import { useAuth } from "@/contexts/AuthContext";
import { DealerDashboardView } from "@/components/credit-hub/dealer/DealerDashboardView";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { useCreditStats } from "@/lib/credit-hub/hooks/useCreditStats";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { WelcomeGuide } from "@/components/credit-hub/onboarding/WelcomeGuide";
```

La page renderiza `<DealerDashboardView .../>` alimentado por `useCreditApplications()` + `useCreditStats()`.

**¿Es el mismo archivo donde se agregaron PipelineFunnel/DealerGoals?** → **SÍ.**
`DealerDashboardView.tsx` importa y renderiza los paneles nuevos, **sin condicionales** que los oculten:

```14:16:components/credit-hub/dealer/DealerDashboardView.tsx
import { PipelineFunnel } from "@/components/credit-hub/dealer/sections/PipelineFunnel";
import { DealerGoals } from "@/components/credit-hub/dealer/sections/DealerGoals";
import { BankRanking } from "@/components/credit-hub/dealer/sections/BankRanking";
```

```136:140:components/credit-hub/dealer/DealerDashboardView.tsx
      <PipelineFunnel stats={stats} />

      <BankRanking />

      <DealerGoals stats={stats} applications={applications} currency={currency} />
```

> Matiz: `PipelineFunnel` hace `if (!stats) return null` (L14). Pero `stats` SÍ llega
> (el KPI muestra "763", que sale de stats), así que en el bundle correcto **se vería**.
> `BankRanking` no depende de datos (es DEMO estático, ver §5). Su ausencia total en pantalla
> es la prueba de que **no se está sirviendo este bundle**.

---

## 3. Mapa real componente-por-pantalla

Todas las URLs cuelgan de `app/(forge)/credit-hub/` (el grupo `(forge)` no aparece en la URL).

### Dealer

| Pantalla | URL | `page.tsx` | Componente real renderizado |
|---|---|---|---|
| Inicio | `/credit-hub/dealer` | `dealer/page.tsx` | `DealerDashboardView` |
| Solicitudes | `/credit-hub/dealer/applications` | `dealer/applications/page.tsx` | `DealerApplicationsListView` |
| Nueva (applicant) | `/credit-hub/dealer/applications/new/applicant` | `.../new/applicant/page.tsx` | `StepApplicant` → `DealerWizardApplicantEmploymentStep` (`components/forge/credit-hub/dealer/*`) |
| Detalle | `/credit-hub/dealer/applications/[applicationId]` | `.../[applicationId]/page.tsx` | `DealerApplicationDetailView` |
| Preaprobación | `/credit-hub/dealer/preapproval` | `dealer/preapproval/page.tsx` | `PreApprovalView` → `PreApprovalSimulator` |
| Notificaciones | `/credit-hub/dealer/notifications` | `dealer/notifications/page.tsx` | `DealerNotificationsView` |
| Perfil | `/credit-hub/dealer/profile` | `dealer/profile/page.tsx` | `DealerProfileView` |

### Banco

| Pantalla | URL | `page.tsx` | Componente real renderizado |
|---|---|---|---|
| Panel | `/credit-hub/bank` | `bank/page.tsx` | `BankDashboardView` |
| Bandeja | `/credit-hub/bank/applications` | `bank/applications/page.tsx` | `BankApplicationsTable` → `QueueTable` |
| Detalle | `/credit-hub/bank/applications/[applicationId]` | `.../[applicationId]/page.tsx` | `BankDetailLayout` |
| Analítica | `/credit-hub/bank/analytics` | `bank/analytics/page.tsx` | `BankAnalyticsView` |
| Auditoría | `/credit-hub/bank/audit` | `bank/audit/page.tsx` | `BankAuditView` |
| Cumplimiento | `/credit-hub/bank/compliance` | `bank/compliance/page.tsx` | `BankComplianceView` |

---

## 4. DUPLICADOS / FANTASMAS encontrados

Existen **tres** árboles de componentes paralelos. Solo `components/credit-hub/*` está conectado a las rutas de producción.

### Árbol moderno `components/credit-hub/` (el conectado)
| Archivo | Rol | ¿Conectado a ruta? |
|---|---|---|
| `dealer/DealerDashboardView.tsx` | Dashboard dealer | **SÍ** (`/credit-hub/dealer`) |
| `dealer/DashboardHero.tsx` | Hero dealer | **HUÉRFANO** (solo lo importa un test) |
| `bank/BankDashboardView.tsx` | Dashboard banco | **SÍ** (`/credit-hub/bank`) |
| `bank/BankDashboardHero.tsx` | Hero banco | **HUÉRFANO** |
| `bank/BankDetailLayout.tsx` | Detalle banco | **SÍ** |
| `bank/BankDetailView.tsx` | Detalle alterno | **HUÉRFANO** |

### Árbol legacy `components/credit/` (todo huérfano del Credit Hub)
| Archivo | Rol | ¿Conectado? |
|---|---|---|
| `credit/forge/DealerCommandHero.tsx` | Hero dealer | **HUÉRFANO** (solo `credit/forge/index.ts`) |
| `credit/forge/BankUnderwritingHero.tsx` | Hero banco | **HUÉRFANO** |
| `credit/forge/CreditHeroShell.tsx` | Shell hero | **HUÉRFANO** |
| `credit/OfferComparisonTable.tsx` | Comparador de ofertas | **HUÉRFANO** (no lo importa ninguna page) |
| `credit/commercial/BestOfferHero.tsx` | Hero mejor oferta | **HUÉRFANO** |
| `credit/dealer/analytics/DealerDashboard.tsx` | Dashboard analítico legacy | Vive en `/credit/dealer/analytics` (otra URL, NO Credit Hub) |

### Árbol `components/forge/credit-hub/`
| Archivo | Rol | ¿Conectado? |
|---|---|---|
| `dealer/DealerWizardApplicantEmploymentStep.tsx` (+ steps) | Pasos del wizard | **SÍ** (re-export desde `components/credit-hub/dealer/wizard/Step*.tsx`) |
| `BankApplicationDetailView.tsx` | Detalle banco legacy | **HUÉRFANO** (reemplazado por `BankDetailLayout`) |
| `DealerApplicationStatusView.tsx` | Vista estado | **HUÉRFANO** |

**Comparador de ofertas (#201):** el comparador que SÍ se ve en el detalle del dealer es **JSX inline dentro de `DealerApplicationDetailView.tsx`** (sección `data-testid="offers-section"`, ~L232), alimentado por `useApplicationOffers`. **`OfferComparisonTable.tsx` (legacy) NO se renderiza en ninguna ruta.**

---

## 5. Routing: ¿hay colisión?

**NO hay colisión** para `/credit-hub/dealer` ni `/credit-hub/bank`:
- Solo existe **un** `page.tsx` por cada URL del Credit Hub, todos bajo `app/(forge)/credit-hub/`.
- No hay un segundo árbol `app/credit-hub/...` fuera de `(forge)`.

Rutas legacy `/credit/*` son **URLs distintas** (no colisionan):
- `next.config.js` redirige `/credit/dealer → /credit-hub/dealer`, `/credit/bank → /credit-hub/bank` (L162-190).
- `/credit/dealer/analytics`, `/credit/dealer/real`, `/credit`, `/credit/new`, `/credit/dashboard`, `/credit/[id]` **NO** se redirigen (son pantallas legacy separadas).

> A diferencia de `/legal/audiencias` (que SÍ colisionaba con el runner dinámico `[core]/[agentId]`),
> aquí **no hay catch-all** que intercepte `/credit-hub/dealer`.

---

## 6. VEREDICTO PARTE 1

### ✅ Editamos el componente CORRECTO, no un fantasma.

- La ruta `/credit-hub/dealer` → `app/(forge)/credit-hub/dealer/page.tsx` → **`DealerDashboardView.tsx`**.
- Ese MISMO archivo importa y renderiza `PipelineFunnel`, `BankRanking` y `DealerGoals` **sin condicionales que los oculten** (L136-140), en el commit `22bf7c1`.
- Por lo tanto los PRs (#197 A1, #198 pipeline/goals, #201 comparador) tocaron el archivo que está conectado a la ruta.

### Entonces, ¿por qué "no se ve nada"? → Es un problema de ENTREGA, no de componente fantasma.

Si el bundle servido fuera realmente `22bf7c1`, los paneles aparecerían (no tienen guardas que los escondan). Que **NINGÚN** panel aparezca y que se vean **UUIDs en vez de nombres** (cuando el código actual ya muestra `applicant_name || "—"`, nunca un UUID) indica que **el navegador está ejecutando un bundle ANTERIOR** a estos merges.

Causa raíz más probable (ver detalle en `00_RESUMEN.md`):
1. **Service Worker PWA** con `skipWaiting:false` + `clientsClaim:false` (`next.config.js` L5-6) → un deploy nuevo **no se activa** hasta cerrar TODAS las pestañas; el SW viejo sigue sirviendo `/_next/static/*` cacheado (`CacheFirst`, maxAge 1 año, L41-48). Artefactos PWA versionados (`public/sw.js`, `public/workbox-*.js`, `public/fallback-*.js`) pueden fijar un precache viejo.
2. **Verificar también** que el alias de producción de Vercel apunte al deployment de `22bf7c1` (no a uno anterior).

> Nota importante (incógnito): una ventana de incógnito **nueva** no debería tener SW previo;
> si aun así muestra lo viejo, los sospechosos son (a) `public/sw.js` versionado con manifest viejo,
> o (b) deployment/alias de Vercel desactualizado. **[NEEDS-HUMAN]**: confirmar en DevTools →
> Application → Service Workers (¿hay SW "waiting"?) y comparar el hash de los chunks `/_next/static`
> servidos contra los del build `22bf7c1`.

### Hallazgo independiente (no es caché): el KPI "763 vs 45" es un bug de lógica REAL
Incluso con el bundle correcto, el número "763" sale de `normalizeStats` que mete `states.COMPLETED`
en el bucket "submitted" (ver `02_BACKEND_TRUTH.md` §stats). Es decir, ese desajuste persiste aunque
se limpie la caché. Es un bug aparte, a corregir en el rediseño.

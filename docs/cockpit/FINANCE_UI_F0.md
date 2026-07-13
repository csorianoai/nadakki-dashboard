# F0 — Finance Core MVP Frontend Recon

**Date:** 2026-07-12  
**Base:** `main` @ `e260bea` (cockpit allowlist `/api/v1/cockpit` active)

---

## 1. Componentes reutilizables del cockpit

| Componente | Ruta | Uso en Finanzas |
|------------|------|-----------------|
| `CockpitSidebar` | `components/cockpit/CockpitSidebar.tsx` | +entrada "Finanzas" (F1) |
| `CockpitTopbar` | `components/cockpit/CockpitTopbar.tsx` | Sin cambios |
| `CockpitShellLayout` | `components/cockpit/CockpitShellLayout.tsx` | Sin cambios |
| `CockpitNavLink` | mismo archivo | Extender con ícono opcional |
| `NetworkHealthCard` | `components/cockpit/network/NetworkHealthCard.tsx` | KPI row Ingresos |
| `Sparkline7d` | `components/cockpit/network/Sparkline7d.tsx` | Disponible; no MVP |
| `CoreCard` | `components/cockpit/network/CoreCard.tsx` | Patrón visual por core |
| `DataTruthBadge` | `components/credit-hub/honesty/DataTruthBadge.tsx` | DEMO amarillo |
| `CockpitErrorBoundary` | `lib/cockpit/components/ErrorBoundary.tsx` | Por tab/panel |
| `platformFetch` | `lib/platformApi.ts` | Allowlist `/api/v1/cockpit` |
| `fetchOrDemo` | patrón en `lib/cockpit/api/observability.ts` | Replicar en finance APIs |
| `core-registry` | `lib/cockpit/core-registry.ts` | 6 cores + colores dinámicos |
| `normalizeStatus` | `lib/cockpit/normalize.ts` | Status suscripción |
| `useCockpit` | `lib/cockpit/context.tsx` | Rol + locale + currency |

**Regresión shell:** `/cockpit`, `/cockpit/credit`, tenants/users/plans intactos en `main`. Sin cambios en `app/layout.tsx` raíz.

---

## 2. Tema y tipografía

- Tailwind `cockpit.*`: `bg`, `surface`, `border`, `text`, `muted`, `accent`, `ok`, `warn`, `err` en `tailwind.config.js`
- Fuentes: `Inter` + `JetBrains Mono` via `app/(cockpit)/layout.tsx` → `--font-inter`, `--font-jetbrains-mono`
- Utilities: `font-cockpitSans`, `font-cockpitMono`, `.tabular-nums`

---

## 3. Formato moneda / locale

- **No existe** `lib/cockpit/format.ts` hoy — crear en F2
- Patrón existente: `Intl.NumberFormat(locale, { style: 'currency', currency: 'DOP' })` en `CreditKpisPanel.tsx`
- Default: `es-DO` / `DOP` desde `useCockpit()`

---

## 4. Recharts

- Versión: `recharts@^3.6.0` (`package.json`)
- Tema oscuro ya usado en `components/cockpit/credit/CreditView.tsx`:
  - Grid `#1e1e2e`, axis `#8b8b99`, tooltip `{ background: '#111118', border: '1px solid #1e1e2e', color: '#e5e5ef' }`

---

## 5. Estado endpoints backend (probe 2026-07-12)

Base: `NEXT_PUBLIC_API_BASE_URL` (Render). Sin JWT en probe → todos **404** (esperado hasta deploy Finance Core).

| Endpoint | HTTP |
|----------|------|
| `GET /api/v1/cockpit/finance/kpis` | 404 |
| `GET /api/v1/cockpit/finance/mrr/by-core` | 404 |
| `GET /api/v1/cockpit/finance/tenants/{id}/financials` | 404 |
| `GET /api/v1/cockpit/population/summary` | 404 |
| `GET /api/v1/cockpit/population/by-core/{core}` | 404 |
| `GET /api/v1/cockpit/population/by-family?family=` | 404 |
| `GET /api/v1/cockpit/population/by-entity-type` | 404 |
| `GET /api/v1/cockpit/population/by-country` | 404 |
| `GET /api/v1/cockpit/population/digital-agents` | 404 |
| `GET /api/v1/cockpit/population/top-tenants?limit=10` | 404 |
| `GET /api/v1/cockpit/population/top-users?limit=10` | 404 |
| `GET /api/v1/cockpit/registry/professions?core=` | 404 |
| `GET /api/v1/cockpit/registry/entity-types?core=` | 404 |

**Frontend strategy:** `fetchOrDemo` → fixture con `data_source: "demo"` → `DataTruthBadge level="DEMO"`.

---

## 6. Decisiones MVP

- Cores en demo MRR: dinámicos desde `PLATFORM_CORE_ORDER` (6) + respuesta API cuando exista — no hardcodear 12 ni tenants protegidos
- Fixtures DEMO: nombres genéricos (`Institución 01`, `Usuario 01`) — nunca Credicefi / Banco Piloto / Demo
- Registry tab: oculto para `tenant_admin`; guard 403 en ruta registry (F5)

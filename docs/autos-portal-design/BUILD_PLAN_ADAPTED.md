# Autos Portal — Plan de construcción adaptado al repo

**Status:** READY_FOR_CURSOR_BUILD (adaptado)  
**Repo:** `csorianoai/nadakki-dashboard`  
**Fecha:** 2026-07-20  
**Input:** Plan “AUTOS PORTAL FRONTEND COMPLETO” (11 fases)  
**Veredicto:** **Extender estructura existente — NO crear `src/autos/`**

---

## 1. Decisión de arquitectura (inviolable)

| Plan original | Realidad en repo | Decisión |
|---------------|------------------|----------|
| `src/autos/pages/*.tsx` | Next.js App Router en `app/autos/` | **Usar `app/autos/`** |
| `src/autos/components/` | `components/{search,vehicle,vdp,marketing,dealer,...}/` | **Extender carpetas existentes** |
| `src/autos/services/autosApi.ts` | `lib/autos-portal/api.ts` + `lib/api/*.ts` | **Unificar en capa existente** |
| Zustand stores | Context + React Query + localStorage | **React Query + Context** (patrón actual) |
| `middleware/auth.ts` nuevo | BFF `app/api/v1/[[...path]]/route.ts` + `TenantProvider` | **Reutilizar; no duplicar middleware** |
| 50+ componentes nuevos vacíos | ~80 componentes P0 ya implementados | **Solo scaffold de gaps** |

**Scope `[data-portal="autos"]`:** ya existe en `components/system/autos-portal-scope.ts`.

---

## 2. Inventario: construido vs faltante

### ✅ Ya operativo (P0 + extras)

| Superficie | Ruta | Componentes / lib |
|------------|------|-------------------|
| Landing | `/autos` | `components/marketing/*`, Hero, DualSearch |
| Browse / AI search | `/autos/vehiculos` | `FilterPanel`, ResultsGrid/List/Map, facets |
| VDP | `/autos/vehiculo/[id]` | `components/vdp/*`, PaymentCalculator, chat |
| Concierge | overlay global | `ConciergeSheet`, voice overlay |
| Personal shopper | `/autos/mi-shopper` | `ShopperProvider` |
| Dealer AI | `/autos/dealer/*` | publish, leads, insights |
| Forge track | `/autos/marketplace`, inventory, finance | `lib/autos-portal/hooks.ts` |
| API BFF | `/api/v1/*` | proxy catch-all → Render backend |
| Multi-tenant | global | `TenantProvider`, `X-Tenant-ID` en `autosFetch` |
| Financiamiento (calc) | VDP + API | `POST /autos/finance/calculate`, inverse, amortization |

### ❌ Faltante vs plan original

| Área del plan | Estado | Blocker |
|---------------|--------|---------|
| Cart (`/autos/cart`) | No existe | **Backend: no hay `/autos/cart/*` en OpenAPI** |
| Checkout (`/autos/checkout`) | No existe | Mismo blocker; flujo real = lead + Credit Hub |
| Orders (`/autos/orders`) | No existe | Backend expone **leads**, no orders e-commerce |
| User dashboard (`/autos/dashboard`) | No existe | Perfil/wishlist sin API dedicada |
| Admin platform (`/autos/admin/*`) | Tipos OpenAPI sí, UI no | `/autos/admin/tenants/.../verification`, moderation, flags |
| Compare (`/autos/compare`) | No existe | Solo client-side viable |
| Financing E2E → Credit Hub | Parcial | `createApplication()` stub; CTAs no cableados |
| Commission tracker | No existe | Sin endpoint en quick reference |

### ⚠️ Colisión de rutas

Dos tracks comparten prefijo `/autos`:

- **Consumer:** `app/autos/` (design-spec, marketing tokens)
- **Forge:** `app/(forge)/autos/` → URLs `/autos/marketplace`, `/autos/inventory`

**Acción recomendada:** deprecar Forge marketplace o mover Forge a `/forge/autos/*` en PR dedicado.

---

## 3. Endpoints reales (OpenAPI vivo) vs plan ficticio

### Consumir hoy (verificados en `types/autos-portal-api.d.ts`)

```
POST /api/v1/autos/vehicles/search
GET  /api/v1/autos/vehicles/{vehicle_id}
GET  /api/v1/autos/vehicles/search/facets
GET  /api/v1/autos/vin/{vin}/decode
POST /api/v1/autos/finance/calculate|inverse|amortization
POST /api/v1/autos/finance/applications
POST /api/v1/autos/tenants/{tenant_id}/dealers/{dealer_id}/leads
PATCH /api/v1/autos/tenants/{tenant_id}/leads/{lead_id}/status
GET  /api/v1/autos/billing/plans
GET  /api/v1/autos/resolve/{hostname}
POST /api/v1/autos_ai/conversational_search|concierge/message|match_my_approval|...
```

### Admin (tipos existen, UI pendiente)

```
GET/PATCH /api/v1/autos/admin/tenants/{tenant_id}/dealers/{dealer_id}/verification
PATCH     /api/v1/autos/admin/tenants/{tenant_id}/vehicles/{vehicle_id}/moderation
GET/POST  /api/v1/autos/admin/tenants/{tenant_id}/flags
POST      /api/v1/autos/admin/impersonate
```

### ❌ NO existen en OpenAPI (no implementar UI que simule éxito)

```
GET/POST  /api/v1/autos/cart/*
POST      /api/v1/autos/orders
GET       /api/v1/autos/users/wishlist
GET       /api/v1/autos/admin/analytics
GET       /api/v1/autos/admin/commissions
```

**Regla probe-first:** igual que Legal — verificar en producción antes de UI sobre endpoint nuevo.

---

## 4. Mapa de directorios adaptado (target)

```
app/autos/
├── layout.tsx                    ✅ existe
├── page.tsx                      ✅ landing
├── vehiculos/                    ✅ browse
├── vehiculo/[id]/                ✅ VDP
├── mi-shopper/                   ✅
├── dealer/                       ✅ dealer AI
├── comparar/page.tsx             🆕 compare (client state, query ?ids=)
├── financiamiento/page.tsx       🆕 financing hub → Credit Hub bridge
├── mis-leads/page.tsx            🆕 lead history (uses leads API, not "orders")
├── admin/                        🆕 platform admin
│   ├── page.tsx
│   ├── verificacion/page.tsx
│   ├── moderacion/page.tsx
│   └── flags/page.tsx
└── not-found.tsx                 🆕 optional

components/
├── cart/                         🆕 client-only until backend cart exists
│   ├── CartProvider.tsx
│   ├── CartDrawer.tsx
│   └── CartSummary.tsx
├── checkout/                     🆕 lead + financing flow (honest, not fake checkout)
│   ├── LeadCaptureForm.tsx
│   └── FinancingBridge.tsx
├── admin/autos/                  🆕 admin panels
└── [search|vehicle|vdp|...]      ✅ extend, don't duplicate

lib/
├── autos-portal/api.ts           ✅ extend with admin + leads
├── autos-portal/hooks.ts         ✅ extend React Query keys
├── cart/storage.ts               🆕 localStorage cart (MVP)
└── api/finance.ts                ✅ wire createApplication → Credit Hub URL
```

---

## 5. Fases de build (orden recomendado, 3–4 días)

### Día 1 — Consolidación + financing bridge

| Task | LOC est. | Entregable |
|------|----------|------------|
| Unificar browse: consumer usa `useVehicleSearch` donde aplique | ~150 | Menos dual API |
| Cablear VDP “Aplicar financiamiento” → `createApplication` + redirect Credit Hub | ~80 | Financing E2E honesto |
| `app/autos/financiamiento/page.tsx` — calculator + offers preview | ~200 | Superficie del plan |
| Documentar rutas Forge vs consumer | ~50 doc | ADR corto |

### Día 2 — Cart MVP (client) + compare

| Task | LOC est. | Entregable |
|------|----------|------------|
| `CartProvider` + localStorage + badge en TopNav | ~120 | “Carrito” sin backend fake |
| `app/autos/comparar` — max 3 vehículos, query `?ids=` | ~180 | Compare del plan |
| Wishlist = extender `SaveButton` + storage | ~60 | Dashboard parcial |

### Día 3 — Leads + dashboard usuario

| Task | LOC est. | Entregable |
|------|----------|------------|
| `app/autos/mis-leads` — lista leads del tenant/dealer | ~150 | Sustituto honesto de “orders” |
| `app/autos/mi-cuenta` — perfil local + leads + wishlist | ~120 | Dashboard light |
| Lead capture en checkout flow (POST leads API) | ~100 | Checkout real = lead, no payment |

### Día 4 — Admin platform + gate

| Task | LOC est. | Entregable |
|------|----------|------------|
| `app/autos/admin/*` — verification, moderation, flags | ~350 | Admin del plan (API real) |
| Probe-first ledger autos (si endpoints fallan) | doc | BACKEND_DEFECTS si aplica |
| E2E extend `e2e/autos-portal/` | ~100 | Gate verde |
| `npm run build` + grep tenants | — | Merge-ready |

**Total estimado:** ~1.500 LOC (no 50 archivos vacíos).

---

## 6. State management (sin Zustand)

```tsx
// Patrón adoptado — React Query + Context
import { useVehicleSearch } from "@/lib/autos-portal/hooks";
import { useTenant } from "@/components/system/TenantProvider";

// Cart MVP — Context + localStorage
import { useCart } from "@/components/cart/CartProvider";
```

No introducir Zustand salvo ADR — el repo ya usa React Query en Forge track.

---

## 7. Multi-tenant (ya resuelto)

```tsx
// lib/autos-consumer-api.ts — patrón existente
headers: {
  "X-Tenant-ID": tenantId,
  Authorization: `Bearer ${token}`,
}
```

No crear `context/TenantContext.tsx` duplicado — usar `components/system/TenantProvider.tsx`.

---

## 8. Integración Credit Hub (canónica)

```
VDP PaymentCalculator
  → POST /api/v1/autos/finance/applications
  → redirect /credit-hub/dealer/applications/new?preset=...
  → Credit Hub wizard (existente)
```

No duplicar `LoanApplication.tsx` — embed/link al wizard Credit Hub.

---

## 9. Checklist gate (adaptado)

- [ ] **NO** crear `src/autos/`
- [ ] Browse + VDP + search siguen verdes
- [ ] Financing CTA cableado (no botón muerto)
- [ ] Cart/compare client-side con badge honesto (“local, sin checkout de pago”)
- [ ] Leads UI consume API real (no “orders” ficticio)
- [ ] Admin UI consume `/autos/admin/*` con probe-first
- [ ] `data-portal="autos"` en layout
- [ ] 0 tenants hardcodeados en JSX autos
- [ ] `npm run build` verde
- [ ] E2E autos-portal extendido

**Veredicto target:** `AUTOS_PORTAL_FRONTEND_OPERATIONAL` (no “100% e-commerce” hasta backend cart/orders).

---

## 10. PRs sugeridos (stacked, ≤500 LOC)

| PR | Scope |
|----|-------|
| AP-1 | Financing bridge + `/autos/financiamiento` |
| AP-2 | CartProvider + compare + TopNav badge |
| AP-3 | mis-leads + mi-cuenta + lead checkout |
| AP-4 | admin verification/moderation/flags |
| AP-5 | Forge route cleanup + docs + E2E |

---

## 11. Referencias autoritativas

- `docs/autos-portal-design/README.md` — P0 runbook (fuente de verdad UI)
- `docs/autos-portal-design/BACKEND_ENDPOINTS_QUICK_REFERENCE.md`
- `types/autos-portal-api.d.ts` — contrato TypeScript OpenAPI
- `lib/autos-portal/api.ts` — cliente HTTP
- `app/autos/layout.tsx` — shell consumer

**Siguiente acción Cursor:** ejecutar **AP-1** (financing bridge) salvo dirección contraria de Ramón/César.

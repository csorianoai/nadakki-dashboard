# _HANDOFF_TO_CODE_P10-05.md
## Handoff de Cowork → Claude Code para implementación TSX de P10-05

**Fecha:** 2026-05-09
**Branch destino:** `feat/forge-cowork-2026-05-09-pivot`
**Aprobado por Cesar:** mapping (§4 ADAPTER_ANALYSIS), Opción 3 (P10-09 NEW separate), 3 ajustes textuales (icono lucide, react-query opts, 4 error classes)
**Workflow paso:** 4 (post-aprobación de mockup, refs, análisis)

---

## 1. CONTEXTO

P10-05 es la primera tarea operativa del backlog v2 post-pivot. Cierra el bug "**multi-tenant es teatro**" en el chrome del Forge Credit Hub: hoy `useTenantConfig()` siempre devuelve un objeto default Dominicano hardcodeado, sin importar qué tenant esté en sesión. Después de este PR, el chrome (sidebar header, topbar, currency formatters, status pill labels) consume datos REALES vía `GET /api/v2/tenants/{tenant_id}/branding`.

**Scope explícito de P10-05:** chrome multi-tenant real (logo, display_name, brand colors via CSS vars, locale, currency, application_status_labels). 15 consumers chrome+i18n se benefician inmediatamente vía proxy del hook viejo.

**Fuera de scope:** banking policy multi-tenant (LTV, DTI, allowed_terms, document_types, features_enabled). Esos 10-15 consumers wizard/simulator siguen consumiendo defaults DO post-merge — **NEW P10-09** los cierra después con un endpoint backend separado.

**Por qué esta tarea ahora:** sin esto, decir "Nadakki es multi-tenant" en demos a banco es ficción. Cesar bloqueó ventas verticales hasta cerrar este bug — es el bloqueador #1 del valor diferencial del producto.

---

## 2. SPEC COMPLETO (3 APROBACIONES + PLAN TSX FINAL)

### 2.1 Aprobación 1 — Mapping campo por campo del adapter

**Mapping core:**
- `brand_primary` → `primary_color`
- `brand_dark` → `secondary_color`
- `accent_color = brand_primary` (TestBank pattern; ningún consumer Forge lo lee — verificado vía grep)

**Tabla completa de mapping** (pegada del análisis §4):

| TenantBankingConfig field | Source | Tipo |
|---|---|---|
| `tenant_id` | `branding.tenant_id` | Direct |
| `institution_name` | `branding.display_name` | Rename |
| `institution_type` | default `"FINANCIAL_INSTITUTION"` | Default fallback |
| `country_code` | parse de `branding.locale.split('-')[1]`; default `"DO"` | Transform from locale |
| `currency_code` | `branding.currency` | Rename |
| `currency_symbol` | tabla local `{ DOP: 'RD$', USD: '$', MXN: 'MX$', BOB: 'Bs', COP: 'COL$', PEN: 'S/' }`; default `"RD$"` | Transform from currency_code |
| `locale` | `branding.locale` | Direct |
| `regulatory_profile` | `branding.regulatory_profile` | Direct |
| `branding.logo_url` | `branding.logo_url` | Direct |
| `branding.primary_color` | `branding.brand_primary` | Rename (semántica institucional confirmada) |
| `branding.secondary_color` | `branding.brand_dark` | Rename |
| `branding.accent_color` | `branding.brand_primary` (= primary; TestBank pattern, no consumers leen) | Default = primary |
| `scoring_thresholds`, `vehicle_types`, `product_types`, `document_types`, `dti_max`, `ltv_max`, `min_age`, `max_age`, `min_employment_years`, `pii_masking_enabled`, `default_rate`, `min_rate`, `max_rate`, `allowed_terms`, `default_term`, `product_limits`, `dti_warning_ratio`, `min_roi_threshold`, `risk_multipliers`, `payment_capacity_ratio`, `garante_minimum_income_ratio`, `required_documents`, `features_enabled`, `consent_methods_enabled` | default desde `getDefaultTenantBankingConfig()` | Default fallback (P10-09 cerrará) |

**ADITIVO OBLIGATORIO** (instrucción explícita de Cesar) — comentario inline en el adapter:

```typescript
// HISTORICAL NOTE: TenantConfig.primary_color was originally
// placeholder "#ff6b35" never consumed in production.
// Confirmed via grep 2026-05-09: only 4 reads of branding.*
// in Forge codebase, all on branding.logo_url. CSS institutional
// colors apply via [data-tenant] in tokens.css, not JS.
// See _design/P10-05_ADAPTER_ANALYSIS.md §1 for evidence.
```

### 2.2 Aprobación 2 — Opción 3 (chrome only) + NEW P10-09

P10-05 cierra solo chrome. Banking policy queda default. **NEW P10-09** se agregará al `_TASK_BACKLOG_v2.md` después de aprobar TSX:

```
P10-09 — Multi-tenant Banking Policy fetch
Estimación: 4-6 hrs
Bloqueado por: P10-05 merged + Ramon implementa endpoint backend
DoD:
  - Backend: nuevo endpoint GET /api/v2/tenants/{id}/banking-policy
    sirve: ltv_max, dti_max, default_rate, allowed_terms,
    document_types, features_enabled, regulatory_profile, etc.
  - Frontend: nuevo hook useTenantBankingPolicy(tenantId)
  - Adapter: extender adaptBrandingToConfigShape para componer
    branding+policy
  - Migration: 10-15 consumers banking que actualmente usan
    defaults pasan a usar policy real
  - Test: parity test con fixtures Credicefi vs Banco Piloto vs
    TestBank Mexico
```

**NOTA CRÍTICA PARA NARRATIVA DE PRODUCTO:**
Después de P10-05 merged, messaging interno y a clientes debe decir:
- ✅ "Multi-tenant chrome (logo, colors, locale, currency, status labels) is fully tenant-driven from API"
- ⏳ "Multi-tenant banking policy (LTV max, DTI max, allowed terms, regulatory profile) shipping in P10-09 — currently uses DR defaults pending P10-09 completion"

**NO digas "multi-tenant complete" en demo a banco hasta que P10-09 también esté merged.**

### 2.3 Aprobación 3 — 3 ajustes textuales

#### Ajuste 1: Banner de error con icono lucide-react

`components/forge/ui/TenantBrandingErrorBanner.tsx`:

```tsx
import { AlertTriangle } from 'lucide-react';

<div role="alert" className="...">
  <AlertTriangle
    aria-hidden="true"
    className="h-5 w-5 text-forge-danger-500 flex-shrink-0"
  />
  <div>
    <p>Could not load institution branding. Using default theme.</p>
    <p className="text-xs text-forge-ink-500 mt-1">
      Reference: ERR-{referenceId}
    </p>
  </div>
  <button onClick={onRetry}>Retry</button>
</div>
```

**Razón:** regla del design system no negociable: "status SIEMPRE icono+texto, nunca solo color".

#### Ajuste 2: react-query opts EXPLÍCITAS en useTenantBranding

`lib/credit-hub/hooks/useTenantBranding.ts`:

```typescript
/**
 * Fetches tenant branding from API and caches via react-query.
 *
 * @param tenantId - Tenant identifier from session/JWT
 * @returns query result with TenantBranding data + loading/error states
 *
 * Configuration rationale:
 * - staleTime 5min: branding rarely changes mid-session
 * - gcTime 30min: keep in cache for tenant switches
 * - retry 2 with 1s delay: tolerate transient network blips
 * - refetchOnWindowFocus false: branding does not change while
 *   user is actively working
 * - refetchOnReconnect true: refresh after network recovery to
 *   ensure post-outage consistency
 */
export function useTenantBranding(tenantId: string | null) {
  return useQuery({
    queryKey: ['tenant-branding', tenantId],
    queryFn: () => fetchTenantBranding(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
```

#### Ajuste 3: 4 clases de error específicas

`lib/credit-hub/api/tenant-branding-client.ts`:

```typescript
export class TenantBrandingError extends Error {
  constructor(message: string, public referenceId: string) {
    super(message);
    this.name = 'TenantBrandingError';
  }
}

export class TenantBrandingNotFoundError extends TenantBrandingError {
  // 404 — tenant doesn't exist
  constructor(tenantId: string, referenceId: string) {
    super(`Tenant '${tenantId}' not found`, referenceId);
    this.name = 'TenantBrandingNotFoundError';
  }
}

export class TenantBrandingForbiddenError extends TenantBrandingError {
  // 403 — cross-tenant violation
  constructor(tenantId: string, referenceId: string) {
    super(`Access to tenant '${tenantId}' forbidden`, referenceId);
    this.name = 'TenantBrandingForbiddenError';
  }
}

export class TenantBrandingNetworkError extends TenantBrandingError {
  // 5xx + network errors
  constructor(originalError: Error, referenceId: string) {
    super(`Network error: ${originalError.message}`, referenceId);
    this.name = 'TenantBrandingNetworkError';
  }
}

export async function fetchTenantBranding(
  tenantId: string,
): Promise<TenantBranding> {
  const referenceId = `ERR-${Date.now()}-${
    Math.random().toString(36).slice(2, 6).toUpperCase()
  }`;

  try {
    const response = await fetch(
      `${API_BASE}/api/v2/tenants/${tenantId}/branding`,
      { headers: getAuthHeaders() },
    );

    if (response.status === 404) {
      throw new TenantBrandingNotFoundError(tenantId, referenceId);
    }
    if (response.status === 403) {
      throw new TenantBrandingForbiddenError(tenantId, referenceId);
    }
    if (!response.ok) {
      throw new TenantBrandingNetworkError(
        new Error(`HTTP ${response.status}`),
        referenceId,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TenantBrandingError) throw error;
    throw new TenantBrandingNetworkError(error as Error, referenceId);
  }
}
```

**Uso en `TenantBrandingErrorBanner`** (`instanceof` switch):

```tsx
let message: string;
if (error instanceof TenantBrandingNotFoundError) {
  message = "Institution configuration not found. Contact admin.";
} else if (error instanceof TenantBrandingForbiddenError) {
  message = "Access denied to this institution. Verify your session.";
} else if (error instanceof TenantBrandingNetworkError) {
  message = "Could not load institution branding. Using default theme.";
} else {
  message = "Unknown error loading institution branding.";
}
```

### 2.4 Plan TSX final — 13 archivos

**NEW (6):**

1. `lib/credit-hub/types/tenantBranding.ts` — interface `TenantBranding` espejando `_API_CONTRACT.md` §"Tenant Branding"
2. `lib/credit-hub/api/tenant-branding-client.ts` — fetch + 4 error classes (Ajuste 3)
3. `lib/credit-hub/hooks/useTenantBranding.ts` — hook react-query (Ajuste 2)
4. `lib/credit-hub/utils/adaptBrandingToConfigShape.ts` — adapter pure function con HISTORICAL NOTE comment
5. `lib/credit-hub/utils/warnOnceForCaller.ts` — utility dev-only `console.warn` única-vez-por-call-site (usa stack trace para detectar caller)
6. `components/forge/ui/TenantBrandingErrorBanner.tsx` — banner persistente con AlertTriangle icon (Ajuste 1)

**NEW TESTS (2):**

7. `lib/credit-hub/utils/__tests__/adaptBrandingToConfigShape.test.ts` — parity test (preserva defaults, override chrome correcto, currency_symbol fallback)
8. `lib/credit-hub/utils/__tests__/warnOnceForCaller.test.ts` — dev-only firing, prod silent, dedup por call-site

**MODIFY (5):**

9. `components/forge/layout/ForgeCreditHubAppShell.tsx` — wire `useTenantBranding`, aplicar CSS vars vía `style` prop (`--forge-brand-500`, `--forge-brand-900`), set `data-tenant` cuando success
10. `components/forge/layout/ForgeCreditHubSidebar.tsx` — agregar prop `showHeaderSkeleton: boolean`, render skeleton cuando true
11. `components/forge/layout/ForgeCreditHubTopbar.tsx` — agregar props `logoUrl?: string | null`, `tenantName?: string | null`, `showLogoSkeleton: boolean`
12. `lib/credit-hub/hooks/useTenantConfig.ts` — rewrite como proxy: usa `useTenantBranding` + `adaptBrandingToConfigShape` cuando data; cae a default cuando isPending/isError; preserva `getForgeTestTenantBankingConfig()` override path; agrega JSDoc `@deprecated` apuntando a `useTenantBranding`; emite `warnOnceForCaller('useTenantConfig')` en dev
13. `app/(forge)/credit-hub/_design/TENANT_THEMING.md` — remover nota "SQL marked illustrative pending real `tenant_branding` schema" porque ya implementamos el fetch real (chrome subset)

---

## 3. REFERENCIAS CRÍTICAS

Lee estos en orden antes de codear:

1. **`_DESIGN_SYSTEM_RULES.md`** (raíz repo) — reglas duras del Forge: tokens CSS only, no hex hardcodeado, no `any`, focus rings visibles, status SIEMPRE icono+texto, anti-patterns build-rejecting (#1-#16).
2. **`_API_CONTRACT.md`** (raíz repo) — sección "TENANT BRANDING ENDPOINT" con response shape exacto. **NO inventar campos. Usar exactamente este shape para `TenantBranding` interface.**
3. **`app/(forge)/credit-hub/_design/P10-05_ADAPTER_ANALYSIS.md`** — análisis completo del mapping con evidencia grep de los 30 consumers + por qué Opción 3.
4. **`app/(forge)/credit-hub/_design/REFERENCES_P10-05.md`** — benchmarks visuales (Stripe, Linear, Goldman Marquee) y qué tomar / qué rechazar.
5. **`app/(forge)/credit-hub/_design/mockups/P10-05_tenant_branding_states.html`** — mockup visual aprobado de los 3 estados (loading / error / success). El TSX debe match este look pixel-near.
6. **`app/(forge)/credit-hub/_design/tokens.css`** — tokens fuente de verdad. Usa class names Tailwind que mapean a estas vars (`text-forgeInk-800`, `bg-forge-surface-card`, etc.) — verifica `tailwind.config.js` para los exact names.

**Lectura suplementaria** (para entender por qué este sistema existe):
- `app/(forge)/credit-hub/_design/COMPONENTS.md` — convenciones de primitivos Forge
- `app/(forge)/credit-hub/_design/MIGRATION.md` — Phase 7.2 Case B (legacy primitives policy)
- `lib/credit-hub/types/tenantConfig.ts` — interface destino del adapter
- `lib/credit-hub/hooks/useTenantConfig.ts` — hook actual a proxy-replazar
- `lib/credit-hub/forge-test-tenant-override.ts` — path de test override que DEBE preservarse

---

## 4. CHECKLIST DE CALIDAD (no negociable)

### 4.1 TypeScript
- [ ] **Cero `any`.** Usar `unknown` + type guards si necesario.
- [ ] Todas las funciones exportadas tienen JSDoc completo (purpose, params, returns, ejemplos cuando útil).
- [ ] `useTenantConfig` lleva JSDoc `@deprecated` con link explícito al hook nuevo: *"Migrate to `useTenantBranding` for chrome fields, or to `useTenantBankingPolicy` (P10-09 pending) for banking policy fields. This hook proxies useTenantBranding for chrome and falls back to defaults for banking policy."*
- [ ] Discriminated unions para variantes (no boolean flags acumulados).
- [ ] Preservar shape exacto de `TenantBankingConfig` en el output del adapter (passing test es la prueba).

### 4.2 Imports — orden estricto del DESIGN_SYSTEM_RULES §5

```tsx
// 1. React
import { useMemo } from 'react';
// 2. Next
import Image from 'next/image';
// 3. External libs
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
// 4. Forge components
import { Button } from '@/components/forge/ui/Button';
// 5. Local
import { useTenant } from '@/lib/credit-hub/hooks/useTenant';
// 6. Types (separados)
import type { TenantBranding } from '@/lib/credit-hub/types/tenantBranding';
```

### 4.3 Tests obligatorios (jest)

**`adaptBrandingToConfigShape.test.ts`** — mínimo 4 tests:
- `it('preserves all default banking policy fields')` — verifica que `dti_max`, `ltv_max`, `allowed_terms`, `features_enabled.garante_required`, `document_types.primary_id`, `vehicle_types`, `product_types`, `min_age`, `max_age` quedan en sus defaults DO post-adapter.
- `it('overrides chrome fields from branding')` — verifica `institution_name === branding.display_name`, `currency_code === branding.currency`, `country_code === parse(branding.locale)`, `branding.primary_color === branding.brand_primary`, `branding.secondary_color === branding.brand_dark`, `branding.accent_color === branding.brand_primary`.
- `it('falls back to default currency_symbol for unknown currency')` — input `currency: "XYZ"` → output `currency_symbol === "RD$"` (default).
- `it('handles malformed locale gracefully')` — input `locale: "es"` (sin región) → output `country_code === "DO"` (default).

**`warnOnceForCaller.test.ts`** — mínimo 3 tests:
- `it('warns once per call site in dev')` — fija `process.env.NODE_ENV = 'development'`; llama 3 veces desde la misma línea simulada → expect `console.warn` se llamó 1 vez.
- `it('warns multiple times when called from different sites')` — llama desde 2 stacks distintos → expect 2 warnings.
- `it('does not warn in production')` — fija `process.env.NODE_ENV = 'production'` → expect `console.warn` no se llamó nunca.

### 4.4 Accesibilidad
- [ ] `TenantBrandingErrorBanner` tiene `role="alert"` (anuncia al render).
- [ ] `AlertTriangle` icon tiene `aria-hidden="true"` (decorativo; el texto comunica el error).
- [ ] Botón Retry tiene focus ring visible (per Forge tokens) + accesible vía Tab.
- [ ] Skeleton elementos en topbar/sidebar tienen `aria-hidden="true"` (no son contenido real).
- [ ] `prefers-reduced-motion: reduce` aplica al skeleton shimmer (CSS class debe incluirlo o usar `motion-reduce:` Tailwind).

### 4.5 Estilo + tokens
- [ ] **Cero hex codes hardcodeados** en TSX. Solo Tailwind class names que mapean a CSS vars.
- [ ] Borders subtle por default (`border-forgeInk-200`); shadow `xs` para cards.
- [ ] Banner error usa `bg-forge-danger-50` + `border-l-3 border-forge-danger-500` + `text-forge-danger-700` (verifica nombres exactos en `tailwind.config.js`).

### 4.6 Multi-tenant
- [ ] **Cero `if (tenantId === 'credicefi')`** en cualquier lugar.
- [ ] **Cero hardcoded `RD$`** — usar `Intl.NumberFormat(locale, { style: 'currency', currency })` (que ya es lo que `formatForgeCurrency` hace).
- [ ] CSS vars aplicadas vía `style` prop en `ForgeCreditHubAppShell`, no inline en componentes hijos.
- [ ] `data-tenant` attribute solo se setea cuando `branding` existe (success), nunca con valor default.

### 4.7 Performance
- [ ] No re-renders innecesarios — `useMemo` en `useTenantConfig` proxy resuelve dependencias correctamente (deps array completo).
- [ ] No fetch loops — react-query manejarlo es suficiente con la config aprobada.
- [ ] Bundle: no agregar libs nuevas. `lucide-react`, `@tanstack/react-query`, `next/image` ya están en package.json.

---

## 5. LO QUE NO DEBE HACER CLAUDE CODE

- ❌ **NO migrar los 30 consumers de `useTenantConfig`** — eso es **P11** (separate task). El proxy hace que sigan funcionando con datos reales sin tocarlos.
- ❌ **NO borrar ningún archivo legacy.** Solo `@deprecated` JSDoc en `useTenantConfig`. El archivo se queda.
- ❌ **NO modificar `tokens.css`** ni el sistema de `[data-tenant]`. Las CSS vars siguen siendo la source of truth visual.
- ❌ **NO inventar campos del API.** Usar exactamente `_API_CONTRACT.md` §"Tenant Branding". Si el contrato no lista un campo, no lo asumas.
- ❌ **NO modificar `getDefaultTenantBankingConfig`.** Sigue siendo el fallback path. El test de parity depende de que exista igual.
- ❌ **NO modificar `lib/credit-hub/forge-test-tenant-override.ts`** ni el TestBank Mexico fixture. La feature `NEXT_PUBLIC_FORGE_TEST_TENANT=mx` debe seguir funcionando idéntica.
- ❌ **NO tocar nada bajo `nadakki-ai-suite/`** (backend, FastAPI, Python). Solo lectura para consultar `_API_CONTRACT.md`.
- ❌ **NO usar emojis** en código ni en comentarios.
- ❌ **NO agregar `console.log`** en runtime code (solo `console.warn` dentro de `warnOnceForCaller`, con guard `NODE_ENV !== 'production'`).
- ❌ **NO instalar paquetes nuevos.** Si crees que falta uno, escribe en `_PACKAGE_REQUEST.md` y para.
- ❌ **NO tocar `app/credit/*` legacy** — fuera de scope, decisión pendiente en P10-03.
- ❌ **NO tocar tests existentes.** Si rompen al introducir el proxy (improbable porque mocks del default siguen sirviendo), reportar primero — Cesar decide si actualizar mocks o ajustar el proxy.

---

## 6. PROCESO POST-CODE

Cuando Claude Code termine la primera pasada de TSX, Cowork (o Cesar):

1. **Pull el branch local** (`git pull origin feat/forge-cowork-2026-05-09-pivot` después de que el agent commitee, o trabajar directo en local)
2. **Revisar diff archivo por archivo** — verificar que solo los 13 archivos del plan están modificados
3. **`npm install`** si Claude Code agregó deps (no debería)
4. **`npm run build`** — debe pasar sin errores nuevos (Turbopack)
5. **`npm run lint`** — debe pasar
6. **`npm test`** (o `npm run test:run`) — los 7 tests nuevos (4 adapter + 3 warnOnce) deben pasar; los tests existentes no deben regresar
7. **Smoke test manual:**
   - `npm run dev`
   - Abrir `/credit-hub/bank` con DevTools console abierto
   - Verificar que aparece UN solo `console.warn` "useTenantConfig is deprecated, called from <path>:<line>" (dev only)
   - Verificar visualmente: si el endpoint `/api/v2/tenants/{id}/branding` responde 200, el sidebar header muestra colores del tenant; si 404/500, aparece el banner rojo persistente con Reference ID + Retry button
   - Toggle `NEXT_PUBLIC_FORGE_TEST_TENANT=mx` en `.env.local`, reiniciar dev → ver el branding TestBank Mexico (logo dark red, currency MXN MX$1,234,567)
   - Verificar `prefers-reduced-motion: reduce` en DevTools rendering → skeleton shimmer no anima
8. **Commit** con mensaje exacto:
   ```
   feat(forge): P10-05 live tenant_branding fetch with proxy adapter

   - NEW: useTenantBranding hook + react-query opts explicit
   - NEW: tenant-branding-client with 4 typed error classes
   - NEW: adaptBrandingToConfigShape pure function with parity test
   - NEW: warnOnceForCaller dev-only console.warn util
   - NEW: TenantBrandingErrorBanner with AlertTriangle icon
   - MODIFY: useTenantConfig rewritten as proxy (chrome real, policy default)
   - MODIFY: ForgeCreditHubAppShell wires hook + CSS vars
   - MODIFY: ForgeCreditHubSidebar/Topbar accept skeleton props
   - MODIFY: TENANT_THEMING.md remove "SQL illustrative" note
   - Closes chrome teatro; banking policy teatro pending P10-09
   - Per _design/P10-05_ADAPTER_ANALYSIS.md and _HANDOFF_TO_CODE_P10-05.md
   ```
9. **Push** a `feat/forge-cowork-2026-05-09-pivot`
10. **Reportar a Cesar** con diff resumido y status de gates (build/lint/test)

---

## 7. RECURSOS DE REFERENCIA RÁPIDA

### `_API_CONTRACT.md` — TenantBranding response shape (verbatim)

```json
{
  "tenant_id": "credicefi",
  "display_name": "Credicefi",
  "logo_url": "https://cdn.nadakki.com/logos/credicefi.svg",
  "brand_primary": "#1B4A8C",
  "brand_dark": "#081E3D",
  "locale": "es-DO",
  "currency": "DOP",
  "regulatory_profile": "INDOTEL",
  "application_status_labels": {
    "DRAFT": "Borrador",
    "SUBMITTED": "Enviada",
    "PENDING_REVIEW": "En revisión",
    "APPROVED": "Aprobada",
    "REJECTED": "Rechazada"
  },
  "copy_overrides": {
    "applicant.singular": "socio",
    "applicant.plural": "socios"
  }
}
```

### Headers requeridos para el fetch

```typescript
{
  'Content-Type': 'application/json',
  'X-Tenant-ID': tenantId,
  'Authorization': `Bearer ${getToken()}`,
}
```

`getAuthHeaders()` debe componerse de helpers existentes en `lib/credit-hub/api/client.ts` o equivalente — verificar antes de duplicar lógica.

### `API_BASE` env var

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
```

(Throw at module load if undefined; `_API_CONTRACT.md` §"BASE URL".)

---

*Fin de _HANDOFF_TO_CODE_P10-05.md. Cuando Claude Code termine, los archivos producidos deben respetar este spec al 100%. Cualquier desviación → reportar antes de commit.*

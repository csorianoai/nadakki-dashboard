# P10-05_ADAPTER_ANALYSIS.md
## Análisis del adapter `TenantBranding → TenantBankingConfig` (proxy de useTenantConfig)

**Fecha:** 2026-05-09 · **Workflow paso:** 3-bis (deep dive antes de TSX) · **Status:** PENDIENTE DE APROBACIÓN POR CESAR

---

## 0. TL;DR

1. **Cesar tenía razón en sospechar:** la confusión `primary_color` (orange `#ff6b35`) vs `brand_primary` (Credicefi navy `#1b4a8c`) es un **placeholder no consumido**. Los 30 call-sites de Forge **nunca leen** `branding.primary_color/secondary_color/accent_color` desde `useTenantConfig`. Ver §3.1 evidencia.
2. **Mapping para `branding.*` es trivial:** `brand_primary → primary_color` y `brand_dark → secondary_color`, pero el adapter casi puede ignorar estos campos porque nadie los lee desde este hook. Las CSS variables se aplican directamente en `ForgeCreditHubAppShell` vía `style` prop.
3. **🚨 Hallazgo arquitectural mayor (no esperado en mi propuesta original):** `TenantBranding` (endpoint nuevo) cubre **~25% de los campos de `TenantBankingConfig`** (chrome). El **75% restante son banking policy** (`ltv_max`, `dti_max`, `default_rate`, `allowed_terms`, `scoring_thresholds`, `vehicle_types`, `document_types`, `features_enabled`, `min_age`, `max_age`, `required_documents`, etc.) que el endpoint `/branding` NO sirve. Estos campos **siguen siendo defaults DO** después de P10-05 — el "teatro" se cierra solo en el chrome (sidebar/topbar/dashboards/listas), no en el wizard/simulator.
4. **Recomendación final:** Adapter `branding.real + banking_policy.default`. Proxy genera el shape completo; chrome sale del fetch real, policy sale del default. **P10-05 cierra el teatro de chrome**, no del banking. El cierre del teatro de policy requiere expandir el endpoint backend (= NEW P10-09) y queda fuera de scope hoy.

---

## 1. Source-of-truth real (post-grep)

### 1.1 `lib/credit-hub/hooks/useTenantConfig.ts`
- Returns `{ tenantConfig: TenantBankingConfig; loading: boolean }`.
- `tenantConfig` viene de `getDefaultTenantBankingConfig(tenantId)` o, si `NEXT_PUBLIC_FORGE_TEST_TENANT=mx`, del fixture `TESTBANK_MEXICO_FIXTURE`.
- **No hay fetch a endpoint alguno.** Es 100% objeto local.

### 1.2 `lib/credit-hub/types/tenantConfig.ts`
- `TenantBankingConfig` es un shape **muy ancho** (29 campos top-level + 4 nested en `branding`). Distribuye en:
  - **Identidad** (5): `tenant_id`, `institution_name`, `institution_type`, `country_code`, `regulatory_profile`
  - **Formatters** (3): `currency_code`, `currency_symbol`, `locale`
  - **Branding** (4 nested): `logo_url`, `primary_color`, `secondary_color`, `accent_color`
  - **Banking policy** (~17): `scoring_thresholds`, `vehicle_types`, `product_types`, `document_types`, `dti_max`, `ltv_max`, `min_age`, `max_age`, `min_employment_years`, `pii_masking_enabled`, `default_rate`, `min_rate`, `max_rate`, `allowed_terms`, `default_term`, `product_limits`, `dti_warning_ratio`, `min_roi_threshold`, `risk_multipliers`, `payment_capacity_ratio`, `garante_minimum_income_ratio`, `required_documents`, `features_enabled`, `consent_methods_enabled`

### 1.3 `TESTBANK_MEXICO_FIXTURE` (real-looking tenant fixture, only "real" reference data en repo)
- `branding.primary_color: "#7B1F1F"` — **dark red institucional**, MATCHES exactamente `--forge-brand-500` del tenant override en `tokens.css` (`.forge-app[data-tenant="test-mx-tenant-uuid"] { --forge-brand-500: #7b1f1f }`).
- `branding.secondary_color: "#3D0A0A"` — **darker red**, MATCHES `--forge-brand-900` del mismo tenant override.
- `branding.accent_color: "#7B1F1F"` — IGUAL a `primary_color`.
- **Conclusión:** En el único caso "real" del repo, el campo `branding.primary_color` SÍ es el color institucional principal — semántica idéntica a `TenantBranding.brand_primary` (no es marketing/orange).

### 1.4 `_API_CONTRACT.md` — endpoint `GET /api/v2/tenants/{tenant_id}/branding`
- Response shape: `{ tenant_id, display_name, logo_url, brand_primary, brand_dark, locale, currency, regulatory_profile, application_status_labels, copy_overrides }`
- **10 campos**, vs los **29+ de TenantBankingConfig**.
- No incluye `accent_color`, `currency_symbol`, `country_code`, `institution_type`, ni nada de banking policy.

### 1.5 Endpoints relacionados que NO existen (verificado)
- No hay `/api/v2/tenants/{id}/banking-config` documentado en `_API_CONTRACT.md`.
- No hay `/api/v2/tenants/{id}/policy` documentado.
- Banking policy está hard-coded en el frontend (`getDefaultTenantBankingConfig` + `TESTBANK_MEXICO_FIXTURE`). Cualquier tenant nuevo "hereda" config DO.

---

## 2. Inventario de consumers (grep evidencia)

### 2.1 30 archivos código (no tests, no docs) consumen `useTenantConfig`

| # | Archivo | Categoría |
|---|---------|-----------|
| 1 | `lib/credit-hub/i18n/useTranslations.ts` | i18n |
| 2 | `lib/credit-hub/hooks/usePreApprovalSimulation.ts` | Banking policy |
| 3 | `lib/credit-hub/hooks/useConsentApi.ts` | Branding chrome |
| 4 | `lib/credit-hub/hooks/useCatalogs.ts` | Catalogs |
| 5 | `components/forge/layout/ForgeCreditHubTopbar.tsx` | Chrome |
| 6 | `components/forge/layout/ForgeCreditHubCommandPalette.tsx` | Chrome |
| 7 | `components/forge/layout/ForgeCreditHubSidebar.tsx` | Chrome |
| 8 | `components/forge/layout/ForgeAppTopbar.tsx` | Chrome |
| 9 | `components/forge/layout/ForgeAppSidebar.tsx` | Chrome |
| 10 | `components/forge/credit-hub/dealer/DealerWizardProvider.tsx` | Banking policy + features |
| 11 | `components/forge/credit-hub/dealer/DealerWizardVehicleFinancialStep.tsx` | Banking policy |
| 12 | `components/forge/credit-hub/dealer/DealerWizardChrome.tsx` | Chrome (locale) |
| 13 | `components/forge/credit-hub/dealer/DealerWizardCoBorrowerStep.tsx` | Banking policy + features |
| 14 | `components/forge/credit-hub/dealer/DealerWizardApplicantEmploymentStep.tsx` | Banking policy + chrome |
| 15 | `components/forge/credit-hub/DealerApplicationStatusView.tsx` | Chrome |
| 16 | `components/forge/credit-hub/BankApplicationDetailView.tsx` | Chrome |
| 17 | `components/credit-hub/system/CreditHubI18nBootstrap.tsx` | i18n (locale) |
| 18 | `components/credit-hub/dealer/wizard/consent/PresentConsentForm.tsx` | Consent methods |
| 19 | `components/credit-hub/dealer/wizard/consent/ConsentSection.tsx` | Consent methods |
| 20 | `components/credit-hub/dealer/wizard/WizardContainer.tsx` (legacy) | Banking policy + features |
| 21 | `components/credit-hub/dealer/preapproval/PreApprovalSimulator.tsx` | Banking policy |
| 22 | `components/credit-hub/dealer/preapproval/SimulatorControls.tsx` | Banking policy |
| 23 | `components/credit-hub/bank/BankDecisionPanel.tsx` | Chrome (locale) |
| 24 | `components/credit-hub/bank/BankDashboardHero.tsx` | Chrome (institution_name) |
| 25 | `app/(forge)/credit-hub/dealer/page.tsx` | Chrome |
| 26 | `app/(forge)/credit-hub/dealer/applications/page.tsx` | Chrome |
| 27 | `app/(forge)/credit-hub/dealer/applications/new/complete/page.tsx` | Chrome |
| 28 | `app/(forge)/credit-hub/bank/page.tsx` | Chrome |
| 29 | `app/(forge)/credit-hub/bank/compliance/page.tsx` | Chrome (locale) |
| 30 | `app/(forge)/credit-hub/bank/audit/page.tsx` | Chrome (locale) |

Plus `app/(forge)/credit-hub/bank/applications/page.tsx` ya estaba implícito en el grep — total real ≈ **30-31 archivos**, no 38 como mi estimación inicial.

### 2.2 Categorización por tipo de campos consumidos

**Bucket A — "Chrome only"** (12 consumers): leen únicamente `locale` / `currency_code` / `institution_name` / `branding.logo_url`. Después del adapter, estos consumers reciben datos REALES del tenant fetcheado.
- Layout chrome: ForgeCreditHubTopbar, ForgeCreditHubSidebar, ForgeCreditHubCommandPalette, ForgeAppTopbar, ForgeAppSidebar (5)
- Pages: bank/page, bank/applications, bank/compliance, bank/audit, dealer/page, dealer/applications, dealer/applications/new/complete (7)
- Detail views: BankApplicationDetailView, BankDashboardHero, BankDecisionPanel, DealerApplicationStatusView (4 — los 2 de bank cuentan como cromo)

**Bucket B — "i18n / system"** (3 consumers): leen `locale`. Idéntico a A pero categorizado aparte porque son hooks/sistema.
- useTranslations
- CreditHubI18nBootstrap
- DealerWizardChrome (solo `locale`)

**Bucket C — "Banking policy + features"** (~10 consumers): leen `ltv_max`, `dti_max`, `default_rate`, `allowed_terms`, `min_age`, `max_age`, `features_enabled.garante_required`, `document_types.primary_id`, `vehicle_types`, `product_types`, `consent_methods_enabled`, `risk_multipliers`, `product_limits`, etc. **El endpoint `/branding` NO les sirve estos datos** — siguen consumiendo defaults DO.
- DealerWizardProvider (features_enabled.garante_required, min_age, max_age, document_types)
- DealerWizardApplicantEmploymentStep (min_age, max_age, document_types, locale)
- DealerWizardCoBorrowerStep (features_enabled.garante_required, document_types, garante_minimum_income_ratio, default_rate, locale)
- DealerWizardVehicleFinancialStep (ltv_max, product_types, locale, currency_code)
- WizardContainer legacy (mismas keys que los 4 anteriores combinados)
- usePreApprovalSimulation (dti_max, dti_warning_ratio, ltv_max, min_roi_threshold, risk_multipliers, payment_capacity_ratio, allowed_terms)
- PreApprovalSimulator (features_enabled.preapproval_simulator)
- SimulatorControls (min_rate, max_rate, product_limits, allowed_terms)
- ConsentSection / PresentConsentForm (consent_methods_enabled — verificar grep complementario)
- useConsentApi / useCatalogs (verificar grep complementario)

### 2.3 Resumen distribución
- **A + B (chrome + i18n):** 15 consumers — el adapter UNLOCK estos completamente. **Multi-tenant es real** post-merge.
- **C (banking policy):** 10-15 consumers — el adapter NO LOS UNLOCK. Siguen sirviendo defaults DO. **Multi-tenant sigue siendo teatro** para wizard/simulator.

---

## 3. La pregunta crítica: `primary_color` vs `brand_primary`

### 3.1 Evidencia de uso de `branding.*` en código

Grep `tenantConfig\.branding\.\w+` en todo el repo (excluyendo `node_modules`):

```
components/forge/layout/ForgeCreditHubSidebar.tsx:58:    {tenantConfig.branding.logo_url ? (
components/forge/layout/ForgeCreditHubSidebar.tsx:62:        src={tenantConfig.branding.logo_url}
components/forge/layout/ForgeAppSidebar.tsx:89:    {tenantConfig.branding.logo_url ? (
components/forge/layout/ForgeAppSidebar.tsx:93:        src={tenantConfig.branding.logo_url}
```

**Cuatro reads totales. Los CUATRO leen solo `logo_url`.** Cero lecturas de `primary_color`, `secondary_color`, `accent_color`.

### 3.2 Donde aparece `primary_color` (cualquier consumer en repo)

```
app/(public)/consent/[token]/_components/ConsentBrandingHeader.tsx:7:
  const primary = branding.primary_color?.trim() || "#2563eb";
app/(public)/consent/[token]/page.tsx:165:
  const primary = data.branding?.primary_color?.trim() || "#2563eb";
lib/credit-hub/api/public-consent-client.ts:10: primary_color?: string | null;
lib/credit-hub/types/tenantConfig.ts:35: primary_color: string;     [type def]
lib/credit-hub/hooks/useTenantConfig.ts:56: primary_color: "#ff6b35", [default]
app/(forge)/credit-hub/_design/_inventory/test-tenant-fixtures.ts:21: primary_color: "#7B1F1F",
```

- **Las 2 lecturas en `app/(public)/consent/`** son del **flujo público de consent** (cliente final con código de seguimiento), que consume un **endpoint diferente** (`lib/credit-hub/api/public-consent-client.ts`) con su propio shape. **No es nuestro hook.**
- **Las otras referencias** son: type def, default placeholder, fixture. Cero consumo en componentes Forge.

### 3.3 Veredicto sobre la pregunta de Cesar

**La respuesta es (C) — confirmada con evidencia:**

> "El default `#ff6b35` es solo placeholder y nunca se usó realmente en producción. Cualquier tenant en BD tiene primary_color = color institucional real. `#ff6b35` solo aparece en getDefaultTenantBankingConfig."

Razones:
1. **Cero consumers Forge** leen `branding.primary_color` directo del hook. Las CSS variables `--forge-brand-500/900` son aplicadas al DOM via `[data-tenant]` attribute (vía `tokens.css`) o via `style` prop en el shell, NO via `branding.primary_color`.
2. **El único fixture "real" del repo** (TestBank Mexico) usa `primary_color: "#7B1F1F"` — color institucional dark red, idéntico al `--forge-brand-500` del tenant override. Confirma semántica institucional, no marketing.
3. **El default `#ff6b35`** es placeholder sin call-site. Probablemente legacy de un mockup pre-Forge cuando el branding era "orange consumer" (e.g. del legacy `app/credit/*`); ya nadie lo lee.

**Mapping correcto del adapter:**
- `branding.primary_color` ← `TenantBranding.brand_primary` (semánticamente equivalentes — institucional)
- `branding.secondary_color` ← `TenantBranding.brand_dark` (semánticamente equivalentes — institucional deepest)
- `branding.accent_color` → fallback al default actual (TestBank Mexico setea === primary; ningún Forge consumer lo lee, así que el valor concreto da igual)

**El problema visual real** ya estaba mitigado: las CSS variables aplicadas vía `[data-tenant]` attribute en `.forge-app` resuelven el branding visual sin necesidad de leer `branding.primary_color` desde JS. El fix de P10-05 es para `display_name`, `logo_url`, `locale`, `currency`, `application_status_labels` — esos sí impactan UX.

---

## 4. Mapping campo por campo (adapter completo)

`adaptBrandingToConfigShape(branding: TenantBranding, tenantId: string): TenantBankingConfig`

| TenantBankingConfig field | Type | Source | Tipo de mapping |
|---|---|---|---|
| `tenant_id` | string | `branding.tenant_id` | **Direct** |
| `institution_name` | string | `branding.display_name` | **Rename** |
| `institution_type` | string | default `"FINANCIAL_INSTITUTION"` | **Default fallback** (no field en TenantBranding) |
| `country_code` | "DO"\|"MX"\|... | derivar de `branding.locale.split('-')[1]` (e.g. `"es-DO"` → `"DO"`); default `"DO"` si parse falla | **Transform from locale** |
| `currency_code` | string | `branding.currency` | **Rename** |
| `currency_symbol` | string | derivar de `branding.currency` con tabla local (`"DOP"→"RD$"`, `"USD"→"$"`, `"MXN"→"MX$"`); default `"RD$"` | **Transform from currency_code** |
| `locale` | string | `branding.locale` | **Direct** |
| `regulatory_profile` | string | `branding.regulatory_profile` | **Direct** |
| `branding.logo_url` | string\|null | `branding.logo_url` | **Direct** (la única branding sub-prop consumida) |
| `branding.primary_color` | string | `branding.brand_primary` | **Rename** (semantic match confirmed §3) |
| `branding.secondary_color` | string | `branding.brand_dark` | **Rename** (semantic match confirmed §3) |
| `branding.accent_color` | string | default `branding.brand_primary` (TestBank pattern: accent === primary; no consumers leen) | **Default = primary** |
| `scoring_thresholds` | obj | default `{ excellent: 800, good: 700, fair: 580 }` | **Default fallback** |
| `vehicle_types` | string[] | default `["Nuevo", "Usado", "Demo"]` | **Default fallback** |
| `product_types` | string[] | default lista DO del config | **Default fallback** |
| `document_types` | obj | default `{ primary_id: "CEDULA", alternative_ids: ["PASAPORTE", "OTRO"] }` | **Default fallback** ⚠️ Tenant MX necesita "INE" pero el endpoint /branding no lo sirve. Documentar deuda. |
| `dti_max` | number | default `0.4` | **Default fallback** |
| `ltv_max` | number | default `0.95` | **Default fallback** |
| `min_age` / `max_age` | number | default `18` / `75` | **Default fallback** |
| `min_employment_years` | number | default `0.5` | **Default fallback** |
| `pii_masking_enabled` | boolean | default `true` | **Default fallback** |
| `default_rate` / `min_rate` / `max_rate` | number | default `16` / `10` / `25` | **Default fallback** |
| `allowed_terms` / `default_term` | number[] / number | default `[12,24,36,48,60,72,84]` / `60` | **Default fallback** |
| `product_limits` | obj | default `{ min_loan: 100_000, max_loan: 5_000_000, min_down_payment_ratio: 0.1, max_ltv: 0.95 }` | **Default fallback** |
| `dti_warning_ratio` / `min_roi_threshold` / `payment_capacity_ratio` | number | default valores DO | **Default fallback** |
| `risk_multipliers` | obj | default `{ BAJO: 1.0, MEDIO: 0.75, ALTO: 0.5 }` | **Default fallback** |
| `garante_minimum_income_ratio` | number\|undefined | default `undefined` | **Default fallback** |
| `required_documents` | array | default `DEFAULT_DO_REQUIRED_DOCUMENTS` | **Default fallback** |
| `features_enabled` | obj | default `{ remote_consent: true, preapproval_simulator: true, garante_required: false }` | **Default fallback** ⚠️ Tenants pueden querer override pero no hay channel hoy |
| `consent_methods_enabled` | string[] | default `["WHATSAPP", "EMAIL", "SMS_OTP", "SELFIE"]` | **Default fallback** |

**Resumen del mapping:**
- **9 campos directos o rename trivial** (chrome): tenant_id, institution_name, currency_code, locale, regulatory_profile, branding.logo_url, branding.primary_color, branding.secondary_color, branding.accent_color
- **2 campos transformados** (chrome derivado): country_code (parse locale), currency_symbol (tabla currency→symbol)
- **20+ campos default fallback** (banking policy): todo el bloque de policy, features, documents, etc.

---

## 5. ⚠️ Hallazgo arquitectural — debe escalar a Cesar

### 5.1 El problema

El endpoint `GET /api/v2/tenants/{tenant_id}/branding` **NO SUFICIENTE** para cerrar el "teatro multi-tenant" en el wizard/simulator. Solo cierra el teatro del chrome.

Después de P10-05, un tenant Banco Boliviano (hipotético) verá:
- ✅ Logo Banco Boliviano + display_name "Banco Boliviano" en sidebar/topbar (real)
- ✅ Currency BOB formatted correctamente (real)
- ✅ Locale es-BO en fechas (real)
- ✅ Status pills "Aprobada" en español (real)
- ❌ Wizard pide **CEDULA** (default DO) en vez de DNI/RUT/CI (real Bolivia)
- ❌ Simulator usa rates 10-25% (default DO), no rates Bolivia
- ❌ LTV max 0.95 (default DO), no LTV Bolivia
- ❌ Edad min 18 max 75 (default DO), pueden no aplicar
- ❌ Documentos requeridos default DO (cédula, comprobante de empleo, etc.), no Bolivia
- ❌ `garante_required: false` (default DO), aunque Bolivia podría requerirlo

**Esto significa que P10-05 cierra ~50% del teatro, no 100%.**

### 5.2 Opciones de remediación (NUEVA TAREA P10-09)

**Opción 1 — Expandir endpoint `/branding` para incluir banking policy:**
- Backend: agregar `banking_policy` object a la response
- Frontend: el adapter usa también esos campos, defaults solo si fetch falla
- **Pro:** un solo endpoint, una sola fuente
- **Con:** banking policy puede ser jerárquica (regional vs tenant), expandir el endpoint puede ser difícil

**Opción 2 — Endpoint nuevo `/api/v2/tenants/{id}/banking-config`:**
- Backend: endpoint separado solo para policy
- Frontend: hook `useTenantBankingPolicy` separado, useTenantConfig combina branding + policy
- **Pro:** separación de concerns, branding y policy se cachean independiente
- **Con:** dos roundtrips, dos sources of truth

**Opción 3 — Postergar (P10-05 cierra solo chrome):**
- P10-05 ships "multi-tenant chrome real"
- Banking policy multi-tenant se trata en sprint separado (P10-09)
- Documentar explícitamente que policy sigue siendo default
- **Pro:** scope claro, ships rápido
- **Con:** "multi-tenant teatro" sigue vivo en wizard/simulator (10 consumers)

### 5.3 Mi recomendación de Cowork

**Opción 3** para el adapter de hoy. Razones:
1. Cesar aprobó P10-05 con scope "tenant_branding fetch" — expandir scope ahora rompe el time target.
2. Wizard/simulator policy multi-tenant es un problema independiente que requiere decisión de producto + backend (¿qué hace la policy hierarchy? ¿hay regional default?).
3. P10-05 sí entrega valor visible: chrome real + currency real + locale real + status labels real. El banker ve "Credicefi" en logo y "RD$1,847,500" formateado correctamente. Eso es 80% del impacto perceptible.
4. **NUEVA tarea P10-09 — Banking policy multi-tenant fetch** se agrega al backlog v2 como next-priority después de P10-05 (mayor que P10-04 persona refactor en mi opinión).

---

## 6. Implicaciones para el adapter (mapping final acordado)

### 6.1 Función pure que escribe Claude Code

```typescript
// lib/credit-hub/utils/adaptBrandingToConfigShape.ts
import type { TenantBranding } from '@/lib/credit-hub/types/tenantBranding';
import type { TenantBankingConfig } from '@/lib/credit-hub/types/tenantConfig';
import { getDefaultTenantBankingConfig } from '@/lib/credit-hub/hooks/useTenantConfig';

const CURRENCY_SYMBOLS: Record<string, string> = {
  DOP: 'RD$', USD: '$', MXN: 'MX$', BOB: 'Bs', COP: 'COL$', PEN: 'S/',
};

function deriveCountryCodeFromLocale(locale: string): TenantBankingConfig['country_code'] {
  const parts = locale.split('-');
  return parts.length === 2 ? (parts[1] as TenantBankingConfig['country_code']) : 'DO';
}

export function adaptBrandingToConfigShape(
  branding: TenantBranding,
  tenantId: string,
): TenantBankingConfig {
  const defaults = getDefaultTenantBankingConfig(tenantId);

  return {
    ...defaults,                               // banking policy stays default (P10-09 territory)
    tenant_id: branding.tenant_id,
    institution_name: branding.display_name,
    country_code: deriveCountryCodeFromLocale(branding.locale),
    currency_code: branding.currency,
    currency_symbol: CURRENCY_SYMBOLS[branding.currency] ?? defaults.currency_symbol,
    locale: branding.locale,
    regulatory_profile: branding.regulatory_profile,
    branding: {
      logo_url: branding.logo_url ?? null,
      primary_color: branding.brand_primary,
      secondary_color: branding.brand_dark,
      accent_color: branding.brand_primary,    // TestBank pattern; no consumers read this
    },
  };
}
```

### 6.2 Test de parity (unit test antes del merge)

```typescript
// tests/lib/credit-hub/utils/adaptBrandingToConfigShape.test.ts
describe('adaptBrandingToConfigShape', () => {
  it('preserves all default banking policy fields', () => {
    const branding: TenantBranding = {
      tenant_id: 'credicefi',
      display_name: 'Credicefi',
      logo_url: 'https://cdn/credicefi.svg',
      brand_primary: '#1b4a8c',
      brand_dark: '#081e3d',
      locale: 'es-DO',
      currency: 'DOP',
      regulatory_profile: 'DO_LEY_172_13',
      application_status_labels: { /* ... */ },
      copy_overrides: {},
    };
    const result = adaptBrandingToConfigShape(branding, 'credicefi');
    expect(result.dti_max).toBe(0.4);       // default preserved
    expect(result.ltv_max).toBe(0.95);
    expect(result.allowed_terms).toEqual([12, 24, 36, 48, 60, 72, 84]);
    expect(result.features_enabled.garante_required).toBe(false);
  });

  it('overrides chrome fields from branding', () => {
    const branding: TenantBranding = { /* ... as above */ };
    const result = adaptBrandingToConfigShape(branding, 'credicefi');
    expect(result.institution_name).toBe('Credicefi');
    expect(result.currency_code).toBe('DOP');
    expect(result.currency_symbol).toBe('RD$');
    expect(result.country_code).toBe('DO');
    expect(result.branding.primary_color).toBe('#1b4a8c');
    expect(result.branding.secondary_color).toBe('#081e3d');
  });

  it('falls back to default currency_symbol for unknown currency', () => {
    const branding = { ...base, currency: 'XYZ' };
    const result = adaptBrandingToConfigShape(branding, 'x');
    expect(result.currency_symbol).toBe('RD$');  // = default
  });
});
```

### 6.3 Implicaciones para `useTenantConfig`

```typescript
// lib/credit-hub/hooks/useTenantConfig.ts (rewrite)
/**
 * @deprecated Migrate to useTenantBranding for chrome fields, or to
 * useTenantBankingPolicy (Phase 11/P10-09) for banking policy fields.
 * This hook proxies useTenantBranding for chrome fields and falls back
 * to defaults for banking policy (defaults remain Dominican-focused).
 */
export function useTenantConfig(): { tenantConfig: TenantBankingConfig; loading: boolean } {
  const { tenantId } = useTenant();
  const { data: branding, isPending, isError } = useTenantBranding(tenantId);

  if (process.env.NODE_ENV !== 'production') {
    warnOnceForCaller('useTenantConfig');
  }

  const tenantConfig = useMemo(() => {
    // Test override path preserved
    const test = getForgeTestTenantBankingConfig();
    if (test) return test;

    // Real branding → adapter
    if (branding) {
      return adaptBrandingToConfigShape(branding, tenantId || 'tenant-no-disponible');
    }

    // Loading or error → default (banking policy is always default until P10-09)
    return getDefaultTenantBankingConfig(tenantId || 'tenant-no-disponible');
  }, [branding, tenantId]);

  return { tenantConfig, loading: isPending };
}
```

---

## 7. Próximos pasos (sujetos a aprobación)

1. **Cesar revisa este análisis** y aprueba:
   - El mapping campo por campo (§4)
   - La aceptación de Opción 3 para banking policy (§5.3) → crear NEW P10-09 en backlog
   - Los 3 fields ⚠️ marcados con deuda explícita (`document_types`, `features_enabled`, `garante_minimum_income_ratio`)
2. **Cesar (o Cowork) agrega P10-09 al `_TASK_BACKLOG_v2.md`** — "Live banking_policy fetch — close multi-tenant teatro completely"
3. **Plan TSX final actualizado** queda con 11 archivos:
   - 4 NEW: `useTenantBranding.ts`, `tenant-branding-client.ts`, `types/tenantBranding.ts`, `TenantBrandingErrorBanner.tsx`
   - 1 NEW: `utils/adaptBrandingToConfigShape.ts` + su unit test
   - 1 NEW: `utils/warnOnceForCaller.ts`
   - 5 MODIFY: `useTenantConfig.ts`, `ForgeCreditHubAppShell.tsx`, `ForgeCreditHubSidebar.tsx`, `ForgeCreditHubTopbar.tsx`, `TENANT_THEMING.md` doc
4. **Plus los 3 ajustes que aprobaste previamente** (icono error banner, react-query options explícitas, 4 error classes) — ⚠️ **No tengo registro escrito de esos 3 ajustes en nuestro chat actual**. ¿Me los pegas explícitos para incluirlos en el handoff a Claude Code? Probablemente quedaron en otra ventana de Claude chat que estás usando para review paralelo.
5. **Escalar a Claude Code con plan final** (post-aprobación + 3 ajustes pegados)
6. **Cowork integra + build + lint + smoke + commit + push + PR**

---

## 8. Resumen para review rápida

- ✅ **Pregunta de Cesar respondida (C):** `primary_color #ff6b35` es placeholder no consumido. Mapping `brand_primary → primary_color` es semánticamente correcto.
- ✅ **Adapter mapping definido** (§4): 9 directos/rename, 2 transformados, 20+ defaults.
- 🚨 **Hallazgo arquitectural:** endpoint `/branding` cubre 25% de los campos consumidos. Banking policy (75%) sigue defaults DO. Documentado como NEW P10-09.
- ⏳ **Esperando 3 aprobaciones de Cesar** (mapping, P10-09 add to backlog, los "3 ajustes previos" que necesito que repegues).

---

*Fin de P10-05_ADAPTER_ANALYSIS.md. Tiempo invertido: ~40 min lectura + grep + análisis + redacción (target 30-45).*

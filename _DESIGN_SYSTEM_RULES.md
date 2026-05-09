# _DESIGN_SYSTEM_RULES.md — NADAKKI FORGE
## Reglas del design system — referencia rápida para Cowork
### Fuente: NADAKKI_FORGE_MASTER_REDESIGN_PROMPT_v3 (condensado)

---

## 1. FILOSOFÍA — NO NEGOCIABLE

| # | Principio | Traducción |
|---|---|---|
| 1 | Authority over decoration | El whitespace dice "esto cuesta dinero". Los gradientes dicen "side project" |
| 2 | Clarity over cleverness | Si un banquero pregunta "qué significa esto?", el diseño falló |
| 3 | Density without chaos | Tablas muestran 50 rows claras. Dashboards muestran 8 KPIs sin agobiar |
| 4 | Consistency over novelty | Cada botón en cada página se comporta igual. Sin excepciones |
| 5 | Motion functional only | Loading, focus, status. Sin "delight". Sin bounce. Sin parallax |
| 6 | Color is semantic | Rojo=danger, Verde=approved, Ámbar=pending. Brand=navegación únicamente |
| 7 | Whitespace is signal | Apretado=utility. Espacioso=institucional. Forge es institucional |
| 8 | Typography is hierarchy | Máx 3 weights (400/500/600 ó 400/600/700). Máx 2 familias |
| 9 | Components, not pages | Si escribes el mismo JSX 2 veces, ya fallaste. Extrae |
| 10 | Tenant-agnostic by default | Hardcoded "Credicefi" anywhere = build rechazado |

**Benchmark "futurista" = Goldman Marquee 2026, NO Dribbble neon.**

---

## 2. STACK FIJO — NO CAMBIAR

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript estricto (`any` prohibido — usar `unknown` + type guards)
- **Styling:** Tailwind CSS + CSS variables custom
- **Componentes UI:** propios (en `components/forge/ui/`) + algunas libs aprobadas
- **Libs aprobadas:** `cmdk` (CommandPalette), `sonner` (Toast), `lucide-react` (icons), `@tanstack/react-virtual` (table virtualization), `@tanstack/react-table`
- **Iconos:** SOLO Lucide React. No emojis. No iconos custom.
- **Fonts:** Source Serif 4 (display) + Inter (body) + JetBrains Mono (code) — vía `next/font`

---

## 3. DESIGN TOKENS — LA FUENTE DE VERDAD

**TODO color, espaciado, tamaño de fuente, radio, sombra DEBE venir de tokens en `app/(forge)/credit-hub/_design/tokens.css`.**

Hex codes hardcodeados en componentes = build rechazado.

### 3.1 Colores — Brand (overridable per tenant)

```
--forge-brand-50:  #F0F4FA
--forge-brand-500: #2E5F97   ← Primary (default Credicefi azul)
--forge-brand-600: #1E477A   ← Hover state
--forge-brand-900: #0A1D36   ← Deepest navy
```

**Tenants override via `[data-tenant="X"]`:**
```css
[data-tenant="credicefi"]    { --forge-brand-500: #1B4A8C; }
[data-tenant="banco-piloto"] { --forge-brand-500: #0B5345; }
[data-tenant="testbank-mx"]  { --forge-brand-500: #7B1F1F; }
```

### 3.2 Colores — Ink (texto/borders, NUNCA negro puro)

```
--forge-ink-200: #DDE3EA   ← Borders sutiles, table dividers
--forge-ink-400: #8C97A6   ← Texto terciario, captions
--forge-ink-600: #3D4759   ← Body text strong
--forge-ink-800: #1A2540   ← Headlines, primary text
```

### 3.3 Colores — Semantic (NUNCA usar brand para status)

```
--forge-success-500: #0F7A3E   ← Approved, Disbursed
--forge-warning-500: #B7791F   ← Pending, Review required
--forge-danger-500:  #B5201E   ← Rejected, AML hit, Fraud
--forge-info-500:    #1F60B5   ← Informational
```

### 3.4 Espaciado — 4pt grid

```
--forge-space-1:  4px
--forge-space-2:  8px
--forge-space-3:  12px
--forge-space-4:  16px
--forge-space-6:  24px   ← Card padding desktop
--forge-space-8:  32px   ← Page gutter min
--forge-space-12: 48px   ← Page gutter >1280px
```

### 3.5 Radii — Restringidos

```
--forge-radius-sm:   4px    ← Inputs, buttons
--forge-radius-md:   6px    ← Cards, modals
--forge-radius-lg:   8px    ← Hero cards
--forge-radius-pill: 9999px ← Status badges ONLY
```

**❌ Prohibido:** `radius-xl`, `radius-2xl`, `radius-3xl`. Cualquier cosa más redonda que 8px = consumer app.

### 3.6 Sombras — Casi planas

```
--forge-shadow-xs: 0 1px 2px 0 rgba(15, 23, 41, 0.04)    ← Default cards
--forge-shadow-sm: 0 1px 3px 0 rgba(15, 23, 41, 0.06)
--forge-shadow-lg: 0 10px 15px -3px rgba(15, 23, 41, 0.08) ← Modals MAX
```

**❌ Prohibido:** `shadow-xl`, `shadow-2xl`. Sombras pesadas = Dribbble.

**Las sombras NO cargan el peso visual. Los borders sí:**
```
--forge-border-subtle:  1px solid var(--forge-ink-200)   ← Default
--forge-border-default: 1px solid var(--forge-ink-300)
--forge-border-strong:  1px solid var(--forge-ink-500)
```

---

## 4. TIPOGRAFÍA

```
--forge-font-display: 'Source Serif 4', Georgia, serif
--forge-font-body:    'Inter', -apple-system, sans-serif
--forge-font-mono:    'JetBrains Mono', monospace

--forge-text-base: 14px   ← Body default (Forge corre en 14, NO 16)
--forge-text-md:   16px   ← Wizard dealer
--forge-text-2xl:  28px   ← Page H1 (sans)
--forge-text-3xl:  36px   ← Hero serif headlines (dashboard)
--forge-text-4xl:  48px   ← KPI marquee numbers
```

**Reglas:**
- `body` SIEMPRE con `font-variant-numeric: tabular-nums` (números financieros)
- Headlines hero: serif (Source Serif 4)
- Headers páginas: sans (Inter, weight 600)
- Body: sans 400
- Code/IDs: mono
- **NUNCA** mezclar serif + sans en el mismo párrafo
- **MÁX 3 weights por página**

---

## 5. COMPONENTES — REGLAS GENERALES

### Imports — orden estricto

```tsx
// 1. React
import { useState } from 'react';
// 2. Next
import Link from 'next/link';
// 3. External libs
import { useQuery } from '@tanstack/react-query';
// 4. Forge components
import { Button } from '@/components/forge/ui/Button';
// 5. Local
import { useTenant } from '@/lib/forge/tenant';
// 6. Types (separados)
import type { Application } from '@/types/credit';
```

### Componentes — convenciones

- Filename: `PascalCase.tsx` (ej: `EvidenceCard.tsx`)
- Carpeta: `components/forge/<categoria>/` donde categoría = `ui | layout | dealer | bank | shared`
- Cada componente exporta default + types nombrados
- JSDoc completo arriba del componente con: descripción, usage rules, accessibility, ejemplo
- Props con TypeScript interface, **JAMÁS** `any`
- Variants vía discriminated unions, NO via boolean flags acumulados

---

## 6. ACCESIBILIDAD — LIGHTHOUSE A11Y ≥ 90

- ✅ Todos los interactive elements: keyboard accessible, focus ring visible
- ✅ Focus ring: `outline: 2px solid var(--forge-brand-500); outline-offset: 2px;` — JAMÁS removerlo
- ✅ Color contrast: WCAG AA (4.5:1 body, 3:1 large)
- ✅ Status pills: SIEMPRE icono + texto, nunca color solo
- ✅ Form fields: `<label>` asociado, errors con `aria-describedby`
- ✅ Tables: `<caption>`, `scope="col"`, `aria-sort`
- ✅ Modals: focus trap, Esc para cerrar, return focus al trigger
- ✅ Skip-to-content link en cada page
- ✅ Iconos decorativos: `aria-hidden="true"`. Iconos significativos: `aria-label`

---

## 7. PERFORMANCE — LIGHTHOUSE PERF ≥ 85

- Fonts: `next/font` + `display: swap` + preload + subset Latin
- Images: `next/image` con sizes, AVIF/WebP, lazy below fold
- Charts: dynamic import (`next/dynamic`), no SSR
- Tables >100 rows: virtualizadas (`@tanstack/react-virtual`)
- CLS < 0.05
- LCP < 2.0s en 3G fast
- Bundle: route-level code splitting; ningún chunk compartido > 200KB
- **Animations**: máximo 240ms (modals exactamente 240ms)

---

## 8. MULTI-TENANT — LO MÁS CRÍTICO

### Reglas duras

- ❌ JAMÁS importar logo o color de constante hardcodeada
- ❌ JAMÁS escribir `if (tenant === 'credicefi')` en un componente — la variación va a config
- ✅ Currency: SIEMPRE `Intl.NumberFormat(branding.locale, { style: 'currency', currency: branding.currency })`
- ✅ Date: SIEMPRE `Intl.DateTimeFormat(branding.locale)`
- ✅ Status pill labels: vienen de `tenant.application_status_labels`

### TenantThemeProvider

```tsx
// app/(forge)/credit-hub/layout.tsx
export default async function ForgeLayout({ children }) {
  const tenant = await resolveTenantFromRequest();  // X-Tenant-ID + JWT
  const branding = await fetchTenantBranding(tenant.id);

  return (
    <html lang={branding.locale.split('-')[0]} data-tenant={tenant.slug}>
      <body style={{
        '--forge-brand-500': branding.brand_primary,
        '--forge-brand-900': branding.brand_dark,
      } as CSSProperties}>
        <TenantThemeProvider value={branding}>
          {children}
        </TenantThemeProvider>
      </body>
    </html>
  );
}
```

### Onboarding nuevo banco — ZERO UI CODE

1. Admin crea row en `tenant_branding` vía API
2. User loguea → JWT carga `tenant_id`
3. Layout lee branding → CSS variables actualizan
4. Logo, colores, currency, idioma — todo cambia
5. **Sin PR. Sin deploy. Sin diseñador.**

Si onboardear un banco requiere UNA línea de código frontend → build rechazado.

---

## 9. ANTI-PATTERNS — BUILD RECHAZADO AUTOMÁTICAMENTE

| # | Anti-pattern | Por qué falla |
|---|---|---|
| 1 | Hex hardcodeado en componente | Rompe theming |
| 2 | `if (tenant_id === 'credicefi')` | Rompe multi-tenancy |
| 3 | `border-radius: 12px` (no en tokens) | Visual drift |
| 4 | Dos implementaciones de tabla | Inconsistencia |
| 5 | Glassmorphism / neon / gradientes animados | No institucional |
| 6 | `box-shadow: 0 20px 40px ...` | Dribbble |
| 7 | Spinner donde skeleton funciona | Perf percibida menor |
| 8 | Modal sin focus trap | a11y fail |
| 9 | Status solo por color | a11y fail |
| 10 | `text-align: center` en columna numérica | UX financiero violado |
| 11 | Currency sin locale | Multi-region fail |
| 12 | `console.log` en production | Quality bar |
| 13 | TODO sin ticket linkeado | Discipline fail |
| 14 | TypeScript con `any` | Quality bar |
| 15 | Page con bundle > 200KB | Perf fail |
| 16 | Animation > 240ms | Feels slow |
| 17 | Más de 3 font weights / página | Drift |
| 18 | Mezclar serif + sans en body | Caos |
| 19 | Sidebar item sin icono | Inconsistencia |
| 20 | Empty state sin CTA | Dead-end UX |

---

## 10. VOCABULARIO INSTITUCIONAL

| ❌ Casual | ✅ Institucional |
|---|---|
| "Approve" | "Approve application" |
| "Customers" | "Applicants" / "Borrowers" |
| "Money" | "Loan amount" / "Principal" |
| "AI says..." | "Recommendation: ... · Confidence: 84%" |
| "Submit" | "Submit for review" |
| "Cool!" / "Nice!" / emojis | (none — institutional software does NOT celebrate) |
| "Oops!" | "An error occurred. Reference: ERR-XXXX" |
| "Loading..." | (skeleton, no text) |
| "No data" | "No applications match these filters" |

---

## 11. DEFINITION OF DONE — CADA TAREA

Antes de marcar una tarea como DONE, verifica:

- [ ] `npm run build` pasa sin warnings nuevos
- [ ] `npm run lint` pasa
- [ ] Smoke test manual: levantar `npm run dev` y verificar visualmente
- [ ] Cero `any` en TypeScript
- [ ] Cero `console.log`
- [ ] Cero hardcoded tenant references
- [ ] Cero hex codes fuera de tokens
- [ ] Componente nuevo: existe en preview page con todas sus variantes
- [ ] Página nueva: Lighthouse a11y ≥ 90 manual check
- [ ] Mobile: responsive verificado en 375px y 1280px
- [ ] Commit limpio con mensaje siguiendo convencional commits

---

## 12. CUANDO DUDES — REGLA DE ORO

**Si dudas si algo cumple las reglas → NO lo hagas. Pregunta.**

Improvisar = riesgo. Preguntar = profesionalismo.

Una sola violación de design tokens contamina el codebase y degrada la calidad institucional. Mejor parar, preguntar, y hacerlo bien una sola vez.

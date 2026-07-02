# FASE 3 White-Label — PASO 2 BUILD + grep posterior

**Fecha:** 2026-07-02  
**Branch:** `feat/white-label-fase3-branding`  
**Estado:** PR listo — **esperar GO de César** (sin merge)

---

## Cambios implementados (solo hits clase a)

| Área | Cambio |
|------|--------|
| Helpers | `lib/white-label/brand-display.ts` — fallbacks neutrales, nunca "Nadakki" |
| Login pre-auth | `usePublicTenantBrandingBySlug` + login dinámico por slug / neutral |
| Shell | Topbar, sidebar cores, ForgeAppSidebar, NavRail monetización → `display_name` API |
| Credit Hub | ForgeLogo/Wordmark, portal home, CHTenantGuard, AdminNetworkOsView |
| Consent i18n | Copy parametrizado por `institutionName` (wizard + público) |
| PWA | `PWAInstallPrompt` → `Instalar {display_name}`; manifest neutro |
| Metadata | Root/forge/public layouts → títulos neutros; `TenantBrandedDocumentTitle` post-auth |

---

## Tests obligatorios

| # | Criterio | Resultado |
|---|----------|-----------|
| 1 | Tenant A ve su display_name | ✅ `brand-display.test.ts` Credicefi |
| 2 | Tenant B ve el suyo | ✅ `brand-display.test.ts` Banco Piloto RD |
| 3 | Banco externo no ve "Nadakki" literal | ✅ fallbacks + grep posterior |
| 4 | Login branding dinámico o neutral | ✅ `login-page.test.tsx` |
| 5 | typecheck OK | ✅ `tsc --noEmit` |
| 6 | build OK | ✅ `npm run build` |

---

## Grep posterior — "Nadakki" en alcance UI

### Cero hits visibles (clase a resuelta)

- `app/layout.tsx` — limpio
- `app/(auth)/login/page.tsx` — solo URL backend warmup (clase b)
- `components/forge/layout/*` — solo `nadakki-sidebar-collapsed` (clase b)
- `components/pwa/*` — solo localStorage keys (clase b)
- `lib/credit-hub/i18n/*` — limpio
- `public/manifest.json` — limpio

### Hits restantes (clase b — técnico, OK)

| Archivo | Contexto |
|---------|----------|
| `login/page.tsx:16` | `nadakki-ai-suite.onrender.com/health` warmup |
| `ForgeGlobalCoresSidebar.tsx:36` | localStorage key |
| `PWAInstallPrompt.tsx:10-11` | localStorage keys |
| `BankDashboardView.tsx:44` | demo detection logic |
| `DealerDashboardView.tsx:59` | demo detection logic |
| `WelcomeGuide.tsx:6` | storage key |

### Tenant Nadakki

Si `tenant_branding.display_name === "Nadakki"`, la UI **sí** muestra "Nadakki" — comportamiento esperado.

---

## Verificación manual recomendada (César)

1. Login como **Credicefi** → título/login sin "Nadakki"
2. Login como **Banco Piloto RD** → display_name propio en topbar/sidebar
3. Consent público token real → footer/checkbox con nombre institución
4. Tenant Nadakki (si aplica) → branding API puede seguir mostrando "Nadakki"

---

*No merge hasta GO explícito de César.*

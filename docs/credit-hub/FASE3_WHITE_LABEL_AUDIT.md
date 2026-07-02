# FASE 3 White-Label — PASO 1 AUDIT

**Fecha:** 2026-07-02  
**Alcance:** `app/layout.tsx`, login, header/sidebar/footer, i18n consent, PWA, metadata  
**Clasificación:** **(a)** marca visible al usuario → reemplazar · **(b)** identificador técnico → NO tocar

---

## Resumen

| Clase | Hits en alcance | Acción BUILD |
|-------|-----------------|--------------|
| **(a) visible** | 28 | Reemplazar con branding API / neutral |
| **(b) técnico** | 12 | Sin cambio |

---

## (a) Marca visible — reemplazar

| Archivo | Línea | Contexto |
|---------|-------|----------|
| `app/layout.tsx` | 12 | `title: "Nadakki Credit"` (metadata root) |
| `app/layout.tsx` | 18 | `appleWebApp.title: "Nadakki"` |
| `app/layout.tsx` | 61 | `<meta apple-mobile-web-app-title content="Nadakki" />` |
| `app/(auth)/login/page.tsx` | 58 | `<h1>Nadakki AI Suite</h1>` |
| `app/(auth)/login/page.tsx` | 126 | footer `Nadakki AI Suite - Multi-tenant Platform` |
| `app/(forge)/layout.tsx` | 4 | `title: "Nadakki Forge"` |
| `app/(public)/layout.tsx` | 4 | `title: "Nadakki — Autorización"` |
| `app/m/layout.tsx` | 4 | `title: "Nadakki — Carga de documento"` |
| `app/m/layout.tsx` | 14 | header `<p>Nadakki</p>` |
| `app/dashboard/layout.tsx` | 3 | `title: 'AI Agents Dashboard \| Nadakki'` |
| `app/market-intel/layout.tsx` | 5 | `title: "Inteligencia de Mercado \| Nadakki"` |
| `public/manifest.json` | 3–4 | `"name": "Nadakki Credit"`, `"short_name": "Nadakki"` |
| `components/pwa/PWAInstallPrompt.tsx` | 88 | `<h3>Instalar Nadakki</h3>` |
| `components/forge/layout/ForgeGlobalTopbar.tsx` | 19, 26 | fallback title `"NADAKKI"` |
| `components/forge/layout/ForgeGlobalTopbar.tsx` | 70 | link texto `Nadakki` |
| `components/forge/layout/ForgeGlobalCoresSidebar.tsx` | 124, 136 | sidebar brand `Nadakki AI Suite` |
| `components/forge/layout/ForgeGlobalCoresSidebar.tsx` | 134 | collapsed fallback `"N"` (aceptable si es inicial del tenant) |
| `components/forge/layout/ForgeAppSidebar.tsx` | 102 | label `Nadakki` |
| `components/credit-hub/monetizacion/shell/NavRail.tsx` | 19 | `Credit Hub · Nadakki` |
| `components/credit-hub/brand/ForgeLogo.tsx` | 30, 53 | aria + wordmark `Nadakki Forge` |
| `components/credit-hub/brand/ForgeWordmark.tsx` | 13 | `Nadakki Forge` |
| `components/credit-hub/system/CHTenantGuard.tsx` | 30 | copy `Nadakki Forge` |
| `components/credit-hub/admin/AdminNetworkOsView.tsx` | 30 | copy operador `Nadakki` |
| `lib/credit-hub/i18n/locales/es-DO/credit-hub.ts` | 420 | `consent_data_policy_label` con Nadakki |
| `lib/credit-hub/i18n/locales/es-DO/credit-hub.ts` | 468 | `footer_brand` con Nadakki |
| `lib/credit-hub/i18n/locales/es-DO/credit-hub.ts` | 476 | `checkbox_DATA_POLICY` con Nadakki |

**Nota:** `ForgeGlobalTopbar` y `ForgeGlobalCoresSidebar` ya consumen `useTenantBranding()` para logo/título parcial; persisten fallbacks hardcodeados.

---

## (b) Identificador técnico — NO tocar

| Archivo | Línea | Contexto |
|---------|-------|----------|
| `app/(auth)/login/page.tsx` | 11 | URL `https://nadakki-ai-suite.onrender.com/health` (warmup backend) |
| `components/forge/layout/ForgeGlobalCoresSidebar.tsx` | 35 | `localStorage` key `nadakki-sidebar-collapsed` |
| `components/pwa/PWAInstallPrompt.tsx` | 6–7 | keys `nadakki_pwa_*` |
| `components/providers/ThemeProvider.tsx` | 20, 38 | key `nadakki-theme` |
| `lib/credit-hub/api/consent-client.ts` | 5 | `nadakki_sic_token` |
| `components/forge/credit-hub/dealer/DealerWizardProvider.tsx` | 41 | storage key wizard |
| `components/credit-hub/onboarding/WelcomeGuide.tsx` | 6 | storage key onboarding |
| `components/credit-hub/bank/BankDashboardView.tsx` | 44 | lógica demo `includes("nadakki")` |
| `components/credit-hub/dealer/DealerDashboardView.tsx` | 59 | lógica demo `includes("nadakki")` |
| `app/bank/analytics/layout.tsx` | 49 | doc `nadakki_role` en comentario UI dev |
| `docs/PWA_*.md` | varios | documentación interna (fuera de UI runtime) |

---

## Hook existente

`lib/hooks/useTenantBranding.ts` — **ya existe**; fetch autenticado `GET /api/v2/tenants/{id}/branding`.  
Login pre-auth requiere hook público por slug (`usePublicTenantBrandingBySlug`) con fallback neutral.

---

*PASO 2 BUILD procede solo sobre hits (a).*

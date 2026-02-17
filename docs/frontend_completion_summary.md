# Frontend Marketing Sync - Completion Summary

**Branch:** `marketing-frontend-sync`  
**Date:** 2026-02-17  
**Build:** ✅ 0 errors | 131 páginas

---

## Creados

| Archivo | Descripción |
|---------|-------------|
| `lib/api/marketing.ts` | API client con fallback chain para `/api/catalog`, `/api/catalog/marketing/agents`, `/api/agents`. Funciones: `fetchMarketingAgents`, `fetchSocialStatus`, `getOAuthConnectUrl`, `disconnectPlatform` |
| `hooks/useMarketingAgents.ts` | Hook `"use client"` con estado `{ agents, total, loading, error }`, retry 1x a los 3s en caso de error |
| `hooks/useSocialConnections.ts` | Hook `"use client"` con `{ platforms, loading, error, connecting }`, `fetchStatus`, `connect`, `disconnect`. Detecta `?success=` y `?error=` en URL para toasts |
| `app/marketing/social-connections/page.tsx` | Página server con Suspense |
| `app/marketing/social-connections/SocialConnectionsClient.tsx` | UI de conexiones: Meta y Google activos, TikTok/LinkedIn/X/Pinterest "Próximamente" |
| `app/marketing/google-ads/page.tsx` | Página server con Suspense |
| `app/marketing/google-ads/GoogleAdsClient.tsx` | UI: banner si Google no conectado, customer_ids si conectado, 5 agentes (BudgetPacingIA, StrategistIA, RSACopyGeneratorIA, SearchTermsCleanerIA, OrchestratorAgent) |
| `app/marketing/overview/OverviewClient.tsx` | Cliente para overview (Suspense boundary) |

---

## Modificados

| Archivo | Cambios |
|---------|---------|
| `app/marketing/overview/page.tsx` | Reemplazado por página server con Suspense + OverviewClient. Mock data sustituido por `useMarketingAgents()` y `useSocialConnections()`. Agentes con nombre, categoría, status badge, botón "Ejecutar". Loading skeleton, error con "Reintentar". Sección de plataformas conectadas arriba |
| `components/layout/Sidebar.tsx` | Corregido destructuring de `useAgents()`: `{ agents, loading: isLoading }` (antes usaba `data` e `isLoading` inexistentes) |

---

## Endpoints utilizados

- **Marketing agents:** Fallback entre  
  `GET /api/catalog?module=marketing&limit=N`,  
  `GET /api/catalog/marketing/agents?limit=N`,  
  `GET /api/agents?module=marketing&limit=N`
- **Social status:** `GET /api/social/status/{tenant_id}`
- **OAuth connect:** `GET /auth/{platform}/connect/{tenant_id}` → redirect
- **Disconnect:** `DELETE /auth/{platform}/disconnect/{tenant_id}`

---

## Variables de entorno

- `NEXT_PUBLIC_API_URL` (default: `https://nadakki-ai-suite.onrender.com`)
- `NEXT_PUBLIC_TENANT_ID` (default: `tenant_credicefi`)

---

## Rutas nuevas

- `/marketing/overview` — Overview con agentes y plataformas conectadas
- `/marketing/social-connections` — Conexiones OAuth (Meta, Google activos)
- `/marketing/google-ads` — Agentes de Google Ads y estado de conexión

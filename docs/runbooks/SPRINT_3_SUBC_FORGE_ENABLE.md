# Habilitar Forge (Credit Hub) en nadakki-demo

## Problema
Banner en dashboard.nadakki.com:
"Forge está instalado pero deshabilitado en este entorno"

## Root Cause
Feature flag controlado por variable de entorno `ROUTEONE_PARITY_ENABLED`
en el backend (Render).

## Flujo del Feature Flag

```
Backend env var: ROUTEONE_PARITY_ENABLED
  → services/sic/routeone_common.py:routeone_parity_enabled()
  → routers/sic_routeone_health_router.py:routeone_health()
    returns { routeone_parity_enabled: true/false }
  → Dashboard: lib/credit-hub/api/health.ts → GET /api/v1/sic/routeone/health
  → Dashboard: lib/credit-hub/hooks/useFeatureFlag.ts
  → Dashboard: components/credit-hub/system/CHFeatureFlagBanner.tsx
    shows banner when enabled === false
```

## Archivos Clave

### Backend (nadakki-ai-suite)
- `services/sic/routeone_common.py:14-16` — lee env var
- `routers/sic_routeone_health_router.py:15-26` — health endpoint
- `services/sic/routeone_common.py:84-92` — require_routeone_enabled_sync() raises 503 si disabled

### Dashboard (nadakki-dashboard)
- `lib/credit-hub/hooks/useFeatureFlag.ts` — hook que consulta health
- `components/credit-hub/system/CHFeatureFlagBanner.tsx` — banner component
- `lib/credit-hub/i18n/locales/es-DO/credit-hub.ts:370-371` — texto del banner

## Accion Requerida (Cesar en Render Dashboard)

1. Ir a Render Dashboard → nadakki-ai-suite service
2. Settings → Environment → Add/Edit:
   ```
   ROUTEONE_PARITY_ENABLED=true
   ```
3. Save & Deploy (trigger redeploy)
4. Verificar: `curl https://api.nadakki.com/api/v1/sic/routeone/health`
   Debe retornar: `{ "routeone_parity_enabled": true, ... }`
5. Recargar dashboard — banner debe desaparecer

## NO es codigo — es configuracion de entorno.

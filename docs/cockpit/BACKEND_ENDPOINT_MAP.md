# BACKEND ENDPOINT MAP — Cockpit

Fuente de verdad para todos los fetch del cockpit frontend.
Última reconciliación: 2026-07-10 (PR r0-reconcile-prefixes).

## Endpoints reales (backend `nadakki-ai-suite`)

Prefijo canónico: `/api/v1/cockpit/*`.

### Network
- GET /api/v1/cockpit/network/health
- GET /api/v1/cockpit/network/cores
- GET /api/v1/cockpit/network/overview
- GET /api/v1/cockpit/network/stats

### Credit
- GET /api/v1/cockpit/credit/summary
- GET /api/v1/cockpit/credit/by-tenant
- GET /api/v1/cockpit/credit/by-status
- GET /api/v1/cockpit/credit/pipeline
- GET /api/v1/cockpit/credit/recent?n=N

### Tenants
- GET    /api/v1/cockpit/tenants
- GET    /api/v1/cockpit/tenants/{id}
- POST   /api/v1/cockpit/tenants
- PATCH  /api/v1/cockpit/tenants/{id}
- DELETE /api/v1/cockpit/tenants/{id}

### Users
- GET   /api/v1/cockpit/users
- GET   /api/v1/cockpit/users/{id}
- POST  /api/v1/cockpit/users
- PATCH /api/v1/cockpit/users/{id}
- POST  /api/v1/cockpit/users/{id}/reset-password

## Endpoints que el frontend invoca pero NO existen en backend (DEMO permanente hasta Finance Core)

- /api/v1/cockpit/credit/compliance/aml — AML panel
- /api/v1/cockpit/plans — plans catalog
- /api/v1/cockpit/users/roles — roles enum

Estos caen en DEMO badge automáticamente vía fetchOrDemo catch-404. NO son bugs.

## Regla dura

Cualquier fetch del cockpit va exclusivamente por `platformFetch` a paths con prefijo `/api/v1/cockpit/*`.
Prefijos legados (`/observability/v1`, `/credit-hub/v1`, `/tenant-admin/v1`, `/auth-users/v1`) están extintos.
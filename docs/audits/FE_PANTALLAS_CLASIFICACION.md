# FE-A2Z · Clasificación de Pantallas

## DEV_ONLY (no accesibles en producción)

| Ruta | Estado | Notas |
|------|--------|-------|
| /credit-hub/components | ✓ Bloqueada (F1) | `notFound()` en producción |
| /credit-hub/preview | ✓ Bloqueada (F1) | `notFound()` en producción |
| /credit-hub/_design/shell-preview | ✓ Bloqueada | `notFound()` en producción |
| /credit-hub/monetizacion/sandbox | Expuesta | Testing sandbox - requiere bloqueo |

## VISIBLE_PRODUCT (deben entrar al menú)

| Ruta | Propósito | Nav Actual | Acción |
|------|-----------|------------|--------|
| /credit-hub/bank/escalations | Escalaciones KYC/OCR del backend | NO | Agregar a BankSideNav |

## ROLE_GATED (visible según rol)

| Ruta | Propósito | Roles | Estado |
|------|-----------|-------|--------|
| /credit-hub/bank/vehicles | VIN anomalies ops tool | bank_admin, bank_ops | Implementar gate |

## ADMIN (platform administration)

| Ruta | Propósito | Estado | Acción |
|------|-----------|--------|--------|
| /credit-hub/admin | Redirect a /cockpit | N/A | No es pantalla real |
| /credit-hub/admin/platform | TBD | Verificar | - |
| /credit-hub/admin/credit | TBD | Verificar | - |

## NO CLASIFICABLES (wizard steps / rutas dinámicas)

- /credit-hub/dealer/applications/new/* (wizard flow - OK)
- /credit-hub/dealer/applications/[id] (lista → detalle - OK)
- /credit-hub/bank/applications/[id] (cola → detalle - OK)

## Conteo

- DEV_ONLY: 4 (3 bloqueadas, 1 expuesta)
- VISIBLE_PRODUCT: 1
- ROLE_GATED: 1
- ADMIN: 2 pendientes verificación
- Total verificadas: 8 de ~13 mencionadas

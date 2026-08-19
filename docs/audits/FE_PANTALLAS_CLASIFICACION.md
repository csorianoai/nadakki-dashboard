# FE-A2Z · Clasificación de Pantallas

## DEV_ONLY (no accesibles en producción)

| Ruta | Estado | Notas |
|------|--------|-------|
| /credit-hub/components | ✓ Bloqueada (F1) | `notFound()` en producción |
| /credit-hub/preview | ✓ Bloqueada (F1) | `notFound()` en producción |
| /credit-hub/_design/shell-preview | ✓ Bloqueada | `notFound()` en producción |
| /credit-hub/monetizacion/sandbox | ✓ Bloqueada (PR #363) | `notFound()` en producción |

## VISIBLE_PRODUCT (deben entrar al menú)

| Ruta | Propósito | Nav Actual | Acción |
|------|-----------|------------|--------|
| /credit-hub/bank/escalations | Escalaciones KYC/OCR del backend | NO | Agregar a BankSideNav |

## ROLE_GATED (visible según rol)

| Ruta | Propósito | Roles | Estado |
|------|-----------|-------|--------|
| /credit-hub/bank/vehicles | VIN anomalies ops tool | bank_admin, bank_ops | Implementar gate |

## LEGACY_COEXIST (páginas legacy con redirects pero aún existen)

| Ruta | Equivalente Credit Hub | Redirect | Estado |
|------|------------------------|----------|--------|
| /credit/page | /credit-hub | ✓ F1 | Página existe + redirect |
| /credit/new | /credit-hub/dealer/applications/new | ✓ F1 | Página existe + redirect |
| /credit/bank/queue | /credit-hub/bank/applications | Parcial | KEEP_TEMPORARILY |
| /credit/dealer/real | N/A | NO | KEEP_TEMPORARILY |
| /credit/dealer/analytics | N/A | NO | KEEP_TEMPORARILY |
| /credit/bank/kpis | N/A | NO | KEEP_TEMPORARILY |
| /credit/pool-filters | N/A | NO | ROADMAP pendiente |

## ADMIN (platform administration)

| Ruta | Propósito | Estado | Acción |
|------|-----------|--------|--------|
| /credit-hub/admin | Redirect a /cockpit | N/A | No es pantalla real |
| /credit-hub/admin/platform | Redirect a /cockpit/tenants | N/A | No es pantalla real |
| /credit-hub/admin/credit | Redirect a /cockpit/credit | N/A | No es pantalla real |

## NO CLASIFICABLES (wizard steps / rutas dinámicas)

- /credit-hub/dealer/applications/new/* (wizard flow - OK)
- /credit-hub/dealer/applications/[id] (lista → detalle - OK)
- /credit-hub/bank/applications/[id] (cola → detalle - OK)
- /credit/[id], /credit/applications/[id] (legacy dynamic - OK)

## Conteo Final

- DEV_ONLY: 4 (todas bloqueadas)
- VISIBLE_PRODUCT: 1 (escalations)
- ROLE_GATED: 1 (vehicles)
- LEGACY_COEXIST: 7 (con notas KEEP_TEMPORARILY o ROADMAP)
- Redirects admin: 3 (no cuentan como pantallas)
- **Total clasificadas: 13 ✓**

## Notas

**LEGACY_COEXIST:** Páginas en `/credit/*` que conviven con `/credit-hub/*`. F1 creó redirects para algunas rutas padre (/credit → /credit-hub) pero las páginas legacy específicas aún existen. Marcadas KEEP_TEMPORARILY según comentarios en código legacy.

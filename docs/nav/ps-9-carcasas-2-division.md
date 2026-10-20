# PS-9-CARCASAS-2: la parte 2/3 no cabe en GR-12

Medido sobre origin/staging b17239fd (2026-10-20). Esta nota no cambia código: propone otra división.

## Por qué no cabe
- `DealerShell` (Dealer OS y Centro Operativo, además de `ContableChrome`) lleva sidebar, topbar y paleta propios. Pasarlo a
  `ModuleShell` deja `DealerSidebar`/`DealerTopbar`/`DealerCommandPalette` sin uso y obliga a reescribir unas 2.500 líneas de
  pruebas existentes que montan ese chrome (`components/dealer-management/**`, `tests/nav/credito-dealer-huerfanas`,
  `tests/dealer/ContableChrome`, `tests/app/dealer-routes-shell`, `DealerAccesoNoVerificado`…). El protocolo prohíbe borrar tests para caber.
- `ModuleShell` hoy NO aplica `capability` (lo dice `lib/modulos/tipos.ts`): el menú del dealer filtra por entitlements
  fail-closed y por `isDealerNavItemOpenable`. Migrar sin portar ese filtro cambia permisos.
- `DccShell` no es el Centro Operativo (ese usa `DealerShell`): lo consume solo `bank-v2` (`BancoV2Shell`), con tema recordado,
  buscador y campana propios, y tipos (`DccNavGroup`, `itemActivo`) que importan `_nav.ts`, `BuscadorBanco` y tests.

## División propuesta (todas contra staging)
1. **2a**: `ModuleShell` aplica `capability` (hook de entitlements + `isDealerNavItemOpenable`) con pruebas; sin migrar rutas.
2. **2b**: Dealer OS + Centro Operativo + `ContableChrome` sobre `ModuleShell` (registro `concesionarios` en `carcasa: "comun"`,
   `AppGate` sin la rama `isDealerChromePath`), conservando sincronización de dealer, avisos y tema; pruebas del chrome viejo reescritas.
3. **2c**: `bank-v2` (`DccShell`) sobre `ModuleShell`; mover los tipos de `DccShell` a un módulo propio y retirar la carcasa (grep = 0).
4. **3/3**: retirada de `DealerSidebar`/`DealerTopbar`/`DealerCommandPalette`/`DealerShell` cuando grep = 0, y e2e `volver-al-inicio`.

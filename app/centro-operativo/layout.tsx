"use client";

import { DealerShell } from "@/components/dealer-management/shell/DealerShell";

/**
 * El Centro Operativo se pinta DENTRO del panel del dealer (decision de Cesar).
 *
 * Mismo `DealerShell` que `app/autos/dealer/layout.tsx`, y por el mismo motivo:
 * el onboarding de Mapaal se lee con el menu del dealer a la vista. Antes caia
 * en la rama por defecto de `AppGate` y lo envolvia `GlobalForgeAppShell` --el
 * chrome de la Suite, con la barra de todos los hubs--, asi que un dealer que
 * pulsaba "Empezar: cargar mi stock" en su Inicio cambiaba de mundo y perdia el
 * menu desde el que habia venido.
 *
 * El enrutado va en `isDealerChromePath` (lib/autos-portal/routes.ts): este
 * layout pone el chrome, y esa funcion evita que ADEMAS se apile el de Forge.
 * Las dos piezas hacen falta; con una sola se verian dos navegaciones.
 */
export default function CentroOperativoLayout({ children }: { children: React.ReactNode }) {
  return <DealerShell>{children}</DealerShell>;
}

"use client";

import { CommandCenterV2 } from "./CommandCenterV2";

/**
 * Dealer Command Center v2 (R1). Ruta nueva: convive con /autos/dealer hasta
 * que Cesar decida el cambio; no reemplaza ninguna ruta actual del panel.
 */
export default function InicioV2Page() {
  return <CommandCenterV2 />;
}

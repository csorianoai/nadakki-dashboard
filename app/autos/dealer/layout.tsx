"use client";

import { DealerShell } from "@/components/dealer-management/shell/DealerShell";

/**
 * Cableado del chrome del panel del dealer.
 *
 * El menu "Dealer Management" que vivia aqui --NAV + NavLinks, con su propia
 * lista de rutas y sin filtrar por entitlements-- lo sustituye `DealerShell`,
 * que pinta sidebar, topbar y paleta a partir de `DEALER_NAV_GROUPS` y del
 * batch de acceso. Mantener los dos dejaria dos navegaciones del dealer en la
 * misma pantalla, que es justo lo que el shell unico viene a quitar.
 */
export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return <DealerShell>{children}</DealerShell>;
}

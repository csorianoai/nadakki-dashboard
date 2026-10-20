"use client";

import type { ReactNode } from "react";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CHPortalAccessGuard } from "@/components/credit-hub/system/CHPortalAccessGuard";

/**
 * Panel legado del banco bajo ModuleShell (PS-9-CARCASAS-1): la barra, las migas, el menú y el cierre de sesión son
 * los de la Suite (AppGate), así que aquí solo quedan las guardas y el contenedor `credit-hub-forge`, que da las
 * variables `--ch-*` y la persona a las páginas.
 */
export function BankChShell({ children }: { children: ReactNode }) {
  return (
    <CHTenantGuard>
      <CHPortalAccessGuard portal="bank">
        <div className="credit-hub-forge" data-persona="bank" style={{ background: "var(--ch-bg)" }}>
          <div id="ch-main" style={{ maxWidth: 1440, margin: "0 auto", padding: 24 }}>{children}</div>
        </div>
      </CHPortalAccessGuard>
    </CHTenantGuard>
  );
}

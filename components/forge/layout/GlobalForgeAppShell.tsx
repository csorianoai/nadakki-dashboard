"use client";

import { useState, type ReactNode } from "react";
import { forgeAppDataTenantAttribute } from "@/lib/credit-hub/forge-test-tenant-override";
import { DealerSuiteGate } from "@/components/dealer/DealerSuiteGate";
import { ForgeAppShell } from "./ForgeAppShell";
import { CLASES_FUENTES_FORGE } from "@/components/shell/fuentes-forge";
import { ForgeGlobalCoresSidebar } from "./ForgeGlobalCoresSidebar";
import { ForgeGlobalTopbar } from "./ForgeGlobalTopbar";
import { TenantBrandedDocumentTitle } from "@/components/white-label/TenantBrandedDocumentTitle";
import { BuscadorNavegacion } from "@/components/nav/BuscadorNavegacion";
import { PestanasMarketing } from "@/components/nav/PestanasMarketing";

/**
 * Root Forge chrome for authenticated app surfaces: cores sidebar, unified top bar,
 * and main slot for route layouts (Credit Hub, Legal, dashboard pages, etc.).
 *
 * Full-bleed Credit Hub portals (bank/dealer/monetización flag ON) hide this chrome via
 * `html[data-ch-portal-full]` — set in {@link CreditHubLayoutClient}, not here.
 */
export function GlobalForgeAppShell({ children }: { children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const forgeTenantAttr = forgeAppDataTenantAttribute();

  return (
    <DealerSuiteGate>
    <div
      className={`${CLASES_FUENTES_FORGE} forge-app flex h-screen flex-col overflow-hidden antialiased`}
      data-tenant={forgeTenantAttr}
    >
      <ForgeAppShell
        sidebar={
          <ForgeGlobalCoresSidebar mobileOpen={mobileNav} onNavigate={() => setMobileNav(false)} />
        }
        topbar={<ForgeGlobalTopbar onMenuClick={() => setMobileNav((o) => !o)} />}
      >
        <TenantBrandedDocumentTitle />
        <PestanasMarketing />
        {children}
      </ForgeAppShell>
      <BuscadorNavegacion />
    </div>
    </DealerSuiteGate>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { forgeAppDataTenantAttribute } from "@/lib/credit-hub/forge-test-tenant-override";
import { DealerSuiteGate } from "@/components/dealer/DealerSuiteGate";
import { ForgeAppShell } from "./ForgeAppShell";
import { ForgeGlobalCoresSidebar } from "./ForgeGlobalCoresSidebar";
import { ForgeGlobalTopbar } from "./ForgeGlobalTopbar";
import { TenantBrandedDocumentTitle } from "@/components/white-label/TenantBrandedDocumentTitle";
import { systemFont } from "@/lib/fonts/system-fonts";

// Pilas del sistema (sin Google Fonts): valores en :root de app/globals.css.
const fontSans = systemFont("--forge-font-sans");
const fontMono = systemFont("--forge-font-mono-opt");
const fontDisplay = systemFont("--forge-font-display-opt");

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
      className={`${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable} forge-app flex h-screen flex-col overflow-hidden antialiased`}
      data-tenant={forgeTenantAttr}
    >
      <ForgeAppShell
        sidebar={
          <ForgeGlobalCoresSidebar mobileOpen={mobileNav} onNavigate={() => setMobileNav(false)} />
        }
        topbar={<ForgeGlobalTopbar onMenuClick={() => setMobileNav((o) => !o)} />}
      >
        <TenantBrandedDocumentTitle />
        {children}
      </ForgeAppShell>
    </div>
    </DealerSuiteGate>
  );
}

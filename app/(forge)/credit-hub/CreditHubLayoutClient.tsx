"use client";

import { useEffect } from "react";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import "./forge-globals.css";
import "@/app/credit-hub/credit-hub.css";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { DemoModeBanner } from "@/components/forge/ui/DemoModeBanner";
import { ForgeCreditHubAppShell } from "@/components/forge";
import { ForgeCommandPaletteProvider } from "@/components/forge/layout/ForgeCommandPaletteContext";
import { creditHubPersonaFromLayoutSegments } from "@/components/forge/layout/creditHubPersonaFromSegments";
import { PersonaProvider } from "@/components/credit-hub/system/PersonaProvider";
import { CHFeatureFlagBanner } from "@/components/credit-hub/system/CHFeatureFlagBanner";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { ForgeToaster } from "@/components/forge/ui/Toast";
import { usaCarcasaComun } from "@/lib/modulos/registro";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { isMonetizacionPath } from "@/lib/credit-hub/monetizacion/routes";
import { isForgeMonetizacionEnabled } from "@/lib/env/feature-forge-monetizacion";

function CreditHubDemoBannerGate({ active }: { active: boolean }) {
  const { tenantConfig } = useTenantConfig();
  if (!active) return null;
  return <DemoModeBanner isDemo={tenantConfig.is_demo === true} />;
}

/** Con ModuleShell encima (AppGate) el menú y la barra son los de la Suite: solo quedan persona, guarda, paleta y avisos. */
function CreditHubSinCarcasa({ children }: { children: React.ReactNode }) {
  const persona = creditHubPersonaFromLayoutSegments(useSelectedLayoutSegments());
  return (
    <PersonaProvider persona={persona}>
      <div className="flex min-h-0 flex-1 flex-col text-forgeGray-800" data-portal={persona}>
        <CHFeatureFlagBanner />
        <CHTenantGuard>
          <ForgeCommandPaletteProvider>{children}</ForgeCommandPaletteProvider>
        </CHTenantGuard>
        <ForgeToaster />
      </div>
    </PersonaProvider>
  );
}

export function CreditHubLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBankPortal = pathname?.startsWith("/credit-hub/bank");
  const isDealerPortal = pathname?.startsWith("/credit-hub/dealer");
  const isAdminCockpit = pathname?.startsWith("/credit-hub/admin");
  const monetizacionActive =
    isMonetizacionPath(pathname) && isForgeMonetizacionEnabled();
  const isChPortal = isBankPortal || isDealerPortal || monetizacionActive;

  useEffect(() => {
    const root = document.documentElement;
    if (isChPortal) {
      root.setAttribute("data-ch-portal-full", "true");
    } else {
      root.removeAttribute("data-ch-portal-full");
    }
    return () => root.removeAttribute("data-ch-portal-full");
  }, [isChPortal]);

  useEffect(() => {
    const root = document.documentElement;
    if (isBankPortal) {
      root.setAttribute("data-bank-portal-full", "true");
    } else {
      root.removeAttribute("data-bank-portal-full");
    }
    return () => root.removeAttribute("data-bank-portal-full");
  }, [isBankPortal]);

  return (
    <>
      <CreditHubI18nBootstrap />
      <CreditHubDemoBannerGate active={isChPortal} />
      {isChPortal || isAdminCockpit ? (
        children
      ) : usaCarcasaComun(pathname) ? (
        <CreditHubSinCarcasa>{children}</CreditHubSinCarcasa>
      ) : (
        <ForgeCreditHubAppShell>{children}</ForgeCreditHubAppShell>
      )}
    </>
  );
}

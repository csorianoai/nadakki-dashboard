"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import "./forge-globals.css";
import "@/app/credit-hub/credit-hub.css";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { DemoModeBanner } from "@/components/forge/ui/DemoModeBanner";
import { ForgeCreditHubAppShell } from "@/components/forge";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { isMonetizacionPath } from "@/lib/credit-hub/monetizacion/routes";
import { isForgeMonetizacionEnabled } from "@/lib/env/feature-forge-monetizacion";

function CreditHubDemoBannerGate({ active }: { active: boolean }) {
  const { tenantConfig } = useTenantConfig();
  if (!active) return null;
  return <DemoModeBanner isDemo={tenantConfig.is_demo === true} />;
}

export function CreditHubLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBankPortal = pathname?.startsWith("/credit-hub/bank");
  const isDealerPortal = pathname?.startsWith("/credit-hub/dealer");
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
      {isChPortal ? children : <ForgeCreditHubAppShell>{children}</ForgeCreditHubAppShell>}
    </>
  );
}

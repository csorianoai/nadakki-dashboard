"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import "./forge-globals.css";
import "@/app/credit-hub/credit-hub.css";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { ForgeCreditHubAppShell } from "@/components/forge";

export function CreditHubLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBankPortal = pathname?.startsWith("/credit-hub/bank");
  const isDealerPortal = pathname?.startsWith("/credit-hub/dealer");
  const isChPortal = isBankPortal || isDealerPortal;

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
      {isChPortal ? children : <ForgeCreditHubAppShell>{children}</ForgeCreditHubAppShell>}
    </>
  );
}

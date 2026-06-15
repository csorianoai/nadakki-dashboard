"use client";

import { usePathname } from "next/navigation";
import "./forge-globals.css";
import "@/app/credit-hub/credit-hub.css";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { ForgeCreditHubAppShell } from "@/components/forge";

export function CreditHubLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBankPortal = pathname?.startsWith("/credit-hub/bank");

  return (
    <>
      <CreditHubI18nBootstrap />
      {isBankPortal ? children : <ForgeCreditHubAppShell>{children}</ForgeCreditHubAppShell>}
    </>
  );
}

"use client";

import "./forge-globals.css";
import "@/app/credit-hub/credit-hub.css";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { ForgeCreditHubAppShell } from "@/components/forge";

export function CreditHubLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CreditHubI18nBootstrap />
      <ForgeCreditHubAppShell>{children}</ForgeCreditHubAppShell>
    </>
  );
}

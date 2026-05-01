"use client";

import "./forge-globals.css";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { ForgeCreditHubAppShell } from "@/components/forge";

export default function CreditHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CreditHubI18nBootstrap />
      <ForgeCreditHubAppShell>{children}</ForgeCreditHubAppShell>
    </>
  );
}

"use client";

import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";

export default function CreditHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CreditHubI18nBootstrap />
      {children}
    </>
  );
}

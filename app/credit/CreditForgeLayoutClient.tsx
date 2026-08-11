"use client";

import { type ReactNode } from "react";
import "@/app/(forge)/credit-hub/forge-globals.css";
import "@/app/credit-hub/credit-hub.css";
import { CHQueryProvider } from "@/components/credit-hub/system/CHQueryProvider";
import { CreditHubI18nBootstrap } from "@/components/credit-hub/system/CreditHubI18nBootstrap";
import { BankChShell } from "@/components/credit-hub/bank/BankChShell";

/** Forge bank shell for legacy `/credit/*` routes without moving page files. */
export function CreditForgeLayoutClient({ children }: { children: ReactNode }) {
  return (
    <CHQueryProvider>
      <CreditHubI18nBootstrap />
      <BankChShell>{children}</BankChShell>
    </CHQueryProvider>
  );
}

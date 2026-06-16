"use client";

import { type ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";
import { BankChShell } from "@/components/credit-hub/bank/BankChShell";

export default function BankLayout({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary segment="credit-hub.bank">
      <div className="credit-hub-bank-portal flex min-h-0 min-w-0 flex-1 flex-col">
        <BankChShell>{children}</BankChShell>
      </div>
    </RouteErrorBoundary>
  );
}

"use client";

import { type ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";
import { BankChShell } from "@/components/credit-hub/bank/BankChShell";

export default function BankLayout({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary segment="credit-hub.bank">
      <BankChShell>{children}</BankChShell>
    </RouteErrorBoundary>
  );
}

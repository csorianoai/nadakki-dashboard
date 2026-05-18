"use client";

import { type ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";

export default function BankLayout({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary segment="credit-hub.bank">
      <div className="mx-auto w-full max-w-7xl p-4 md:p-8">{children}</div>
    </RouteErrorBoundary>
  );
}

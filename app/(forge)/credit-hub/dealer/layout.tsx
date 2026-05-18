"use client";

import { type ReactNode } from "react";
import { DealerBottomNav } from "@/components/credit-hub/navigation/DealerBottomNav";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";

export default function DealerLayout({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary segment="credit-hub.dealer">
      <>
        <div className="mx-auto max-w-7xl pb-20 lg:pb-8">{children}</div>
        <DealerBottomNav />
      </>
    </RouteErrorBoundary>
  );
}

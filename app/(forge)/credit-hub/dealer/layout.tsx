"use client";

import { RouteErrorBoundary } from "@/lib/observability/error-boundary";
import { DealerChShell } from "@/components/credit-hub/dealer/DealerChShell";
import type { ReactNode } from "react";

export default function DealerLayout({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary segment="credit-hub.dealer">
      <DealerChShell>{children}</DealerChShell>
    </RouteErrorBoundary>
  );
}

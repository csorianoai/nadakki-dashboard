"use client";

import type { ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";

export default function CreditDealerLayout({ children }: { children: ReactNode }) {
  return <RouteErrorBoundary segment="credit.dealer">{children}</RouteErrorBoundary>;
}

"use client";

import type { ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";

export default function BankRouteGroupLayout({ children }: { children: ReactNode }) {
  return <RouteErrorBoundary segment="(bank)">{children}</RouteErrorBoundary>;
}

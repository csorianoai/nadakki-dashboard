"use client";

import type { ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";

export default function DealerRouteGroupLayout({ children }: { children: ReactNode }) {
  return <RouteErrorBoundary segment="(dealer)">{children}</RouteErrorBoundary>;
}

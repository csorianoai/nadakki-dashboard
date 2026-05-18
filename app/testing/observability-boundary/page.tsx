"use client";

import { RouteErrorBoundary } from "@/lib/observability/error-boundary";

function Bomb(): never {
  throw new Error("e2e-observability-boundary");
}

/** Used by Playwright EP-T3-2 to assert {@link RouteErrorBoundary} fallback UI. */
export default function ObservabilityBoundaryTestPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <p className="mb-4 text-sm text-slate-400">E2E · EP-T3-2 · error boundary</p>
      <RouteErrorBoundary segment="testing.observability">
        <Bomb />
      </RouteErrorBoundary>
    </div>
  );
}

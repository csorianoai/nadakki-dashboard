"use client";

import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { DEMO_LABEL } from "../demo";

export function DemoPanelBadge({ hint }: { hint?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="cockpit-demo-badge">
      <DataTruthBadge level="DEMO" />
      <span className="text-xs text-[var(--ch-text-3)]">{hint ?? DEMO_LABEL}</span>
    </div>
  );
}

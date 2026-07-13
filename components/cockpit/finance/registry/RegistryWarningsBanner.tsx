"use client";

import type { CockpitStructuredWarning } from "@/lib/cockpit/finance-v3/warnings";
import { warningBannerClass } from "@/lib/cockpit/finance-v3/warnings";

export function RegistryWarningsBanner({ warnings }: { warnings: CockpitStructuredWarning[] }) {
  if (!warnings.length) return null;
  return (
    <div className="space-y-2" data-testid="registry-warnings">
      {warnings.map((w) => (
        <div
          key={`${w.code}-${w.message}`}
          className={`rounded-lg border px-3 py-2 text-sm ${warningBannerClass(w.severity)}`}
          role="status"
        >
          <span className="font-mono text-xs opacity-80">{w.code}</span>
          <span className="mx-2">·</span>
          {w.message}
        </div>
      ))}
    </div>
  );
}

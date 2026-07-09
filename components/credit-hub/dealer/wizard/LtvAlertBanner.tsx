"use client";

import type { LtvAlertLevel } from "@/lib/credit-hub/dealer/ltv-alert";

export function LtvAlertBanner({ level, message }: { level: LtvAlertLevel; message: string | null }) {
  if (!message || level === "none") return null;
  const isDanger = level === "danger";
  return (
    <div
      role="status"
      data-testid="ltv-alert-banner"
      data-ltv-level={level}
      className="rounded-forge-md border px-3 py-2 text-forge-sm"
      style={{
        borderColor: isDanger ? "#fca5a5" : "#fcd34d",
        background: isDanger ? "#fef2f2" : "#fffbeb",
        color: isDanger ? "#991b1b" : "#92400e",
      }}
    >
      {message}
    </div>
  );
}

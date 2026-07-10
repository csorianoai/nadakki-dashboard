"use client";

import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

export function NetworkHealthCard({
  label,
  value,
  alert,
  dot,
  dotLabel,
  isDemo,
}: {
  label: string;
  value: string;
  alert?: boolean;
  dot?: "green" | "yellow" | "red";
  dotLabel?: string;
  isDemo?: boolean;
}) {
  const dotClass =
    dot === "green" ? "bg-cockpit-ok" : dot === "red" ? "bg-cockpit-err" : "bg-cockpit-warn";

  return (
    <div className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-cockpit-muted">{label}</p>
        {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      </div>
      {dot ? (
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${dotClass}`} />
          <span className="font-cockpitMono text-2xl tabular-nums text-cockpit-text">{dotLabel ?? value}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className={`font-cockpitMono text-[40px] leading-none tabular-nums ${alert ? "text-cockpit-err" : "text-cockpit-text"}`}>
            {value}
          </p>
          {alert ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cockpit-err text-xs font-bold text-white">
              !
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

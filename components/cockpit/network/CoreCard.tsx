"use client";

import Link from "next/link";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { CoreSummaryItem } from "@/lib/cockpit/types";
import { CORE_INITIALS, type PlatformCoreCode } from "@/lib/cockpit/core-registry";
import { Sparkline7d } from "./Sparkline7d";

const STATUS_LABEL: Record<string, string> = {
  healthy: "Producción",
  degraded: "Beta",
  down: "Caído",
  unknown: "Desarrollo",
};

export function CoreCard({ core, isDemo }: { core: CoreSummaryItem; isDemo?: boolean }) {
  const code = core.core_code as PlatformCoreCode;
  const color = core.color_hex ?? "#a78bfa";
  const sem =
    core.semaphore === "green" ? "bg-cockpit-ok" : core.semaphore === "red" ? "bg-cockpit-err" : "bg-cockpit-warn";
  const initials = CORE_INITIALS[code] ?? code.slice(0, 2).toUpperCase();
  const cardDemo = isDemo || core.data_source === "none";

  const inner = (
    <article
      className="relative flex h-full flex-col rounded-xl border border-cockpit-border bg-cockpit-surface p-6"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
      data-testid={`core-card-${code}`}
    >
      {cardDemo ? (
        <div className="absolute right-4 top-4">
          <DataTruthBadge level="DEMO" />
        </div>
      ) : null}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold"
            style={{ background: `${color}22`, color }}
          >
            {initials}
          </div>
          <h3 className="text-lg font-semibold text-cockpit-text">{core.display_name}</h3>
        </div>
        <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${sem}`} title={core.status} />
      </div>
      <span
        className="mb-4 inline-flex w-fit rounded px-2 py-0.5 text-[10px] font-medium uppercase"
        style={{ background: `${color}18`, color }}
      >
        {STATUS_LABEL[core.status] ?? core.status}
      </span>
      <div className="mb-4 flex flex-wrap gap-6">
        {(core.metrics ?? []).slice(0, 3).map((m) => (
          <div key={m.label}>
            <p className="font-cockpitMono text-[32px] leading-none tabular-nums text-cockpit-text">{m.value}</p>
            <p className="mt-1 text-xs text-cockpit-muted">{m.label}</p>
          </div>
        ))}
      </div>
      {core.sparkline_7d?.length ? <Sparkline7d values={core.sparkline_7d} color={color} /> : null}
      {code === "credit_hub" ? (
        <p className="mt-4 text-sm text-cockpit-accent">Ver inmersión →</p>
      ) : null}
    </article>
  );

  if (code === "credit_hub") {
    return (
      <Link href="/cockpit/credit" className="block transition-opacity hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}

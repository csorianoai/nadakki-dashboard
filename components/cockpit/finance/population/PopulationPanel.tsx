"use client";

import type { ReactNode } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { cockpitDataSourceToBadgeLevel } from "@/lib/cockpit/finance-v3/data-source";
import type { CockpitDataSource } from "@/lib/cockpit/finance-v3/envelope";

export function PopulationPanel({
  title,
  dataSource,
  children,
  onRetry,
}: {
  title: string;
  dataSource: CockpitDataSource;
  children: ReactNode;
  onRetry?: () => void;
}) {
  const badge = cockpitDataSourceToBadgeLevel(dataSource);
  return (
    <section className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-cockpit-text">{title}</h3>
        <DataTruthBadge level={badge} onRetry={onRetry} />
      </div>
      {children}
    </section>
  );
}

export function PopulationNonePlaceholder({ message }: { message: string }) {
  return (
    <p className="text-sm text-cockpit-muted" data-testid="population-none-placeholder">
      {message}
    </p>
  );
}

export function PopulationErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-cockpit-err/30 bg-cockpit-err/10 px-3 py-2 text-xs text-cockpit-err">
      {message}
    </p>
  );
}

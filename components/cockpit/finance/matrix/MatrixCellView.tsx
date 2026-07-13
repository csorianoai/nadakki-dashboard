"use client";

import Link from "next/link";
import type { MatrixCell } from "@/lib/cockpit/finance-v3/contracts/matrix";
import { cockpitDataSourceToBadgeLevel } from "@/lib/cockpit/finance-v3/data-source";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

const CELL_CLASS: Record<MatrixCell["data_source"], string> = {
  live: "text-cockpit-text",
  none: "text-cockpit-muted",
  partial: "text-orange-400",
  stale: "text-violet-400",
  error: "text-red-400",
  demo: "text-yellow-400",
  derived: "text-blue-300",
};

export function MatrixCellView({
  cell,
  tenantSlug,
  onRetry,
}: {
  cell: MatrixCell;
  tenantSlug: string;
  onRetry?: () => void;
}) {
  const cls = CELL_CLASS[cell.data_source];
  const showBadge = ["partial", "stale", "error", "demo"].includes(cell.data_source);

  const content = (
    <span className={`tabular-nums ${cls}`} title={cell.data_source}>
      {cell.display_value}
      {showBadge ? (
        <span className="ml-1 inline-block scale-75">
          <DataTruthBadge level={cockpitDataSourceToBadgeLevel(cell.data_source)} />
        </span>
      ) : null}
      {cell.data_source === "error" && onRetry ? (
        <button type="button" className="ml-1 text-xs underline" onClick={onRetry}>
          reintentar
        </button>
      ) : null}
    </span>
  );

  if (cell.data_source === "live" || cell.data_source === "partial") {
    return (
      <Link
        href={`/cockpit/finance/tenant/${tenantSlug}?highlighted_core=${encodeURIComponent(cell.core_code)}`}
        className="block hover:underline"
        data-testid={`matrix-cell-${tenantSlug}-${cell.core_code}`}
      >
        {content}
      </Link>
    );
  }

  return <span data-testid={`matrix-cell-${tenantSlug}-${cell.core_code}`}>{content}</span>;
}

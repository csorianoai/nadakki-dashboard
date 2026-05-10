"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

export type DataTableDensity = "comfortable" | "compact" | "dense";

export type DataTableSortDirection = "ascending" | "descending" | "none";

export interface DataTableColumn<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
  /** When set with `onSort`, header is a sortable control and `aria-sort` is applied to the `<th>`. */
  sort?: DataTableSortDirection;
  onSort?: () => void;
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  /** Optional per-row class (e.g. selection rail via `before:` utilities). */
  getRowClassName?: (row: Row) => string | undefined;
  emptyLabel?: string;
  /** Shown under `emptyLabel` inside `<EmptyState>` when there are no rows. */
  emptyDescription?: string;
  /** Optional CTA in the empty state (e.g. clear filters). */
  emptyAction?: ReactNode;
  /** Decorative icon for the empty row (Lucide recommended). */
  emptyIcon?: ReactNode;
  /** Visual tone when empty (e.g. compliance “all clear”). */
  emptyTone?: "default" | "success";
  className?: string;
  /** Row / header padding and type scale (default: **compact** — Phase 9 v3 scan efficiency). */
  density?: DataTableDensity;
  /** Skeleton body matching column count (does not replace header). */
  loading?: boolean;
  /** Number of skeleton rows when `loading` (default 5). */
  skeletonRowCount?: number;
}

const densityClasses: Record<DataTableDensity, { th: string; td: string; table: string }> = {
  comfortable: {
    table: "text-forge-sm",
    th: "px-4 py-3",
    td: "px-4 py-3",
  },
  compact: {
    table: "text-forge-xs",
    th: "px-3 py-2.5",
    td: "px-3 py-2.5",
  },
  dense: {
    table: "text-forge-xs",
    th: "px-2 py-1.5",
    td: "px-2 py-1.5",
  },
};

function SortAffix({ direction }: { direction: DataTableSortDirection }) {
  if (direction === "ascending") {
    return <ChevronUp className="h-3 w-3 shrink-0 text-forgeBrand-600" aria-hidden />;
  }
  if (direction === "descending") {
    return <ChevronDown className="h-3 w-3 shrink-0 text-forgeBrand-600" aria-hidden />;
  }
  return (
    <span className="inline-flex h-3 w-3 shrink-0 items-center justify-center text-forgeGray-400" aria-hidden>
      <span className="text-[10px] leading-none">↕</span>
    </span>
  );
}

export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  getRowClassName,
  emptyLabel = "No rows",
  emptyDescription,
  emptyAction,
  emptyIcon,
  emptyTone = "default",
  className,
  density = "compact",
  loading = false,
  skeletonRowCount = 5,
}: DataTableProps<Row>) {
  const d = densityClasses[density];
  const skeletonKeys = Array.from({ length: skeletonRowCount }, (_, i) => `sk-${i}`);

  return (
    <div
      className={cn("overflow-x-auto rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card", className)}
      aria-busy={loading || undefined}
    >
      <table className={cn("w-full min-w-0 border-collapse text-left", d.table)}>
        <thead className="sticky top-0 z-10 border-b border-forgeGray-100 bg-forgeSurface-card/95 shadow-sm backdrop-blur-sm">
          <tr>
            {columns.map((col) => {
              const sortable = Boolean(col.onSort);
              const ariaSort = sortable ? col.sort ?? "none" : undefined;
              const sortActive = sortable && col.sort && col.sort !== "none";
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cn(
                    d.th,
                    "font-sans text-[12px] font-medium uppercase tracking-wide text-forgeGray-600",
                    sortable && "align-middle",
                    col.className
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => col.onSort?.()}
                      className={cn(
                        "-mx-1 inline-flex w-full min-w-0 max-w-full items-center justify-start gap-1 rounded-forge-sm px-1 py-0.5 text-left font-medium uppercase tracking-wide text-forgeGray-600 transition-colors duration-100 ease-out",
                        "hover:bg-forgeGray-50/80 hover:text-forgeGray-900",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
                        sortActive && "text-forgeBrand-700"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{col.header}</span>
                      <SortAffix direction={col.sort ?? "none"} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            skeletonKeys.map((sk) => (
              <tr key={sk} className="border-b border-forgeGray-100 last:border-0">
                {columns.map((col) => (
                  <td key={col.id} className={cn(d.td, col.className)}>
                    <Skeleton className="h-4 w-full max-w-[12rem]" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={cn(d.td, "p-0")}>
                <EmptyState
                  icon={emptyIcon}
                  tone={emptyTone}
                  title={emptyLabel}
                  titleLevel={2}
                  description={emptyDescription}
                  action={emptyAction}
                  className="rounded-none border-0 border-t-0 bg-transparent px-6 py-8 shadow-none"
                />
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const rid = getRowId(row);
              const rowExtra = getRowClassName?.(row);
              return (
                <tr
                  key={rid}
                  className={cn(
                    "relative border-b border-forgeGray-100 transition-colors duration-100 ease-out motion-reduce:transition-none last:border-0 hover:bg-forgeSurface-sunken",
                    rowExtra
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn(d.td, "text-forgeGray-800", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

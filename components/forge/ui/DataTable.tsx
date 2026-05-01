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
  /** Row / header padding and type scale (default: comfortable). */
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
    th: "px-3 py-2",
    td: "px-3 py-2",
  },
  dense: {
    table: "text-forge-xs",
    th: "px-2 py-1.5",
    td: "px-2 py-1.5",
  },
};

function SortAffix({ direction }: { direction: DataTableSortDirection }) {
  if (direction === "ascending") {
    return <ChevronUp className="h-4 w-4 shrink-0 text-forgeBrand-600" aria-hidden />;
  }
  if (direction === "descending") {
    return <ChevronDown className="h-4 w-4 shrink-0 text-forgeBrand-600" aria-hidden />;
  }
  return (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-forgeInk-400" aria-hidden>
      <span className="text-forge-xs leading-none">↕</span>
    </span>
  );
}

export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  emptyLabel = "No rows",
  emptyDescription,
  emptyAction,
  emptyIcon,
  emptyTone = "default",
  className,
  density = "comfortable",
  loading = false,
  skeletonRowCount = 5,
}: DataTableProps<Row>) {
  const d = densityClasses[density];
  const skeletonKeys = Array.from({ length: skeletonRowCount }, (_, i) => `sk-${i}`);

  return (
    <div
      className={cn("overflow-x-auto rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card", className)}
      aria-busy={loading || undefined}
    >
      <table className={cn("w-full min-w-0 border-collapse text-left", d.table)}>
        <thead>
          <tr className="border-b border-forgeInk-200 bg-forgeSurface-sunken transition-colors duration-[var(--forge-duration-fast)]">
            {columns.map((col) => {
              const sortable = Boolean(col.onSort);
              const ariaSort = sortable ? col.sort ?? "none" : undefined;
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cn(
                    d.th,
                    "font-semibold text-forgeInk-700",
                    sortable && "align-middle",
                    col.className
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => col.onSort?.()}
                      className={cn(
                        "-mx-1 inline-flex w-full min-w-0 max-w-full items-center justify-start gap-1 rounded-forge-sm px-1 py-0.5 text-left font-semibold text-forgeInk-700 transition-colors duration-[var(--forge-duration-fast)] ease-out",
                        "hover:bg-forgeInk-50/80 hover:text-forgeInk-900",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
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
              <tr key={sk} className="border-b border-forgeInk-100 last:border-0">
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
            rows.map((row) => (
              <tr
                key={getRowId(row)}
                className="border-b border-forgeInk-100 transition-colors duration-[var(--forge-duration-fast)] ease-out last:border-0 hover:bg-forgeSurface-sunken/50"
              >
                {columns.map((col) => (
                  <td key={col.id} className={cn(d.td, "text-forgeInk-800", col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableDensity = "comfortable" | "compact" | "dense";

export interface DataTableColumn<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  emptyLabel?: string;
  className?: string;
  /** Row / header padding and type scale (default: comfortable). */
  density?: DataTableDensity;
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

export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  emptyLabel = "No rows",
  className,
  density = "comfortable",
}: DataTableProps<Row>) {
  const d = densityClasses[density];
  return (
    <div className={cn("overflow-x-auto rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card", className)}>
      <table className={cn("w-full min-w-0 border-collapse text-left", d.table)}>
        <thead>
          <tr className="border-b border-forgeInk-200 bg-forgeSurface-sunken">
            {columns.map((col) => (
              <th key={col.id} scope="col" className={cn(d.th, "font-semibold text-forgeInk-700", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={cn(d.td, "py-8 text-center text-forgeInk-500")}>
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowId(row)} className="border-b border-forgeInk-100 last:border-0">
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

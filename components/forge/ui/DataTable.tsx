"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<Row> {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  className?: string;
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  emptyLabel?: string;
  className?: string;
}

export function DataTable<Row>({ columns, rows, getRowId, emptyLabel = "No rows", className }: DataTableProps<Row>) {
  return (
    <div className={cn("overflow-x-auto rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card", className)}>
      <table className="w-full min-w-[480px] border-collapse text-left text-forge-sm">
        <thead>
          <tr className="border-b border-forgeInk-200 bg-forgeSurface-sunken">
            {columns.map((col) => (
              <th key={col.id} scope="col" className={cn("px-4 py-3 font-semibold text-forgeInk-700", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-forgeInk-500">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowId(row)} className="border-b border-forgeInk-100 last:border-0">
                {columns.map((col) => (
                  <td key={col.id} className={cn("px-4 py-3 text-forgeInk-800", col.className)}>
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

"use client";

import type { FetchSource } from "@/lib/api/client";

type Props = {
  source: FetchSource;
  error?: string | null;
  className?: string;
};

export function DataSourceBadge({ source, error, className = "" }: Props) {
  const live = source === "live";
  return (
    <span
      title={!live && error ? error : live ? "Datos del API" : "Modo respaldo"}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        live
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
          : "bg-amber-500/15 text-amber-200 border border-amber-500/35"
      } ${className}`}
    >
      {live ? "Live" : "Fallback"}
    </span>
  );
}

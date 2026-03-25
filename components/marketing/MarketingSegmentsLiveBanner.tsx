"use client";

import type { FetchSource } from "@/lib/api/client";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { RefreshCw } from "lucide-react";

type Row = Record<string, unknown>;

export type MarketingSegmentsLiveBannerProps = {
  loading: boolean;
  error: string | null;
  source: FetchSource;
  segments: Row[];
  total: number;
  onRefresh: () => void;
};

export default function MarketingSegmentsLiveBanner({
  loading,
  error,
  source,
  segments,
  total,
  onRefresh,
}: MarketingSegmentsLiveBannerProps) {
  return (
    <div className="mb-6 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">Segmentos (API)</span>
          <DataSourceBadge source={source} error={error} />
          {loading ? (
            <span className="text-xs text-gray-500">Cargando…</span>
          ) : (
            <span className="text-xs text-gray-400">{total} registro(s)</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRefresh()}
          className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>
      {segments.length === 0 && !loading ? (
        <p className="text-xs text-gray-500 mt-2 m-0">
          Sin datos del API. Usa &quot;Nuevo segmento&quot; para crear uno persistente en tu tenant.
        </p>
      ) : (
        <ul className="mt-2 space-y-1 max-h-28 overflow-y-auto text-sm text-gray-300">
          {segments.slice(0, 15).map((s, i) => (
            <li key={String(s.id ?? s.segment_id ?? i)} className="truncate">
              {String(s.name ?? s.title ?? "—")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useTenant } from "@/contexts/TenantContext";
import { useFetchWithFallback } from "@/hooks/useFetchWithFallback";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";
import { FALLBACK_SEGMENTS_LIST } from "@/lib/fallbacks/marketing";
import { normalizeMarketingSegmentsList } from "@/lib/api/marketing";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { RefreshCw } from "lucide-react";

export default function MarketingSegmentsLiveBanner() {
  const { tenantId } = useTenant();
  const { data, source, loading, error, refresh } = useFetchWithFallback(
    MARKETING_ENDPOINTS.SEGMENTS,
    { tenantId, fallbackData: FALLBACK_SEGMENTS_LIST }
  );
  const { segments, total } = normalizeMarketingSegmentsList(data);

  return (
    <div className="mb-6 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">
            Segmentos (API)
          </span>
          <DataSourceBadge source={source} error={error} />
          {loading ? (
            <span className="text-xs text-gray-500">Cargando…</span>
          ) : (
            <span className="text-xs text-gray-400">{total} registro(s)</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>
      {segments.length === 0 && !loading ? (
        <p className="text-xs text-gray-500 mt-2 m-0">
          Sin segmentos desde el API. El constructor local sigue disponible abajo.
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

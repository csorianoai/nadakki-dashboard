"use client";

import { useTenant } from "@/contexts/TenantContext";
import { useFetchWithFallback } from "@/hooks/useFetchWithFallback";
import { ADVERTISING_ENDPOINTS } from "@/lib/api/endpoints";
import {
  FALLBACK_ADVERTISING_DASHBOARD,
  normalizeAdvertisingDashboard,
  type AdvertisingDashboardData,
} from "@/lib/fallbacks/advertising";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { RefreshCw } from "lucide-react";

type Props = {
  title?: string;
};

export function AdvertisingDashboardLive({ title = "Publicidad — Dashboard API" }: Props) {
  const { tenantId } = useTenant();
  const { data, source, loading, error, refresh } = useFetchWithFallback<AdvertisingDashboardData>(
    ADVERTISING_ENDPOINTS.DASHBOARD,
    { tenantId, fallbackData: FALLBACK_ADVERTISING_DASHBOARD }
  );

  const d = normalizeAdvertisingDashboard(data);
  const hasMetrics =
    d.spend_total > 0 || d.active_ads > 0 || d.impressions > 0 || d.platforms.length > 0;
  const showEmpty = !loading && !hasMetrics;

  return (
    <div className="mb-8 rounded-xl border border-sky-500/25 bg-sky-500/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
          <DataSourceBadge source={source} error={error} />
          {loading ? (
            <span className="text-xs text-gray-500">Cargando…</span>
          ) : (
            <span className="text-xs text-gray-500">
              {d.platforms.length} plataforma(s) · spend {d.spend_total} · ads {d.active_ads} · imp.{" "}
              {d.impressions}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300 hover:opacity-90"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>

      {!loading && hasMetrics && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-white/80 dark:bg-slate-900/60 px-3 py-2 border border-slate-200/80 dark:border-slate-700">
            <div className="text-[10px] uppercase text-gray-500">Spend total</div>
            <div className="text-lg font-bold text-sky-600 dark:text-sky-400">{d.spend_total}</div>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-slate-900/60 px-3 py-2 border border-slate-200/80 dark:border-slate-700">
            <div className="text-[10px] uppercase text-gray-500">Anuncios activos</div>
            <div className="text-lg font-bold text-sky-600 dark:text-sky-400">{d.active_ads}</div>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-slate-900/60 px-3 py-2 border border-slate-200/80 dark:border-slate-700">
            <div className="text-[10px] uppercase text-gray-500">Impresiones</div>
            <div className="text-lg font-bold text-sky-600 dark:text-sky-400">{d.impressions}</div>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-slate-900/60 px-3 py-2 border border-slate-200/80 dark:border-slate-700">
            <div className="text-[10px] uppercase text-gray-500">Plataformas</div>
            <div className="text-lg font-bold text-sky-600 dark:text-sky-400">{d.platforms.length}</div>
          </div>
        </div>
      )}

      {showEmpty && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Sin métricas de dashboard desde el API (o modo respaldo). Los enlaces de plataforma siguen
          disponibles abajo.
        </p>
      )}
    </div>
  );
}

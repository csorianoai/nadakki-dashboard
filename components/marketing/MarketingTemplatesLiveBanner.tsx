"use client";

import { useTenant } from "@/contexts/TenantContext";
import { useFetchWithFallback } from "@/hooks/useFetchWithFallback";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";
import { FALLBACK_TEMPLATES } from "@/lib/fallbacks/marketing";
import { normalizeMarketingTemplates } from "@/lib/api/marketing";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { RefreshCw } from "lucide-react";

export default function MarketingTemplatesLiveBanner() {
  const { tenantId } = useTenant();
  const { data, source, loading, error, refresh } = useFetchWithFallback(
    MARKETING_ENDPOINTS.TEMPLATES,
    { tenantId, fallbackData: FALLBACK_TEMPLATES }
  );
  const { templates, total } = normalizeMarketingTemplates(data);

  return (
    <div className="max-w-[1800px] mx-auto px-6 pt-4">
      <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">
            Plantillas (API)
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
          className="inline-flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>
      {templates.length === 0 && !loading ? (
        <p className="text-xs text-gray-500 mt-2 px-1">
          Sin plantillas desde el API. Use &quot;Generar con IA&quot; para crear
          contenido.
        </p>
      ) : (
        <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto text-sm text-gray-300 px-1">
          {templates.slice(0, 20).map((t, i) => (
            <li key={String(t.id ?? t.template_id ?? i)} className="truncate">
              {String(t.name ?? t.title ?? t.slug ?? "—")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Megaphone, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";

const MARKETING_CAMPAIGNS_LABEL = "API marketing";

function campaignLabel(row: Record<string, unknown>): string {
  return String(row.name ?? row.title ?? row.campaign_name ?? "—");
}

function campaignId(row: Record<string, unknown>): string {
  return String(row.id ?? row.campaign_id ?? "");
}

function campaignStatus(row: Record<string, unknown>): string {
  return String(row.status ?? "—");
}

export default function CampaignsPage() {
  const { campaigns, total, loading, error, source, refresh } = useMarketingCampaigns();

  return (
    <div className="ndk-page ndk-fade-in min-h-screen text-white p-6">
      <NavigationBar backHref="/marketing">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Campañas</span>
          <DataSourceBadge source={source} error={error} />
        </div>
      </NavigationBar>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
            <Megaphone className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white m-0">Campaigns</h1>
            <p className="text-gray-400 text-sm m-0 mt-1">
              {loading ? "Cargando…" : `${total} campaña(s) · ${MARKETING_CAMPAIGNS_LABEL}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {error && source === "fallback" && (
        <GlassCard className="p-4 mb-6 border-amber-500/30 bg-amber-500/5">
          <p className="text-amber-200/90 text-sm m-0">
            No se pudo conectar al API ({error}). Mostrando estado vacío seguro.
          </p>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400 text-sm">Cargando campañas…</div>
      ) : campaigns.length === 0 ? (
        <GlassCard className="p-12 text-center border-white/10">
          <p className="text-gray-400 m-0">No hay campañas para mostrar.</p>
          <p className="text-gray-500 text-xs mt-2 m-0">
            Datos desde <code className="text-gray-400">/marketing/campaigns</code> (sin legacy{" "}
            <code className="text-gray-400">/api/campaigns</code>).
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {campaigns
            .map((row, i) => ({ row, id: campaignId(row), i }))
            .filter((x) => x.id.length > 0)
            .map(({ row, id }) => (
              <Link
                key={id}
                href={`/marketing/campaigns/${encodeURIComponent(id)}`}
                className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:border-orange-500/40 hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex justify-between items-center gap-4">
                  <span className="font-medium text-white">{campaignLabel(row)}</span>
                  <span className="text-sm text-gray-400 shrink-0">{campaignStatus(row)}</span>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}

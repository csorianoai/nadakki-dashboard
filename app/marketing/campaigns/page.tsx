"use client";

<<<<<<< HEAD
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Plus, RefreshCw } from "lucide-react";
import { campaignsAPI, type Campaign, type CampaignStatus } from "@/lib/api";
import { useTenant } from "@/contexts/TenantContext";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300",
  draft: "bg-slate-500/20 text-slate-300",
  scheduled: "bg-amber-500/20 text-amber-300",
  paused: "bg-yellow-500/20 text-yellow-300",
  completed: "bg-blue-500/20 text-blue-300",
  archived: "bg-slate-600/20 text-slate-400",
};

export default function MarketingCampaignsPage() {
  const { tenantId } = useTenant();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await campaignsAPI.getAll(undefined, tenantId || undefined);
      setCampaigns(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/marketing" className="text-slate-500 hover:text-slate-300 text-xs mb-1 inline-block">← Marketing</Link>
          <h1 className="text-2xl font-bold text-white">Campanas</h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? "Cargando..." : `${campaigns.length} campanas registradas`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500">
            <Plus className="w-4 h-4" /> Nueva
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <p className="font-medium">Error al cargar campanas</p>
            <p className="mt-1 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {loading && campaigns.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" /> Cargando campanas...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-12 text-center">
          <p className="text-slate-400 mb-4">No hay campanas registradas.</p>
          <Link href="/campaigns/new" className="text-purple-400 hover:underline text-sm">
            Crear primera campana
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400 text-xs uppercase">
                <th className="p-3 font-semibold">Nombre</th>
                <th className="p-3 font-semibold">Tipo</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 font-semibold">Audiencia</th>
                <th className="p-3 font-semibold">Actualizada</th>
                <th className="p-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-3">
                    <Link href={`/marketing/campaigns/${c.id}`} className="text-white hover:text-purple-400 font-medium transition-colors">
                      {c.name}
                    </Link>
                    {c.description && <p className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{c.description}</p>}
                  </td>
                  <td className="p-3 text-slate-300 capitalize">{c.type}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[c.status] ?? "bg-slate-600/20 text-slate-400"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{c.audience_size?.toLocaleString() ?? "—"}</td>
                  <td className="p-3 text-slate-400 text-xs">{c.updated_at ? new Date(c.updated_at).toLocaleDateString("es") : "—"}</td>
                  <td className="p-3">
                    <Link href={`/marketing/campaigns/${c.id}`} className="text-purple-400 hover:underline text-xs">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
=======
import Link from "next/link";
import { Megaphone, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { DataSourceBadge } from "@/components/ui/DataSourceBadge";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";

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
  const { campaigns, total, loading, error, source, refresh } =
    useMarketingCampaigns();

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
              {loading ? "Cargando…" : `${total} campaña(s) · API marketing`}
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
        <div className="flex justify-center py-20 text-gray-400 text-sm">
          Cargando campañas…
        </div>
      ) : campaigns.length === 0 ? (
        <GlassCard className="p-12 text-center border-white/10">
          <p className="text-gray-400 m-0">No hay campañas para mostrar.</p>
          <p className="text-gray-500 text-xs mt-2 m-0">
            Cuando el backend devuelva datos, aparecerán aquí.
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
                  <span className="font-medium text-white">
                    {campaignLabel(row)}
                  </span>
                  <span className="text-sm text-gray-400 shrink-0">
                    {campaignStatus(row)}
                  </span>
                </div>
              </Link>
            ))}
>>>>>>> 2b64c9bfa8733c9561d314186ee448bf03a241ef
        </div>
      )}
    </div>
  );
}

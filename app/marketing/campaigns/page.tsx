"use client";

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
        </div>
      )}
    </div>
  );
}

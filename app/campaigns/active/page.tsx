"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "@/lib/motion-stub";
import { Play, Eye, Pause, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { campaignsAPI, type Campaign } from "@/lib/api";
import { useTenant } from "@/contexts/TenantContext";

export default function CampaignsActivePage() {
  const { tenantId } = useTenant();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pausing, setPausing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await campaignsAPI.getByStatus("active", undefined, tenantId || undefined);
      setCampaigns(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handlePause = useCallback(async (id: string) => {
    setPausing(id);
    try {
      await campaignsAPI.pause(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPausing(null);
    }
  }, [load]);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/campaigns">
        <StatusBadge status="active" label={loading ? "Cargando..." : `${campaigns.length} Activas`} size="lg" />
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30"><Play className="w-8 h-8 text-green-400" /></div>
            <div><h1 className="text-3xl font-bold text-white">Campanas Activas</h1><p className="text-gray-400">Campanas en ejecucion</p></div>
          </div>
          <button type="button" onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white hover:bg-white/15 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </button>
        </div>
      </motion.div>

      {error && (
        <GlassCard className="p-4 mb-6 border-amber-500/30 bg-amber-500/10">
          <div className="flex items-start gap-3 text-amber-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div><p className="font-medium">Error</p><p className="mt-1 opacity-80">{error}</p></div>
          </div>
        </GlassCard>
      )}

      {loading && campaigns.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" /> Cargando campanas activas...
        </div>
      ) : campaigns.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400">No hay campanas activas en este momento.</p>
          <Link href="/campaigns/new" className="mt-4 inline-block text-purple-400 hover:underline text-sm">
            Crear nueva campana
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Link href={`/marketing/campaigns/${c.id}`} className="font-bold text-white hover:text-pink-400 transition-colors">
                      {c.name}
                    </Link>
                    <p className="text-sm text-gray-400">{c.type} · {c.created_at ? new Date(c.created_at).toLocaleDateString("es") : "—"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/marketing/campaigns/${c.id}`} className="p-2 hover:bg-white/10 rounded-lg">
                      <Eye className="w-4 h-4 text-gray-400" />
                    </Link>
                    <button onClick={() => handlePause(c.id)} disabled={pausing === c.id}
                      className="p-2 hover:bg-yellow-500/20 rounded-lg disabled:opacity-50">
                      {pausing === c.id ? <Loader2 className="w-4 h-4 animate-spin text-yellow-400" /> : <Pause className="w-4 h-4 text-yellow-400" />}
                    </button>
                  </div>
                </div>
                {c.stats ? (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg"><p className="text-lg font-bold text-white">{c.stats.sent.toLocaleString()}</p><p className="text-xs text-gray-500">Enviados</p></div>
                    <div className="p-3 bg-white/5 rounded-lg"><p className="text-lg font-bold text-blue-400">{c.stats.opened.toLocaleString()}</p><p className="text-xs text-gray-500">Abiertos</p></div>
                    <div className="p-3 bg-white/5 rounded-lg"><p className="text-lg font-bold text-purple-400">{c.stats.clicked.toLocaleString()}</p><p className="text-xs text-gray-500">Clicks</p></div>
                    <div className="p-3 bg-white/5 rounded-lg"><p className="text-lg font-bold text-green-400">{c.stats.conversions.toLocaleString()}</p><p className="text-xs text-gray-500">Conversiones</p></div>
                  </div>
                ) : (
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>Audiencia: {c.audience_size?.toLocaleString() ?? "—"}</span>
                    {c.description && <span className="truncate max-w-xs">{c.description}</span>}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

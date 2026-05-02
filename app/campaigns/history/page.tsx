"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "@/lib/motion-stub";
import { History, Eye, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { campaignsAPI, type Campaign } from "@/lib/api";
import { useTenant } from "@/contexts/TenantContext";

export default function CampaignsHistoryPage() {
  const { tenantId } = useTenant();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await campaignsAPI.getAll(undefined, tenantId || undefined);
      setCampaigns(all.filter((c) => c.status === "completed" || c.status === "archived"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/campaigns">
        <StatusBadge status="inactive" label={loading ? "Cargando..." : `${campaigns.length} Completadas`} size="lg" />
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30"><History className="w-8 h-8 text-yellow-400" /></div>
            <div><h1 className="text-3xl font-bold text-white">Historial de Campanas</h1><p className="text-gray-400">Campanas completadas y archivadas</p></div>
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
          <Loader2 className="w-6 h-6 animate-spin" /> Cargando historial...
        </div>
      ) : campaigns.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400">No hay campanas completadas aun.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Link href={`/marketing/campaigns/${c.id}`} className="font-bold text-white hover:text-yellow-400 transition-colors">
                      {c.name}
                    </Link>
                    <p className="text-sm text-gray-400">{c.type} · {c.updated_at ? new Date(c.updated_at).toLocaleDateString("es") : "—"}</p>
                  </div>
                  <Link href={`/marketing/campaigns/${c.id}`} className="p-2 hover:bg-white/10 rounded-lg">
                    <Eye className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
                {c.stats ? (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center"><p className="text-lg font-bold text-white">{c.stats.sent.toLocaleString()}</p><p className="text-xs text-gray-500">Enviados</p></div>
                    <div className="text-center"><p className="text-lg font-bold text-blue-400">{c.stats.opened.toLocaleString()}</p><p className="text-xs text-gray-500">Abiertos</p></div>
                    <div className="text-center"><p className="text-lg font-bold text-purple-400">{c.stats.clicked.toLocaleString()}</p><p className="text-xs text-gray-500">Clicks</p></div>
                    <div className="text-center"><p className="text-lg font-bold text-green-400">{c.stats.conversions.toLocaleString()}</p><p className="text-xs text-gray-500">Conversiones</p></div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Sin metricas registradas</p>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Megaphone, Plus, Play, Clock, CheckCircle, ArrowRight, RefreshCw, Loader2, AlertCircle, Archive } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { campaignsAPI, type Campaign } from "@/lib/api";
import { useTenant } from "@/contexts/TenantContext";

const MODULES = [
  { id: "active", name: "Campanas Activas", desc: "Campanas en ejecucion", href: "/campaigns/active", color: "#22c55e" },
  { id: "new", name: "Nueva Campana", desc: "Crear nueva campana", href: "/campaigns/new", color: "#8b5cf6" },
  { id: "history", name: "Historial", desc: "Campanas completadas", href: "/campaigns/history", color: "#f59e0b" },
];

export default function CampaignsPage() {
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

  const active = campaigns.filter((c) => c.status === "active").length;
  const scheduled = campaigns.filter((c) => c.status === "scheduled").length;
  const completed = campaigns.filter((c) => c.status === "completed").length;
  const draft = campaigns.filter((c) => c.status === "draft").length;

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status={loading ? "warning" : "active"} label="Campaigns" size="lg" />
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30"><Megaphone className="w-8 h-8 text-pink-400" /></div>
            <div><h1 className="text-3xl font-bold text-white">Campanas</h1><p className="text-gray-400">Gestion de campanas de marketing</p></div>
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
            <div><p className="font-medium">Error al cargar campanas</p><p className="mt-1 opacity-80">{error}</p></div>
          </div>
        </GlassCard>
      )}

      {loading && campaigns.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" /> Cargando campanas...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <StatCard value={active} label="Activas" icon={<Play className="w-6 h-6 text-green-400" />} color="#22c55e" />
            <StatCard value={scheduled} label="Programadas" icon={<Clock className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
            <StatCard value={completed} label="Completadas" icon={<CheckCircle className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
            <StatCard value={draft} label="Borradores" icon={<Archive className="w-6 h-6 text-slate-400" />} color="#94a3b8" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MODULES.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link href={m.href}><GlassCard className="p-6 cursor-pointer group">
                  <h3 className="text-lg font-bold text-white group-hover:text-pink-400">{m.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{m.desc}</p>
                  <ArrowRight className="w-5 h-5 text-gray-500 mt-4 group-hover:translate-x-1 transition-transform" />
                </GlassCard></Link>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

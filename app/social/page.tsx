"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Share2, Calendar, MessageSquare, BarChart3, Rss, Settings, ArrowRight, AlertTriangle, RefreshCw, Plus } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

const SOCIAL_MODULES = [
  { id: "connections", name: "Conexiones", icon: Settings, desc: "Conecta tus redes sociales", href: "/social/connections", color: "#06b6d4", priority: true },
  { id: "scheduler", name: "Programador", icon: Calendar, desc: "Programa posts automaticamente", href: "/social/scheduler", color: "#22c55e" },
  { id: "inbox", name: "Inbox Social", icon: MessageSquare, desc: "Mensajes y comentarios", href: "/social/inbox", color: "#3b82f6" },
  { id: "analytics", name: "Analytics", icon: BarChart3, desc: "Metricas de rendimiento", href: "/social/analytics", color: "#f59e0b" },
  { id: "feeds", name: "Feeds", icon: Rss, desc: "Monitorea contenido", href: "/social/feeds", color: "#8b5cf6" },
  { id: "editor", name: "Editor de Posts", icon: Share2, desc: "Crea contenido con IA", href: "/social/editor", color: "#ec4899" },
];

interface Connection {
  platform: string;
  connected: boolean;
  account?: string;
  followers?: string;
}

export default function SocialPage() {
  const { tenantId } = useTenant();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, connected: 0 });

  useEffect(() => {
    if (tenantId) fetchConnections();
    else setLoading(false);
  }, [tenantId]);

  const fetchConnections = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/social/connections?tenant_id=${encodeURIComponent(tenantId)}`, {
        headers: { "X-Tenant-ID": tenantId },
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
        const connected = (data.connections || []).filter((c: Connection) => c.connected).length;
        setStats({ total: (data.connections || []).length, connected });
      }
    } catch (err) {
      console.error("Error fetching connections:", err);
    } finally {
      setLoading(false);
    }
  };

  const connectedPlatforms = connections.filter(c => c.connected);
  const hasConnections = connectedPlatforms.length > 0;

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <button onClick={fetchConnections} className="p-2 hover:bg-white/10 rounded-lg">
          <RefreshCw className={"w-5 h-5 text-gray-400 " + (loading ? "animate-spin" : "")} />
        </button>
        <StatusBadge 
          status={hasConnections ? "active" : "warning"} 
          label={stats.connected + " Conectadas"} 
          size="lg" 
        />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <Share2 className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Social Media Hub
            </h1>
            <p className="text-gray-400 mt-1">Gestion unificada de redes sociales con IA</p>
          </div>
        </div>
      </motion.div>

      {!hasConnections && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <GlassCard className="p-6 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Conecta tus Redes Sociales</h3>
                <p className="text-gray-400 mb-4">
                  Para usar los agentes de IA y automatizar tu presencia social, primero necesitas conectar tus cuentas.
                  Ve a Conexiones para vincular Facebook, Instagram, Twitter, LinkedIn y mas.
                </p>
                <Link href="/social/connections">
                  <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors">
                    <Plus className="w-4 h-4" /> Conectar Redes Sociales
                  </button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={stats.connected.toString()} label="Redes Conectadas" icon={<Share2 className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value={hasConnections ? "â€”" : "0"} label="Seguidores Total" icon={<MessageSquare className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={hasConnections ? "â€”" : "0"} label="Posts Este Mes" icon={<Calendar className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value={hasConnections ? "â€”" : "0%"} label="Engagement Rate" icon={<BarChart3 className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      <Link href="/social/connections">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <GlassCard className="p-6 cursor-pointer group border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30">
                  <Settings className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Conexiones</h3>
                    {!hasConnections && <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500 text-black rounded-full">Configurar</span>}
                  </div>
                  <p className="text-gray-400 mt-1">Conecta Facebook, Instagram, Twitter, LinkedIn, TikTok y YouTube</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all" />
            </div>
          </GlassCard>
        </motion.div>
      </Link>

      <h2 className="text-xl font-bold text-white mb-4">Modulos</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {SOCIAL_MODULES.filter(m => m.id !== "connections").map((module, i) => (
          <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <Link href={module.href}>
              <GlassCard className={"p-6 cursor-pointer group h-full " + (!hasConnections ? "opacity-60" : "")}>
                <div className="p-3 rounded-xl mb-4 w-fit" style={{ backgroundColor: module.color + "20" }}>
                  <module.icon className="w-6 h-6" style={{ color: module.color }} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{module.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{module.desc}</p>
                {!hasConnections && (
                  <p className="text-xs text-yellow-500 mb-2">Requiere conexion de redes</p>
                )}
                <div className="flex items-center justify-end pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500 group-hover:text-blue-400 flex items-center gap-1">
                    Abrir <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {hasConnections && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Cuentas Conectadas</h3>
              <p className="text-sm text-gray-400">Gestiona tus redes sociales</p>
            </div>
            <Link href="/social/connections" className="text-sm text-cyan-400 hover:text-cyan-300">
              Gestionar â†’
            </Link>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {connectedPlatforms?.map(conn => (
              <div key={conn.platform} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                <span className="text-lg">{getPlatformIcon(conn.platform)}</span>
                <span className="text-sm text-gray-300">{conn.account || conn.platform}</span>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    facebook: "ðŸ“˜",
    instagram: "ðŸ“¸",
    twitter: "ðŸ¦",
    linkedin: "ðŸ’¼",
    tiktok: "ðŸŽµ",
    youtube: "â–¶ï¸"
  };
  return icons[platform] || "ðŸŒ";
}



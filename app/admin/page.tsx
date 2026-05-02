"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "@/lib/motion-stub";
import Link from "next/link";
import { 
  Settings, Bot, FileText, Shield, Database, 
  Users, Activity, Server, ArrowRight, Cog,
  CreditCard, BarChart3, Key, Monitor,
  Rocket, Gauge, MessageCircle, Sparkles, ClipboardList, Loader2, Search
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import AutonomousHealthPanel from "@/components/system/AutonomousHealthPanel";
import { useTenant } from "@/contexts/TenantContext";

type AuditEventDisplay = {
  type: "success" | "warning" | "error" | "info";
  message: string;
  time: string;
};

function formatRelativeEs(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t)) return iso;
  const diffMs = Date.now() - t;
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  if (hr < 24) return `Hace ${hr} h`;
  if (day < 7) return `Hace ${day} d`;
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

function auditEventType(status: string | undefined): AuditEventDisplay["type"] {
  const s = (status ?? "").toLowerCase();
  if (/\b(fail|error|failed|timeout)\b/.test(s) || /^5\d\d$/.test(s)) return "error";
  if (/\bwarn|degrad/.test(s)) return "warning";
  if (/\b(ok|success|completed|200|201)\b/.test(s)) return "success";
  return "info";
}

function formatAuditMessage(log: Record<string, unknown>): string {
  const raw = log.message ?? log.detail ?? log.description;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  const agent = String(log.agent_id ?? "").trim();
  const mode = String(log.mode ?? "").trim();
  const status = String(log.status ?? "").trim();
  const trace = String(log.trace_id ?? "").trim();
  const parts = [agent && `agent: ${agent}`, mode && `mode: ${mode}`, status && `status: ${status}`, trace && `trace: ${trace.slice(0, 12)}…`].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Evento de auditoría";
}

const ADMIN_MODULES_BASE = [
  { id: "onboarding", name: "Onboarding tenant", icon: ClipboardList, desc: "Asistente de perfil y POST /tenants/onboard", href: "/admin/onboarding", color: "#a855f7" },
  { id: "activation", name: "Activación", icon: Rocket, desc: "Readiness y activación dry-run", href: "/admin/activation", color: "#f59e0b" },
  { id: "sales-scripts", name: "Ofertas & scripts", icon: Sparkles, desc: "OfferStrategyIA (segmentos)", href: "/admin/sales-scripts", color: "#ec4899" },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, desc: "Config tenant Meta / verify token", href: "/admin/whatsapp", color: "#22c55e" },
  { id: "readiness", name: "Readiness ops", icon: Gauge, desc: "Fleet y tenant /ops/onboarding", href: "/admin/readiness", color: "#06b6d4" },
  {
    id: "google-ads-agent-ops",
    name: "Google Ads Agent ops",
    icon: Search,
    desc: "Operational checks (/ops/google-ads-agent/checks)",
    href: "/admin/google-ads-agent",
    color: "#22c55e",
  },
  { id: "agents", name: "Agentes IA", icon: Bot, desc: "Activar, desactivar y configurar agentes", href: "/admin/agents", color: "#8b5cf6", badgeKey: "agents" },
  { id: "logs", name: "Logs del Sistema", icon: FileText, desc: "Historial de ejecuciones y errores", href: "/admin/logs", color: "#22c55e" },
  { id: "gates", name: "Gates", icon: Shield, desc: "Gates de configuracion (Security, Data, Quality, Pilot)", href: "/admin/gates", color: "#f59e0b" },
  { id: "config", name: "Config", icon: Settings, desc: "Configuracion de tenant y canales en vivo", href: "/admin/config", color: "#8b5cf6" },
  { id: "db", name: "Database Status", icon: Database, desc: "Estado de conexion y esquema DB", href: "/admin/db", color: "#06b6d4" },
  { id: "billing", name: "Billing", icon: CreditCard, desc: "Planes y facturacion", href: "/admin/billing", color: "#10b981" },
  { id: "usage", name: "Usage", icon: BarChart3, desc: "Ejecuciones y limites por tenant", href: "/admin/usage", color: "#f59e0b" },
  { id: "api-keys", name: "API Keys", icon: Key, desc: "Gestion de claves API", href: "/admin/api-keys", color: "#8b5cf6" },
  { id: "system", name: "System Info", icon: Monitor, desc: "Estado del sistema", href: "/admin/system", color: "#06b6d4" },
  { id: "qa", name: "QA Piloto", icon: Activity, desc: "Verificacion operativa del tenant", href: "/admin/qa", color: "#22c55e" },
  { id: "tenants", name: "Multi-Tenant", icon: Users, desc: "Gestion de clientes y permisos", href: "/tenants", color: "#3b82f6", badge: "4" },
  { id: "settings", name: "Configuracion", icon: Settings, desc: "Ajustes generales del sistema", href: "/settings", color: "#f59e0b" },
];

export default function AdminPage() {
  const { tenantId } = useTenant();
  const [agentTotal, setAgentTotal] = useState<string>("--");
  const [recentEvents, setRecentEvents] = useState<AuditEventDisplay[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai-studio/agents")
      .then((r) => r.json())
      .then((d) => {
        const total = d.data?.total ?? d.data?.agents?.length;
        if (total != null) setAgentTotal(String(total));
      })
      .catch(() => {});
  }, []);

  const fetchRecentAudit = useCallback(async () => {
    if (!tenantId?.trim()) {
      setRecentEvents([]);
      setEventsError(null);
      setEventsLoading(false);
      return;
    }
    const tid = tenantId.trim();
    setEventsLoading(true);
    setEventsError(null);
    try {
      const url = `/api/v1/audit/logs?tenant_id=${encodeURIComponent(tid)}&limit=8`;
      const res = await fetch(url, { headers: { Accept: "application/json", "X-Tenant-ID": tid }, cache: "no-store" });
      if (!res.ok) {
        setRecentEvents([]);
        setEventsError(`No se pudieron cargar eventos (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : data?.logs ?? data?.data ?? [];
      const mapped: AuditEventDisplay[] = items
        .filter((row): row is Record<string, unknown> => row != null && typeof row === "object")
        .slice(0, 8)
        .map((log) => {
          const status = typeof log.status === "string" ? log.status : undefined;
          const ts =
            (typeof log.timestamp === "string" && log.timestamp) ||
            (typeof log.created_at === "string" && log.created_at) ||
            (typeof log.time === "string" && log.time) ||
            undefined;
          return {
            type: auditEventType(status),
            message: formatAuditMessage(log),
            time: formatRelativeEs(ts),
          };
        });
      setRecentEvents(mapped);
    } catch (e) {
      setRecentEvents([]);
      setEventsError(e instanceof Error ? e.message : "Error al cargar auditoría.");
    } finally {
      setEventsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void fetchRecentAudit();
  }, [fetchRecentAudit]);

  const adminModules = ADMIN_MODULES_BASE.map((m) => ({
    ...m,
    badge: m.badge ?? (m.badgeKey === "agents" ? agentTotal : undefined),
  }));

  const systemStats = [
    { value: agentTotal, label: "Agentes Totales", icon: <Bot className="w-6 h-6 text-purple-400" />, color: "#8b5cf6" },
    { value: "4", label: "Tenants Activos", icon: <Users className="w-6 h-6 text-blue-400" />, color: "#3b82f6" },
    { value: "99.7%", label: "Uptime", icon: <Activity className="w-6 h-6 text-green-400" />, color: "#22c55e" },
    { value: "v3.2", label: "Version", icon: <Server className="w-6 h-6 text-cyan-400" />, color: "#06b6d4" },
  ];

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Admin Panel" size="lg" />
      </NavigationBar>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/20 border border-slate-500/30">
            <Cog className="w-10 h-10 text-slate-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 bg-clip-text text-transparent">
              Panel de Administracin
            </h1>
            <p className="text-gray-400 mt-1">Gestiona agentes, tenants, logs y configuracin del sistema</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {systemStats?.map((stat, i) => (
          <StatCard key={i} {...stat} delay={i * 0.1} />
        ))}
      </div>

      <div className="mb-8">
        <AutonomousHealthPanel />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Admin Modules */}
        <div className="col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Mdulos de Administracin</h2>
          <div className="grid grid-cols-2 gap-4">
            {adminModules?.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Link href={module.href}>
                  <GlassCard className="p-6 cursor-pointer group h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: module.color + "20" }}
                      >
                        <module.icon className="w-6 h-6" style={{ color: module.color }} />
                      </div>
                      {module.badge && (
                        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">
                          {module.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                      {module.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">{module.desc}</p>
                    <div className="flex items-center justify-end mt-4 pt-4 border-t border-white/5">
                      <span className="text-xs text-gray-500 group-hover:text-purple-400 transition-colors flex items-center gap-1">
                        Abrir <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Eventos Recientes</h2>
          <GlassCard className="p-4">
            {!tenantId?.trim() && (
              <p className="text-sm text-gray-500 m-0 mb-4">Selecciona un tenant para ver la auditoría en vivo.</p>
            )}
            {eventsError && tenantId?.trim() && (
              <p className="text-sm text-amber-300/90 m-0 mb-4">{eventsError}</p>
            )}
            {eventsLoading && tenantId?.trim() && (
              <p className="text-sm text-gray-400 m-0 mb-4 inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando auditoría…
              </p>
            )}
            <div className="space-y-4">
              {!eventsLoading && tenantId?.trim() && !eventsError && recentEvents.length === 0 && (
                <p className="text-sm text-gray-500 m-0">No hay eventos de auditoría recientes para este tenant.</p>
              )}
              {recentEvents.map((event, i) => (
                <motion.div
                  key={`${event.time}-${i}-${event.message.slice(0, 24)}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    event.type === "success" ? "bg-green-500" :
                    event.type === "warning" ? "bg-yellow-500" :
                    event.type === "error" ? "bg-red-500" : "bg-blue-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white break-words">{event.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link href="/admin/logs">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/10 transition-colors"
              >
                Ver todos los logs
              </motion.button>
            </Link>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}



"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "@/lib/motion-stub";
import {
  Bot,
  Users,
  Zap,
  ArrowRight,
  Shield,
  BarChart3,
  Settings,
  Loader2,
  Scale,
  ClipboardList,
  BadgeDollarSign,
  type LucideIcon,
} from "lucide-react";
import { useAgentRegistrySummary } from "@/app/hooks/useAgentRegistrySummary";
import { AgentRegistryStatHome } from "@/components/agent-registry/AgentRegistryStatHome";
import { CORES_CONFIG } from "@/config/cores";
import { useAuth } from "@/hooks/useAuth";
import { esPersonalDePlataforma } from "@/lib/auth/platform-staff";

/** Same-origin; proxied via next.config rewrites */
const API_URL = "";

/** Acceso rápido: producto principal + gobierno (alineado con rutas reales). */
const QUICK_LINKS: {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  badge?: string;
}[] = [
  { href: "/agents/execute", label: "Ejecutar Agentes", icon: Zap, color: "from-cyan-500 to-blue-600" },
  {
    href: "/credit-hub/bank",
    label: "Credit Hub",
    subtitle: "Multi-tenant credit origination & decisioning",
    icon: BadgeDollarSign,
    color: "from-emerald-600 to-teal-700",
    badge: "v1.0",
  },
  { href: "/sic", label: "SIC", icon: ClipboardList, color: "from-sky-500 to-blue-700" },
  { href: "/legal", label: "Legal", icon: Scale, color: "from-violet-500 to-purple-700" },
  { href: "/compliance", label: "Compliance", icon: Shield, color: "from-emerald-500 to-teal-700" },
  { href: "/marketing", label: "Marketing", icon: BarChart3, color: "from-green-500 to-emerald-600" },
  { href: "/autopilot", label: "Autopilot IA", icon: Zap, color: "from-violet-500 to-purple-600" },
  { href: "/admin/gates", label: "Admin Gates", icon: Shield, color: "from-amber-500 to-orange-600" },
  { href: "/admin/billing", label: "Billing", icon: Settings, color: "from-purple-500 to-pink-600" },
];

/** Cores destacados en home (resto en mapa completo). */
const HIGHLIGHT_CORE_IDS = ["marketing", "contabilidad", "legal", "ventascrm", "logistica"] as const;

export default function HomePage() {
  const agentReg = useAgentRegistrySummary();
  const [stats, setStats] = useState({ totalTenants: 0, backendOnline: false });

  /**
   * Las metricas de abajo son de la PLATAFORMA: registro de agentes, numero de
   * tenants, estado del backend y catalogo de cores. Ninguna es dato del tenant,
   * y un usuario de un tenant no tiene por que ver cuantos clientes tiene
   * Nadakki ni cuantos agentes hay en el registro.
   *
   * Verificado por Cesar en produccion con cajamapaal+carolina: las veia. El
   * motivo esta en `lib/auth/platform-staff.ts` --`tenant_admin` se trataba como
   * personal de plataforma-- y ahi vive la regla.
   *
   * Fail-closed: mientras la sesion carga, `allRoles` esta vacio y esto es
   * `false`, asi que las metricas no asoman antes de saber quien mira.
   */
  const { allRoles } = useAuth();
  const esPlataforma = esPersonalDePlataforma(allRoles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/health`)
        .then((r) => {
          if (cancelled) return;
          setStats((s) => ({ ...s, backendOnline: r.ok }));
        })
        .catch(() => {}),
      fetch(`${API_URL}/api/v1/system/info`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (cancelled || !d) return;
          const info = d?.data || d;
          if (info.total_tenants != null) {
            setStats((s) => ({ ...s, totalTenants: info.total_tenants }));
          }
        })
        .catch(() => {}),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const coresList = Object.values(CORES_CONFIG).sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "es")
  );

  return (
    <div className="ndk-page ndk-fade-in min-h-[80vh]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                stats.backendOnline
                  ? "bg-green-500/20 text-green-400 border border-green-500/40"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${stats.backendOnline ? "bg-green-400" : "bg-amber-400 animate-pulse"}`}
              />
              {stats.backendOnline ? "Backend online" : "Backend offline"}
            </span>
            {agentReg.available && (
              <span className="text-xs text-gray-500">Agent Registry</span>
            )}
            {!agentReg.loading && !agentReg.available && (
              <span className="text-xs text-amber-400/90" title={agentReg.tooltip}>
                Agent Registry unavailable
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            NADAKKI AI Suite
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Plataforma enterprise de IA: riesgo crediticio, crecimiento autonomo y dominios operativos.
          </p>
          <p className="text-gray-500 mt-3 text-sm max-w-2xl leading-relaxed">
            <span className="text-gray-400 font-medium">Arquitectura del producto:</span>{" "}
            Sistema · SIC / riesgo · Crecimiento (publicidad, workflows, marketing) · Autopilot IA ·
            Dominios de negocio · Admin y control.
          </p>
        </motion.div>

        {esPlataforma ? (
        <motion.div
          data-testid="home-metricas-plataforma"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Agentes</span>
            </div>
            <AgentRegistryStatHome
              loading={agentReg.loading}
              available={agentReg.available}
              summary={agentReg.summary}
              tooltip={agentReg.tooltip}
            />
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-400 text-sm">Tenants</span>
            </div>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <span className="text-2xl font-bold text-white">{stats.totalTenants || "—"}</span>
            )}
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-gray-400 text-sm">Estado</span>
            </div>
            <span className="text-lg font-semibold text-white">
              {stats.backendOnline ? "Operativo" : "Verificando"}
            </span>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">Dominios (catálogo)</span>
            </div>
            <span className="text-2xl font-bold text-white">{coresList.length}</span>
          </div>
        </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <h2 className="text-xl font-bold text-white mb-2">Dominios de negocio (neural cores)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Hubs por dominio — alineados con el mapa lateral y el catálogo de agentes.
          </p>
          <div className="flex flex-wrap gap-2">
            {HIGHLIGHT_CORE_IDS.map((id) => {
              const c = CORES_CONFIG[id];
              if (!c) return null;
              return (
                <Link
                  key={id}
                  href={`/${id}`}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-sm text-white hover:bg-white/15 transition-colors"
                >
                  {c.icon} {c.displayName}
                </Link>
              );
            })}
            <a
              href="#cores-full-map"
              className="px-3 py-2 rounded-lg border border-dashed border-white/20 text-sm text-gray-400 hover:text-white hover:border-white/30 inline-flex items-center"
            >
              Ver todos en rejilla ↓
            </a>
          </div>
        </motion.div>

        <motion.div
          id="cores-full-map"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mb-10 rounded-xl border border-white/10 bg-white/[0.03] p-4 max-h-64 overflow-y-auto scroll-mt-24"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {coresList.map((c) => (
              <Link
                key={c.id}
                href={`/${c.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <span>{c.icon}</span>
                <span className="truncate">{c.displayName}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-white mb-1">Acceso rápido por función</h2>
          <p className="text-sm text-gray-500 mb-4">Operacion diaria, inteligencia autonoma, cumplimiento y gobierno.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-r ${link.color} flex items-center justify-center shrink-0`}
                    >
                      <link.icon className="w-5 h-5 text-white" />
                    </div>
                    {link.badge && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90 bg-emerald-500/15 border border-emerald-500/30 rounded px-1.5 py-0.5 shrink-0">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-medium text-white block">{link.label}</span>
                      {link.subtitle ? (
                        <p className="text-xs text-gray-400 mt-1 leading-snug">{link.subtitle}</p>
                      ) : null}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Link href="/agents/execute">
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity">
              Ejecutar agentes <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

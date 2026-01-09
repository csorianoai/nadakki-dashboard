"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Settings, Bot, FileText, Shield, Database, 
  Users, Activity, Server, ArrowRight, Cog
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const ADMIN_MODULES = [
  { id: "agents", name: "Agentes IA", icon: Bot, desc: "Activar, desactivar y configurar agentes", href: "/admin/agents", color: "#8b5cf6", badge: "225" },
  { id: "logs", name: "Logs del Sistema", icon: FileText, desc: "Historial de ejecuciones y errores", href: "/admin/logs", color: "#22c55e" },
  { id: "tenants", name: "Multi-Tenant", icon: Users, desc: "Gestión de clientes y permisos", href: "/tenants", color: "#3b82f6", badge: "4" },
  { id: "settings", name: "Configuración", icon: Settings, desc: "Ajustes generales del sistema", href: "/settings", color: "#f59e0b" },
];

const SYSTEM_STATS = [
  { value: "225", label: "Agentes Totales", icon: <Bot className="w-6 h-6 text-purple-400" />, color: "#8b5cf6" },
  { value: "4", label: "Tenants Activos", icon: <Users className="w-6 h-6 text-blue-400" />, color: "#3b82f6" },
  { value: "99.7%", label: "Uptime", icon: <Activity className="w-6 h-6 text-green-400" />, color: "#22c55e" },
  { value: "v3.2", label: "Versión", icon: <Server className="w-6 h-6 text-cyan-400" />, color: "#06b6d4" },
];

const RECENT_EVENTS = [
  { type: "success", message: "Tenant 'sfrentals' creado exitosamente", time: "Hace 5 min" },
  { type: "info", message: "35 agentes de marketing sincronizados", time: "Hace 12 min" },
  { type: "warning", message: "Backend Render reiniciado (cold start)", time: "Hace 25 min" },
  { type: "success", message: "Deploy frontend completado", time: "Hace 1 hora" },
];

export default function AdminPage() {
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
              Panel de Administración
            </h1>
            <p className="text-gray-400 mt-1">Gestiona agentes, tenants, logs y configuración del sistema</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {SYSTEM_STATS?.map((stat, i) => (
          <StatCard key={i} {...stat} delay={i * 0.1} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Admin Modules */}
        <div className="col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Módulos de Administración</h2>
          <div className="grid grid-cols-2 gap-4">
            {ADMIN_MODULES?.map((module, index) => (
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
            <div className="space-y-4">
              {RECENT_EVENTS?.map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    event.type === "success" ? "bg-green-500" :
                    event.type === "warning" ? "bg-yellow-500" :
                    event.type === "error" ? "bg-red-500" : "bg-blue-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{event.message}</p>
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


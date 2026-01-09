"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, Building2, Plus, Search, MoreVertical,
  Key, Settings, Trash2, CheckCircle, Clock
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: "starter" | "pro" | "enterprise";
  status: "active" | "inactive" | "pending";
  agents: number;
  created: string;
  apiKey: string;
}

const TENANTS: Tenant[] = [
  { id: "credicefi", name: "CrediCefi", domain: "credicefi.com", plan: "enterprise", status: "active", agents: 225, created: "2024-01-15", apiKey: "sk-cred-xxx" },
  { id: "sfrentals", name: "SF Rentals", domain: "sfrentals.com", plan: "pro", status: "active", agents: 45, created: "2024-12-28", apiKey: "sk-sfr-xxx" },
  { id: "techstartup", name: "Tech Startup", domain: "techstartup.io", plan: "starter", status: "pending", agents: 10, created: "2025-01-02", apiKey: "sk-tech-xxx" },
  { id: "financeplus", name: "Finance Plus", domain: "financeplus.mx", plan: "pro", status: "active", agents: 78, created: "2024-06-20", apiKey: "sk-fin-xxx" },
];

const PLAN_COLORS = {
  starter: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/30" },
  pro: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  enterprise: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
};

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const filteredTenants = TENANTS.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.domain.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: TENANTS.length,
    active: TENANTS.filter(t => t.status === "active").length,
    totalAgents: TENANTS.reduce((acc, t) => acc + t.agents, 0),
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg font-medium text-white text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo Tenant
        </motion.button>
      </NavigationBar>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Multi-Tenant Management</h1>
            <p className="text-gray-400">Gestiona clientes, API keys y permisos</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={stats.total} label="Tenants Totales" icon={<Building2 className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value={stats.active} label="Activos" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={stats.totalAgents} label="Agentes Totales" icon={<Users className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value="3" label="Planes" icon={<Key className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      {/* Search */}
      <GlassCard className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tenant por nombre o dominio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
      </GlassCard>

      {/* Tenants Grid */}
      <div className="grid grid-cols-2 gap-6">
        {filteredTenants?.map((tenant, index) => {
          const planStyle = PLAN_COLORS[tenant.plan];
          return (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{tenant.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{tenant.name}</h3>
                      <p className="text-sm text-gray-400">{tenant.domain}</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${planStyle.bg} ${planStyle.text} border ${planStyle.border}`}>
                    {tenant.plan.toUpperCase()}
                  </span>
                  <StatusBadge 
                    status={tenant.status === "active" ? "active" : tenant.status === "pending" ? "warning" : "inactive"} 
                    label={tenant.status === "active" ? "Activo" : tenant.status === "pending" ? "Pendiente" : "Inactivo"}
                    size="sm" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-500">Agentes</p>
                    <p className="text-lg font-bold text-white">{tenant.agents}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-500">Creado</p>
                    <p className="text-sm font-medium text-white">{tenant.created}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1">
                    <Key className="w-4 h-4" /> API Key
                  </button>
                  <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1">
                    <Settings className="w-4 h-4" /> Configurar
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


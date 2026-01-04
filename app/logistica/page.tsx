"use client";
import { motion } from "framer-motion";
import { 
  Truck, Package, MapPin, Clock,
  Bot, CheckCircle, TrendingUp, Warehouse
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const LOGISTICS_MODULES = [
  { name: "Inventario", desc: "Gestión de stock en tiempo real", agents: 6, icon: Warehouse, color: "#22c55e" },
  { name: "Rutas", desc: "Optimización de rutas de entrega", agents: 5, icon: MapPin, color: "#3b82f6" },
  { name: "Entregas", desc: "Tracking y gestión de entregas", agents: 6, icon: Truck, color: "#f59e0b" },
  { name: "Proveedores", desc: "Gestión de cadena de suministro", agents: 6, icon: Package, color: "#8b5cf6" },
];

export default function LogisticaPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Logística Core" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
            <Truck className="w-10 h-10 text-orange-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Logística Inteligente
            </h1>
            <p className="text-gray-400 mt-1">23 agentes de IA para cadena de suministro</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="23" label="Agentes" icon={<Bot className="w-6 h-6 text-orange-400" />} color="#f97316" />
        <StatCard value="4" label="Módulos" icon={<Package className="w-6 h-6 text-amber-400" />} color="#f59e0b" />
        <StatCard value="98.5%" label="Entregas a tiempo" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="-15%" label="Costos" icon={<TrendingUp className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Módulos de Logística</h2>
      <div className="grid grid-cols-2 gap-6">
        {LOGISTICS_MODULES.map((module, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6 cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: module.color + "20" }}>
                  <module.icon className="w-6 h-6" style={{ color: module.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{module.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{module.desc}</p>
                  <p className="text-xs text-gray-500 mt-3">{module.agents} agentes</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

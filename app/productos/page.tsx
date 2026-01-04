"use client";
import { motion } from "framer-motion";
import { 
  Package, Layers, Tag, Sparkles,
  Bot, CheckCircle, TrendingUp, Settings
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const PRODUCT_TYPES = [
  { name: "Crédito Personal", products: 5, active: 4, color: "#22c55e" },
  { name: "Crédito Empresarial", products: 3, active: 3, color: "#3b82f6" },
  { name: "Tarjetas", products: 4, active: 3, color: "#8b5cf6" },
  { name: "Inversiones", products: 6, active: 5, color: "#f59e0b" },
];

export default function ProductosPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <StatusBadge status="active" label="Productos Core" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30">
            <Package className="w-10 h-10 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Catálogo de Productos
            </h1>
            <p className="text-gray-400 mt-1">8 agentes de IA para gestión de productos</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="8" label="Agentes" icon={<Bot className="w-6 h-6 text-indigo-400" />} color="#6366f1" />
        <StatCard value="18" label="Productos" icon={<Package className="w-6 h-6 text-violet-400" />} color="#8b5cf6" />
        <StatCard value="15" label="Activos" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="4" label="Categorías" icon={<Layers className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Tipos de Producto</h2>
      <div className="grid grid-cols-2 gap-6">
        {PRODUCT_TYPES.map((type, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: type.color + "20" }}>
                  <Package className="w-6 h-6" style={{ color: type.color }} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                  {type.active}/{type.products} activos
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{type.name}</h3>
              <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: (type.active/type.products)*100 + "%", backgroundColor: type.color }} />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

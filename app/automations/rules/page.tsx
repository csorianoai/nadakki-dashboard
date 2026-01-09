"use client";
import { motion } from "framer-motion";
import { Settings, Plus, Edit, Trash2, ToggleRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const RULES = [
  { name: "Lead Score > 90", action: "Notificar ventas", status: "active" },
  { name: "Carrito abandonado", action: "Enviar email", status: "active" },
  { name: "Sin actividad 30d", action: "Campana reactivacion", status: "paused" },
  { name: "Nuevo registro", action: "Welcome sequence", status: "active" },
];

export default function AutomationsRulesPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/automations">
        <motion.button whileHover={{ scale: 1.05 }} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Regla
        </motion.button>
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30"><Settings className="w-8 h-8 text-yellow-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Reglas de Automatizacion</h1><p className="text-gray-400">{RULES.length} reglas configuradas</p></div>
        </div>
      </motion.div>
      <div className="space-y-4">
        {RULES?.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div><h3 className="font-bold text-white">{r.name}</h3><p className="text-sm text-gray-400">Accion: {r.action}</p></div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status === "active" ? "active" : "warning"} label={r.status === "active" ? "Activa" : "Pausada"} size="sm" />
                  <button className="p-2 hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4 text-gray-400" /></button>
                  <button className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4 text-gray-400" /></button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


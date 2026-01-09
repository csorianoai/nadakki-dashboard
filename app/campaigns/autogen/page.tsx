"use client";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Play } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const SUGGESTIONS = [
  { name: "Campana de Reactivacion", desc: "Para usuarios inactivos 30+ dias", confidence: 92 },
  { name: "Promo Fin de Mes", desc: "Basado en patrones de compra", confidence: 87 },
  { name: "Cross-sell Productos", desc: "Para clientes recientes", confidence: 85 },
];

export default function CampaignsAutogenPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/campaigns"><StatusBadge status="active" label="AI Generated" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30"><Sparkles className="w-8 h-8 text-pink-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Campanas Auto-generadas</h1><p className="text-gray-400">Sugerencias de IA basadas en tus datos</p></div>
        </div>
      </motion.div>
      <div className="space-y-4">
        {SUGGESTIONS?.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-pink-500/20"><Wand2 className="w-5 h-5 text-pink-400" /></div>
                  <div><h3 className="font-bold text-white">{s.name}</h3><p className="text-sm text-gray-400">{s.desc}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><p className="text-lg font-bold text-green-400">{s.confidence}%</p><p className="text-xs text-gray-500">Confianza</p></div>
                  <motion.button whileHover={{ scale: 1.05 }} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-sm font-medium text-white flex items-center gap-2">
                    <Play className="w-4 h-4" /> Crear
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Plus, Edit, Trash2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const SEGMENTS = [
  { id: 1, name: "Clientes VIP", contacts: 1234, engagement: "92%", lastUpdate: "Hace 2 dias" },
  { id: 2, name: "Leads Calientes", contacts: 567, engagement: "78%", lastUpdate: "Hace 1 dia" },
  { id: 3, name: "Newsletter", contacts: 8900, engagement: "45%", lastUpdate: "Hoy" },
  { id: 4, name: "Inactivos 30d", contacts: 2345, engagement: "12%", lastUpdate: "Hace 1 semana" },
];

export default function AudiencesManagerPage() {
  const [search, setSearch] = useState("");
  const filtered = SEGMENTS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/audiences">
        <motion.button whileHover={{ scale: 1.05 }} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Segmento
        </motion.button>
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><Users className="w-8 h-8 text-purple-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Gestor de Audiencias</h1><p className="text-gray-400">{SEGMENTS.length} segmentos</p></div>
        </div>
      </motion.div>
      <GlassCard className="p-4 mb-6">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Buscar segmentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" /></div>
      </GlassCard>
      <div className="space-y-4">
        {filtered?.map((seg, i) => (
          <motion.div key={seg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div><h3 className="font-bold text-white">{seg.name}</h3><p className="text-sm text-gray-400">{seg.contacts.toLocaleString()} contactos - {seg.engagement} engagement</p></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{seg.lastUpdate}</span>
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


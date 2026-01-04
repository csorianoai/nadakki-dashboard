"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function SchedulerNewJobPage() {
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => { setCreating(true); await new Promise(r => setTimeout(r, 2000)); setCreating(false); };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/scheduler"><StatusBadge status="active" label="Nuevo Job" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30"><Plus className="w-8 h-8 text-orange-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Nuevo Job</h1><p className="text-gray-400">Crear nueva tarea programada</p></div>
        </div>
      </motion.div>
      <GlassCard className="p-6 max-w-2xl">
        <div className="space-y-6">
          <div><label className="text-sm text-gray-400 block mb-2">Nombre del Job</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Daily Report" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" /></div>
          <div><label className="text-sm text-gray-400 block mb-2">Schedule (Cron)</label>
            <input type="text" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Ej: 0 9 * * *" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 font-mono" /></div>
          <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreate} disabled={creating || !name.trim()}
            className={`w-full py-4 rounded-xl font-bold text-white ${creating || !name.trim() ? "bg-gray-600" : "bg-gradient-to-r from-orange-500 to-yellow-500"}`}>
            {creating ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Creando...</span> : "Crear Job"}
          </motion.button>
        </div>
      </GlassCard>
    </div>
  );
}

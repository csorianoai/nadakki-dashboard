"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function CampaignsNewPage() {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("email");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => { setCreating(true); await new Promise(r => setTimeout(r, 2000)); setCreating(false); };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/campaigns"><StatusBadge status="active" label="Nueva Campana" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><Plus className="w-8 h-8 text-purple-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Nueva Campana</h1><p className="text-gray-400">Crea una nueva campana de marketing</p></div>
        </div>
      </motion.div>
      <GlassCard className="p-6 max-w-2xl">
        <div className="space-y-6">
          <div><label className="text-sm text-gray-400 block mb-2">Nombre de la campana</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Promocion Verano 2025" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" /></div>
          <div><label className="text-sm text-gray-400 block mb-2">Canal</label>
            <div className="flex gap-2">
              {["email", "social", "ads", "multi"].map(c => (
                <button key={c} onClick={() => setChannel(c)} className={`px-4 py-2 rounded-lg text-sm ${channel === c ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400"}`}>{c.charAt(0).toUpperCase() + c.slice(1)}</button>
              ))}
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreate} disabled={creating || !name.trim()}
            className={`w-full py-4 rounded-xl font-bold text-white ${creating || !name.trim() ? "bg-gray-600" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}>
            {creating ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Creando...</span> : "Crear Campana"}
          </motion.button>
        </div>
      </GlassCard>
    </div>
  );
}

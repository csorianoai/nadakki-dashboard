"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Mail, Plus, Search, Calendar, Users, 
  TrendingUp, Play, Pause, Settings, Eye
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const CAMPAIGNS = [
  { id: 1, name: "Welcome Series", type: "Email Automation", status: "active", sent: 12450, opened: 8920, clicked: 2340, converted: 567 },
  { id: 2, name: "Black Friday 2024", type: "Promotional", status: "completed", sent: 45000, opened: 28500, clicked: 8900, converted: 2340 },
  { id: 3, name: "Newsletter Semanal", type: "Newsletter", status: "active", sent: 8900, opened: 5670, clicked: 1230, converted: 234 },
  { id: 4, name: "Re-engagement Q1", type: "Win-back", status: "scheduled", sent: 0, opened: 0, clicked: 0, converted: 0 },
];

export default function MarketingCampaignsPage() {
  const [search, setSearch] = useState("");

  const filteredCampaigns = CAMPAIGNS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Campaña
        </motion.button>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30">
            <Mail className="w-8 h-8 text-pink-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Campaign Management</h1>
            <p className="text-gray-400">Automatización y gestión de campañas de marketing</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={CAMPAIGNS.length} label="Campañas" icon={<Mail className="w-6 h-6 text-pink-400" />} color="#ec4899" />
        <StatCard value={CAMPAIGNS.filter(c => c.status === "active").length} label="Activas" icon={<Play className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="66.2K" label="Enviados" icon={<Users className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="3.1K" label="Conversiones" icon={<TrendingUp className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      <GlassCard className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar campañas..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50" />
        </div>
      </GlassCard>

      <div className="space-y-4">
        {filteredCampaigns.map((campaign, i) => (
          <motion.div key={campaign.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{campaign.name}</h3>
                    <p className="text-sm text-gray-400">{campaign.type}</p>
                  </div>
                </div>
                <StatusBadge 
                  status={campaign.status === "active" ? "active" : campaign.status === "completed" ? "inactive" : "warning"} 
                  label={campaign.status === "active" ? "Activa" : campaign.status === "completed" ? "Completada" : "Programada"} 
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-white/5 rounded-lg text-center">
                  <p className="text-xl font-bold text-white">{campaign.sent.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Enviados</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg text-center">
                  <p className="text-xl font-bold text-blue-400">{campaign.opened.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Abiertos</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg text-center">
                  <p className="text-xl font-bold text-yellow-400">{campaign.clicked.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Clicks</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg text-center">
                  <p className="text-xl font-bold text-green-400">{campaign.converted.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Conversiones</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

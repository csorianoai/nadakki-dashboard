"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Plus, Search, Play, Pause, Eye, Edit, Trash2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const CAMPAIGNS = [
  { id: 1, name: "Welcome Series", status: "active", sent: 12450, opened: 4890, clicked: 1234, rate: "39.3%" },
  { id: 2, name: "Newsletter Enero", status: "sent", sent: 8900, opened: 3200, clicked: 890, rate: "36.0%" },
  { id: 3, name: "Promo Ano Nuevo", status: "draft", sent: 0, opened: 0, clicked: 0, rate: "0%" },
  { id: 4, name: "Re-engagement Q1", status: "scheduled", sent: 0, opened: 0, clicked: 0, rate: "0%" },
];

export default function EmailCampaignsPage() {
  const [search, setSearch] = useState("");
  const filteredCampaigns = CAMPAIGNS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/email">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-medium text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Campana
        </motion.button>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
            <Send className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Campanas de Email</h1>
            <p className="text-gray-400">{CAMPAIGNS.length} campanas</p>
          </div>
        </div>
      </motion.div>

      <GlassCard className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar campanas..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" />
        </div>
      </GlassCard>

      <div className="space-y-4">
        {filteredCampaigns?.map((campaign, i) => (
          <motion.div key={campaign.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/20">
                    <Send className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{campaign.name}</h3>
                    <StatusBadge 
                      status={campaign.status === "active" ? "active" : campaign.status === "sent" ? "inactive" : "warning"} 
                      label={campaign.status === "active" ? "Activa" : campaign.status === "sent" ? "Enviada" : campaign.status === "draft" ? "Borrador" : "Programada"} 
                      size="sm" 
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg"><Eye className="w-4 h-4 text-gray-400" /></button>
                  <button className="p-2 hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4 text-gray-400" /></button>
                  <button className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4 text-gray-400" /></button>
                </div>
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
                  <p className="text-xl font-bold text-purple-400">{campaign.clicked.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Clicks</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg text-center">
                  <p className="text-xl font-bold text-green-400">{campaign.rate}</p>
                  <p className="text-xs text-gray-500">Open Rate</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


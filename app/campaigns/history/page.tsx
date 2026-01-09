"use client";
import { motion } from "framer-motion";
import { History, Eye, Download } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const HISTORY = [
  { name: "Cyber Monday 2024", date: "Nov 2024", sent: "45K", opens: "38%", clicks: "12%", roi: "320%" },
  { name: "Halloween Promo", date: "Oct 2024", sent: "32K", opens: "42%", clicks: "15%", roi: "280%" },
  { name: "Back to School", date: "Sep 2024", sent: "28K", opens: "35%", clicks: "10%", roi: "195%" },
];

export default function CampaignsHistoryPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/campaigns"><StatusBadge status="inactive" label="Historial" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30"><History className="w-8 h-8 text-yellow-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Historial de Campanas</h1><p className="text-gray-400">Campanas completadas</p></div>
        </div>
      </motion.div>
      <div className="space-y-4">
        {HISTORY?.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="font-bold text-white">{c.name}</h3><p className="text-sm text-gray-400">{c.date}</p></div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg"><Eye className="w-4 h-4 text-gray-400" /></button>
                  <button className="p-2 hover:bg-white/10 rounded-lg"><Download className="w-4 h-4 text-gray-400" /></button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center"><p className="text-lg font-bold text-white">{c.sent}</p><p className="text-xs text-gray-500">Enviados</p></div>
                <div className="text-center"><p className="text-lg font-bold text-blue-400">{c.opens}</p><p className="text-xs text-gray-500">Opens</p></div>
                <div className="text-center"><p className="text-lg font-bold text-purple-400">{c.clicks}</p><p className="text-xs text-gray-500">Clicks</p></div>
                <div className="text-center"><p className="text-lg font-bold text-green-400">{c.roi}</p><p className="text-xs text-gray-500">ROI</p></div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


"use client";
import { motion } from "framer-motion";
import { FileText, Download, Calendar } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const REPORTS = [
  { name: "Reporte Mensual Diciembre", date: "01 Ene 2025", type: "Mensual" },
  { name: "Performance Q4 2024", date: "15 Dic 2024", type: "Trimestral" },
  { name: "ROI Campanas 2024", date: "10 Dic 2024", type: "Anual" },
  { name: "Reporte Semanal #52", date: "30 Dic 2024", type: "Semanal" },
];

export default function AnalyticsReportsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/analytics"><StatusBadge status="active" label="Reports" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30"><FileText className="w-8 h-8 text-blue-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Reportes</h1><p className="text-gray-400">Reportes generados automaticamente</p></div>
        </div>
      </motion.div>
      <div className="space-y-4">
        {REPORTS?.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/20"><FileText className="w-5 h-5 text-blue-400" /></div>
                  <div><h3 className="font-bold text-white">{r.name}</h3><p className="text-sm text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {r.date}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{r.type}</span>
                  <button className="p-2 hover:bg-white/10 rounded-lg"><Download className="w-4 h-4 text-gray-400" /></button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


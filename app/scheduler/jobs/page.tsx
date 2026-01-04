"use client";
import { motion } from "framer-motion";
import { Clock, Play, Pause, Trash2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const JOBS = [
  { name: "Daily Report Generator", schedule: "0 9 * * *", lastRun: "Hoy 09:00", status: "active" },
  { name: "Weekly Newsletter", schedule: "0 10 * * 1", lastRun: "Lun 10:00", status: "active" },
  { name: "Data Sync", schedule: "*/15 * * * *", lastRun: "Hace 5 min", status: "active" },
  { name: "Cleanup Old Data", schedule: "0 2 * * 0", lastRun: "Dom 02:00", status: "paused" },
];

export default function SchedulerJobsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/scheduler"><StatusBadge status="active" label="Jobs" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30"><Clock className="w-8 h-8 text-orange-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Jobs Programados</h1><p className="text-gray-400">{JOBS.length} tareas configuradas</p></div>
        </div>
      </motion.div>
      <div className="space-y-4">
        {JOBS.map((j, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-500/20"><Clock className="w-5 h-5 text-orange-400" /></div>
                  <div><h3 className="font-bold text-white">{j.name}</h3><p className="text-sm text-gray-400 font-mono">{j.schedule}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">{j.lastRun}</span>
                  <StatusBadge status={j.status === "active" ? "active" : "warning"} label={j.status === "active" ? "Activo" : "Pausado"} size="sm" />
                  <button className="p-2 hover:bg-white/10 rounded-lg">{j.status === "active" ? <Pause className="w-4 h-4 text-yellow-400" /> : <Play className="w-4 h-4 text-green-400" />}</button>
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

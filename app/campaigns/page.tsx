"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Megaphone, Plus, Play, Clock, CheckCircle, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const MODULES = [
  { id: "active", name: "Campanas Activas", desc: "Campanas en ejecucion", href: "/campaigns/active", color: "#22c55e" },
  { id: "new", name: "Nueva Campana", desc: "Crear nueva campana", href: "/campaigns/new", color: "#8b5cf6" },
  { id: "history", name: "Historial", desc: "Campanas anteriores", href: "/campaigns/history", color: "#f59e0b" },
  { id: "autogen", name: "Auto-generadas", desc: "Campanas con IA", href: "/campaigns/autogen", color: "#ec4899" },
];

export default function CampaignsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><StatusBadge status="active" label="Campaigns" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30"><Megaphone className="w-8 h-8 text-pink-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Campanas</h1><p className="text-gray-400">Gestion de campanas de marketing</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="12" label="Activas" icon={<Play className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="5" label="Programadas" icon={<Clock className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="89" label="Completadas" icon={<CheckCircle className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="$125K" label="ROI Total" icon={<Megaphone className="w-6 h-6 text-pink-400" />} color="#ec4899" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        {MODULES?.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link href={m.href}><GlassCard className="p-6 cursor-pointer group">
              <h3 className="text-lg font-bold text-white group-hover:text-pink-400">{m.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{m.desc}</p>
              <ArrowRight className="w-5 h-5 text-gray-500 mt-4 group-hover:translate-x-1 transition-transform" />
            </GlassCard></Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


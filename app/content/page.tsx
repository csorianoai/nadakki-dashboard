"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, Wand2, Calendar, FolderOpen, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const MODULES = [
  { id: "studio", name: "Content Studio", desc: "Crea contenido con IA", href: "/content/studio", color: "#8b5cf6" },
  { id: "calendar", name: "Calendario", desc: "Planifica tu contenido", href: "/content/calendar", color: "#22c55e" },
];

export default function ContentPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><StatusBadge status="active" label="Content Hub" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><FileText className="w-8 h-8 text-purple-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Content Hub</h1><p className="text-gray-400">Creacion y gestion de contenido</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value="1,250" label="Contenidos" icon={<FileText className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value="89" label="Este Mes" icon={<Calendar className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="4" label="Pendientes" icon={<Wand2 className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="98%" label="Engagement" icon={<FolderOpen className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        {MODULES?.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link href={m.href}><GlassCard className="p-6 cursor-pointer group">
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400">{m.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{m.desc}</p>
              <ArrowRight className="w-5 h-5 text-gray-500 mt-4 group-hover:translate-x-1 transition-transform" />
            </GlassCard></Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


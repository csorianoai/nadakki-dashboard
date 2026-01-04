"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AudiencesPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><StatusBadge status="active" label="Audiences" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><Users className="w-8 h-8 text-purple-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Audiencias</h1><p className="text-gray-400">Segmentacion y gestion de audiencias</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard value="45.2K" label="Contactos" icon={<Users className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value="12" label="Segmentos" icon={<Users className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="89%" label="Engagement" icon={<Users className="w-6 h-6 text-green-400" />} color="#22c55e" />
      </div>
      <Link href="/audiences/manager">
        <GlassCard className="p-6 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div><h3 className="text-lg font-bold text-white group-hover:text-purple-400">Gestionar Audiencias</h3><p className="text-sm text-gray-400">Ver todos los segmentos y contactos</p></div>
            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </GlassCard>
      </Link>
    </div>
  );
}

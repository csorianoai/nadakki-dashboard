"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { FlaskConical, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function TestingPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><StatusBadge status="active" label="Testing" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30"><FlaskConical className="w-8 h-8 text-cyan-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Testing & QA</h1><p className="text-gray-400">Pruebas y validacion de agentes</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard value="45" label="Tests Activos" icon={<FlaskConical className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value="98.5%" label="Pass Rate" icon={<FlaskConical className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="12" label="En Cola" icon={<FlaskConical className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>
      <Link href="/testing/lab"><GlassCard className="p-6 cursor-pointer group">
        <h3 className="text-lg font-bold text-white group-hover:text-cyan-400">Testing Lab</h3>
        <p className="text-sm text-gray-400 mt-1">Accede al laboratorio de pruebas</p>
        <ArrowRight className="w-5 h-5 text-gray-500 mt-4 group-hover:translate-x-1 transition-transform" />
      </GlassCard></Link>
    </div>
  );
}

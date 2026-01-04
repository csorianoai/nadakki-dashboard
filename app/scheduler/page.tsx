"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, Plus, Calendar, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

export default function SchedulerPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><StatusBadge status="active" label="Scheduler" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30"><Clock className="w-8 h-8 text-orange-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Scheduler</h1><p className="text-gray-400">Programacion de tareas y jobs</p></div>
        </div>
      </motion.div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard value="12" label="Jobs Activos" icon={<Clock className="w-6 h-6 text-orange-400" />} color="#f97316" />
        <StatCard value="156" label="Ejecuciones/dia" icon={<Calendar className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value="99.8%" label="Uptime" icon={<Clock className="w-6 h-6 text-green-400" />} color="#22c55e" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Link href="/scheduler/jobs"><GlassCard className="p-6 cursor-pointer group">
          <h3 className="text-lg font-bold text-white group-hover:text-orange-400">Ver Jobs</h3>
          <p className="text-sm text-gray-400 mt-1">Lista de tareas programadas</p>
          <ArrowRight className="w-5 h-5 text-gray-500 mt-4 group-hover:translate-x-1 transition-transform" />
        </GlassCard></Link>
        <Link href="/scheduler/new-job"><GlassCard className="p-6 cursor-pointer group">
          <h3 className="text-lg font-bold text-white group-hover:text-orange-400">Nuevo Job</h3>
          <p className="text-sm text-gray-400 mt-1">Crear nueva tarea programada</p>
          <ArrowRight className="w-5 h-5 text-gray-500 mt-4 group-hover:translate-x-1 transition-transform" />
        </GlassCard></Link>
      </div>
    </div>
  );
}

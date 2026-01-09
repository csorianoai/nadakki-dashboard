"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Brain, Building2, Users, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const MODULES = [
  { id: "brand", name: "Brand Intelligence", desc: "Monitoreo de marca", href: "/intelligence/brand", color: "#8b5cf6" },
  { id: "competitors", name: "Competitors", desc: "Analisis competitivo", href: "/intelligence/competitors", color: "#ec4899" },
];

export default function IntelligencePage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/"><StatusBadge status="active" label="Intelligence" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"><Brain className="w-8 h-8 text-purple-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Market Intelligence</h1><p className="text-gray-400">Analisis de mercado y competencia</p></div>
        </div>
      </motion.div>
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


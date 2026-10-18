"use client";
import { motion } from "@/lib/motion-stub";
import Link from "next/link";
import { Target, Users, TrendingUp, Filter, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import DemoPanel from "@/components/leads/DemoPanel";
import { DEMO_KPIS } from "@/lib/leads/demo-data";

const KPI_ICONS = {
  total: <Users className="w-6 h-6 text-blue-400" />,
  hot: <TrendingUp className="w-6 h-6 text-red-400" />,
  conv: <Target className="w-6 h-6 text-green-400" />,
  score: <Filter className="w-6 h-6 text-yellow-400" />,
};

const MODULES = [
  { id: "scoring", name: "Lead Scoring", desc: "Puntuacion automatica con IA", href: "/leads/scoring", color: "#22c55e" },
  { id: "pipeline", name: "Pipeline", desc: "Visualiza tu embudo de ventas", href: "/leads/pipeline", color: "#3b82f6" },
];

export default function LeadsPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Lead Management" size="lg" />
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
            <Target className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Lead Management</h1>
            <p className="text-gray-400">Gestion y scoring de leads con IA</p>
          </div>
        </div>
      </motion.div>
      <DemoPanel>
        <div className="grid grid-cols-4 gap-6 mb-8">
          {DEMO_KPIS.map((k) => (
            <StatCard key={k.key} value={k.value} label={k.label} icon={KPI_ICONS[k.key as keyof typeof KPI_ICONS]} color={k.color} />
          ))}
        </div>
      </DemoPanel>
      <div className="grid grid-cols-2 gap-6">
        {MODULES?.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link href={m.href}>
              <GlassCard className="p-6 cursor-pointer group">
                <h3 className="text-lg font-bold text-white group-hover:text-green-400">{m.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{m.desc}</p>
                <ArrowRight className="w-5 h-5 text-gray-500 mt-4 group-hover:translate-x-1 transition-transform" />
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


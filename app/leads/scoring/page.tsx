"use client";
import { motion } from "framer-motion";
import { Target, TrendingUp, Users, Star } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const LEADS = [
  { name: "Carlos Garcia", company: "Tech Solutions", score: 92, status: "hot" },
  { name: "Maria Lopez", company: "Startup Inc", score: 85, status: "warm" },
  { name: "Juan Perez", company: "Corp MX", score: 78, status: "warm" },
  { name: "Ana Martinez", company: "Fintech Pro", score: 95, status: "hot" },
  { name: "Roberto Silva", company: "Digital Agency", score: 65, status: "cold" },
];

const COLORS = { hot: "#ef4444", warm: "#f59e0b", cold: "#3b82f6" };

export default function LeadsScoringPage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/leads"><StatusBadge status="active" label="AI Scoring" size="lg" /></NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30"><Target className="w-8 h-8 text-green-400" /></div>
          <div><h1 className="text-3xl font-bold text-white">Lead Scoring</h1><p className="text-gray-400">Puntuacion automatica con IA</p></div>
        </div>
      </motion.div>
      <div className="space-y-4">
        {LEADS.map((lead, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 font-bold">{lead.name.charAt(0)}</div>
                  <div><h3 className="font-bold text-white">{lead.name}</h3><p className="text-sm text-gray-400">{lead.company}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: COLORS[lead.status as keyof typeof COLORS] + "20", color: COLORS[lead.status as keyof typeof COLORS] }}>{lead.status.toUpperCase()}</span>
                  <div className="text-center"><p className="text-2xl font-bold text-green-400">{lead.score}</p><p className="text-xs text-gray-500">AI Score</p></div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

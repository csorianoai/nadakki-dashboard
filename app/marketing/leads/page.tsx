"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Target, Users, TrendingUp, Star, Filter,
  Search, ArrowUpRight, Phone, Mail, Building
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const LEADS = [
  { id: 1, name: "Carlos García", email: "carlos@empresa.com", company: "Tech Solutions", score: 92, status: "hot", source: "LinkedIn" },
  { id: 2, name: "María López", email: "maria@startup.io", company: "Startup Inc", score: 85, status: "warm", source: "Website" },
  { id: 3, name: "Juan Pérez", email: "juan@corp.mx", company: "Corp MX", score: 78, status: "warm", source: "Referral" },
  { id: 4, name: "Ana Martínez", email: "ana@fintech.com", company: "Fintech Pro", score: 95, status: "hot", source: "Event" },
  { id: 5, name: "Roberto Silva", email: "roberto@agency.com", company: "Digital Agency", score: 65, status: "cold", source: "Ads" },
];

const SCORE_COLORS = {
  hot: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  warm: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
  cold: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
};

export default function MarketingLeadsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredLeads = LEADS.filter(lead => {
    const matchSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || lead.company.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || lead.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Lead Scoring AI" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
            <Target className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Lead Management</h1>
            <p className="text-gray-400">Scoring, calificación y nurturing de leads con IA</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={LEADS.length} label="Total Leads" icon={<Users className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value={LEADS.filter(l => l.status === "hot").length} label="Hot Leads" icon={<TrendingUp className="w-6 h-6 text-red-400" />} color="#ef4444" />
        <StatCard value="87%" label="Conversión" icon={<Target className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="4.2" label="Score Promedio" icon={<Star className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar leads..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50" />
          </div>
          <div className="flex items-center gap-2">
            {["all", "hot", "warm", "cold"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? "bg-green-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                {f === "all" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="space-y-4">
        {filteredLeads?.map((lead, i) => {
          const scoreStyle = SCORE_COLORS[lead.status as keyof typeof SCORE_COLORS];
          return (
            <motion.div key={lead.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-green-400">{lead.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-white">{lead.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${scoreStyle.bg} ${scoreStyle.text} border ${scoreStyle.border}`}>
                        {lead.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Building className="w-4 h-4" /> {lead.company}</span>
                      <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {lead.email}</span>
                    </div>
                  </div>
                  <div className="text-center px-6 border-l border-white/10">
                    <div className="text-3xl font-bold text-green-400">{lead.score}</div>
                    <div className="text-xs text-gray-500">AI Score</div>
                  </div>
                  <div className="text-sm text-gray-400">{lead.source}</div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


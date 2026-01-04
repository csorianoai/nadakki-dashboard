"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Bot, Search, Play, Zap, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Agent { id: string; name: string; category: string; }

const CATEGORIES = ["Todos", "Leads", "Content", "Social", "Analytics", "Campaigns"];

const MOCK_AGENTS: Agent[] = [
  { id: "leadscoringia", name: "Lead Scoring IA", category: "Leads" },
  { id: "leadqualifieria", name: "Lead Qualifier IA", category: "Leads" },
  { id: "leadnurturingia", name: "Lead Nurturing IA", category: "Leads" },
  { id: "contentgeneratoria", name: "Content Generator IA", category: "Content" },
  { id: "copywriteria", name: "Copywriter IA", category: "Content" },
  { id: "blogwriteria", name: "Blog Writer IA", category: "Content" },
  { id: "seooptimizeria", name: "SEO Optimizer IA", category: "Content" },
  { id: "socialpostgeneratoria", name: "Social Post Generator IA", category: "Social" },
  { id: "hashtagoptimizeria", name: "Hashtag Optimizer IA", category: "Social" },
  { id: "engagementanalyzeria", name: "Engagement Analyzer IA", category: "Social" },
  { id: "sentimentanalyzeria", name: "Sentiment Analyzer IA", category: "Analytics" },
  { id: "trenddetectoria", name: "Trend Detector IA", category: "Analytics" },
  { id: "campaignoptimizeria", name: "Campaign Optimizer IA", category: "Campaigns" },
  { id: "emailsequencemasteria", name: "Email Sequence Master IA", category: "Campaigns" },
  { id: "abTestingIA", name: "A/B Testing IA", category: "Campaigns" },
];

export default function MarketingAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [apiStatus, setApiStatus] = useState<"live" | "mock">("mock");

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("https://nadakki-ai-suite.onrender.com/api/catalog/marketing/agents");
        const data = await res.json();
        if (data.agents && data.agents.length > 0) {
          setAgents(data.agents);
          setApiStatus("live");
        } else {
          setAgents(MOCK_AGENTS);
        }
      } catch {
        setAgents(MOCK_AGENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(agent => {
    const matchSearch = agent.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "Todos" || agent.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status={apiStatus === "live" ? "active" : "warning"} label={apiStatus === "live" ? "API Live" : "Demo Mode"} size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Bot className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Marketing AI Agents</h1>
            <p className="text-gray-400">{agents.length} agentes especializados en marketing</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={agents.length.toString()} label="Total Agentes" icon={<Bot className="w-6 h-6 text-cyan-400" />} color="#06b6d4" />
        <StatCard value={agents.length.toString()} label="Activos" icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value="98.5%" label="Precision" icon={<TrendingUp className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
        <StatCard value="45ms" label="Latencia" icon={<Zap className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
      </div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar agentes..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50" />
          </div>
          <div className="flex items-center gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${category === cat ? "bg-cyan-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Cargando agentes..." /></div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredAgents.map((agent, i) => (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link href={`/marketing/agents/${agent.id}`}>
                <GlassCard className="p-5 cursor-pointer group h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{agent.name}</h3>
                      <p className="text-xs text-gray-400">{agent.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Bot, Plus, Play, Pause, Settings, Trash2, Copy, Edit,
  MessageSquare, Mail, Phone, Globe, Zap, Brain, Target,
  TrendingUp, Users, Clock, MoreVertical, Search, Filter,
  Loader2, Check, X, Sparkles, ArrowRight
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface Agent {
  id: string;
  name: string;
  description: string;
  type: "chatbot" | "email" | "voice" | "support" | "sales";
  status: "active" | "paused" | "draft";
  conversations: number;
  successRate: number;
  avgResponseTime: string;
  lastActive: string;
  model: string;
}

const AGENT_TYPES = {
  chatbot: { icon: MessageSquare, color: "#8b5cf6", label: "Chatbot" },
  email: { icon: Mail, color: "#3b82f6", label: "Email Agent" },
  voice: { icon: Phone, color: "#22c55e", label: "Voice Agent" },
  support: { icon: Globe, color: "#f59e0b", label: "Support Agent" },
  sales: { icon: Target, color: "#ec4899", label: "Sales Agent" },
};

const SAMPLE_AGENTS: Agent[] = [
  { id: "a1", name: "Customer Support Bot", description: "Handles customer inquiries 24/7", type: "support", status: "active", conversations: 12450, successRate: 94.2, avgResponseTime: "1.2s", lastActive: "2 min ago", model: "GPT-4" },
  { id: "a2", name: "Sales Assistant", description: "Qualifies leads and schedules demos", type: "sales", status: "active", conversations: 3420, successRate: 87.5, avgResponseTime: "2.1s", lastActive: "5 min ago", model: "Claude 3" },
  { id: "a3", name: "Email Responder", description: "Auto-responds to common email queries", type: "email", status: "active", conversations: 8900, successRate: 91.8, avgResponseTime: "45s", lastActive: "1 min ago", model: "GPT-4" },
  { id: "a4", name: "Onboarding Guide", description: "Guides new users through setup", type: "chatbot", status: "paused", conversations: 2100, successRate: 96.3, avgResponseTime: "0.8s", lastActive: "2 hours ago", model: "Claude 3" },
  { id: "a5", name: "Voice Support", description: "Handles phone support calls", type: "voice", status: "draft", conversations: 0, successRate: 0, avgResponseTime: "-", lastActive: "Never", model: "Whisper + GPT-4" },
];

const TEMPLATES = [
  { id: "t1", name: "Customer Support", desc: "24/7 support bot", type: "support", icon: Globe },
  { id: "t2", name: "Lead Qualifier", desc: "Qualify and route leads", type: "sales", icon: Target },
  { id: "t3", name: "FAQ Bot", desc: "Answer common questions", type: "chatbot", icon: MessageSquare },
  { id: "t4", name: "Email Assistant", desc: "Auto-respond emails", type: "email", icon: Mail },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(SAMPLE_AGENTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const filteredAgents = agents.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || a.status === filter || a.type === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === "active").length,
    totalConversations: agents.reduce((acc, a) => acc + a.conversations, 0),
    avgSuccess: (agents.filter(a => a.successRate > 0).reduce((acc, a) => acc + a.successRate, 0) / agents.filter(a => a.successRate > 0).length).toFixed(1),
  };

  const toggleStatus = (id: string) => {
    setAgents(agents?.map(a => a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a));
  };

  const duplicateAgent = (agent: Agent) => {
    const newAgent = { ...agent, id: `a${Date.now()}`, name: `${agent.name} (Copy)`, status: "draft" as const, conversations: 0 };
    setAgents([...agents, newAgent]);
  };

  const deleteAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="AI Agents" size="lg" />
      </NavigationBar>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <Bot className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">AI Agents</h1>
            <p className="text-gray-400">Crea y gestiona agentes inteligentes para automatización</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white font-medium">
          <Plus className="w-5 h-5" /> Create Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={stats.total.toString()} label="Total Agents" icon={<Bot className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value={stats.active.toString()} label="Active" icon={<Play className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={(stats.totalConversations / 1000).toFixed(1) + "K"} label="Conversations" icon={<MessageSquare className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value={stats.avgSuccess + "%"} label="Avg Success Rate" icon={<TrendingUp className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input type="text" placeholder="Search agents..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500" />
        </div>
        <div className="flex gap-2">
          {["all", "active", "paused", "draft"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize ${filter === f ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-2 gap-6">
        {filteredAgents?.map((agent, i) => {
          const typeConfig = AGENT_TYPES[agent.type];
          const TypeIcon = typeConfig.icon;
          return (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5 hover:border-green-500/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: typeConfig.color + "20" }}>
                      <TypeIcon className="w-6 h-6" style={{ color: typeConfig.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{agent.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          agent.status === "active" ? "bg-green-500/20 text-green-400" :
                          agent.status === "paused" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>{agent.status}</span>
                      </div>
                      <p className="text-sm text-gray-400">{agent.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{typeConfig.label}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{agent.model}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleStatus(agent.id)}
                      className={`p-2 rounded-lg ${agent.status === "active" ? "hover:bg-yellow-500/20 text-yellow-400" : "hover:bg-green-500/20 text-green-400"}`}>
                      {agent.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><Settings className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-lg font-bold text-white">{agent.conversations.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Conversations</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-lg font-bold text-green-400">{agent.successRate}%</div>
                    <div className="text-xs text-gray-500">Success Rate</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-lg font-bold text-blue-400">{agent.avgResponseTime}</div>
                    <div className="text-xs text-gray-500">Avg Response</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {agent.lastActive}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => duplicateAgent(agent)} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Duplicate
                    </button>
                    <button onClick={() => deleteAgent(agent.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Create New Agent</h3>
                <p className="text-sm text-gray-400 mt-1">Choose a template or start from scratch</p>
              </div>
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-400 mb-4">TEMPLATES</h4>
                <div className="grid grid-cols-2 gap-4">
                  {TEMPLATES?.map(t => (
                    <button key={t.id} className="p-4 border border-white/10 rounded-xl hover:border-green-500 hover:bg-green-500/5 text-left transition-all group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-white/10 group-hover:bg-green-500/20">
                          <t.icon className="w-5 h-5 text-gray-400 group-hover:text-green-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{t.name}</div>
                          <div className="text-sm text-gray-400">{t.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <button className="w-full p-4 border border-dashed border-white/20 rounded-xl hover:border-purple-500 hover:bg-purple-500/5 text-center transition-all">
                    <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-white font-medium">Start from Scratch</div>
                    <div className="text-sm text-gray-400">Build a custom agent with AI</div>
                  </button>
                </div>
              </div>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


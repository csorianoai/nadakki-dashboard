"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Filter, Download, RefreshCw, Search,
  CheckCircle, AlertTriangle, XCircle, Info, Clock
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  agent: string;
  message: string;
  duration: string;
  details?: string;
}

const LOGS: LogEntry[] = [
  { id: "1", timestamp: "14:32:45", level: "success", agent: "LeadScoringIA", message: "Procesó 150 leads exitosamente", duration: "1.2s" },
  { id: "2", timestamp: "14:30:12", level: "success", agent: "ContentGeneratorIA", message: "Generó 3 posts para Instagram", duration: "3.4s" },
  { id: "3", timestamp: "14:28:56", level: "warning", agent: "SentimentAnalyzerIA", message: "API rate limit approaching (80%)", duration: "0.8s" },
  { id: "4", timestamp: "14:25:33", level: "error", agent: "EmailSequenceMaster", message: "SMTP connection timeout", duration: "5.0s", details: "Connection refused to smtp.gmail.com:587" },
  { id: "5", timestamp: "14:22:11", level: "success", agent: "CampaignOptimizerIA", message: "Budget reallocated successfully", duration: "2.1s" },
  { id: "6", timestamp: "14:18:45", level: "info", agent: "AudienceSegmenterIA", message: "Segmentation model updated", duration: "4.5s" },
  { id: "7", timestamp: "14:15:22", level: "success", agent: "SocialPostGeneratorIA", message: "Published 5 posts to Twitter", duration: "1.8s" },
  { id: "8", timestamp: "14:12:10", level: "warning", agent: "CompetitorAnalyzerIA", message: "Data source temporarily unavailable", duration: "0.5s" },
  { id: "9", timestamp: "14:08:33", level: "success", agent: "PricingOptimizerIA", message: "Price adjustments applied", duration: "2.3s" },
  { id: "10", timestamp: "14:05:18", level: "error", agent: "InfluencerMatcherIA", message: "Instagram API authentication failed", duration: "0.3s" },
];

const LEVEL_CONFIG = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  success: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

export default function AdminLogsPage() {
  const [filter, setFilter] = useState<"all" | "info" | "success" | "warning" | "error">("all");
  const [search, setSearch] = useState("");

  const filteredLogs = LOGS.filter(log => {
    const matchFilter = filter === "all" || log.level === filter;
    const matchSearch = log.agent.toLowerCase().includes(search.toLowerCase()) || log.message.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: LOGS.length,
    success: LOGS.filter(l => l.level === "success").length,
    warning: LOGS.filter(l => l.level === "warning").length,
    error: LOGS.filter(l => l.level === "error").length,
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05 }} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">
            <Download className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>
      </NavigationBar>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
            <FileText className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Logs del Sistema</h1>
            <p className="text-gray-400">Historial de ejecuciones y eventos de los agentes IA</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Exitosos", value: stats.success, color: "text-green-400" },
          { label: "Advertencias", value: stats.warning, color: "text-yellow-400" },
          { label: "Errores", value: stats.error, color: "text-red-400" },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "success", "warning", "error"] as const).map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filter === level ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              >
                {level === "all" ? "Todos" : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Timeline */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          {filteredLogs.map((log, i) => {
            const config = LEVEL_CONFIG[log.level];
            const Icon = config.icon;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-4 p-4 rounded-xl ${config.bg} border ${config.border}`}
              >
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{log.agent}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400">{log.duration}</span>
                  </div>
                  <p className="text-sm text-gray-300">{log.message}</p>
                  {log.details && <p className="text-xs text-gray-500 mt-1 font-mono">{log.details}</p>}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {log.timestamp}
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

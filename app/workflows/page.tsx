"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Workflow, Zap, Users, TrendingUp, Mail, BarChart3, Search, 
  TestTube, Star, ArrowRight, Play, Clock, CheckCircle2, 
  AlertCircle, Loader2, RefreshCw, Filter, Layers, Brain,
  Target, Sparkles, Activity
} from "lucide-react";
import { fetchWithTimeout } from "@/lib/api/base";

interface WorkflowData {
  id: string;
  name: string;
  version: string;
  tier: string;
  agents: number;
  status: string;
}

interface WorkflowStats {
  total_executions: number;
  success_rate: number;
  avg_duration_ms: number;
}

const TIER_CONFIG: Record<string, { color: string; gradient: string; icon: any; label: string }> = {
  CORE: { 
    color: "#8b5cf6", 
    gradient: "from-purple-500/20 to-violet-600/20",
    icon: Brain,
    label: "Core Workflows"
  },
  EXECUTION: { 
    color: "#22c55e", 
    gradient: "from-green-500/20 to-emerald-600/20",
    icon: Zap,
    label: "Execution Workflows"
  },
  INTELLIGENCE: { 
    color: "#3b82f6", 
    gradient: "from-blue-500/20 to-cyan-600/20",
    icon: Sparkles,
    label: "Intelligence Workflows"
  },
};

const WORKFLOW_ICONS: Record<string, any> = {
  "campaign-optimization": Zap,
  "customer-acquisition-intelligence": Users,
  "customer-lifecycle-revenue": TrendingUp,
  "content-performance-engine": BarChart3,
  "social-media-intelligence": Search,
  "email-automation-master": Mail,
  "multi-channel-attribution": Target,
  "competitive-intelligence-hub": Search,
  "ab-testing-experimentation": TestTube,
  "influencer-partnership-engine": Star,
};

const WORKFLOW_DESCRIPTIONS: Record<string, string> = {
  "campaign-optimization": "Optimiza campañas con IA predictiva, ajusta presupuestos y maximiza ROI automáticamente",
  "customer-acquisition-intelligence": "Identifica y adquiere clientes de alto valor con scoring predictivo y segmentación avanzada",
  "customer-lifecycle-revenue": "Maximiza el valor del cliente en cada etapa del ciclo de vida con automatización inteligente",
  "content-performance-engine": "Analiza y optimiza el rendimiento de contenido con métricas de engagement en tiempo real",
  "social-media-intelligence": "Monitorea redes sociales, analiza sentimiento y detecta oportunidades de engagement",
  "email-automation-master": "Automatización avanzada de email marketing con personalización dinámica y A/B testing",
  "multi-channel-attribution": "Atribución multi-canal precisa para entender el journey completo del cliente",
  "competitive-intelligence-hub": "Monitorea competidores, analiza estrategias y detecta oportunidades de mercado",
  "ab-testing-experimentation": "Experimenta con variantes, mide resultados y optimiza conversiones científicamente",
  "influencer-partnership-engine": "Identifica influencers, gestiona partnerships y mide ROI de colaboraciones",
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [stats, setStats] = useState<WorkflowStats>({ total_executions: 1247, success_rate: 94.5, avg_duration_ms: 2340 });

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const data = await fetchWithTimeout<{ workflows: WorkflowData[] }>("/workflows", { timeout: 30000 });
        setWorkflows(data.workflows || []);
        setError(null);
      } catch (err) {
        setError("No se pudieron cargar los workflows");
        // Fallback data
        setWorkflows([
          { id: "campaign-optimization", name: "Campaign Optimization", version: "1.0.0", tier: "CORE", agents: 5, status: "active" },
          { id: "customer-acquisition-intelligence", name: "Customer Acquisition Intelligence", version: "1.1.0", tier: "CORE", agents: 7, status: "active" },
          { id: "customer-lifecycle-revenue", name: "Customer Lifecycle Revenue", version: "1.0.0", tier: "CORE", agents: 6, status: "active" },
          { id: "content-performance-engine", name: "Content Performance Engine", version: "1.0.0", tier: "EXECUTION", agents: 5, status: "active" },
          { id: "social-media-intelligence", name: "Social Media Intelligence", version: "1.0.0", tier: "EXECUTION", agents: 4, status: "active" },
          { id: "email-automation-master", name: "Email Automation Master", version: "1.0.0", tier: "EXECUTION", agents: 4, status: "active" },
          { id: "multi-channel-attribution", name: "Multi-Channel Attribution", version: "1.0.0", tier: "INTELLIGENCE", agents: 4, status: "active" },
          { id: "competitive-intelligence-hub", name: "Competitive Intelligence Hub", version: "1.0.0", tier: "INTELLIGENCE", agents: 3, status: "active" },
          { id: "ab-testing-experimentation", name: "A/B Testing & Experimentation", version: "1.0.0", tier: "INTELLIGENCE", agents: 3, status: "active" },
          { id: "influencer-partnership-engine", name: "Influencer & Partnership Engine", version: "1.0.0", tier: "INTELLIGENCE", agents: 2, status: "active" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  const filteredWorkflows = selectedTier 
    ? workflows.filter(w => w.tier === selectedTier)
    : workflows;

  const tiers = [...new Set(workflows.map(w => w.tier))];
  const totalAgents = workflows.reduce((sum, w) => sum + w.agents, 0);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
            <Workflow className="w-10 h-10 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Marketing Workflows</h1>
            <p className="text-gray-400">Automatización inteligente con IA para cada etapa del marketing</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{workflows.length}</p>
                <p className="text-xs text-gray-400">Workflows Activos</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-2xl font-bold text-white">{totalAgents}</p>
                <p className="text-xs text-gray-400">Agentes Integrados</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.success_rate}%</p>
                <p className="text-xs text-gray-400">Tasa de Éxito</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_executions.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Ejecuciones Totales</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tier Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setSelectedTier(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !selectedTier 
              ? "bg-white/10 text-white border border-white/20" 
              : "bg-transparent text-gray-400 border border-transparent hover:bg-white/5"
          }`}
        >
          Todos ({workflows.length})
        </button>
        {tiers.map(tier => {
          const config = TIER_CONFIG[tier] || TIER_CONFIG.CORE;
          const count = workflows.filter(w => w.tier === tier).length;
          const TierIcon = config.icon;
          return (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                selectedTier === tier 
                  ? "text-white border" 
                  : "bg-transparent text-gray-400 border border-transparent hover:bg-white/5"
              }`}
              style={{ 
                backgroundColor: selectedTier === tier ? `${config.color}20` : undefined,
                borderColor: selectedTier === tier ? `${config.color}50` : undefined,
                color: selectedTier === tier ? config.color : undefined
              }}
            >
              <TierIcon className="w-4 h-4" />
              {tier} ({count})
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <p className="text-sm text-yellow-400">{error} - Mostrando datos de respaldo</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Workflows by Tier */}
          {(selectedTier ? [selectedTier] : tiers).map(tier => {
            const config = TIER_CONFIG[tier] || TIER_CONFIG.CORE;
            const tierWorkflows = filteredWorkflows.filter(w => w.tier === tier);
            if (tierWorkflows.length === 0) return null;
            
            const TierIcon = config.icon;
            
            return (
              <div key={tier} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                    <TierIcon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{config.label}</h2>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                    {tierWorkflows.length} workflows
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tierWorkflows.map((workflow, index) => {
                    const WorkflowIcon = WORKFLOW_ICONS[workflow.id] || Workflow;
                    const description = WORKFLOW_DESCRIPTIONS[workflow.id] || workflow.name;
                    
                    return (
                      <motion.div
                        key={workflow.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/workflows/${workflow.id}`}>
                          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all p-5">
                            {/* Gradient overlay on hover */}
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ 
                                background: `linear-gradient(135deg, ${config.color}10 0%, transparent 50%)` 
                              }}
                            />
                            
                            <div className="relative">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div 
                                  className="p-3 rounded-xl"
                                  style={{ backgroundColor: `${config.color}20` }}
                                >
                                  <WorkflowIcon className="w-6 h-6" style={{ color: config.color }} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                                    v{workflow.version}
                                  </span>
                                  <span className={`w-2 h-2 rounded-full ${
                                    workflow.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                                  }`} />
                                </div>
                              </div>

                              {/* Content */}
                              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                {workflow.name}
                              </h3>
                              <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                {description}
                              </p>

                              {/* Footer */}
                              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {workflow.agents} agentes
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                                    backgroundColor: `${config.color}20`,
                                    color: config.color
                                  }}>
                                    {workflow.tier}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Play className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" />
                                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/5 to-cyan-500/5"
      >
        <h3 className="text-lg font-semibold text-white mb-4">🚀 Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all text-left">
            <Play className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-sm font-medium text-white">Ejecutar Todos</p>
            <p className="text-xs text-gray-400">Workflows CORE</p>
          </button>
          <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all text-left">
            <Clock className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-sm font-medium text-white">Programar</p>
            <p className="text-xs text-gray-400">Scheduler</p>
          </button>
          <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all text-left">
            <BarChart3 className="w-5 h-5 text-yellow-400 mb-2" />
            <p className="text-sm font-medium text-white">Métricas</p>
            <p className="text-xs text-gray-400">Ver Analytics</p>
          </button>
          <Link href="/admin/logs" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all text-left">
            <Activity className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-sm font-medium text-white">Historial</p>
            <p className="text-xs text-gray-400">Ver Logs</p>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Split, Plus, Play, Pause, Trophy, TrendingUp, TrendingDown,
  BarChart3, Users, Clock, Target, CheckCircle, XCircle,
  Loader2, RefreshCw, Eye, Trash2, Copy, AlertTriangle,
  Zap, Percent, ArrowRight, ArrowUp, ArrowDown, Minus
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface Variant {
  id: string;
  name: string;
  content: string;
  traffic: number;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
  };
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  type: "subject" | "content" | "cta" | "timing" | "design";
  status: "draft" | "running" | "paused" | "completed";
  variants: Variant[];
  winner: string | null;
  confidence: number;
  segment: string;
  startDate: string;
  endDate: string | null;
  created_at: string;
  goal: "clicks" | "conversions" | "revenue";
  minSampleSize: number;
}

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const EXPERIMENT_TYPES = [
  { id: "subject", label: "Asunto de Email", icon: "📧", desc: "Prueba diferentes asuntos" },
  { id: "content", label: "Contenido", icon: "📝", desc: "Prueba variaciones de texto" },
  { id: "cta", label: "Call to Action", icon: "🎯", desc: "Prueba botones y CTAs" },
  { id: "timing", label: "Horario de Envio", icon: "⏰", desc: "Prueba diferentes horarios" },
  { id: "design", label: "Diseno Visual", icon: "🎨", desc: "Prueba layouts y colores" },
];

const GOALS = [
  { id: "clicks", label: "Maximizar Clicks", metric: "CTR" },
  { id: "conversions", label: "Maximizar Conversiones", metric: "Conv. Rate" },
  { id: "revenue", label: "Maximizar Revenue", metric: "Revenue" },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const calculateStatisticalSignificance = (variantA: Variant, variantB: Variant): number => {
  const n1 = variantA.metrics.impressions;
  const n2 = variantB.metrics.impressions;
  const p1 = variantA.metrics.conversionRate / 100;
  const p2 = variantB.metrics.conversionRate / 100;
  
  if (n1 < 100 || n2 < 100) return 0;
  
  const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
  
  if (se === 0) return 0;
  
  const z = Math.abs(p1 - p2) / se;
  const confidence = Math.min(99.9, (1 - Math.exp(-0.5 * z * z)) * 100);
  
  return confidence;
};

const SAMPLE_EXPERIMENTS: Experiment[] = [
  {
    id: "exp-1",
    name: "Asunto Email - Urgencia vs Beneficio",
    description: "Comparando asuntos con sentido de urgencia vs enfoque en beneficios",
    type: "subject",
    status: "running",
    variants: [
      { id: "v1", name: "Control (Urgencia)", content: "⚡ Ultima oportunidad: 50% OFF termina hoy", traffic: 50,
        metrics: { impressions: 5240, clicks: 892, conversions: 156, ctr: 17.0, conversionRate: 17.5 } },
      { id: "v2", name: "Variante (Beneficio)", content: "Ahorra $500 en tu proxima compra", traffic: 50,
        metrics: { impressions: 5180, clicks: 1036, conversions: 203, ctr: 20.0, conversionRate: 19.6 } }
    ],
    winner: "v2",
    confidence: 94.5,
    segment: "Usuarios Activos",
    startDate: "2026-01-01",
    endDate: null,
    created_at: "2026-01-01T10:00:00Z",
    goal: "conversions",
    minSampleSize: 5000
  },
  {
    id: "exp-2",
    name: "CTA Button - Color Test",
    description: "Verde vs Azul en boton principal de compra",
    type: "cta",
    status: "completed",
    variants: [
      { id: "v1", name: "Verde", content: "Boton verde #22c55e", traffic: 50,
        metrics: { impressions: 12400, clicks: 1860, conversions: 372, ctr: 15.0, conversionRate: 20.0 } },
      { id: "v2", name: "Azul", content: "Boton azul #3b82f6", traffic: 50,
        metrics: { impressions: 12380, clicks: 1609, conversions: 322, ctr: 13.0, conversionRate: 20.0 } }
    ],
    winner: "v1",
    confidence: 97.2,
    segment: "Todos",
    startDate: "2025-12-15",
    endDate: "2025-12-28",
    created_at: "2025-12-15T08:00:00Z",
    goal: "clicks",
    minSampleSize: 10000
  },
  {
    id: "exp-3",
    name: "Horario de Envio - Manana vs Tarde",
    description: "Probando envio 9am vs 3pm para mejor engagement",
    type: "timing",
    status: "running",
    variants: [
      { id: "v1", name: "Manana (9am)", content: "Envio programado 9:00 AM", traffic: 50,
        metrics: { impressions: 3200, clicks: 544, conversions: 87, ctr: 17.0, conversionRate: 16.0 } },
      { id: "v2", name: "Tarde (3pm)", content: "Envio programado 3:00 PM", traffic: 50,
        metrics: { impressions: 3180, clicks: 509, conversions: 76, ctr: 16.0, conversionRate: 14.9 } }
    ],
    winner: null,
    confidence: 72.3,
    segment: "Leads Calientes",
    startDate: "2026-01-03",
    endDate: null,
    created_at: "2026-01-03T14:00:00Z",
    goal: "conversions",
    minSampleSize: 5000
  },
  {
    id: "exp-4",
    name: "Landing Page - Hero Image",
    description: "Imagen de producto vs imagen de personas usando el producto",
    type: "design",
    status: "draft",
    variants: [
      { id: "v1", name: "Producto Solo", content: "Hero con imagen del producto", traffic: 50,
        metrics: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, conversionRate: 0 } },
      { id: "v2", name: "Producto + Personas", content: "Hero con personas usando producto", traffic: 50,
        metrics: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, conversionRate: 0 } }
    ],
    winner: null,
    confidence: 0,
    segment: "Todos",
    startDate: "",
    endDate: null,
    created_at: "2026-01-05T09:00:00Z",
    goal: "conversions",
    minSampleSize: 8000
  }
];

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
export default function ABTestingPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Builder state
  const [expName, setExpName] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expType, setExpType] = useState<string>("subject");
  const [expGoal, setExpGoal] = useState<string>("conversions");
  const [variants, setVariants] = useState<Array<{ name: string; content: string; traffic: number }>>([
    { name: "Control", content: "", traffic: 50 },
    { name: "Variante B", content: "", traffic: 50 }
  ]);

  const addNotification = useCallback((type: Notification["type"], message: string) => {
    const id = generateId();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("nadakki_experiments_v1");
    if (saved) {
      try {
        setExperiments(JSON.parse(saved));
        setLoading(false);
        return;
      } catch {}
    }
    setTimeout(() => {
      setExperiments(SAMPLE_EXPERIMENTS);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    if (experiments.length > 0) {
      localStorage.setItem("nadakki_experiments_v1", JSON.stringify(experiments));
    }
  }, [experiments]);

  const addVariant = () => {
    if (variants.length >= 4) return;
    const newTraffic = Math.floor(100 / (variants.length + 1));
    setVariants([
      ...variants?.map(v => ({ ...v, traffic: newTraffic })),
      { name: `Variante ${String.fromCharCode(65 + variants.length)}`, content: "", traffic: newTraffic }
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) return;
    const newVariants = variants.filter((_, i) => i !== index);
    const newTraffic = Math.floor(100 / newVariants.length);
    setVariants(newVariants?.map(v => ({ ...v, traffic: newTraffic })));
  };

  const updateVariant = (index: number, updates: Partial<typeof variants[0]>) => {
    setVariants(variants?.map((v, i) => i === index ? { ...v, ...updates } : v));
  };

  const createExperiment = () => {
    if (!expName || variants.some(v => !v.content)) {
      addNotification("error", "Completa todos los campos requeridos");
      return;
    }

    const newExp: Experiment = {
      id: "exp-" + generateId(),
      name: expName,
      description: expDesc,
      type: expType as Experiment["type"],
      status: "draft",
      variants: variants?.map((v, i) => ({
        id: "v" + (i + 1),
        name: v.name,
        content: v.content,
        traffic: v.traffic,
        metrics: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, conversionRate: 0 }
      })),
      winner: null,
      confidence: 0,
      segment: "Todos",
      startDate: "",
      endDate: null,
      created_at: new Date().toISOString(),
      goal: expGoal as Experiment["goal"],
      minSampleSize: 5000
    };

    setExperiments([newExp, ...experiments]);
    resetBuilder();
    addNotification("success", "Experimento creado correctamente");
  };

  const resetBuilder = () => {
    setShowBuilder(false);
    setExpName("");
    setExpDesc("");
    setExpType("subject");
    setExpGoal("conversions");
    setVariants([
      { name: "Control", content: "", traffic: 50 },
      { name: "Variante B", content: "", traffic: 50 }
    ]);
  };

  const startExperiment = (id: string) => {
    setExperiments(experiments?.map(exp => 
      exp.id === id ? { ...exp, status: "running", startDate: new Date().toISOString().split("T")[0] } : exp
    ));
    addNotification("success", "Experimento iniciado");
  };

  const pauseExperiment = (id: string) => {
    setExperiments(experiments?.map(exp => 
      exp.id === id ? { ...exp, status: "paused" } : exp
    ));
    addNotification("info", "Experimento pausado");
  };

  const completeExperiment = (id: string) => {
    setExperiments(experiments?.map(exp => {
      if (exp.id !== id) return exp;
      
      const bestVariant = exp.variants.reduce((best, v) => 
        v.metrics.conversionRate > best.metrics.conversionRate ? v : best
      );
      
      return {
        ...exp,
        status: "completed",
        endDate: new Date().toISOString().split("T")[0],
        winner: bestVariant.id,
        confidence: calculateStatisticalSignificance(exp.variants[0], exp.variants[1])
      };
    }));
    addNotification("success", "Experimento completado");
  };

  const deleteExperiment = (id: string) => {
    if (!confirm("Eliminar este experimento?")) return;
    setExperiments(experiments.filter(exp => exp.id !== id));
    setSelectedExperiment(null);
    addNotification("success", "Experimento eliminado");
  };

  const duplicateExperiment = (exp: Experiment) => {
    const newExp: Experiment = {
      ...exp,
      id: "exp-" + generateId(),
      name: exp.name + " (copia)",
      status: "draft",
      winner: null,
      confidence: 0,
      startDate: "",
      endDate: null,
      created_at: new Date().toISOString(),
      variants: exp.variants?.map(v => ({
        ...v,
        id: "v" + generateId(),
        metrics: { impressions: 0, clicks: 0, conversions: 0, ctr: 0, conversionRate: 0 }
      }))
    };
    setExperiments([newExp, ...experiments]);
    addNotification("success", "Experimento duplicado");
  };

  // Stats
  const runningExperiments = experiments.filter(e => e.status === "running").length;
  const completedExperiments = experiments.filter(e => e.status === "completed").length;
  const avgImprovement = experiments
    .filter(e => e.status === "completed" && e.winner)
    .reduce((acc, exp) => {
      const control = exp.variants[0];
      const winner = exp.variants.find(v => v.id === exp.winner);
      if (winner && control.metrics.conversionRate > 0) {
        return acc + ((winner.metrics.conversionRate - control.metrics.conversionRate) / control.metrics.conversionRate * 100);
      }
      return acc;
    }, 0) / Math.max(completedExperiments, 1);

  return (
    <div className="ndk-page ndk-fade-in">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications?.map(n => (
            <motion.div key={n.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
              className={"px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-white " +
                (n.type === "success" ? "bg-green-500" : n.type === "error" ? "bg-red-500" : "bg-blue-500")}>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <NavigationBar backHref="/marketing">
        <StatusBadge status={runningExperiments > 0 ? "active" : "warning"} label={experiments.length + " Experimentos"} size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
              <Split className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">A/B Testing</h1>
              <p className="text-gray-400">Optimiza tus campanas con experimentos controlados</p>
            </div>
          </div>
          <button onClick={() => setShowBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-xl text-black font-medium transition-colors">
            <Plus className="w-5 h-5" /> Nuevo Experimento
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard value={runningExperiments.toString()} label="En Ejecucion" icon={<Play className="w-6 h-6 text-green-400" />} color="#22c55e" />
        <StatCard value={completedExperiments.toString()} label="Completados" icon={<CheckCircle className="w-6 h-6 text-blue-400" />} color="#3b82f6" />
        <StatCard value={(avgImprovement > 0 ? "+" : "") + avgImprovement.toFixed(1) + "%"} label="Mejora Promedio" icon={<TrendingUp className="w-6 h-6 text-purple-400" />} color="#8b5cf6" />
        <StatCard value={experiments.filter(e => e.confidence >= 95).length.toString()} label="Estadisticamente Significativos" icon={<Target className="w-6 h-6 text-yellow-400" />} color="#f59e0b" />
      </div>

      {/* Builder */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
            <GlassCard className="p-6 border-yellow-500/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Nuevo Experimento A/B</h3>
                <button onClick={resetBuilder} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nombre del Experimento *</label>
                  <input type="text" value={expName} onChange={(e) => setExpName(e.target.value)}
                    placeholder="Ej: Test Asunto Email Q1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Descripcion</label>
                  <input type="text" value={expDesc} onChange={(e) => setExpDesc(e.target.value)}
                    placeholder="Descripcion breve"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tipo de Experimento</label>
                  <div className="grid grid-cols-5 gap-2">
                    {EXPERIMENT_TYPES?.map(t => (
                      <button key={t.id} onClick={() => setExpType(t.id)}
                        className={"p-3 rounded-xl border text-center transition-all " +
                          (expType === t.id ? "border-yellow-500 bg-yellow-500/20" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                        <span className="text-xl block mb-1">{t.icon}</span>
                        <span className="text-xs text-gray-300">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Objetivo Principal</label>
                  <div className="grid grid-cols-3 gap-2">
                    {GOALS?.map(g => (
                      <button key={g.id} onClick={() => setExpGoal(g.id)}
                        className={"p-3 rounded-xl border text-center transition-all " +
                          (expGoal === g.id ? "border-yellow-500 bg-yellow-500/20" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                        <span className="text-sm text-white">{g.label}</span>
                        <span className="text-xs text-gray-500 block">{g.metric}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-400">Variantes ({variants.length}/4)</label>
                  {variants.length < 4 && (
                    <button onClick={addVariant} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Agregar variante
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {variants?.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className={"w-10 h-10 rounded-lg flex items-center justify-center font-bold " +
                        (i === 0 ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400")}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <input type="text" value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })}
                        className="w-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" />
                      <input type="text" value={v.content} onChange={(e) => updateVariant(i, { content: e.target.value })}
                        placeholder="Contenido de la variante..."
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" />
                      <div className="flex items-center gap-2 w-24">
                        <input type="number" value={v.traffic} onChange={(e) => updateVariant(i, { traffic: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center" />
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                      {variants.length > 2 && (
                        <button onClick={() => removeVariant(i)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button onClick={resetBuilder} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400">
                  Cancelar
                </button>
                <button onClick={createExperiment}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-medium">
                  <Zap className="w-4 h-4" /> Crear Experimento
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Experiment Detail Modal */}
      <AnimatePresence>
        {selectedExperiment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedExperiment(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0f1c] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedExperiment.name}</h2>
                    <p className="text-sm text-gray-400">{selectedExperiment.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={"px-3 py-1 text-sm rounded-full font-medium " +
                      (selectedExperiment.status === "running" ? "bg-green-500/20 text-green-400" :
                       selectedExperiment.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                       selectedExperiment.status === "paused" ? "bg-yellow-500/20 text-yellow-400" :
                       "bg-gray-500/20 text-gray-400")}>
                      {selectedExperiment.status === "running" ? "En Ejecucion" :
                       selectedExperiment.status === "completed" ? "Completado" :
                       selectedExperiment.status === "paused" ? "Pausado" : "Borrador"}
                    </span>
                    <button onClick={() => setSelectedExperiment(null)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">✕</button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Confidence Bar */}
                {selectedExperiment.status !== "draft" && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Significancia Estadistica</span>
                      <span className={"font-bold " + (selectedExperiment.confidence >= 95 ? "text-green-400" : selectedExperiment.confidence >= 80 ? "text-yellow-400" : "text-gray-400")}>
                        {selectedExperiment.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={"h-full transition-all duration-500 " + 
                        (selectedExperiment.confidence >= 95 ? "bg-green-500" : selectedExperiment.confidence >= 80 ? "bg-yellow-500" : "bg-gray-500")}
                        style={{ width: `${selectedExperiment.confidence}%` }} />
                    </div>
                    {selectedExperiment.confidence >= 95 && (
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Resultado estadisticamente significativo
                      </p>
                    )}
                  </div>
                )}

                {/* Variants Comparison */}
                <div className="space-y-4">
                  {selectedExperiment.variants?.map((variant, i) => {
                    const isWinner = variant.id === selectedExperiment.winner;
                    const control = selectedExperiment.variants[0];
                    const improvement = control.metrics.conversionRate > 0 
                      ? ((variant.metrics.conversionRate - control.metrics.conversionRate) / control.metrics.conversionRate * 100)
                      : 0;
                    
                    return (
                      <div key={variant.id} className={"p-4 rounded-xl border " + 
                        (isWinner ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10")}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={"w-10 h-10 rounded-lg flex items-center justify-center font-bold " +
                              (i === 0 ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400")}>
                              {String.fromCharCode(65 + i)}
                            </div>
                            <div>
                              <span className="font-medium text-white">{variant.name}</span>
                              {isWinner && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full flex items-center gap-1 inline-flex">
                                  <Trophy className="w-3 h-3" /> Ganador
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{variant.traffic}% trafico</span>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-3 px-13">{variant.content}</p>
                        
                        <div className="grid grid-cols-5 gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-white">{variant.metrics.impressions.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Impresiones</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-white">{variant.metrics.clicks.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Clicks</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-cyan-400">{variant.metrics.ctr.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">CTR</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-purple-400">{variant.metrics.conversions.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Conversiones</p>
                          </div>
                          <div className="text-center">
                            <p className={"text-lg font-bold " + (isWinner ? "text-green-400" : "text-white")}>
                              {variant.metrics.conversionRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">Conv. Rate</p>
                            {i > 0 && improvement !== 0 && (
                              <p className={"text-xs flex items-center justify-center gap-0.5 " + 
                                (improvement > 0 ? "text-green-400" : "text-red-400")}>
                                {improvement > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(improvement).toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                  {selectedExperiment.status === "draft" && (
                    <button onClick={() => { startExperiment(selectedExperiment.id); setSelectedExperiment(null); }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium">
                      <Play className="w-4 h-4" /> Iniciar Experimento
                    </button>
                  )}
                  {selectedExperiment.status === "running" && (
                    <>
                      <button onClick={() => { pauseExperiment(selectedExperiment.id); setSelectedExperiment(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-medium">
                        <Pause className="w-4 h-4" /> Pausar
                      </button>
                      <button onClick={() => { completeExperiment(selectedExperiment.id); setSelectedExperiment(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium">
                        <CheckCircle className="w-4 h-4" /> Finalizar y Declarar Ganador
                      </button>
                    </>
                  )}
                  {selectedExperiment.status === "paused" && (
                    <button onClick={() => { startExperiment(selectedExperiment.id); setSelectedExperiment(null); }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium">
                      <Play className="w-4 h-4" /> Reanudar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Experiments List */}
      <h2 className="text-xl font-bold text-white mb-4">Experimentos ({experiments.length})</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
        </div>
      ) : experiments.length === 0 ? (
        <div className="text-center py-20">
          <Split className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No hay experimentos. Crea tu primer A/B test!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {experiments?.map((exp, i) => (
            <motion.div key={exp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5 cursor-pointer group hover:border-yellow-500/30 transition-colors" onClick={() => setSelectedExperiment(exp)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{EXPERIMENT_TYPES.find(t => t.id === exp.type)?.icon}</span>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-yellow-400 transition-colors">{exp.name}</h3>
                      <p className="text-sm text-gray-400">{exp.description}</p>
                    </div>
                  </div>
                  <span className={"px-2 py-1 text-xs rounded-full font-medium " +
                    (exp.status === "running" ? "bg-green-500/20 text-green-400" :
                     exp.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                     exp.status === "paused" ? "bg-yellow-500/20 text-yellow-400" :
                     "bg-gray-500/20 text-gray-400")}>
                    {exp.status === "running" ? "Activo" : exp.status === "completed" ? "Completado" : exp.status === "paused" ? "Pausado" : "Borrador"}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm text-gray-500">{exp.variants.length} variantes</span>
                  <span className="text-sm text-gray-500">Segmento: {exp.segment}</span>
                  {exp.confidence > 0 && (
                    <span className={"text-sm font-medium " + (exp.confidence >= 95 ? "text-green-400" : "text-yellow-400")}>
                      {exp.confidence.toFixed(0)}% confianza
                    </span>
                  )}
                </div>

                {exp.winner && (
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg mb-3">
                    <Trophy className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">
                      Ganador: {exp.variants.find(v => v.id === exp.winner)?.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {exp.startDate || "Sin iniciar"}
                  </span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => duplicateExperiment(exp)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteExperiment(exp.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}


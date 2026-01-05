"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Brain, TrendingUp, TrendingDown, Users, Target, Zap,
  AlertTriangle, CheckCircle, Clock, RefreshCw, Loader2,
  BarChart3, PieChart, Activity, DollarSign, ArrowUp, ArrowDown,
  Calendar, Filter, Download, Sparkles
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface SegmentPrediction {
  id: string;
  name: string;
  size: number;
  conversionProbability: number;
  churnRisk: number;
  expectedRevenue: number;
  trend: "up" | "down" | "stable";
  confidence: number;
  recommendations: string[];
}

interface MetricForecast {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
  actual?: number;
}

interface ChurnAlert {
  userId: string;
  userName: string;
  riskScore: number;
  lastActivity: string;
  suggestedAction: string;
}

// ═══════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════
const SEGMENT_PREDICTIONS: SegmentPrediction[] = [
  {
    id: "seg-1",
    name: "Leads Calientes",
    size: 1850,
    conversionProbability: 0.28,
    churnRisk: 0.05,
    expectedRevenue: 92500,
    trend: "up",
    confidence: 0.94,
    recommendations: ["Enviar oferta personalizada", "Llamada de seguimiento en 48h", "Activar secuencia de nurturing"]
  },
  {
    id: "seg-2",
    name: "Usuarios Premium Activos",
    size: 890,
    conversionProbability: 0.18,
    churnRisk: 0.08,
    expectedRevenue: 178000,
    trend: "stable",
    confidence: 0.91,
    recommendations: ["Programa de fidelizacion", "Oferta de upgrade", "Encuesta de satisfaccion"]
  },
  {
    id: "seg-3",
    name: "En Riesgo de Churn",
    size: 1240,
    conversionProbability: 0.05,
    churnRisk: 0.72,
    expectedRevenue: 12400,
    trend: "down",
    confidence: 0.89,
    recommendations: ["Campana de retencion urgente", "Descuento especial", "Contacto directo del CS"]
  },
  {
    id: "seg-4",
    name: "Nuevos Registros (7d)",
    size: 456,
    conversionProbability: 0.15,
    churnRisk: 0.25,
    expectedRevenue: 22800,
    trend: "up",
    confidence: 0.87,
    recommendations: ["Onboarding automatizado", "Email de bienvenida personalizado", "Webinar introductorio"]
  },
  {
    id: "seg-5",
    name: "Usuarios Inactivos",
    size: 2340,
    conversionProbability: 0.03,
    churnRisk: 0.85,
    expectedRevenue: 4680,
    trend: "down",
    confidence: 0.92,
    recommendations: ["Campana de win-back", "Encuesta de salida", "Oferta de reactivacion"]
  },
  {
    id: "seg-6",
    name: "Alto LTV",
    size: 520,
    conversionProbability: 0.22,
    churnRisk: 0.04,
    expectedRevenue: 260000,
    trend: "up",
    confidence: 0.95,
    recommendations: ["Programa VIP", "Acceso anticipado a features", "Account manager dedicado"]
  }
];

const REVENUE_FORECAST: MetricForecast[] = [
  { date: "Ene 1", predicted: 45000, lower: 42000, upper: 48000, actual: 46200 },
  { date: "Ene 8", predicted: 48000, lower: 44000, upper: 52000, actual: 47800 },
  { date: "Ene 15", predicted: 52000, lower: 47000, upper: 57000, actual: 53100 },
  { date: "Ene 22", predicted: 55000, lower: 49000, upper: 61000 },
  { date: "Ene 29", predicted: 58000, lower: 51000, upper: 65000 },
  { date: "Feb 5", predicted: 62000, lower: 54000, upper: 70000 },
  { date: "Feb 12", predicted: 65000, lower: 56000, upper: 74000 },
];

const CHURN_ALERTS: ChurnAlert[] = [
  { userId: "u-1", userName: "Empresa ABC", riskScore: 0.92, lastActivity: "hace 45 dias", suggestedAction: "Llamada urgente del CS" },
  { userId: "u-2", userName: "Tech Solutions", riskScore: 0.87, lastActivity: "hace 38 dias", suggestedAction: "Email de reactivacion" },
  { userId: "u-3", userName: "Marketing Pro", riskScore: 0.81, lastActivity: "hace 32 dias", suggestedAction: "Oferta especial -30%" },
  { userId: "u-4", userName: "Digital Agency", riskScore: 0.76, lastActivity: "hace 28 dias", suggestedAction: "Webinar personalizado" },
  { userId: "u-5", userName: "StartupXYZ", riskScore: 0.71, lastActivity: "hace 25 dias", suggestedAction: "Demo de nuevas features" },
];

// ═══════════════════════════════════════
// MAIN COMPONENT  
// ═══════════════════════════════════════
export default function PredictivePage() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<SegmentPrediction[]>([]);
  const [forecast, setForecast] = useState<MetricForecast[]>([]);
  const [churnAlerts, setChurnAlerts] = useState<ChurnAlert[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<SegmentPrediction | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    setPredictions(SEGMENT_PREDICTIONS);
    setForecast(REVENUE_FORECAST);
    setChurnAlerts(CHURN_ALERTS);
    setLoading(false);
  };

  const refreshPredictions = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate updated predictions with slight variations
    setPredictions(predictions.map(p => ({
      ...p,
      conversionProbability: Math.min(1, Math.max(0, p.conversionProbability + (Math.random() - 0.5) * 0.05)),
      churnRisk: Math.min(1, Math.max(0, p.churnRisk + (Math.random() - 0.5) * 0.05)),
      expectedRevenue: Math.round(p.expectedRevenue * (0.95 + Math.random() * 0.1))
    })));
    
    setRefreshing(false);
  };

  // Calculate totals
  const totalExpectedRevenue = predictions.reduce((acc, p) => acc + p.expectedRevenue, 0);
  const avgConversion = predictions.reduce((acc, p) => acc + p.conversionProbability, 0) / predictions.length;
  const highRiskUsers = predictions.filter(p => p.churnRisk > 0.5).reduce((acc, p) => acc + p.size, 0);
  const modelAccuracy = predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length;

  // Chart dimensions
  const chartWidth = 600;
  const chartHeight = 200;
  const maxValue = Math.max(...forecast.map(f => f.upper));
  const minValue = Math.min(...forecast.map(f => f.lower));
  const valueRange = maxValue - minValue;

  const getY = (value: number) => chartHeight - ((value - minValue) / valueRange * chartHeight * 0.8) - 20;
  const getX = (index: number) => (index / (forecast.length - 1)) * (chartWidth - 60) + 30;

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="IA Predictiva" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Metricas Predictivas</h1>
              <p className="text-gray-400">Predicciones de IA para optimizar tus decisiones</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 rounded-lg p-1">
              {(["7d", "30d", "90d"] as const).map(range => (
                <button key={range} onClick={() => setTimeRange(range)}
                  className={"px-3 py-1.5 rounded-md text-sm font-medium transition-colors " +
                    (timeRange === range ? "bg-purple-500 text-white" : "text-gray-400 hover:text-white")}>
                  {range}
                </button>
              ))}
            </div>
            <button onClick={refreshPredictions} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium disabled:opacity-50">
              <RefreshCw className={"w-4 h-4 " + (refreshing ? "animate-spin" : "")} />
              {refreshing ? "Actualizando..." : "Actualizar IA"}
            </button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Brain className="w-16 h-16 text-purple-400 mb-4 animate-pulse" />
          <p className="text-white text-lg mb-2">Analizando datos con IA...</p>
          <p className="text-gray-500 text-sm">Calculando predicciones y tendencias</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard 
              value={"$" + (totalExpectedRevenue / 1000).toFixed(0) + "K"} 
              label="Revenue Esperado (30d)" 
              icon={<DollarSign className="w-6 h-6 text-green-400" />} 
              color="#22c55e" 
            />
            <StatCard 
              value={(avgConversion * 100).toFixed(1) + "%"} 
              label="Conversion Promedio" 
              icon={<Target className="w-6 h-6 text-blue-400" />} 
              color="#3b82f6" 
            />
            <StatCard 
              value={highRiskUsers.toLocaleString()} 
              label="Usuarios en Riesgo" 
              icon={<AlertTriangle className="w-6 h-6 text-red-400" />} 
              color="#ef4444" 
            />
            <StatCard 
              value={(modelAccuracy * 100).toFixed(0) + "%"} 
              label="Precision del Modelo" 
              icon={<Sparkles className="w-6 h-6 text-purple-400" />} 
              color="#8b5cf6" 
            />
          </div>

          {/* Revenue Forecast Chart */}
          <GlassCard className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Proyeccion de Revenue</h3>
                <p className="text-sm text-gray-400">Prediccion con intervalo de confianza del 95%</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 text-sm">
                <Download className="w-4 h-4" /> Exportar
              </button>
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48">
              {/* Confidence interval */}
              <path
                d={`M ${forecast.map((f, i) => `${getX(i)},${getY(f.upper)}`).join(" L ")} L ${forecast.map((f, i) => `${getX(forecast.length - 1 - i)},${getY(forecast[forecast.length - 1 - i].lower)}`).join(" L ")} Z`}
                fill="url(#gradient)" opacity="0.3"
              />
              
              {/* Predicted line */}
              <path
                d={`M ${forecast.map((f, i) => `${getX(i)},${getY(f.predicted)}`).join(" L ")}`}
                fill="none" stroke="#8b5cf6" strokeWidth="2"
              />
              
              {/* Actual points */}
              {forecast.map((f, i) => f.actual && (
                <circle key={i} cx={getX(i)} cy={getY(f.actual)} r="4" fill="#22c55e" />
              ))}
              
              {/* Predicted points */}
              {forecast.map((f, i) => !f.actual && (
                <circle key={i} cx={getX(i)} cy={getY(f.predicted)} r="4" fill="#8b5cf6" strokeDasharray="2" />
              ))}
              
              {/* Labels */}
              {forecast.map((f, i) => (
                <text key={i} x={getX(i)} y={chartHeight - 5} textAnchor="middle" className="text-[10px] fill-gray-500">
                  {f.date}
                </text>
              ))}
              
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-gray-400">Prediccion</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-400">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-purple-500/30" style={{ width: 24 }} />
                <span className="text-xs text-gray-400">Intervalo 95%</span>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Segment Predictions */}
            <div className="col-span-2">
              <h3 className="text-lg font-bold text-white mb-4">Predicciones por Segmento</h3>
              <div className="space-y-3">
                {predictions.map((pred, i) => (
                  <motion.div key={pred.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <GlassCard className={"p-4 cursor-pointer hover:border-purple-500/30 transition-colors " +
                      (selectedSegment?.id === pred.id ? "border-purple-500/50" : "")}
                      onClick={() => setSelectedSegment(selectedSegment?.id === pred.id ? null : pred)}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={"p-2 rounded-lg " + 
                            (pred.churnRisk > 0.5 ? "bg-red-500/20" : pred.conversionProbability > 0.15 ? "bg-green-500/20" : "bg-blue-500/20")}>
                            {pred.churnRisk > 0.5 ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                             pred.conversionProbability > 0.15 ? <TrendingUp className="w-5 h-5 text-green-400" /> :
                             <Activity className="w-5 h-5 text-blue-400" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{pred.name}</h4>
                            <p className="text-xs text-gray-500">{pred.size.toLocaleString()} usuarios</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {pred.trend === "up" && <ArrowUp className="w-4 h-4 text-green-400" />}
                          {pred.trend === "down" && <ArrowDown className="w-4 h-4 text-red-400" />}
                          {pred.trend === "stable" && <span className="w-4 h-0.5 bg-gray-400" />}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className={"text-lg font-bold " + (pred.conversionProbability > 0.15 ? "text-green-400" : "text-white")}>
                            {(pred.conversionProbability * 100).toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-gray-500">Conversion</p>
                        </div>
                        <div>
                          <p className={"text-lg font-bold " + (pred.churnRisk > 0.5 ? "text-red-400" : pred.churnRisk > 0.3 ? "text-yellow-400" : "text-green-400")}>
                            {(pred.churnRisk * 100).toFixed(0)}%
                          </p>
                          <p className="text-[10px] text-gray-500">Riesgo Churn</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-400">${(pred.expectedRevenue / 1000).toFixed(0)}K</p>
                          <p className="text-[10px] text-gray-500">Revenue Esp.</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-cyan-400">{(pred.confidence * 100).toFixed(0)}%</p>
                          <p className="text-[10px] text-gray-500">Confianza</p>
                        </div>
                      </div>

                      {selectedSegment?.id === pred.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} 
                          className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-xs text-gray-400 mb-2">Acciones Recomendadas:</p>
                          <div className="flex flex-wrap gap-2">
                            {pred.recommendations.map((rec, ri) => (
                              <span key={ri} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg">
                                {rec}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Churn Alerts */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Alertas de Churn
              </h3>
              <GlassCard className="p-4">
                <div className="space-y-3">
                  {churnAlerts.map((alert, i) => (
                    <motion.div key={alert.userId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white text-sm">{alert.userName}</span>
                        <span className={"px-2 py-0.5 text-xs rounded-full font-bold " +
                          (alert.riskScore > 0.85 ? "bg-red-500 text-white" : "bg-red-500/30 text-red-400")}>
                          {(alert.riskScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Ultima actividad: {alert.lastActivity}</p>
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-yellow-400">{alert.suggestedAction}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <button className="w-full mt-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm font-medium transition-colors">
                  Ver todos los alertas ({churnAlerts.length})
                </button>
              </GlassCard>

              {/* Model Info */}
              <GlassCard className="p-4 mt-4">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  Informacion del Modelo
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Modelo</span>
                    <span className="text-white">NADAKKI Predictive v2.1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ultima actualizacion</span>
                    <span className="text-white">Hace 2 horas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Datos procesados</span>
                    <span className="text-white">124,502 registros</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Precision historica</span>
                    <span className="text-green-400">91.2%</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

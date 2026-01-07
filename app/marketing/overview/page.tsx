"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Users, Activity, Target, DollarSign,
  BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw,
  ChevronRight, Home, ArrowLeft, Zap, Mail, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import Sidebar from "@/components/layout/Sidebar";
import { analyticsAPI, type AnalyticsOverview, type MetricValue, cancelAllRequests } from "@/lib/api";

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

function MetricCard({ title, metric, icon: Icon, format = "number", theme }: { 
  title: string; metric: MetricValue; icon: any; format?: "number" | "currency" | "percent"; theme: any;
}) {
  const isLight = theme?.isLight;
  const bgCard = isLight ? "#ffffff" : theme?.colors?.bgCard || "rgba(30,41,59,0.5)";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  const formatValue = (value: number) => {
    if (format === "currency") return `$${value.toLocaleString()}`;
    if (format === "percent") return `${value}%`;
    return value.toLocaleString();
  };

  const isPositive = metric.trend === "up";
  const trendColor = isPositive ? "#10b981" : "#ef4444";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl"
      style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: textMuted }}>{title}</span>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}15` }}>
          <Icon className="w-4 h-4" style={{ color: accentPrimary }} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: textPrimary }}>{formatValue(metric.current)}</div>
        <div className="flex items-center gap-1 mt-1">
          {isPositive ? <ArrowUpRight className="w-3 h-3" style={{ color: trendColor }} /> : <ArrowDownRight className="w-3 h-3" style={{ color: trendColor }} />}
          <span className="text-xs font-medium" style={{ color: trendColor }}>{Math.abs(metric.change)}%</span>
          <span className="text-xs" style={{ color: textMuted }}>vs período anterior</span>
        </div>
      </div>
    </motion.div>
  );
}

function CampaignRow({ campaign, theme }: { campaign: any; theme: any }) {
  const isLight = theme?.isLight;
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";
  const statusColors: Record<string, string> = { active: "#10b981", completed: "#6366f1", scheduled: "#f59e0b", draft: "#64748b" };

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)" }}>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[campaign.status] || "#64748b" }} />
        <div>
          <div className="font-medium text-sm" style={{ color: textPrimary }}>{campaign.name}</div>
          <div className="text-xs" style={{ color: textMuted }}>{campaign.sent.toLocaleString()} enviados • {campaign.ctr}% CTR</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-sm" style={{ color: accentPrimary }}>${campaign.revenue.toLocaleString()}</div>
        <div className="text-xs" style={{ color: textMuted }}>{campaign.conversion_rate}% conv</div>
      </div>
    </div>
  );
}

function KPICard({ kpi, theme }: { kpi: any; theme: any }) {
  const isLight = theme?.isLight;
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const progress = (kpi.value / kpi.target) * 100;
  const isOnTrack = progress >= 90;

  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: textMuted }}>{kpi.name}</span>
        {isOnTrack ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold" style={{ color: textPrimary }}>
          {kpi.unit === "USD" ? "$" : ""}{kpi.value.toLocaleString()}{kpi.unit === "%" ? "%" : ""}
        </span>
        <span className="text-xs" style={{ color: textMuted }}>/ {kpi.unit === "USD" ? "$" : ""}{kpi.target.toLocaleString()}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: isOnTrack ? "#10b981" : "#f59e0b" }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function MarketingOverviewPage() {
  const { theme } = useTheme();
  const isLight = theme?.isLight;
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const bgPrimary = isLight ? "#f8fafc" : theme?.colors?.bgPrimary || "#0F172A";
  const bgSecondary = isLight ? "#ffffff" : theme?.colors?.bgSecondary || "#111827";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textSecondary = isLight ? "#475569" : theme?.colors?.textSecondary || "#94a3b8";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsAPI.getOverview("default", period);
      setData(response);
    } catch (err) {
      if (err instanceof Error && err.message === 'Request cancelled') return;
      setError("Error al cargar datos. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    return () => cancelAllRequests();
  }, [fetchData]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: bgPrimary }}>
      <Sidebar />
      <main className="flex-1 ml-80">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: `${bgSecondary}ee`, borderBottom: `1px solid ${borderColor}` }}>
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Link href="/" className="flex items-center gap-1 text-sm hover:opacity-80" style={{ color: textMuted }}><Home className="w-4 h-4" /> Inicio</Link>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              <Link href="/marketing" className="text-sm hover:opacity-80" style={{ color: textMuted }}>Marketing</Link>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              <span className="text-sm font-medium" style={{ color: accentPrimary }}>Overview</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/marketing" className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}20` }}>
                  <ArrowLeft className="w-5 h-5" style={{ color: accentPrimary }} />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: textPrimary }}>
                    <BarChart3 className="w-6 h-6" style={{ color: accentPrimary }} />Marketing Overview
                  </h1>
                  <p className="text-sm" style={{ color: textSecondary }}>
                    Métricas en tiempo real • {data?.data_source === 'database' ? '🟢 Base de datos' : '🟡 API'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}`, color: textPrimary }}>
                  <option value="24h">Últimas 24h</option>
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 90 días</option>
                </select>
                <button onClick={fetchData} disabled={loading} className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                  style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Actualizar
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: accentPrimary }} />
                <p style={{ color: textMuted }}>Cargando métricas desde API...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={fetchData} className="px-4 py-2 rounded-lg font-medium text-white" style={{ backgroundColor: accentPrimary }}>Reintentar</button>
              </div>
            </div>
          )}

          {data && !loading && (
            <>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <MetricCard title="MAU (Monthly Active Users)" metric={data.mau} icon={Users} theme={theme} />
                <MetricCard title="DAU (Daily Active Users)" metric={data.dau} icon={Activity} theme={theme} />
                <MetricCard title="Sesiones Diarias" metric={data.daily_sessions} icon={BarChart3} theme={theme} />
                <MetricCard title="Revenue Total" metric={data.total_revenue} icon={DollarSign} format="currency" theme={theme} />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <MetricCard title="Nuevos Usuarios" metric={data.new_users} icon={TrendingUp} theme={theme} />
                <MetricCard title="Stickiness (DAU/MAU)" metric={data.stickiness} icon={Target} format="percent" theme={theme} />
                <MetricCard title="Sesiones/MAU" metric={data.sessions_per_mau} icon={Zap} theme={theme} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 rounded-xl" style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2" style={{ color: textPrimary }}>
                      <Mail className="w-5 h-5" style={{ color: accentPrimary }} />Top Campaigns
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}>
                      {data.active_campaigns} activas
                    </span>
                  </div>
                  {data.top_campaigns.length > 0 ? (
                    data.top_campaigns.map((campaign) => <CampaignRow key={campaign.id} campaign={campaign} theme={theme} />)
                  ) : (
                    <p className="text-center py-8" style={{ color: textMuted }}>No hay campañas</p>
                  )}
                  <Link href="/marketing/campaigns" className="mt-4 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    style={{ backgroundColor: `${accentPrimary}10`, color: accentPrimary }}>
                    Ver todas <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="p-5 rounded-xl" style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2" style={{ color: textPrimary }}>
                      <Target className="w-5 h-5" style={{ color: accentPrimary }} />KPIs Principales
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {data.kpis.map((kpi) => <KPICard key={kpi.id} kpi={kpi} theme={theme} />)}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: textMuted }}>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Datos en vivo • Actualizado: {new Date(data.generated_at).toLocaleTimeString()}</span>
                {data.data_source && <span>• Fuente: {data.data_source}</span>}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

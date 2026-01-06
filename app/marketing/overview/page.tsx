"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, Calendar, Target, Mail, CheckCircle, Circle, ChevronRight, ExternalLink, Sparkles, BarChart3, Zap, BookOpen, Video, Activity } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTheme } from "@/components/providers/ThemeProvider";

const userMetrics = {
  mau: { value: 45200, change: 12.4, trend: "up" as const },
  dau: { value: 8450, change: 8.2, trend: "up" as const },
  newUsers: { value: 2340, change: 15.7, trend: "up" as const },
  stickiness: { value: 18.7, change: 2.3, trend: "up" as const },
  dailySessions: { value: 24500, change: 11.2, trend: "up" as const },
  sessionsPerMau: { value: 3.2, change: -1.4, trend: "down" as const },
};

const genSparkline = (base: number, variance: number) => Array.from({ length: 14 }, (_, i) => ({ day: i, value: base + Math.floor(Math.random() * variance - variance/2) + (i * variance/20) }));
const sparklines = { mau: genSparkline(45000, 5000), dau: genSparkline(8000, 1500), newUsers: genSparkline(2000, 800), stickiness: genSparkline(18, 3), dailySessions: genSparkline(24000, 4000), sessionsPerMau: genSparkline(3, 0.5) };

const performanceData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  return { date: d.toLocaleDateString("es", { day: "2-digit", month: "short" }), sessions: 180 + Math.floor(Math.random() * 80) + (i * 2), users: 140 + Math.floor(Math.random() * 60) + (i * 1.5), events: 450 + Math.floor(Math.random() * 150) + (i * 3) };
});

const onboardingSteps = [
  { id: 1, title: "Conectar datos", desc: "Integra tu CDP", done: true, icon: Target },
  { id: 2, title: "Crear segmento", desc: "Define audiencia", done: true, icon: Users },
  { id: 3, title: "Configurar canal", desc: "Email, SMS, Push", done: true, icon: Mail },
  { id: 4, title: "Primera campaña", desc: "Lanza comunicación", done: false, icon: Zap },
  { id: 5, title: "A/B Testing", desc: "Optimiza resultados", done: false, icon: BarChart3 },
  { id: 6, title: "Customer Journey", desc: "Automatiza flujos", done: false, icon: Activity },
];

const quickActions = [
  { title: "Crear Email", desc: "Editor drag & drop", emoji: "📧", gradient: "from-purple-500 to-pink-500", href: "/marketing/campaigns/new?type=email", tag: "Recomendado" },
  { title: "Segmentos", desc: "Audiencias personalizadas", emoji: "👥", gradient: "from-blue-500 to-cyan-500", href: "/marketing/segments", tag: "Popular" },
  { title: "Journeys", desc: "Flujos automáticos", emoji: "🗺️", gradient: "from-green-500 to-teal-500", href: "/marketing/journeys", tag: "Nuevo" },
  { title: "Analytics", desc: "Métricas en tiempo real", emoji: "📊", gradient: "from-orange-500 to-yellow-500", href: "/marketing/analytics", tag: "Insights" },
];

function MetricCard({ title, subtitle, value, change, trend, data, format = "number", theme }: any) {
  const fmt = (v: number) => format === "percent" ? `${v.toFixed(1)}%` : format === "decimal" ? v.toFixed(1) : v.toLocaleString();
  const isLight = theme?.isLight;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl p-5 transition-shadow hover:shadow-lg"
      style={{ backgroundColor: isLight ? "#ffffff" : theme?.colors?.bgCard || "rgba(30,41,59,0.5)", border: `1px solid ${isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)"}` }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: isLight ? "#111827" : theme?.colors?.textPrimary }}>{title}</h3>
          <p className="text-xs" style={{ color: isLight ? "#6b7280" : theme?.colors?.textMuted }}>{subtitle}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend === "up" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(change)}%
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold" style={{ color: isLight ? "#111827" : theme?.colors?.textPrimary }}>{fmt(value)}</span>
        <div className="w-24 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs><linearGradient id={`grad-${title.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={trend === "up" ? "#10b981" : "#ef4444"} stopOpacity={0.3} /><stop offset="100%" stopColor={trend === "up" ? "#10b981" : "#ef4444"} stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="value" stroke={trend === "up" ? "#10b981" : "#ef4444"} strokeWidth={2} fill={`url(#grad-${title.replace(/\s/g,'')})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

export default function MarketingOverviewPage() {
  const { theme } = useTheme();
  const isLight = theme?.isLight;
  const [dateRange, setDateRange] = useState("30d");
  const [selectedApp, setSelectedApp] = useState("all");
  const [statistic, setStatistic] = useState("sessions");
  const [breakdown, setBreakdown] = useState("all");
  const completedSteps = onboardingSteps.filter(s => s.done).length;
  const progress = Math.round((completedSteps / onboardingSteps.length) * 100);
  const bgPrimary = isLight ? "#f8fafc" : theme?.colors?.bgPrimary || "#0F172A";
  const bgSecondary = isLight ? "#ffffff" : theme?.colors?.bgSecondary || "#111827";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textSecondary = isLight ? "#475569" : theme?.colors?.textSecondary || "#94a3b8";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgPrimary }}>
      <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: `${bgSecondary}ee`, borderBottom: `1px solid ${borderColor}` }}>
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>Hola, <span style={{ color: accentPrimary }}>Marketing Team</span> 👋</h1>
              <p className="text-sm" style={{ color: textSecondary }}>{new Date().toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.05)" }}>
                {["24h", "7d", "30d", "90d"].map((r) => (
                  <button key={r} onClick={() => setDateRange(r)} className="px-3 py-1.5 text-sm font-medium rounded-md transition-all"
                    style={{ backgroundColor: dateRange === r ? (isLight ? "#fff" : "rgba(255,255,255,0.1)") : "transparent", color: dateRange === r ? accentPrimary : textSecondary, boxShadow: dateRange === r ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>{r}</button>
                ))}
                <button className="px-3 py-1.5 text-sm font-medium flex items-center gap-1" style={{ color: textSecondary }}><Calendar className="w-4 h-4" /> Custom</button>
              </div>
              <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}`, color: textPrimary }}>
                <option value="all">Todas las Apps</option><option value="web">Web App</option><option value="ios">iOS App</option><option value="android">Android App</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {progress < 100 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}20` }}><Sparkles className="w-5 h-5" style={{ color: accentPrimary }} /></div>
                <div><h2 className="text-lg font-semibold" style={{ color: textPrimary }}>Comenzar con NADAKKI</h2><p className="text-sm" style={{ color: textSecondary }}>Completa la configuración</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right"><span className="text-2xl font-bold" style={{ color: accentPrimary }}>{progress}%</span><p className="text-xs" style={{ color: textMuted }}>completado</p></div>
                <div className="w-32 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? "#e5e7eb" : "rgba(255,255,255,0.1)" }}><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${accentPrimary}, ${theme?.colors?.accentSecondary || "#06b6d4"})` }} /></div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {onboardingSteps.map((step, i) => (
                <motion.div key={step.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl cursor-pointer transition-all"
                  style={{ backgroundColor: step.done ? (isLight ? "#ecfdf5" : "rgba(16,185,129,0.1)") : bgSecondary, border: `2px solid ${step.done ? (isLight ? "#a7f3d0" : "rgba(16,185,129,0.3)") : borderColor}` }}>
                  <div className="flex items-center gap-2 mb-2">{step.done ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" style={{ color: textMuted }} />}<step.icon className="w-4 h-4" style={{ color: step.done ? "#10b981" : textMuted }} /></div>
                  <h4 className="text-sm font-medium" style={{ color: step.done ? "#047857" : textPrimary }}>{step.title}</h4>
                  <p className="text-xs mt-1" style={{ color: textMuted }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: textPrimary }}>Acciones rápidas</h2>
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.href}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }} className="relative overflow-hidden rounded-xl p-5 cursor-pointer group" style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}` }}>
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${action.gradient} opacity-10 rounded-bl-full`} />
                  <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}>{action.tag}</span>
                  <div className="text-4xl my-3">{action.emoji}</div>
                  <h3 className="font-semibold transition-colors" style={{ color: textPrimary }}>{action.title}</h3>
                  <p className="text-sm mt-1" style={{ color: textMuted }}>{action.desc}</p>
                  <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 transition-colors" style={{ color: textMuted }} />
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: textPrimary }}>Métricas de Usuarios</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <MetricCard title="Monthly Active Users" subtitle="EN ESTE MES" value={userMetrics.mau.value} change={userMetrics.mau.change} trend={userMetrics.mau.trend} data={sparklines.mau} theme={theme} />
            <MetricCard title="Daily Active Users" subtitle="PROMEDIO" value={userMetrics.dau.value} change={userMetrics.dau.change} trend={userMetrics.dau.trend} data={sparklines.dau} theme={theme} />
            <MetricCard title="New Users" subtitle="TOTAL" value={userMetrics.newUsers.value} change={userMetrics.newUsers.change} trend={userMetrics.newUsers.trend} data={sparklines.newUsers} theme={theme} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title="Stickiness" subtitle="DAU/MAU RATIO" value={userMetrics.stickiness.value} change={userMetrics.stickiness.change} trend={userMetrics.stickiness.trend} data={sparklines.stickiness} format="percent" theme={theme} />
            <MetricCard title="Daily Sessions" subtitle="PROMEDIO" value={userMetrics.dailySessions.value} change={userMetrics.dailySessions.change} trend={userMetrics.dailySessions.trend} data={sparklines.dailySessions} theme={theme} />
            <MetricCard title="Sessions per MAU" subtitle="PROMEDIO" value={userMetrics.sessionsPerMau.value} change={userMetrics.sessionsPerMau.change} trend={userMetrics.sessionsPerMau.trend} data={sparklines.sessionsPerMau} format="decimal" theme={theme} />
          </div>
        </section>

        <section className="mb-8">
          <div className="rounded-xl p-6" style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>Performance Over Time</h2>
              <div className="flex items-center gap-4">
                <div><label className="text-xs block mb-1" style={{ color: textMuted }}>Statistics For</label><select value={statistic} onChange={(e) => setStatistic(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: isLight ? "#f9fafb" : "rgba(255,255,255,0.05)", border: `1px solid ${borderColor}`, color: textPrimary }}><option value="sessions">Sessions</option><option value="users">Active Users</option><option value="events">Events</option></select></div>
                <div><label className="text-xs block mb-1" style={{ color: textMuted }}>Breakdown</label><select value={breakdown} onChange={(e) => setBreakdown(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: isLight ? "#f9fafb" : "rgba(255,255,255,0.05)", border: `1px solid ${borderColor}`, color: textPrimary }}><option value="all">All</option><option value="channel">By Channel</option><option value="device">By Device</option></select></div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e5e7eb" : "rgba(255,255,255,0.1)"} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: textMuted }} axisLine={{ stroke: borderColor }} />
                  <YAxis tick={{ fontSize: 12, fill: textMuted }} axisLine={{ stroke: borderColor }} />
                  <Tooltip contentStyle={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}`, borderRadius: "8px", color: textPrimary }} />
                  <Legend />
                  <Line type="monotone" dataKey={statistic} stroke={accentPrimary} strokeWidth={2} dot={{ r: 3, fill: accentPrimary }} activeDot={{ r: 6 }} name={statistic === "sessions" ? "Sessions" : statistic === "users" ? "Active Users" : "Events"} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl p-6" style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}` }}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold" style={{ color: textPrimary }}>Campañas Recientes</h3><Link href="/marketing/campaigns" className="text-sm font-medium" style={{ color: accentPrimary }}>Ver todas →</Link></div>
            <div className="space-y-3">
              {[{ name: "Welcome Series", status: "active", sent: "12.4K", opened: "45%" },{ name: "Black Friday Promo", status: "completed", sent: "89.2K", opened: "38%" },{ name: "Cart Abandonment", status: "active", sent: "5.6K", opened: "52%" },{ name: "Newsletter Enero", status: "draft", sent: "-", opened: "-" }].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: isLight ? "#f9fafb" : "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-green-500" : c.status === "completed" ? "bg-blue-500" : "bg-gray-400"}`} /><span className="font-medium" style={{ color: textPrimary }}>{c.name}</span></div>
                  <div className="flex items-center gap-4 text-sm" style={{ color: textMuted }}><span>Sent: {c.sent}</span><span>Opened: {c.opened}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-6" style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}` }}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold" style={{ color: textPrimary }}>Recursos de Aprendizaje</h3><Link href="#" className="text-sm font-medium" style={{ color: accentPrimary }}>Ver todos →</Link></div>
            <div className="space-y-3">
              {[{ title: "Guía de Segmentación", type: "guide", time: "10 min", Icon: BookOpen },{ title: "Crear tu primer Journey", type: "video", time: "5 min", Icon: Video },{ title: "Email Marketing Tips", type: "guide", time: "15 min", Icon: BookOpen },{ title: "A/B Testing Setup", type: "video", time: "8 min", Icon: Video }].map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: isLight ? "#f9fafb" : "rgba(255,255,255,0.03)" }}>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: r.type === "video" ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)" }}><r.Icon className="w-4 h-4" style={{ color: r.type === "video" ? "#ef4444" : "#3b82f6" }} /></div>
                  <div className="flex-1"><span className="font-medium text-sm" style={{ color: textPrimary }}>{r.title}</span><div className="flex items-center gap-2 text-xs" style={{ color: textMuted }}><span className="capitalize">{r.type}</span><span>•</span><span>{r.time}</span></div></div>
                  <ExternalLink className="w-4 h-4" style={{ color: textMuted }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

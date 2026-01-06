"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, UserPlus, Activity, TrendingUp, TrendingDown, Calendar,
  Play, ShoppingCart, Target, Mail, CheckCircle, Circle, ChevronDown,
  ChevronRight, ExternalLink, Sparkles, BarChart3, Clock, Zap,
  BookOpen, Video, Layout, MousePointer
} from "lucide-react";
import Link from "next/link";
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";

// Datos de métricas de usuarios
const userMetricsData = {
  mau: { value: 45200, change: 12.4, trend: "up" },
  dau: { value: 8450, change: 8.2, trend: "up" },
  newUsers: { value: 2340, change: 15.7, trend: "up" },
  stickiness: { value: 18.7, change: 2.3, trend: "up" },
  dailySessions: { value: 24500, change: 11.2, trend: "up" },
  sessionsPerMau: { value: 3.2, change: -1.4, trend: "down" },
};

// Datos para sparklines (últimos 14 días)
const generateSparklineData = (baseValue: number, variance: number) => {
  return Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    value: baseValue + Math.floor(Math.random() * variance - variance / 2) + (i * variance / 20)
  }));
};

const sparklineData = {
  mau: generateSparklineData(45000, 5000),
  dau: generateSparklineData(8000, 1500),
  newUsers: generateSparklineData(2000, 800),
  stickiness: generateSparklineData(18, 3),
  dailySessions: generateSparklineData(24000, 4000),
  sessionsPerMau: generateSparklineData(3, 0.5),
};

// Datos de performance over time (último mes)
const performanceData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString("es", { day: "2-digit", month: "short" }),
    sessions: 180 + Math.floor(Math.random() * 80) + (i * 2),
    users: 140 + Math.floor(Math.random() * 60) + (i * 1.5),
    events: 450 + Math.floor(Math.random() * 150) + (i * 3),
  };
});

// Checklist de onboarding
const onboardingSteps = [
  { id: 1, title: "Conectar fuente de datos", description: "Integra tu CDP o base de datos", completed: true, icon: Target },
  { id: 2, title: "Crear primer segmento", description: "Define tu audiencia objetivo", completed: true, icon: Users },
  { id: 3, title: "Configurar canal de envío", description: "Email, SMS, Push o WhatsApp", completed: true, icon: Mail },
  { id: 4, title: "Crear primera campaña", description: "Lanza tu primera comunicación", completed: false, icon: Zap },
  { id: 5, title: "Configurar A/B Testing", description: "Optimiza con experimentos", completed: false, icon: BarChart3 },
  { id: 6, title: "Crear Customer Journey", description: "Automatiza el ciclo de vida", completed: false, icon: Activity },
];

// Quick Start Cards
const quickStartCards = [
  {
    id: 1,
    title: "Crear campaña de Email",
    description: "Diseña emails con nuestro editor drag & drop",
    image: "📧",
    color: "from-purple-500 to-pink-500",
    href: "/marketing/campaigns/new?type=email",
    tag: "Recomendado"
  },
  {
    id: 2,
    title: "Explorar Segmentos",
    description: "Analiza y crea audiencias personalizadas",
    image: "👥",
    color: "from-blue-500 to-cyan-500",
    href: "/marketing/segments",
    tag: "Popular"
  },
  {
    id: 3,
    title: "Customer Journeys",
    description: "Automatiza flujos de comunicación",
    image: "🗺️",
    color: "from-green-500 to-teal-500",
    href: "/marketing/journeys",
    tag: "Nuevo"
  },
  {
    id: 4,
    title: "Ver Analytics",
    description: "Métricas de rendimiento en tiempo real",
    image: "📊",
    color: "from-orange-500 to-yellow-500",
    href: "/marketing/analytics",
    tag: "Insights"
  },
];

// Componente MetricCard con sparkline
function MetricCard({ 
  title, 
  subtitle, 
  value, 
  change, 
  trend, 
  sparkline,
  format = "number"
}: {
  title: string;
  subtitle: string;
  value: number;
  change: number;
  trend: "up" | "down";
  sparkline: { day: number; value: number }[];
  format?: "number" | "percent" | "decimal";
}) {
  const formatValue = (val: number) => {
    if (format === "percent") return `${val.toFixed(1)}%`;
    if (format === "decimal") return val.toFixed(1);
    return val.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-gray-900">{formatValue(value)}</span>
        <div className="w-24 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trend === "up" ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={trend === "up" ? "#10b981" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={trend === "up" ? "#10b981" : "#ef4444"} 
                strokeWidth={2}
                fill={`url(#gradient-${title})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

export default function MarketingOverviewPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [selectedApp, setSelectedApp] = useState("all");
  const [statistic, setStatistic] = useState("sessions");
  const [breakdown, setBreakdown] = useState("all");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const completedSteps = onboardingSteps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedSteps / onboardingSteps.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hola, <span className="text-purple-600">Marketing Team</span> 👋
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Date Range Picker */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                {["24h", "7d", "30d", "90d"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      dateRange === range
                        ? "bg-white text-purple-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {range}
                  </button>
                ))}
                <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Custom
                </button>
              </div>

              {/* App Filter */}
              <select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
              >
                <option value="all">Todas las Apps</option>
                <option value="web">Web App</option>
                <option value="ios">iOS App</option>
                <option value="android">Android App</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Onboarding Section */}
        {progressPercent < 100 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Comenzar con NADAKKI</h2>
                  <p className="text-sm text-gray-500">Completa la configuración para aprovechar al máximo</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-2xl font-bold text-purple-600">{progressPercent}%</span>
                  <p className="text-xs text-gray-500">completado</p>
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Onboarding Steps */}
            <div className="grid grid-cols-6 gap-3">
              {onboardingSteps.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    step.completed 
                      ? "bg-green-50 border-green-200" 
                      : "bg-white border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                    <step.icon className={`w-4 h-4 ${step.completed ? "text-green-600" : "text-gray-400"}`} />
                  </div>
                  <h4 className={`text-sm font-medium ${step.completed ? "text-green-700" : "text-gray-900"}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Quick Start Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-4 gap-4">
            {quickStartCards.map((card, i) => (
              <Link key={card.id} href={card.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 cursor-pointer group"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 rounded-bl-full`} />
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                    {card.tag}
                  </span>
                  <div className="text-4xl my-3">{card.image}</div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                  <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* User Metrics Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Métricas de Usuarios</h2>
            <button 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              {showBreakdown ? "Ocultar" : "Mostrar"} Breakdown
              <ChevronDown className={`w-4 h-4 transition-transform ${showBreakdown ? "rotate-180" : ""}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <MetricCard
              title="Monthly Active Users"
              subtitle={`EN ${new Date().toLocaleDateString("es", { month: "short", year: "numeric" }).toUpperCase()}`}
              value={userMetricsData.mau.value}
              change={userMetricsData.mau.change}
              trend={userMetricsData.mau.trend as "up" | "down"}
              sparkline={sparklineData.mau}
            />
            <MetricCard
              title="Daily Active Users"
              subtitle="PROMEDIO"
              value={userMetricsData.dau.value}
              change={userMetricsData.dau.change}
              trend={userMetricsData.dau.trend as "up" | "down"}
              sparkline={sparklineData.dau}
            />
            <MetricCard
              title="New Users"
              subtitle="TOTAL"
              value={userMetricsData.newUsers.value}
              change={userMetricsData.newUsers.change}
              trend={userMetricsData.newUsers.trend as "up" | "down"}
              sparkline={sparklineData.newUsers}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              title="Stickiness"
              subtitle="DAU/MAU RATIO"
              value={userMetricsData.stickiness.value}
              change={userMetricsData.stickiness.change}
              trend={userMetricsData.stickiness.trend as "up" | "down"}
              sparkline={sparklineData.stickiness}
              format="percent"
            />
            <MetricCard
              title="Daily Sessions"
              subtitle="PROMEDIO"
              value={userMetricsData.dailySessions.value}
              change={userMetricsData.dailySessions.change}
              trend={userMetricsData.dailySessions.trend as "up" | "down"}
              sparkline={sparklineData.dailySessions}
            />
            <MetricCard
              title="Sessions per MAU"
              subtitle="PROMEDIO"
              value={userMetricsData.sessionsPerMau.value}
              change={userMetricsData.sessionsPerMau.change}
              trend={userMetricsData.sessionsPerMau.trend as "up" | "down"}
              sparkline={sparklineData.sessionsPerMau}
              format="decimal"
            />
          </div>
        </section>

        {/* Performance Over Time */}
        <section className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Performance Over Time</h2>
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Statistics For</label>
                  <select
                    value={statistic}
                    onChange={(e) => setStatistic(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="sessions">Sessions</option>
                    <option value="users">Active Users</option>
                    <option value="events">Events</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Breakdown</label>
                  <select
                    value={breakdown}
                    onChange={(e) => setBreakdown(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="all">All</option>
                    <option value="channel">By Channel</option>
                    <option value="device">By Device</option>
                    <option value="country">By Country</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={statistic} 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#8b5cf6" }}
                    activeDot={{ r: 6, fill: "#8b5cf6" }}
                    name={statistic === "sessions" ? "Sessions" : statistic === "users" ? "Active Users" : "Events"}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Recent Activity & Tips */}
        <div className="grid grid-cols-2 gap-6">
          {/* Recent Campaigns */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Campañas Recientes</h3>
              <Link href="/marketing/campaigns" className="text-sm text-purple-600 hover:text-purple-700">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { name: "Welcome Series", status: "active", sent: "12.4K", opened: "45%" },
                { name: "Black Friday Promo", status: "completed", sent: "89.2K", opened: "38%" },
                { name: "Cart Abandonment", status: "active", sent: "5.6K", opened: "52%" },
                { name: "Newsletter Enero", status: "draft", sent: "-", opened: "-" },
              ].map((campaign, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      campaign.status === "active" ? "bg-green-500" :
                      campaign.status === "completed" ? "bg-blue-500" : "bg-gray-400"
                    }`} />
                    <span className="font-medium text-gray-900">{campaign.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Sent: {campaign.sent}</span>
                    <span>Opened: {campaign.opened}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Resources */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recursos de Aprendizaje</h3>
              <Link href="#" className="text-sm text-purple-600 hover:text-purple-700">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { title: "Guía de Segmentación Avanzada", type: "guide", duration: "10 min", icon: BookOpen },
                { title: "Crear tu primer Journey", type: "video", duration: "5 min", icon: Video },
                { title: "Best Practices: Email Marketing", type: "guide", duration: "15 min", icon: BookOpen },
                { title: "Configurar A/B Testing", type: "video", duration: "8 min", icon: Video },
              ].map((resource, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <div className={`p-2 rounded-lg ${resource.type === "video" ? "bg-red-100" : "bg-blue-100"}`}>
                    <resource.icon className={`w-4 h-4 ${resource.type === "video" ? "text-red-600" : "text-blue-600"}`} />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">{resource.title}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="capitalize">{resource.type}</span>
                      <span>•</span>
                      <span>{resource.duration}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

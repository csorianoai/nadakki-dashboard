"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Mail, MousePointer,
  Eye, DollarSign, Calendar, Download, RefreshCw, Filter,
  ArrowUpRight, ArrowDownRight, Loader2, Target, Zap, Clock
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

const COLORS = ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

const PERFORMANCE_DATA = [
  { date: "Jan 1", sent: 12500, delivered: 12200, opened: 4880, clicked: 1464 },
  { date: "Jan 8", sent: 15000, delivered: 14700, opened: 6174, clicked: 1852 },
  { date: "Jan 15", sent: 18200, delivered: 17800, opened: 7832, clicked: 2350 },
  { date: "Jan 22", sent: 14800, delivered: 14500, opened: 5945, clicked: 1783 },
  { date: "Jan 29", sent: 21000, delivered: 20600, opened: 9064, clicked: 2719 },
  { date: "Feb 5", sent: 19500, delivered: 19100, opened: 8213, clicked: 2464 },
  { date: "Feb 12", sent: 23000, delivered: 22500, opened: 10125, clicked: 3038 },
];

const CHANNEL_DATA = [
  { name: "Email", value: 45, color: "#3b82f6" },
  { name: "SMS", value: 25, color: "#22c55e" },
  { name: "Push", value: 18, color: "#f59e0b" },
  { name: "In-App", value: 12, color: "#8b5cf6" },
];

const CAMPAIGN_PERFORMANCE = [
  { name: "Welcome Series", sent: 45000, openRate: 42.5, clickRate: 12.8, conversion: 3.2, revenue: 12500 },
  { name: "Black Friday", sent: 125000, openRate: 38.2, clickRate: 15.4, conversion: 4.8, revenue: 85000 },
  { name: "Newsletter Weekly", sent: 89000, openRate: 28.6, clickRate: 8.2, conversion: 1.5, revenue: 4200 },
  { name: "Cart Abandonment", sent: 23000, openRate: 52.1, clickRate: 22.3, conversion: 8.5, revenue: 32000 },
  { name: "Re-engagement", sent: 67000, openRate: 18.4, clickRate: 5.1, conversion: 0.8, revenue: 1800 },
];

const HOURLY_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  opens: Math.floor(Math.random() * 500 + (i >= 9 && i <= 18 ? 800 : 200)),
  clicks: Math.floor(Math.random() * 150 + (i >= 10 && i <= 17 ? 250 : 50)),
}));

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1500));
    setRefreshing(false);
  };

  const stats = {
    totalSent: 523847,
    delivered: 512567,
    opened: 179398,
    clicked: 46107,
    converted: 8298,
    revenue: 245800,
    openRate: 35.0,
    clickRate: 9.0,
    conversionRate: 1.6,
    unsubscribed: 1247,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Analytics Dashboard" size="lg" />
      </NavigationBar>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Métricas en tiempo real de todas tus campañas</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
          <button onClick={refresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-green-400 flex items-center"><ArrowUpRight className="w-3 h-3" /> 12%</span>
          </div>
          <div className="text-2xl font-bold text-white">{(stats.totalSent / 1000).toFixed(0)}K</div>
          <div className="text-sm text-gray-400">Total Enviados</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-green-400 flex items-center"><ArrowUpRight className="w-3 h-3" /> 8%</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.openRate}%</div>
          <div className="text-sm text-gray-400">Open Rate</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <MousePointer className="w-5 h-5 text-cyan-400" />
            <span className="text-xs text-red-400 flex items-center"><ArrowDownRight className="w-3 h-3" /> 2%</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.clickRate}%</div>
          <div className="text-sm text-gray-400">Click Rate</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-400 flex items-center"><ArrowUpRight className="w-3 h-3" /> 15%</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.conversionRate}%</div>
          <div className="text-sm text-gray-400">Conversion Rate</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            <span className="text-xs text-green-400 flex items-center"><ArrowUpRight className="w-3 h-3" /> 23%</span>
          </div>
          <div className="text-2xl font-bold text-white">${(stats.revenue / 1000).toFixed(0)}K</div>
          <div className="text-sm text-gray-400">Revenue</div>
        </GlassCard>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <GlassCard className="col-span-2 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Performance Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={PERFORMANCE_DATA}>
              <defs>
                <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClicked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#1a1f2e", border: "1px solid #333" }} />
              <Legend />
              <Area type="monotone" dataKey="opened" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOpened)" name="Opened" />
              <Area type="monotone" dataKey="clicked" stroke="#22c55e" fillOpacity={1} fill="url(#colorClicked)" name="Clicked" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Channel Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={CHANNEL_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {CHANNEL_DATA?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1a1f2e", border: "1px solid #333" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {CHANNEL_DATA?.map(c => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-sm text-gray-400">{c.name} ({c.value}%)</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Engagement by Hour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={HOURLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" stroke="#666" interval={3} />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#1a1f2e", border: "1px solid #333" }} />
              <Bar dataKey="opens" fill="#8b5cf6" name="Opens" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicks" fill="#22c55e" name="Clicks" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Funnel Analysis</h3>
          <div className="space-y-4">
            {[
              { label: "Sent", value: stats.totalSent, percent: 100, color: "#3b82f6" },
              { label: "Delivered", value: stats.delivered, percent: 97.8, color: "#8b5cf6" },
              { label: "Opened", value: stats.opened, percent: 35.0, color: "#22c55e" },
              { label: "Clicked", value: stats.clicked, percent: 9.0, color: "#f59e0b" },
              { label: "Converted", value: stats.converted, percent: 1.6, color: "#ec4899" },
            ].map((step, i) => (
              <div key={step.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{step.label}</span>
                  <span className="text-white">{step.value.toLocaleString()} ({step.percent}%)</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${step.percent}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full rounded-full" style={{ backgroundColor: step.color }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Campaign Table */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Top Performing Campaigns</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 text-sm text-gray-400">Campaign</th>
              <th className="text-right p-3 text-sm text-gray-400">Sent</th>
              <th className="text-right p-3 text-sm text-gray-400">Open Rate</th>
              <th className="text-right p-3 text-sm text-gray-400">Click Rate</th>
              <th className="text-right p-3 text-sm text-gray-400">Conversion</th>
              <th className="text-right p-3 text-sm text-gray-400">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {CAMPAIGN_PERFORMANCE?.map((c, i) => (
              <tr key={c.name} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3 text-white font-medium">{c.name}</td>
                <td className="p-3 text-right text-gray-300">{c.sent.toLocaleString()}</td>
                <td className="p-3 text-right"><span className={`${c.openRate > 35 ? "text-green-400" : "text-gray-300"}`}>{c.openRate}%</span></td>
                <td className="p-3 text-right"><span className={`${c.clickRate > 10 ? "text-green-400" : "text-gray-300"}`}>{c.clickRate}%</span></td>
                <td className="p-3 text-right"><span className={`${c.conversion > 3 ? "text-green-400" : "text-gray-300"}`}>{c.conversion}%</span></td>
                <td className="p-3 text-right text-white font-medium">${c.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}


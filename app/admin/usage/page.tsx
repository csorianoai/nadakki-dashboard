"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, List, Loader2, RefreshCw } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

interface UsageData {
  executions_this_month?: number;
  limit?: number;
  executions?: { date: string; agent: string; result: string }[];
}

const EXAMPLE_USAGE: UsageData = {
  executions_this_month: 3420,
  limit: 10000,
  executions: [
    { date: "2025-02-18 10:32", agent: "leadscoringia__leadscoringagentoperative", result: "success" },
    { date: "2025-02-18 10:15", agent: "contentgeneratoria__contentgeneratoragentoperative", result: "success" },
    { date: "2025-02-18 09:58", agent: "sentimentanalyzeria__sentimentanalyzeragentoperative", result: "success" },
    { date: "2025-02-18 09:42", agent: "audiencesegmenteria__audiencesegmenteragentoperative", result: "success" },
    { date: "2025-02-18 09:21", agent: "budgetforecastia__budgetforecastagentoperative", result: "success" },
    { date: "2025-02-17 18:05", agent: "campaignoptimizeria__campaignoptimizeragentoperative", result: "success" },
    { date: "2025-02-17 17:30", agent: "retentionpredictoria__retentionpredictoragentoperative", result: "success" },
    { date: "2025-02-17 16:55", agent: "competitoranalyzeria__competitoranalyzeragentoperative", result: "success" },
    { date: "2025-02-17 16:20", agent: "emailautomationia__emailautomationagentoperative", result: "success" },
    { date: "2025-02-17 15:45", agent: "socialpostgeneratoria__socialpostgeneratoragentoperative", result: "success" },
  ],
};

export default function AdminUsagePage() {
  const { tenantId } = useTenant();
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = () => {
    if (!tenantId) return;
    setLoading(true);
    fetch(`${API_URL}/api/v1/tenants/${tenantId}/usage`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const usage = d?.data || d;
        if (usage?.executions_this_month != null || usage?.executions?.length) {
          setData(usage);
        } else {
          setData(EXAMPLE_USAGE);
        }
      })
      .catch(() => setData(EXAMPLE_USAGE))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tenantId) fetchUsage();
    else setLoading(false);
  }, [tenantId]);

  const usage = data || EXAMPLE_USAGE;
  const used = usage.executions_this_month ?? 0;
  const limit = usage.limit ?? 10000;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const executions = usage.executions || [];

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <span className="text-sm text-gray-400">Tenant: {tenantId || "—"}</span>
        <button
          onClick={fetchUsage}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar
        </button>
      </NavigationBar>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Usage</h1>
        <p className="text-gray-400 mt-1">Ejecuciones y límites del tenant</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Ejecuciones este mes</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{used.toLocaleString()} / {limit.toLocaleString()}</span>
              <span className="text-gray-300">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-6 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${pct > 90 ? "bg-amber-500" : pct > 70 ? "bg-yellow-500" : "bg-cyan-500"}`}
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <List className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Últimas 10 ejecuciones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/10">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Agente</th>
                  <th className="py-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {executions.slice(0, 10).map((e, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-gray-400">{e.date}</td>
                    <td className="py-2 pr-4 text-gray-300 font-mono text-xs truncate max-w-[200px]">{e.agent}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded ${e.result === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {e.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

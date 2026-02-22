"use client";

import { useState } from "react";
import { AgentCard } from "@/components/ui/AgentCard";
import { useTenant } from "@/contexts/TenantContext";

interface Agent {
  id: string;
  backendId: string;
  name: string;
  description: string;
  icon: string;
  status: "active" | "inactive" | "pending";
  metrics?: Array<{ label: string; value: number | string }>;
}

const AGENTS: Agent[] = [
  { id: "budget-pacing", backendId: "action_plan_executor__actionplanexecutor", name: "Budget Pacing Agent", description: "Optimiza presupuesto por hora", icon: "💰", status: "active", metrics: [{ label: "Presupuesto", value: "$500" }, { label: "Paced", value: "45%" }] },
  { id: "strategist", backendId: "connector__googleadsconnector", name: "Strategist Agent", description: "Analisis estrategico", icon: "📊", status: "active", metrics: [{ label: "Analisis", value: 24 }, { label: "Efectividad", value: "92%" }] },
  { id: "orchestrator", backendId: "registry__operationregistry", name: "Orchestrator Agent", description: "Coordinador maestro", icon: "👑", status: "active", metrics: [{ label: "Tareas", value: 156 }, { label: "Exito", value: "98%" }] },
  { id: "rsa-copy-generator", backendId: "executor__googleadsexecutor", name: "RSA Copy Generator", description: "Genera anuncios", icon: "📝", status: "active", metrics: [{ label: "Ads", value: 342 }, { label: "CTR", value: "5.2%" }] },
  { id: "search-terms-cleaner", backendId: "email_bridge__emailoperationalwrapper", name: "Search Terms Cleaner", description: "Limpia terminos negativos", icon: "🧹", status: "active", metrics: [{ label: "Terminos", value: 1203 }, { label: "Filtrados", value: "18%" }] },
];

export default function GoogleAdsPage() {
  const { tenantId } = useTenant();
  const [selectedId, setSelectedId] = useState("budget-pacing");
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const selected = AGENTS.find((a) => a.id === selectedId);

  const executeAgent = async (agent: Agent) => {
    if (!tenantId) return;
    setLoading((prev) => ({ ...prev, [agent.id]: true }));
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";
      const res = await fetch(`${apiUrl}/api/v1/agents/${agent.backendId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
        body: JSON.stringify({ payload: {}, dry_run: true }),
      });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [agent.id]: { success: true, data } }));
    } catch (err: any) {
      setResults((prev) => ({ ...prev, [agent.id]: { success: false, error: err.message } }));
    } finally {
      setLoading((prev) => ({ ...prev, [agent.id]: false }));
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">💰 Google Ads Hub</h1>
        <p className="text-gray-600">Agentes especializados de automatizacion - Conectados al Backend</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            {...agent}
            isSelected={selectedId === agent.id}
            onSelect={() => setSelectedId(agent.id)}
            onExecute={() => executeAgent(agent)}
          />
        ))}
      </div>
      {selected && (
        <div className="border-2 border-blue-500 rounded-xl p-8 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl">{selected.icon}</span>
            <div>
              <h3 className="text-2xl font-bold">{selected.name}</h3>
              <p className="text-gray-700">{selected.description}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6">
            {selected.metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {selected.metrics.map((m, i) => (
                  <div key={i} className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-bold text-2xl text-blue-600">{m.value}</div>
                    <div className="text-sm text-gray-600">{m.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 flex-wrap">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-semibold disabled:opacity-50"
                type="button"
                disabled={loading[selected.id]}
                onClick={() => executeAgent(selected)}
              >
                {loading[selected.id] ? "Ejecutando..." : "Ejecutar"}
              </button>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded font-semibold" type="button">Historico</button>
              <button className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-semibold" type="button">Programar</button>
            </div>
            {results[selected.id] && (
              <div className={`mt-4 p-4 rounded ${results[selected.id].success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`font-semibold ${results[selected.id].success ? "text-green-700" : "text-red-700"}`}>
                  {results[selected.id].success ? "Exito - DRY RUN" : "Error"}
                </p>
                <pre className="text-xs mt-2 overflow-auto max-h-40">
                  {JSON.stringify(results[selected.id].data || results[selected.id].error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
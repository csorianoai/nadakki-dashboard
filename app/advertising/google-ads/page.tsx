"use client";
import { useState } from "react";
import { AgentCard } from "@/components/ui/AgentCard";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "active" | "inactive" | "pending";
  metrics?: Array<{ label: string; value: number | string }>;
}

const AGENTS: Agent[] = [
  { id: "budget-pacing", name: "Budget Pacing Agent", description: "Optimiza presupuesto por hora", icon: "💰", status: "active", metrics: [{ label: "Presupuesto", value: "$500" }, { label: "Paced", value: "45%" }] },
  { id: "strategist", name: "Strategist Agent", description: "Análisis estratégico", icon: "📊", status: "active", metrics: [{ label: "Análisis", value: 24 }, { label: "Efectividad", value: "92%" }] },
  { id: "orchestrator", name: "Orchestrator Agent", description: "Coordinador maestro", icon: "👑", status: "active", metrics: [{ label: "Tareas", value: 156 }, { label: "Éxito", value: "98%" }] },
  { id: "rsa-copy-generator", name: "RSA Copy Generator", description: "Genera anuncios", icon: "📝", status: "active", metrics: [{ label: "Ads", value: 342 }, { label: "CTR", value: "5.2%" }] },
  { id: "search-terms-cleaner", name: "Search Terms Cleaner", description: "Limpia términos negativos", icon: "🧹", status: "active", metrics: [{ label: "Términos", value: 1203 }, { label: "Filtrados", value: "18%" }] },
];

export default function GoogleAdsPage() {
  const [selectedId, setSelectedId] = useState("budget-pacing");
  const selected = AGENTS.find((a) => a.id === selectedId);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">💰 Google Ads Hub</h1>
        <p className="text-gray-600">Agentes especializados de automatización</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            {...agent}
            isSelected={selectedId === agent.id}
            onSelect={() => setSelectedId(agent.id)}
            onExecute={() => alert(`Ejecutando: ${agent.name}`)}
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
              <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-semibold" type="button">Ejecutar</button>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded font-semibold" type="button">Histórico</button>
              <button className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-semibold" type="button">Programar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

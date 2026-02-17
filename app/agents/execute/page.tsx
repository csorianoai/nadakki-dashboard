"use client";

import { useState } from "react";
import AgentExecuteButton from "@/components/agents/AgentExecuteButton";

const AVAILABLE_AGENTS = [
  { id: "audiencesegmenteria__audiencesegmenteragentoperative", name: "Audience Segmenter", category: "Segmentation" },
  { id: "campaignoptimizeria__campaignoptimizeragentoperative", name: "Campaign Optimizer", category: "Campaign" },
  { id: "sentimentanalyzeria__sentimentanalyzeragentoperative", name: "Sentiment Analyzer", category: "Analytics" },
  { id: "socialpostgeneratoria__socialpostgeneratoragentoperative", name: "Social Post Generator", category: "Social" },
  { id: "leadscoria__leadscoragentoperative", name: "Lead Scorer", category: "Lead Management" },
  { id: "contentgeneratoria__contentgeneratoragentoperative", name: "Content Generator", category: "Content" },
];

export default function AgentExecutePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...new Set(AVAILABLE_AGENTS.map(a => a.category))];
  const filtered = selectedCategory === "all"
    ? AVAILABLE_AGENTS
    : AVAILABLE_AGENTS.filter(a => a.category === selectedCategory);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Ejecutar Agentes IA</h1>
      <p className="text-gray-500 mb-6">
        Ejecuta agentes en modo DRY RUN para ver análisis sin afectar datos reales.
      </p>

      {/* Filtro por categoría */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
              selectedCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de agentes */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(agent => (
          <div
            key={agent.id}
            className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{agent.name}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {agent.category}
                </span>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500" title="Online" />
            </div>
            <AgentExecuteButton agentId={agent.id} agentName={agent.name} />
          </div>
        ))}
      </div>
    </div>
  );
}


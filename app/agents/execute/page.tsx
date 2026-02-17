"use client";

import { useState, useEffect } from "react";
import AgentExecuteButton from "@/components/agents/AgentExecuteButton";

interface Agent {
  id: string;
  name: string;
  category: string;
  description: string;
}

const MARKETING_AGENTS: Agent[] = [
  // LEAD MANAGEMENT (3)
  { id: "leadscoria__leadscoragentoperative", name: "Lead Scorer", category: "Lead Management", description: "Scoring predictivo de leads con ML" },
  { id: "leadscoringia__leadscoringagentoperative", name: "Lead Scoring", category: "Lead Management", description: "Calificación automática de leads" },
  { id: "predictiveleadia__predictiveleadagentoperative", name: "Predictive Lead", category: "Lead Management", description: "Predicción de conversión de leads" },

  // EXPERIMENTATION (2)
  { id: "abtestingia__abtestingagentoperative", name: "A/B Testing", category: "Experimentation", description: "Análisis de pruebas A/B" },
  { id: "abtestingimpactia__abtestingimpactagentoperative", name: "A/B Testing Impact", category: "Experimentation", description: "Medición de impacto A/B" },

  // CAMPAIGN (1)
  { id: "campaignoptimizeria__campaignoptimizeragentoperative", name: "Campaign Optimizer", category: "Campaign", description: "Optimización de campañas publicitarias" },

  // CONTENT (2)
  { id: "contentgeneratoria__contentgeneratoragentoperative", name: "Content Generator", category: "Content", description: "Generación de contenido con IA" },
  { id: "contentperformanceia__contentperformanceagentoperative", name: "Content Performance", category: "Content", description: "Análisis de rendimiento de contenido" },

  // SOCIAL MEDIA (2)
  { id: "socialpostgeneratoria__socialpostgeneratoragentoperative", name: "Social Post Generator", category: "Social Media", description: "Generación de posts para redes" },
  { id: "sociallisteningia__sociallisteningagentoperative", name: "Social Listening", category: "Social Media", description: "Monitor de redes sociales" },

  // ANALYTICS (2)
  { id: "sentimentanalyzeria__sentimentanalyzeragentoperative", name: "Sentiment Analyzer", category: "Analytics", description: "Análisis de sentimiento" },
  { id: "conversioncohortia__conversioncohortagentoperative", name: "Conversion Cohort", category: "Analytics", description: "Análisis de cohortes de conversión" },

  // INTELLIGENCE (2)
  { id: "competitoranalyzeria__competitoranalyzeragentoperative", name: "Competitor Analyzer", category: "Intelligence", description: "Análisis de competencia" },
  { id: "competitorintelligenceia__competitorintelligenceagentoperative", name: "Competitor Intelligence", category: "Intelligence", description: "Inteligencia competitiva avanzada" },

  // ATTRIBUTION (2)
  { id: "channelattributia__channelattributagentoperative", name: "Channel Attribution", category: "Attribution", description: "Atribución de canales" },
  { id: "attributionmodelia__attributionmodelagentoperative", name: "Attribution Model", category: "Attribution", description: "Modelado de atribución" },

  // FORECASTING (2)
  { id: "budgetforecastia__budgetforecastagentoperative", name: "Budget Forecast", category: "Forecasting", description: "Pronóstico de presupuesto" },
  { id: "marketingmixmodelia__marketingmixmodelagentoperative", name: "Marketing Mix Model", category: "Forecasting", description: "Modelado de mix marketing" },

  // SEGMENTATION (3)
  { id: "audiencesegmenteria__audiencesegmenteragentoperative", name: "Audience Segmenter", category: "Segmentation", description: "Segmentación de audiencias" },
  { id: "customersegmentatonia__customersegmentationagentoperative", name: "Customer Segmentation", category: "Segmentation", description: "Segmentación de clientes" },
  { id: "geosegmentationia__geosegmentationagentoperative", name: "Geo Segmentation", category: "Segmentation", description: "Segmentación geográfica" },

  // PERSONALIZATION (1)
  { id: "personalizationengineia__personalizationengineagentoperative", name: "Personalization Engine", category: "Personalization", description: "Motor de personalización" },

  // EMAIL (1)
  { id: "emailautomationia__emailautomationagentoperative", name: "Email Automation", category: "Email", description: "Automatización de email marketing" },

  // INFLUENCER (2)
  { id: "influencermatchingia__influencermatchingagentoperative", name: "Influencer Matching", category: "Influencer", description: "Matching de influencers" },
  { id: "influencermatcheria__influencermatcheragentoperative", name: "Influencer Matcher", category: "Influencer", description: "Buscador de influencers" },

  // CUSTOMER JOURNEY (1)
  { id: "journeyoptimizeria__journeyoptimizeragentoperative", name: "Journey Optimizer", category: "Customer Journey", description: "Optimización del customer journey" },

  // RETENTION (2)
  { id: "retentionpredictoria__retentionpredictoragentoperative", name: "Retention Predictor", category: "Retention", description: "Predicción de retención" },
  { id: "retentionpredictorea__retentionpredictoragentoperative", name: "Retention Predictor EA", category: "Retention", description: "Predictor de retención enterprise" },

  // PRODUCT (1)
  { id: "productaffinityia__productaffinityagentoperative", name: "Product Affinity", category: "Product", description: "Afinidad de productos" },

  // PRICING (1)
  { id: "pricingoptimizeria__pricingoptimizeragentoperative", name: "Pricing Optimizer", category: "Pricing", description: "Optimización de precios" },

  // CREATIVE (1)
  { id: "creativeanalyzeria__creativeanalyzeragentoperative", name: "Creative Analyzer", category: "Creative", description: "Análisis de creatividades" },

  // DATA QUALITY (1)
  { id: "contactqualityia__contactqualityagentoperative", name: "Contact Quality", category: "Data Quality", description: "Calidad de datos de contacto" },

  // OFFERS (1)
  { id: "cashofferfilteria__cashofferfilteragentoperative", name: "Cash Offer Filter", category: "Offers", description: "Filtro de ofertas de efectivo" },

  // FORMS (1)
  { id: "minimalformia__minimalformagentoperative", name: "Minimal Form", category: "Forms", description: "Optimización de formularios" },

  // ORCHESTRATION (2)
  { id: "marketingorchestratorea__marketingorchestratoragentoperative", name: "Marketing Orchestrator", category: "Orchestration", description: "Orquestador de marketing" },
  { id: "campaignstrategyorchestratoria__campaignstrategyorchestratoragentoperative", name: "Campaign Strategy Orchestrator", category: "Orchestration", description: "Orquestador de estrategia de campaña" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Lead Management": "bg-blue-100 text-blue-700 border-blue-200",
  "Experimentation": "bg-purple-100 text-purple-700 border-purple-200",
  "Campaign": "bg-amber-100 text-amber-700 border-amber-200",
  "Content": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Social Media": "bg-pink-100 text-pink-700 border-pink-200",
  "Analytics": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Intelligence": "bg-red-100 text-red-700 border-red-200",
  "Attribution": "bg-orange-100 text-orange-700 border-orange-200",
  "Forecasting": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Segmentation": "bg-teal-100 text-teal-700 border-teal-200",
  "Personalization": "bg-violet-100 text-violet-700 border-violet-200",
  "Email": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Influencer": "bg-rose-100 text-rose-700 border-rose-200",
  "Customer Journey": "bg-sky-100 text-sky-700 border-sky-200",
  "Retention": "bg-lime-100 text-lime-700 border-lime-200",
  "Product": "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  "Pricing": "bg-stone-100 text-stone-700 border-stone-200",
  "Creative": "bg-pink-100 text-pink-700 border-pink-200",
  "Data Quality": "bg-slate-100 text-slate-700 border-slate-200",
  "Offers": "bg-amber-100 text-amber-700 border-amber-200",
  "Forms": "bg-zinc-100 text-zinc-700 border-zinc-200",
  "Orchestration": "bg-blue-100 text-blue-700 border-blue-200",
};

function getCategoryCounts(agents: Agent[]): Record<string, number> {
  return agents.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export default function AgentExecutePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";
    fetch(`${apiUrl}/health`)
      .then(r => r.ok ? setBackendStatus("online") : setBackendStatus("offline"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  const categories = ["all", ...Array.from(new Set(MARKETING_AGENTS.map(a => a.category))).sort()];
  const categoryCounts = getCategoryCounts(MARKETING_AGENTS);

  const filtered = MARKETING_AGENTS
    .filter(a => selectedCategory === "all" || a.category === selectedCategory)
    .filter(a =>
      searchTerm === "" ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Ejecutar Agentes de Marketing</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              backendStatus === "online" ? "bg-green-500" :
              backendStatus === "offline" ? "bg-red-500" : "bg-yellow-500 animate-pulse"
            }`} />
            <span className="text-sm text-gray-500">
              {backendStatus === "online" ? "Backend Online" :
               backendStatus === "offline" ? "Backend Offline" : "Verificando..."}
            </span>
          </div>
        </div>
        <p className="text-gray-500 mb-4">
          {MARKETING_AGENTS.length} agentes operativos con Decision Layer v2.0, Compliance y Audit Trail. Modo DRY RUN por defecto.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{MARKETING_AGENTS.length}</div>
            <div className="text-xs text-blue-500">Agentes Totales</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{categories.length - 1}</div>
            <div className="text-xs text-green-500">Categorías</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">v2.0</div>
            <div className="text-xs text-purple-500">Decision Layer</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-700">GDPR</div>
            <div className="text-xs text-amber-500">Compliance</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar agente por nombre, categoría o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
              selectedCategory === cat
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat === "all" ? `Todos (${MARKETING_AGENTS.length})` : `${cat} (${categoryCounts[cat] || 0})`}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-4">
        Mostrando {filtered.length} de {MARKETING_AGENTS.length} agentes
      </p>

      {/* Agent Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(agent => {
          const colorClass = CATEGORY_COLORS[agent.category] || "bg-gray-100 text-gray-700 border-gray-200";
          return (
            <div
              key={agent.id}
              className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all hover:border-blue-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{agent.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{agent.description}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 ml-2 mt-1 flex-shrink-0" title="Operativo" />
              </div>
              <div className="mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>
                  {agent.category}
                </span>
              </div>
              <AgentExecuteButton agentId={agent.id} agentName={agent.name} />
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron agentes</p>
          <p className="text-sm">Intenta con otro término de búsqueda o categoría</p>
        </div>
      )}
    </div>
  );
}

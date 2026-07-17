"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Megaphone, CheckCircle } from "lucide-react";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { generateAdCreatives, launchCampaign } from "@/lib/autos-portal/ads-api";
import AdCreativePreview from "@/components/autos/ads/AdCreativePreview";
import type { AdCreatives, CampaignObjective } from "@/types/ads-ai";

const DEMO_DEALER_ID = "d1111111-0000-4000-b000-000000000001";
const DEMO_TENANT_ID = "d0000001-0000-4000-a000-000000000001";

const OBJECTIVES: { value: CampaignObjective; label: string; desc: string }[] = [
  { value: "leads", label: "Leads", desc: "Generar contactos de compradores potenciales" },
  { value: "awareness", label: "Reconocimiento", desc: "Aumentar visibilidad de la marca" },
  { value: "traffic", label: "Tráfico", desc: "Llevar visitantes al portal o sitio web" },
];

const PLATFORMS = ["facebook", "instagram", "tiktok"];

export default function NuevaCampanaPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const tid = tenantId ?? DEMO_TENANT_ID;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [objective, setObjective] = useState<CampaignObjective>("leads");
  const [platforms, setPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [dailyBudget, setDailyBudget] = useState("3000");
  const [campaignName, setCampaignName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [creatives, setCreatives] = useState<AdCreatives | null>(null);
  const [generating, setGenerating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{ campaign_id: string; is_mock: boolean } | null>(null);

  function togglePlatform(p: string) {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  async function handleGenerateCreatives() {
    setGenerating(true);
    try {
      const result = await generateAdCreatives({
        dealer_id: DEMO_DEALER_ID,
        tenant_id: tid,
        campaign_objective: objective,
        platforms,
        budget_rd: Number(dailyBudget),
      });
      setCreatives(result.creatives);
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleLaunch() {
    if (!creatives) return;
    setLaunching(true);
    try {
      const result = await launchCampaign({
        dealer_id: DEMO_DEALER_ID,
        tenant_id: tid,
        name: campaignName || `Campaña ${objective} — ${new Date().toLocaleDateString("es-DO")}`,
        objective,
        platforms,
        daily_budget_rd: Number(dailyBudget),
        start_date: startDate,
        headlines: creatives.headlines,
        body_copies: creatives.body_copies,
      });
      setLaunchResult({ campaign_id: result.campaign_id, is_mock: result.is_mock });
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Nueva Campaña AI</h1>
      </div>

      {/* Step 1: Campaign setup */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Objective */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
            <h2 className="text-base font-semibold text-white">Objetivo de campaña</h2>
            {OBJECTIVES.map((obj) => (
              <label key={obj.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                objective === obj.value ? "border-orange-400/50 bg-orange-500/10" : "border-white/10 bg-white/5 hover:border-white/20"
              }`}>
                <input
                  type="radio"
                  name="objective"
                  value={obj.value}
                  checked={objective === obj.value}
                  onChange={() => setObjective(obj.value)}
                  className="mt-0.5 accent-orange-400"
                />
                <div>
                  <p className="text-sm font-medium text-white">{obj.label}</p>
                  <p className="text-xs text-gray-400">{obj.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Platforms */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
            <h2 className="text-base font-semibold text-white">Plataformas</h2>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`text-sm px-4 py-2 rounded-xl border transition-all capitalize ${
                    platforms.includes(p)
                      ? "bg-orange-500/20 border-orange-400/40 text-orange-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Budget & dates */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
            <h2 className="text-base font-semibold text-white">Presupuesto y fechas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre de campaña</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Ej: Toyota Verano 2026"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Presupuesto diario (RD$)</label>
                <input
                  type="number"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  min="500"
                  step="500"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Fecha de inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-400"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateCreatives}
            disabled={generating || platforms.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-3 font-medium transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? "Generando creativos..." : "Generar creativos con AI"}
          </button>
        </div>
      )}

      {/* Step 2: Review creatives & launch */}
      {step === 2 && creatives && (
        <div className="space-y-5">
          <AdCreativePreview
            creatives={creatives}
            objective={objective}
            platforms={platforms}
            isMock
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-3 font-medium transition-all"
            >
              Volver
            </button>
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-3 font-medium transition-all disabled:opacity-50"
            >
              <Megaphone className="w-4 h-4" />
              {launching ? "Lanzando..." : "Lanzar campaña"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && launchResult && (
        <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">
            {launchResult.is_mock ? "¡Campaña simulada creada!" : "¡Campaña lanzada!"}
          </h2>
          {launchResult.is_mock && (
            <p className="text-sm text-amber-400">
              MODO DEMO — La campaña no se publicará en Meta/TikTok reales.
            </p>
          )}
          <p className="text-xs text-gray-500">ID: {launchResult.campaign_id}</p>
          <button
            onClick={() => router.push("/autos/dealer/anuncios")}
            className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-6 py-3 text-sm font-medium transition-all"
          >
            Ver campañas
          </button>
        </div>
      )}
    </div>
  );
}

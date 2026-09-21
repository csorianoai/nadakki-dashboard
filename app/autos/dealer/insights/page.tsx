"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BenchmarkComparison } from "@/components/dealer/BenchmarkComparison";
import { InsightCard } from "@/components/dealer/InsightCard";
import { PerformanceMetricCard } from "@/components/dealer/PerformanceMetricCard";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import {
  downloadWeeklyReportPdf,
  getDealerInsights,
  regenerateInsights,
} from "@/lib/api/dealer-insights";
import { getDealerId } from "@/lib/api/dealer-leads";
import type { DealerInsight, DealerInsightsPayload } from "@/lib/dealer/insights-mock";

export default function DealerInsightsPage() {
  const [payload, setPayload] = useState<DealerInsightsPayload | null>(null);
  const [insights, setInsights] = useState<DealerInsight[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [weeklyEmail, setWeeklyEmail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const dealerId = getDealerId();
    if (!dealerId) {
      setPayload(null);
      setInsights([]);
      setDemoMode(false);
      setLoading(false);
      return;
    }
    const res = await getDealerInsights(dealerId);
    setPayload(res.data);
    setInsights(res.data.insights);
    setDemoMode(!res.fromBackend);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const dealerId = getDealerId();
      if (!dealerId) {
        toast.error("Seleccione un dealer para regenerar insights");
        return;
      }
      const res = await regenerateInsights(dealerId);
      setPayload(res.data);
      setInsights(res.data.insights);
      setDemoMode(!res.fromBackend);
      toast.success("Insights regenerados");
      if (!res.fromBackend) toast.message("Modo demo — conectar backend para uso real");
    } finally {
      setRegenerating(false);
    }
  };

  const updateInsight = (id: string, status: DealerInsight["status"]) => {
    setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    toast.success(status === "applied" ? "Sugerencia aplicada" : "Insight descartado");
  };

  const updatedLabel = payload
    ? `Actualizado: ${formatRelative(payload.updatedAt)}`
    : "";

  if (loading || !payload) {
    return <p className="text-sm text-nk-fg-muted">Cargando insights…</p>;
  }

  return (
    <main className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">
              Insights AI para tu Dealership
            </h1>
            <DemoModeBadge visible={demoMode} />
          </div>
          <p className="mt-1 text-nk-fg-muted">
            Recomendaciones accionables basadas en tu performance
          </p>
          <p className="mt-1 text-xs text-nk-fg-subtle">{updatedLabel}</p>
        </div>
        <button
          type="button"
          disabled={regenerating}
          onClick={handleRegenerate}
          className="inline-flex items-center gap-2 rounded-full border border-nk-border px-4 py-2 text-sm font-semibold text-nk-fg hover:bg-nk-surface-2 disabled:opacity-50"
        >
          {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Regenerar insights
        </button>
      </header>

      <section>
        <h2 className="mb-4 font-manrope text-lg font-bold text-nk-fg">Performance Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {payload.metrics.map((m) => (
            <PerformanceMetricCard key={m.id} metric={m} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-manrope text-lg font-bold text-nk-fg">
          Recomendaciones AI (accionables)
        </h2>
        <div className="space-y-4">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onPrimary={() => updateInsight(insight.id, "applied")}
              onSecondary={() => updateInsight(insight.id, "dismissed")}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-manrope text-lg font-bold text-nk-fg">
          Comparativa vs competencia
        </h2>
        <BenchmarkComparison items={payload.benchmarks} />
      </section>

      <section>
        <div className="rounded-r-sm border border-nk-border bg-nk-surface p-6">
          <div className="flex flex-wrap items-start gap-4">
            <FileText className="h-10 w-10 text-brand-2" />
            <div className="flex-1">
              <h3 className="font-manrope text-lg font-bold text-nk-fg">Reporte Semanal AI</h3>
              <p className="mt-1 text-sm text-nk-fg-muted">
                Análisis completo generado el{" "}
                {new Date(payload.weeklyReportDate).toLocaleDateString("es-DO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                type="button"
                onClick={() => downloadWeeklyReportPdf(payload.weeklyReportDate)}
                className="mt-4 rounded-full bg-brand-2 px-5 py-2 text-sm font-bold text-white"
              >
                Descargar PDF
              </button>
              <label className="mt-4 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={weeklyEmail}
                  onChange={(e) => {
                    setWeeklyEmail(e.target.checked);
                    toast.message(
                      e.target.checked
                        ? "Reporte programado cada lunes (demo)"
                        : "Programación cancelada",
                    );
                  }}
                  className="accent-brand-2"
                />
                <span className="text-sm text-nk-fg-muted">Enviar cada lunes al email</span>
              </label>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "hace unos minutos";
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
  return `hace ${Math.floor(hours / 24)} días`;
}

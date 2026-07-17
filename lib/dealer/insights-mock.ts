/** Dealer AI insights mock data — Fase 8. */

export type InsightPriority = "alta" | "media" | "baja";
export type InsightStatus = "new" | "applied" | "dismissed";
export type InsightType = "critical" | "opportunity" | "competition";

export type DealerInsight = {
  id: string;
  type: InsightType;
  icon: string;
  title: string;
  description: string;
  priority: InsightPriority;
  status: InsightStatus;
  primaryAction?: string;
  secondaryAction?: string;
};

export type PerformanceMetric = {
  id: string;
  label: string;
  value: number;
  unit?: string;
  changePct?: number;
  benchmark?: string;
  sparkline: number[];
};

export type BenchmarkItem = {
  id: string;
  label: string;
  yours: number;
  average: number;
  unit: string;
  better: boolean;
  rank?: string;
};

export type DealerInsightsPayload = {
  updatedAt: string;
  metrics: PerformanceMetric[];
  insights: DealerInsight[];
  benchmarks: BenchmarkItem[];
  weeklyReportDate: string;
};

export const MOCK_INSIGHTS: DealerInsightsPayload = {
  updatedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  metrics: [
    {
      id: "views",
      label: "Views este mes",
      value: 3245,
      changePct: 12,
      sparkline: [40, 55, 48, 62, 58, 70, 65, 72],
    },
    {
      id: "chats",
      label: "Chats iniciados",
      value: 87,
      benchmark: "vs promedio dealers similares: +18%",
      sparkline: [20, 25, 30, 28, 35, 40, 38, 45],
    },
    {
      id: "leads",
      label: "Leads generados",
      value: 34,
      benchmark: "conversion rate 4.2%",
      sparkline: [5, 8, 6, 10, 9, 12, 11, 14],
    },
    {
      id: "sales",
      label: "Ventas cerradas",
      value: 8,
      unit: "RD$ 12.4M facturado",
      sparkline: [1, 2, 1, 3, 2, 2, 3, 4],
    },
  ],
  insights: [
    {
      id: "ins-1",
      type: "critical",
      icon: "🔥",
      title: "Optimización de precio detectada",
      description:
        "Tu Corolla 2020 lleva 45 días sin visitas. El precio está 8% arriba del promedio del mercado (RD$ 1.35M vs RD$ 1.24M). Sugerencia: bajar a RD$ 1.28M (2.5%). Estimación: conversión +40%.",
      priority: "alta",
      status: "new",
      primaryAction: "Aplicar sugerencia",
      secondaryAction: "Descartar",
    },
    {
      id: "ins-2",
      type: "opportunity",
      icon: "💡",
      title: "Compradores compatibles disponibles",
      description:
        "3 buyers pre-aprobados por Credicefi tienen match >85% con tu Kia Sportage. Ninguno lo ha contactado aún. Sugerencia: envía mensaje proactivo vía chat del vehículo.",
      priority: "media",
      status: "new",
      primaryAction: "Ver compradores compatibles",
    },
    {
      id: "ins-3",
      type: "competition",
      icon: "📊",
      title: "Best practice de dealers top",
      description:
        "Los top 3 dealers en tu categoría actualizan fotos cada 15 días. Tú lo hiciste hace 62 días. Recomendación: actualiza fotos de vehículos con >30 días sin views.",
      priority: "baja",
      status: "new",
      primaryAction: "Ver vehículos que actualizar",
    },
  ],
  benchmarks: [
    {
      id: "conv",
      label: "Conversion rate",
      yours: 4.2,
      average: 2.8,
      unit: "%",
      better: true,
    },
    {
      id: "days",
      label: "Tiempo promedio venta",
      yours: 18,
      average: 24,
      unit: " días",
      better: true,
    },
    {
      id: "rank",
      label: "Ranking en categoría",
      yours: 7,
      average: 171,
      unit: "",
      better: true,
      rank: "#7 de 342 (top 3%)",
    },
  ],
  weeklyReportDate: "2026-07-20",
};

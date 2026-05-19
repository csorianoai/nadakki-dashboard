/** T6.5 Risk-based UX — tiering from the readiness 0–100 scale aligned with App Health Score. */

export type DealerRiskTier = "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "DECLINED";

export interface DealerRiskCopy {
  tier: DealerRiskTier;
  title: string;
  summary: string;
  bullets: string[];
  footer?: string;
}

export function classifyDealerRiskTier(score: number): DealerRiskTier {
  const s = Math.min(100, Math.max(0, score));
  if (s >= 80) return "LOW_RISK";
  if (s >= 60) return "MEDIUM_RISK";
  if (s >= 40) return "HIGH_RISK";
  return "DECLINED";
}

export function dealerRiskCopy(tier: DealerRiskTier): DealerRiskCopy {
  switch (tier) {
    case "LOW_RISK":
      return {
        tier,
        title: "Ruta express",
        summary: "Perfil sano: una sola pantalla de síntesis basta hasta que llegue dictamen institucional.",
        bullets: [
          "Mini-checklist rápido: identidad · ingresos · vehículo",
          "Mantenga oferta visible y tiempo de decisión dentro del SLA interno del dealer.",
        ],
        footer: "Mantenga el expediente estable; cargue soporte solo ante solicitudes explícitas de la institución.",
      };
    case "MEDIUM_RISK":
      return {
        tier,
        title: "Ruta estándar con estipulaciones",
        summary: "Se anticipan aclaraciones. Promueva transparencia y documentación ordenada antes de cursar mesa.",
        bullets: [
          "Mostrar lista corta de estipulaciones probables antes de llamar al cliente.",
          "Educación breve sobre qué evidencias aceleran underwriting humano.",
        ],
      };
    case "HIGH_RISK":
      return {
        tier,
        title: "Escenario educativo · alternativas",
        summary: "Alto riesgo de contraprestación o estructuras alternativas. Active guía corta antes de llamar mesa.",
        bullets: [
          "Evaluar co-firmante, enganche incremental o recompra de ratio LTV cuando aplique política institucional.",
          "Registrar objeciones del cliente para alimentar reconsideración ordenada.",
        ],
      };
    default:
      return {
        tier: "DECLINED",
        title: "Declinación probable",
        summary: "Documente motivadores y próximos pasos para reducir fricción reputacional.",
        bullets: [
          "Desglose sintético del motivo (salud financiera vs. incompletitud).",
          "Ofrecer vía formal de recurso/apelación con documentos mínimos requeridos.",
          "Registrar intención de reintento (≈30–45 días) si mejoran variables centrales.",
        ],
      };
  }
}

export function readinessScoreExplanation(score: number, tier: DealerRiskTier): string {
  switch (tier) {
    case "LOW_RISK":
      return `Puntaje de salud orientativo ${score}/100 · banda alta (≥80).`;
    case "MEDIUM_RISK":
      return `Puntaje de salud orientativo ${score}/100 · zona media (60–79).`;
    case "HIGH_RISK":
      return `Puntaje de salud orientativo ${score}/100 · zona de tensión (40–59).`;
    default:
      return `Puntaje de salud orientativo ${score}/100 · banda delicada (<40).`;
  }
}

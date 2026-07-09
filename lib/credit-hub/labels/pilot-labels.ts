/** Pilot readiness labels — always sourced from backend; never inferred as LIVE. */

export type DataSourceLabel = "DEMO" | "MOCK" | "MANUAL_REVIEW" | "LIVE" | (string & {});
export type KycMode = "mock" | "sandbox" | "manual" | "live" | "unavailable" | (string & {});
export type OcrMode = "mock" | "manual" | "live" | "unavailable" | (string & {});

export interface PilotLabels {
  data_source_label?: string | null;
  kyc_mode?: string | null;
  ocr_mode?: string | null;
}

export function normalizePilotLabel(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : null;
}

export function extractPilotLabels(raw: unknown): PilotLabels {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const fromMeta =
    r.pilot_labels && typeof r.pilot_labels === "object"
      ? (r.pilot_labels as Record<string, unknown>)
      : null;
  const pick = (key: string): string | null =>
    normalizePilotLabel(
      String(
        r[key] ??
          fromMeta?.[key] ??
          (r.metadata && typeof r.metadata === "object"
            ? (r.metadata as Record<string, unknown>)[key]
            : undefined) ??
          "",
      ),
    );

  return {
    data_source_label: pick("data_source_label"),
    kyc_mode: pick("kyc_mode"),
    ocr_mode: pick("ocr_mode"),
  };
}

export interface BadgeVisual {
  label: string;
  color: string;
  background: string;
  icon?: string;
}

export function dataSourceBadgeVisual(value: string | null | undefined): BadgeVisual {
  const v = normalizePilotLabel(value)?.toUpperCase() ?? null;
  if (!v) return { label: "Estado desconocido", color: "var(--ch-text-3)", background: "var(--ch-surface-2)" };
  if (v === "DEMO") return { label: "DEMO", color: "#92400e", background: "#fef3c7", icon: "⚠️" };
  if (v === "MOCK") return { label: "DATOS SIMULADOS", color: "#c2410c", background: "#ffedd5" };
  if (v === "MANUAL_REVIEW") return { label: "REVISIÓN MANUAL", color: "#1d4ed8", background: "#dbeafe" };
  if (v === "LIVE") return { label: "PROVEEDOR EN VIVO", color: "#15803d", background: "#dcfce7" };
  return { label: v, color: "var(--ch-text-2)", background: "var(--ch-surface-2)" };
}

export function kycModeBadgeVisual(value: string | null | undefined): BadgeVisual {
  const v = normalizePilotLabel(value)?.toLowerCase() ?? null;
  if (!v) return { label: "KYC: Not Set", color: "var(--ch-text-3)", background: "var(--ch-surface-2)" };
  if (v === "mock") return { label: "KYC: DATOS SIMULADOS", color: "#c2410c", background: "#ffedd5" };
  if (v === "sandbox") return { label: "KYC: SANDBOX", color: "#92400e", background: "#fef3c7" };
  if (v === "manual") return { label: "KYC: REVISIÓN MANUAL", color: "#1d4ed8", background: "#dbeafe" };
  if (v === "live") return { label: "KYC: PROVEEDOR EN VIVO", color: "#15803d", background: "#dcfce7" };
  if (v === "unavailable") return { label: "KYC: No disponible", color: "var(--ch-text-3)", background: "var(--ch-surface-2)" };
  return { label: `KYC: ${v}`, color: "var(--ch-text-2)", background: "var(--ch-surface-2)" };
}

export function ocrModeBadgeVisual(value: string | null | undefined): BadgeVisual {
  const v = normalizePilotLabel(value)?.toLowerCase() ?? null;
  if (!v) return { label: "OCR: Not Set", color: "var(--ch-text-3)", background: "var(--ch-surface-2)" };
  if (v === "mock") return { label: "OCR: DATOS SIMULADOS", color: "#c2410c", background: "#ffedd5" };
  if (v === "manual") return { label: "OCR: REVISIÓN MANUAL", color: "#1d4ed8", background: "#dbeafe" };
  if (v === "live") return { label: "OCR: PROVEEDOR EN VIVO", color: "#15803d", background: "#dcfce7" };
  if (v === "unavailable") return { label: "OCR: No disponible", color: "var(--ch-text-3)", background: "var(--ch-surface-2)" };
  return { label: `OCR: ${v}`, color: "var(--ch-text-2)", background: "var(--ch-surface-2)" };
}

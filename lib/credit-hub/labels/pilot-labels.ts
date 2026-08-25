/** Pilot readiness labels — always sourced from backend; never inferred as LIVE. */

export type DataSourceLabel = "DEMO" | "MOCK" | "MANUAL_REVIEW" | "LIVE" | (string & {});
export type KycMode = "mock" | "sandbox" | "manual" | "live" | "unavailable" | (string & {});
export type OcrMode = "mock" | "manual" | "live" | "unavailable" | (string & {});

export interface PilotLabels {
  data_source_label?: string | null;
  kyc_mode?: string | null;
  ocr_mode?: string | null;
}

export interface CreditProvenance {
  data_source?: string | null;
  provider?: string | null;
  environment?: string | null;
  retrieved_at?: string | null;
}

export function normalizePilotLabel(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function provenanceFromPayload(payload: unknown): CreditProvenance | null {
  const bankExecution = asRecord(asRecord(payload)?.bank_execution);
  if (!bankExecution) return null;
  return {
    data_source: typeof bankExecution.data_source === "string" ? bankExecution.data_source : null,
    provider: typeof bankExecution.provider === "string" ? bankExecution.provider : null,
    environment: typeof bankExecution.environment === "string" ? bankExecution.environment : null,
    retrieved_at: typeof bankExecution.retrieved_at === "string" ? bankExecution.retrieved_at : null,
  };
}

export function extractCreditProvenance(raw: unknown): CreditProvenance | null {
  const record = asRecord(raw);
  if (!record) return null;

  const decisions = Array.isArray(record.decisions) ? record.decisions : [];
  const lastProcess = decisions.find((decision) => asRecord(decision)?.kind === "last_process_result") ?? decisions[0];
  const fromDecision = provenanceFromPayload(asRecord(lastProcess)?.payload);
  if (fromDecision) return fromDecision;

  const auditTrail = Array.isArray(record.audit_trail) ? record.audit_trail : [];
  return provenanceFromPayload(asRecord(auditTrail[2])?.payload);
}

export function extractPilotLabels(raw: unknown): PilotLabels {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const provenance = extractCreditProvenance(raw);
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
    data_source_label: normalizePilotLabel(provenance?.environment) ?? pick("data_source_label"),
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
  if (v === "MOCK") return { label: "SIMULADO", color: "#c2410c", background: "#ffedd5" };
  if (v === "SANDBOX") return { label: "SANDBOX", color: "#92400e", background: "#fef3c7" };
  if (v === "MANUAL_REVIEW") return { label: "REVISIÓN MANUAL", color: "#1d4ed8", background: "#dbeafe" };
  if (v === "LIVE") return { label: "REAL", color: "#15803d", background: "#dcfce7" };
  if (v === "UNAVAILABLE") return { label: "NO DISPONIBLE", color: "var(--ch-text-3)", background: "var(--ch-surface-2)" };
  return { label: v, color: "var(--ch-text-2)", background: "var(--ch-surface-2)" };
}

export function kycModeBadgeVisual(value: string | null | undefined): BadgeVisual {
  const v = normalizePilotLabel(value)?.toLowerCase() ?? null;
  if (!v) return { label: "KYC: No configurado", color: "var(--ch-text-3)", background: "var(--ch-surface-2)" };
  if (v === "mock") return { label: "KYC: DATOS SIMULADOS", color: "#c2410c", background: "#ffedd5" };
  if (v === "sandbox") return { label: "KYC: SANDBOX", color: "#92400e", background: "#fef3c7" };
  if (v === "manual") return { label: "KYC: REVISIÓN MANUAL", color: "#1d4ed8", background: "#dbeafe" };
  if (v === "live") return { label: "KYC: PROVEEDOR EN VIVO", color: "#15803d", background: "#dcfce7" };
  if (v === "unavailable") return { label: "KYC: No disponible", color: "var(--ch-text-3)", background: "var(--ch-surface-2)" };
  return { label: `KYC: ${v}`, color: "var(--ch-text-2)", background: "var(--ch-surface-2)" };
}

export function ocrModeBadgeVisual(value: string | null | undefined): BadgeVisual {
  const v = normalizePilotLabel(value)?.toLowerCase() ?? null;
  if (!v) return { label: "OCR: No configurado", color: "var(--ch-text-3)", background: "var(--ch-surface-2)" };
  if (v === "mock") return { label: "OCR: DATOS SIMULADOS", color: "#c2410c", background: "#ffedd5" };
  if (v === "manual") return { label: "OCR: REVISIÓN MANUAL", color: "#1d4ed8", background: "#dbeafe" };
  if (v === "live") return { label: "OCR: PROVEEDOR EN VIVO", color: "#15803d", background: "#dcfce7" };
  if (v === "unavailable") return { label: "OCR: No disponible", color: "var(--ch-text-3)", background: "var(--ch-surface-2)" };
  return { label: `OCR: ${v}`, color: "var(--ch-text-2)", background: "var(--ch-surface-2)" };
}

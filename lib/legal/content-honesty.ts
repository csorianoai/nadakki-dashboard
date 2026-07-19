import type { AgentRunResponse, RagMetadata } from "@/types/legal";

export type LegalHonestyBadge = "MOCK" | "DRAFT" | "DEMO";

type AuditTrailLike = {
  knowledge_pack_verified?: boolean;
  knowledge_pack_hash?: string;
  llm_mode?: string;
  validation_status?: string;
  strict_mode?: boolean;
  rejection_reason?: string;
};

type RunLike = AgentRunResponse & {
  audit_trail?: AuditTrailLike;
  llm_metadata?: { provider?: string; model?: string; mode?: string };
  metricas?: Record<string, unknown>;
  validation_status?: string;
  rejection_reason?: string;
};

function normalizeMode(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().toLowerCase();
}

/** Detect MOCK_LLM / mock provider from agent run or quick-check payloads. */
export function isMockLlmActive(source: RunLike | Record<string, unknown> | null | undefined): boolean {
  if (!source || typeof source !== "object") return false;
  const o = source as Record<string, unknown>;
  const audit = o.audit_trail as AuditTrailLike | undefined;
  const metricas = o.metricas as Record<string, unknown> | undefined;
  const llmMeta = o.llm_metadata as { mode?: string; provider?: string } | undefined;
  const candidates = [
    o.llm_mode,
    audit?.llm_mode,
    metricas?.llm_mode,
    llmMeta?.mode,
    llmMeta?.provider,
  ];
  return candidates.some((c) => {
    const m = normalizeMode(c);
    return m != null && (m.includes("mock") || m === "mock_llm");
  });
}

/** Knowledge pack not attorney-verified → DRAFT badge. */
export function isDraftKnowledgePack(source: {
  packVerified?: boolean | null;
  packStatus?: string | null;
  auditTrail?: AuditTrailLike | null;
  ragMetadata?: RagMetadata | null;
}): boolean {
  const { packVerified, packStatus, auditTrail, ragMetadata } = source;
  if (packVerified === false) return true;
  if (auditTrail?.knowledge_pack_verified === false) return true;
  const status = (packStatus ?? auditTrail?.validation_status ?? "").toLowerCase();
  if (status.includes("draft") || status.includes("pending") || status.includes("skeleton")) return true;
  if (ragMetadata?.pack_hash && packVerified !== true && auditTrail?.knowledge_pack_verified !== true) {
    return true;
  }
  return false;
}

export function resolveLegalHonestyBadges(
  run: RunLike | null | undefined,
  opts: { demoPanel?: boolean; packVerified?: boolean | null; packStatus?: string | null } = {},
): LegalHonestyBadge[] {
  const badges: LegalHonestyBadge[] = [];
  if (opts.demoPanel) badges.push("DEMO");
  if (run && isMockLlmActive(run)) badges.push("MOCK");
  if (
    isDraftKnowledgePack({
      packVerified: opts.packVerified,
      packStatus: opts.packStatus,
      auditTrail: run?.audit_trail,
      ragMetadata: run?.rag_metadata,
    })
  ) {
    badges.push("DRAFT");
  }
  return badges;
}

export type StrictRejection = {
  rejected: boolean;
  reason: string;
  technicalDetail?: string;
};

/**
 * Strict-mode rejection is a valid outcome (not a transport error).
 * Surfaces engine refusal with reason when the backend rejects an answer.
 */
export function parseStrictModeRejection(run: AgentRunResponse | null | undefined): StrictRejection {
  if (!run) return { rejected: false, reason: "" };
  const raw = run as RunLike;
  const audit = raw.audit_trail;

  const explicitReason =
    (typeof raw.rejection_reason === "string" && raw.rejection_reason.trim()) ||
    (typeof audit?.rejection_reason === "string" && audit.rejection_reason.trim()) ||
    "";

  const validationStatus = (raw.validation_status ?? audit?.validation_status ?? "").toLowerCase();
  if (validationStatus === "rejected" || validationStatus === "validation_failed") {
    return {
      rejected: true,
      reason: explicitReason || run.respuesta?.trim() || "El motor de validación rechazó la respuesta (strict mode).",
      technicalDetail: JSON.stringify({ validation_status: validationStatus, request_id: run.request_id }, null, 2),
    };
  }

  const alertas = run.monitor?.alertas ?? [];
  const strictAlert = alertas.find((a) =>
    /strict|rechaz|reject|no certif|sin cita|confianza insuficiente/i.test(a),
  );
  if (strictAlert) {
    return {
      rejected: true,
      reason: strictAlert,
      technicalDetail: JSON.stringify({ alertas, request_id: run.request_id }, null, 2),
    };
  }

  if (
    audit?.strict_mode === true &&
    (explicitReason || (run.citations?.length ?? 0) === 0)
  ) {
    return {
      rejected: true,
      reason: explicitReason || run.respuesta?.trim() || "Strict mode: respuesta no publicada por el validador.",
      technicalDetail: JSON.stringify(audit, null, 2),
    };
  }

  return { rejected: false, reason: "" };
}

import { fetchAPI, type APIError } from "@/lib/api/base";

export interface CodigoRazon {
  codigo: string;
  categoria: string;
  descripcion: string;
  impacto: "positivo" | "negativo" | "neutral";
  detalles?: Record<string, unknown>;
}

export interface DecisionBlock {
  accion: "aprobar" | "rechazar" | "revision";
  prioridad: "baja" | "media" | "alta" | "critica";
  confianza: number;
  explicacion: string;
  siguientes_pasos: string[];
}

export interface TrazabilidadAuditoria {
  knowledge_pack_id?: string;
  knowledge_pack_version?: string;
  knowledge_pack_hash?: string;
  knowledge_pack_verified?: boolean;
  cadena_agentes: string[];
  execution_id?: string;
  tenant_id: string;
  timestamp: string;
}

export interface DisclaimerLegal {
  es: string;
  en: string;
}

export interface QuickCheckRequest {
  tipo_solicitud: string;
  texto?: string;
  consulta?: string;
  jurisdiccion?: string;
  etiquetas_area_practica?: string[];
}

export interface LegalQuickCheckResponse {
  estado: "exito" | "error";
  agent_id: string;
  tenant_id: string;
  timestamp: string;
  latencia_ms: number;
  decision: DecisionBlock;
  estado_cumplimiento: "PASS" | "WARN" | "FAIL" | "PENDING";
  puntaje_impacto_negocio: number;
  codigos_razon: CodigoRazon[];
  etiquetas_area_practica: string[];
  citas: string[];
  citas_verificadas?: string[];
  citas_no_verificadas?: string[];
  requiere_revision_abogado: boolean;
  disclaimer_legal: DisclaimerLegal;
  trazabilidad_auditoria: TrazabilidadAuditoria;
  analisis?: string;
  execution_id?: string;
  metricas?: Record<string, number | boolean | string>;
}

export interface AuditEntry {
  execution_id: string;
  tipo_solicitud: string;
  cadena_agentes: string[];
  decision_accion: string;
  estado_cumplimiento: string;
  requiere_revision_abogado: boolean;
  knowledge_pack_hash?: string;
  latencia_ms: number;
  timestamp: string;
  llm_mode?: string;
  llm_tokens_used?: number;
}

export interface KnowledgePackInfo {
  jurisdiction?: string;
  version?: string;
  verification_status?: "pending_attorney_review" | "verified" | "expired";
  verified_by?: string;
  verified_at?: string;
  sha256_hash?: string;
  practice_areas_covered?: string[];
  leyes_codificadas_count?: number;
  articulos_codificados_count?: number;
  // Backend puede devolver estos nombres alternativos
  status?: string;
  pack_hash?: string;
  leyes_cargadas?: number;
  articulos_cargados?: number;
  tenant_id?: string;
  last_loaded_at?: string;
}

export function getLegalApiErrorMessage(e: unknown): string {
  if (e && typeof e === "object" && "error" in e) {
    const ae = e as APIError;
    const raw = ae.error.detail;
    if (raw && typeof raw === "object" && "detail" in raw) {
      const d = (raw as { detail?: unknown }).detail;
      if (typeof d === "string") return d;
      if (Array.isArray(d)) {
        return d
          .map((item) =>
            typeof item === "object" && item && "msg" in item
              ? String((item as { msg: unknown }).msg)
              : JSON.stringify(item)
          )
          .join("; ");
      }
    }
    return ae.error.message;
  }
  if (e instanceof Error) return e.message;
  return "Error desconocido";
}

export const legalApi = {
  async quickCheck(
    payload: QuickCheckRequest,
    tenantId?: string | null
  ): Promise<LegalQuickCheckResponse> {
    return fetchAPI<LegalQuickCheckResponse>("/api/v1/legal/quick-check", {
      method: "POST",
      body: JSON.stringify(payload),
      tenantId: tenantId ?? undefined,
    });
  },

  async getAuditLog(
    limite: number = 50,
    tenantId?: string | null
  ): Promise<{ ejecuciones: AuditEntry[] }> {
    return fetchAPI<{ ejecuciones: AuditEntry[] }>(
      `/api/v1/legal/audit-trail?limite=${encodeURIComponent(String(limite))}`,
      { method: "GET", tenantId: tenantId ?? undefined }
    );
  },

  async getKnowledgePackInfo(
    jurisdiccion: string = "do",
    tenantId?: string | null
  ): Promise<KnowledgePackInfo> {
    const q = encodeURIComponent(jurisdiccion);
    return fetchAPI<KnowledgePackInfo>(
      `/api/v1/legal/knowledge-pack/status?jurisdiccion=${q}`,
      { method: "GET", tenantId: tenantId ?? undefined }
    );
  },
};

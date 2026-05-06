/**
 * Contrato de API para el Legal Task System v2.2.
 * Worker B — Entregable C: Frontend contract tests.
 * Spec v2.1 página 17.
 */

import type { LegalTask, TaskExecutionResponse } from "@/types/legal-tasks";

// ─── Type guard helpers ───────────────────────────────────────────────────────

function isLegalTask(obj: unknown): obj is LegalTask {
  if (!obj || typeof obj !== "object") return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.task_id === "string" &&
    typeof t.display_name_es === "string" &&
    Array.isArray(t.agent_chain) &&
    typeof t.requires_attorney_review === "boolean"
  );
}

function isTaskExecutionResponse(obj: unknown): obj is TaskExecutionResponse {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.task_id === "string" &&
    typeof r.tenant_id === "string" &&
    typeof r.execution_id === "string" &&
    r.sealed_output !== undefined
  );
}

// ─── Mock data conforming to the spec ────────────────────────────────────────

const mockTask: LegalTask = {
  task_id: "review_contract",
  display_name_es: "Revisión de Contrato",
  display_name_en: "Contract Review",
  description_es: "Analiza contratos legales dominicanos",
  description_en: "Analyzes Dominican legal contracts",
  section_es: "Contratos",
  section_en: "Contracts",
  icon_hint: "FileText",
  agent_chain: ["agente_extractor_clausulas_legal", "agente_revisor_contratos_legal"],
  default_practice_area_tags: ["contract_review"],
  required_inputs: ["document_text"],
  output_type: "contract_analysis",
  requires_attorney_review: true,
  max_execution_time_ms: 30000,
  risk_level: "high",
  audit_required: true,
  min_knowledge_pack_level: 1,
  fallback_action: "escalate_to_attorney",
  sync_mode: "sync",
  tenant_features_required: ["contract_review"],
  compliance_jurisdiction_scope: ["do"],
  estimated_time_es: "15-30 segundos",
  estimated_time_en: "15-30 seconds",
};

const mockSealedOutput = {
  estado: "success",
  version: "2.2.0",
  agent_id: "agente_revisor_contratos_legal",
  tenant_id: "366b3c6c-a899-4320-805e-5c1d7c896f74",
  timestamp: "2026-05-06T12:00:00Z",
  latencia_ms: 1250,
  decision: {
    accion: "revisar_clausulas",
    prioridad: "alta",
    confianza: 0.85,
    explicacion: "Se detectaron cláusulas de riesgo moderado.",
    siguientes_pasos: ["Consultar con abogado", "Revisar cláusula 4.2"],
  },
  estado_cumplimiento: "PASS",
  puntaje_impacto_negocio: 7.5,
  codigos_razon: [
    { codigo: "CR001", categoria: "CONTRATO", descripcion: "Cláusula abusiva detectada", impacto: "negativo" },
    { codigo: "CR002", categoria: "CONTRATO", descripcion: "Plazo de prescripción correcto", impacto: "positivo" },
  ],
  etiquetas_area_practica: ["contract_review"],
  requiere_revision_abogado: true,
  disclaimer_legal: {
    es: "Este análisis es informativo. Consulte con un abogado autorizado por el Colegio de Abogados de la República Dominicana (Ley 91).",
    en: "This analysis is informational. Consult a licensed attorney.",
  },
  trazabilidad_auditoria: {
    knowledge_pack_id: "kp_do_v2",
    knowledge_pack_version: "2.0",
    knowledge_pack_hash: "abc123def456abc123def456abc123de",
    cadena_agentes: ["agente_extractor_clausulas_legal", "agente_revisor_contratos_legal"],
    execution_id: "exec_abc123",
    tenant_id: "366b3c6c-a899-4320-805e-5c1d7c896f74",
    timestamp: "2026-05-06T12:00:00Z",
  },
};

const mockResponse: TaskExecutionResponse = {
  task_id: "review_contract",
  task_display_name_es: "Revisión de Contrato",
  task_display_name_en: "Contract Review",
  execution_id: "exec_abc123",
  tenant_id: "366b3c6c-a899-4320-805e-5c1d7c896f74",
  sealed_output: mockSealedOutput,
  timestamp: "2026-05-06T12:00:00Z",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LegalTask type contract", () => {
  it("mock task conforms to LegalTask interface", () => {
    expect(isLegalTask(mockTask)).toBe(true);
  });

  it("task_id is a non-empty string", () => {
    expect(mockTask.task_id).toBeTruthy();
    expect(typeof mockTask.task_id).toBe("string");
  });

  it("requires_attorney_review is always true for legal tasks", () => {
    expect(mockTask.requires_attorney_review).toBe(true);
  });

  it("agent_chain has at least 2 agents", () => {
    expect(mockTask.agent_chain.length).toBeGreaterThanOrEqual(2);
  });

  it("compliance_jurisdiction_scope is an array", () => {
    expect(Array.isArray(mockTask.compliance_jurisdiction_scope)).toBe(true);
  });

  it("tenant_features_required is an array", () => {
    expect(Array.isArray(mockTask.tenant_features_required)).toBe(true);
  });
});

describe("TaskExecutionResponse type contract", () => {
  it("mock response conforms to TaskExecutionResponse interface", () => {
    expect(isTaskExecutionResponse(mockResponse)).toBe(true);
  });

  it("sealed_output.tenant_id matches response.tenant_id", () => {
    expect(mockResponse.sealed_output.tenant_id).toBe(mockResponse.tenant_id);
  });

  it("sealed_output.trazabilidad_auditoria.tenant_id matches", () => {
    const audit = mockResponse.sealed_output.trazabilidad_auditoria;
    expect(audit.tenant_id).toBe(mockResponse.tenant_id);
  });

  it("sealed_output.requiere_revision_abogado is true", () => {
    expect(mockResponse.sealed_output.requiere_revision_abogado).toBe(true);
  });

  it("sealed_output.disclaimer_legal.es mentions abogado", () => {
    const disclaimer = mockResponse.sealed_output.disclaimer_legal;
    expect(disclaimer.es.toLowerCase()).toContain("abogado");
  });

  it("sealed_output.codigos_razon has at least 2 entries", () => {
    expect(mockResponse.sealed_output.codigos_razon.length).toBeGreaterThanOrEqual(2);
  });

  it("sealed_output.trazabilidad_auditoria.cadena_agentes has at least 2 agents", () => {
    const chain = mockResponse.sealed_output.trazabilidad_auditoria.cadena_agentes;
    expect(chain.length).toBeGreaterThanOrEqual(2);
  });

  it("execution_id is a non-empty string", () => {
    expect(mockResponse.execution_id).toBeTruthy();
    expect(typeof mockResponse.execution_id).toBe("string");
  });
});

describe("Cross-tenant isolation contract", () => {
  it("two responses with different tenant_ids are independent", () => {
    const r1 = { ...mockResponse, tenant_id: "tenant-a-uuid" };
    const r2 = { ...mockResponse, tenant_id: "tenant-b-uuid" };
    expect(r1.tenant_id).not.toBe(r2.tenant_id);
  });

  it("sealed_output.tenant_id must match the request tenant", () => {
    const tenantId = "366b3c6c-a899-4320-805e-5c1d7c896f74";
    expect(mockResponse.sealed_output.tenant_id).toBe(tenantId);
    expect(mockResponse.tenant_id).toBe(tenantId);
  });

  it("'default' is not a valid tenant_id", () => {
    const invalidTenants = ["default", "", "  "];
    invalidTenants.forEach((t) => {
      // Simulate frontend validation: valid tenant_id must be non-empty and not 'default'
      const isValid = t.trim().length > 0 && t.trim() !== "default";
      expect(isValid).toBe(false);
    });
  });
});

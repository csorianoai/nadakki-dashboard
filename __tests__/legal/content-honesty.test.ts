import {
  isMockLlmActive,
  isDraftKnowledgePack,
  parseStrictModeRejection,
  resolveLegalHonestyBadges,
} from "@/lib/legal/content-honesty";
import type { AgentRunResponse } from "@/types/legal";

describe("content-honesty", () => {
  it("detects MOCK from llm_mode in audit_trail", () => {
    expect(
      isMockLlmActive({
        audit_trail: { llm_mode: "MOCK_LLM" },
      }),
    ).toBe(true);
  });

  it("detects DRAFT when knowledge pack is not verified", () => {
    expect(
      isDraftKnowledgePack({
        packVerified: false,
        packStatus: "pending_attorney_review",
      }),
    ).toBe(true);
  });

  it("resolves MOCK and DRAFT badges together", () => {
    const run = {
      audit_trail: { llm_mode: "mock", knowledge_pack_verified: false },
    } as AgentRunResponse;
    expect(resolveLegalHonestyBadges(run, { packVerified: false })).toEqual(["MOCK", "DRAFT"]);
  });

  it("parses strict-mode rejection from validation_status", () => {
    const run = {
      agent_id: "chat_asesor_legal",
      tenant_id: "t1",
      status: "success",
      request_id: "req-1",
      respuesta: "No se puede emitir dictamen sin citas verificadas.",
      citations: [],
      requiere_revision_abogado: true,
      validation_status: "rejected",
      rejection_reason: "Citas insuficientes para strict mode",
    } as AgentRunResponse;
    const r = parseStrictModeRejection(run);
    expect(r.rejected).toBe(true);
    expect(r.reason).toContain("Citas insuficientes");
  });

  it("parses strict-mode rejection from monitor alertas", () => {
    const run = {
      agent_id: "chat_asesor_legal",
      tenant_id: "t1",
      status: "success",
      request_id: "req-2",
      respuesta: "",
      citations: [],
      requiere_revision_abogado: true,
      monitor: { alertas: ["Strict mode: confianza insuficiente"] },
    } as AgentRunResponse;
    expect(parseStrictModeRejection(run).rejected).toBe(true);
  });
});

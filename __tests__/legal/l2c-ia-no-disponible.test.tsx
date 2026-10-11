/** @jest-environment jsdom */
/**
 * DASH-LEGAL L2c contra el contrato de LEGAL-FAILCLOSED-01
 * (csorianoai/nadakki-ai-suite#1881, services/legal/llm_gate.py).
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/styles/legal-research-papel-blanco.css", () => ({}));
jest.mock("@/lib/legal/telemetry", () => ({ trackEvent: jest.fn(), emitLegalTaskInvoked: jest.fn() }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/legal/research",
}));
jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "tok" } }));
jest.mock("@/lib/auth/token-refresh", () => ({ isTokenExpiringSoon: () => false, refreshAccessToken: async () => false }));
const runMock = jest.fn();
let quickCheckState: Record<string, unknown> = {};
jest.mock("@/hooks/useLegal", () => ({
  useLegalEffectiveTenantId: () => ({ effectiveTenantId: "t1", tenantHydrated: true, tenantError: null }),
  useLegalAgentRun: () => ({ run: runMock, loading: false }),
  useLegalQuickCheck: () => quickCheckState,
  useKnowledgePackInfo: () => ({ info: null, loading: false }),
}));

import { isLlmUnavailable } from "@/lib/legal/llm-availability";
import { legalApiClient } from "@/lib/api/legal";
import LegalResearchClient from "@/components/legal/LegalResearchClient";
import LegalForgeContractsPage from "@/app/(forge)/legal/contracts/page";

// Cuerpos literales de llm_gate.py (#1881).
const BODY_503 = {
  code: "LLM_UNAVAILABLE",
  error: "LLM_UNAVAILABLE",
  message: "El modelo de lenguaje no esta disponible. No se genera analisis.",
  motivo: "sin OPENAI_API_KEY ni ANTHROPIC_API_KEY en el proceso; MOCK_LLM ignorado en produccion",
  llm_mode: "NONE",
  request_id: "r-1",
};
const AVISO = "MOCK — salida simulada, no es analisis del modelo";

describe("detección del 503 LLM_UNAVAILABLE", () => {
  it("el cliente de agentes conserva code y se reconoce", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, statusText: "Service Unavailable", text: async () => JSON.stringify(BODY_503) }) as unknown as typeof fetch;
    const err = await legalApiClient.runAgent("t1", "chat_asesor_legal", { mensaje: "x" }).catch((e) => e);
    expect(err.code).toBe("LLM_UNAVAILABLE");
    expect(isLlmUnavailable(err)).toBe(true);
  });

  it("forma APIError de quick-check y un 503 cualquiera", () => {
    expect(isLlmUnavailable({ status: 503, error: { message: "x", detail: BODY_503 } })).toBe(true);
    expect(isLlmUnavailable({ status: 503, error: { detail: { detail: "otro" } } })).toBe(false);
    expect(isLlmUnavailable({ status: 500, code: "LLM_UNAVAILABLE" })).toBe(false);
  });
});

describe("Contratos sin análisis de IA", () => {
  it("503: aviso y ningún veredicto ni error técnico", async () => {
    quickCheckState = { loading: false, result: null, tenantMissing: false, submit: jest.fn().mockRejectedValue({ status: 503, error: { message: "x", detail: BODY_503 } }) };
    render(<LegalForgeContractsPage />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Contrato de prueba" } });
    fireEvent.click(screen.getByRole("button", { name: /Analizar contrato/ }));
    expect(await screen.findByTestId("ai-unavailable")).toHaveTextContent(/Análisis de IA no disponible/);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("200 MOCK: aviso con aviso_mock y sin el veredicto devuelto", () => {
    quickCheckState = {
      loading: false,
      tenantMissing: false,
      submit: jest.fn(),
      result: { llm_mode: "MOCK", aviso_mock: AVISO, decision: { accion: "aprobar", confianza: 0.3, explicacion: "Score riesgo: 0.0/100." } },
    };
    render(<LegalForgeContractsPage />);
    expect(screen.getByTestId("ai-unavailable")).toHaveTextContent(AVISO);
    expect(screen.queryByText(/Score riesgo/)).toBeNull();
  });
});

describe("Investigación sin análisis de IA", () => {
  it("200 MOCK: aviso, sin el texto ni las citas del mock", async () => {
    runMock.mockResolvedValueOnce({ status: "success", llm_mode: "MOCK", aviso_mock: AVISO, respuesta: "Texto fijo de mock", citations: [{ source_id: "s1", law_name: "Ley X", article: "Art. 1" }] });
    render(<LegalResearchClient />);
    const box = screen.getByLabelText("Escribe tu consulta legal");
    fireEvent.change(box, { target: { value: "Plazo de preaviso" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(await screen.findByTestId("ai-unavailable")).toHaveTextContent(/Análisis de IA no disponible/);
    expect(screen.queryByText(/Texto fijo de mock/)).toBeNull();
    expect(screen.queryByText(/Ley X/)).toBeNull();
  });

  it("503: aviso y la pregunta vuelve a la caja", async () => {
    runMock.mockRejectedValueOnce({ status: 503, message: BODY_503.message, code: "LLM_UNAVAILABLE" });
    render(<LegalResearchClient />);
    const box = screen.getByLabelText("Escribe tu consulta legal");
    fireEvent.change(box, { target: { value: "Plazo de preaviso" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(await screen.findByTestId("ai-unavailable")).toHaveTextContent(/no está disponible/);
    await waitFor(() => expect(screen.getByLabelText("Escribe tu consulta legal")).toHaveValue("Plazo de preaviso"));
  });
});

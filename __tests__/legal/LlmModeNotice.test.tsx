import { render, screen } from "@testing-library/react";
import { LlmModeNotice, etiquetaModoLlm } from "@/components/legal/LlmModeNotice";
import type { LegalQuickCheckResponse } from "@/lib/legal-api";

const con = (llm_mode: string) => ({ metricas: { llm_mode } }) as unknown as LegalQuickCheckResponse;

describe("LlmModeNotice", () => {
  it("mock avisa que es demostración", () => {
    render(<LlmModeNotice resultado={con("mock")} />);
    expect(screen.getByText(/Modo demostración/)).toBeInTheDocument();
  });

  it("en vivo no dice demo (QA 23-nov)", () => {
    render(<LlmModeNotice resultado={con("LLM")} />);
    expect(screen.getByText(/modelo de lenguaje/)).toBeInTheDocument();
    expect(screen.queryByText(/demo/i)).toBeNull();
  });

  it("sin modo muestra un aviso genérico", () => {
    render(<LlmModeNotice resultado={null} />);
    expect(screen.getByText(/Asistencia automatizada/)).toBeInTheDocument();
  });

  it("bloqueado lo dice", () => {
    expect(etiquetaModoLlm("blocked").titulo).toMatch(/bloqueado/);
  });
});

import { render, screen } from "@testing-library/react";
import { LlmModeNotice } from "@/components/legal/LlmModeNotice";
import type { LegalQuickCheckResponse } from "@/lib/legal-api";

describe("LlmModeNotice", () => {
  it("shows backend llm_mode when present", () => {
    const resultado = {
      metricas: { llm_mode: "mock" },
    } as unknown as LegalQuickCheckResponse;
    render(<LlmModeNotice resultado={resultado} />);
    expect(screen.getByText(/mock/)).toBeInTheDocument();
  });

  it("shows static demo copy when mode absent", () => {
    render(<LlmModeNotice resultado={null} />);
    expect(screen.getByText(/determinística o mock/i)).toBeInTheDocument();
  });
});

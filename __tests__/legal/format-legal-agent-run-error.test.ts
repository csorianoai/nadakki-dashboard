import { formatLegalAgentRunError } from "@/lib/api/legal";

describe("formatLegalAgentRunError", () => {
  it("maps client abort / 408 to a clear Spanish message", () => {
    expect(formatLegalAgentRunError({ status: 408, message: "Request Timeout" })).toContain(
      "más de 2 minutos",
    );
    expect(formatLegalAgentRunError({ name: "AbortError", message: "signal is aborted without reason" })).toContain(
      "más de 2 minutos",
    );
  });

  it("preserves rate-limit and server errors", () => {
    expect(formatLegalAgentRunError({ status: 429, message: "Too Many Requests" })).toContain("Límite de tasa");
    expect(formatLegalAgentRunError({ status: 503, message: "Unavailable" })).toContain("Error interno (503)");
  });
});

import { render, screen } from "@testing-library/react";
import { CreditDataSourceBadge } from "@/components/credit-hub/labels/CreditDataSourceBadge";
import { extractPilotLabels } from "@/lib/credit-hub/labels/pilot-labels";

describe("CreditDataSourceBadge", () => {
  it.each([
    ["DEMO", "DEMO"],
    ["MOCK", "SIMULADO"],
    ["SANDBOX", "SANDBOX"],
    ["MANUAL_REVIEW", "REVISIÓN MANUAL"],
    ["LIVE", "REAL"],
    ["UNAVAILABLE", "NO DISPONIBLE"],
  ] as const)("renders backend label %s as %s", (input, expected) => {
    render(<CreditDataSourceBadge value={input} />);
    expect(screen.getByTestId("credit-data-source-badge")).toHaveTextContent(expected);
    expect(screen.getByTestId("credit-data-source-badge")).toHaveAttribute("data-source-label", input);
  });

  it("null shows Estado desconocido, never LIVE", () => {
    render(<CreditDataSourceBadge value={null} />);
    const el = screen.getByTestId("credit-data-source-badge");
    expect(el).toHaveTextContent("Estado desconocido");
    expect(el).not.toHaveTextContent("REAL");
    expect(el).toHaveAttribute("data-source-label", "null");
  });

  it("uses persisted nested environment for the dealer badge", () => {
    const labels = extractPilotLabels({
      decisions: [{
        payload: {
          bank_execution: {
            data_source: "bureau",
            provider: "datacredito",
            environment: "UNAVAILABLE",
            retrieved_at: "2026-08-25T12:00:00Z",
          },
        },
      }],
    });

    render(<CreditDataSourceBadge value={labels.data_source_label} />);
    expect(screen.getByTestId("credit-data-source-badge")).toHaveTextContent("NO DISPONIBLE");
    expect(labels.data_source_label).toBe("UNAVAILABLE");
  });
});

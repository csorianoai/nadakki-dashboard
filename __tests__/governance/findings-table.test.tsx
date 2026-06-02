import { render, screen } from "@testing-library/react";
import { FindingsTable, sortFindings } from "@/app/admin/governance/components/findings-table";
import { mockFinding } from "@/__mocks__/governance-fixtures";

describe("FindingsTable", () => {
  it("renderiza mensaje vacío cuando no hay findings", () => {
    render(<FindingsTable findings={[]} />);
    expect(screen.getByText(/No critical findings detected/i)).toBeInTheDocument();
  });

  it("ordena P0 antes de P1", () => {
    const findings = [
      { ...mockFinding, id: "1", severity: "P1" as const, blocking: false },
      { ...mockFinding, id: "2", severity: "P0" as const, blocking: false },
    ];
    const sorted = sortFindings(findings);
    expect(sorted[0]?.id).toBe("2");
    expect(sorted[0]?.severity).toBe("P0");
  });

  it("ordena blocking antes de no-blocking", () => {
    const findings = [
      { ...mockFinding, id: "1", severity: "P0" as const, blocking: false },
      { ...mockFinding, id: "2", severity: "P0" as const, blocking: true },
    ];
    const sorted = sortFindings(findings);
    expect(sorted[0]?.id).toBe("2");
    expect(sorted[0]?.blocking).toBe(true);
  });

  it("muestra filas en tabla cuando hay findings", () => {
    render(<FindingsTable findings={[mockFinding]} />);
    expect(screen.getByText(mockFinding.title)).toBeInTheDocument();
    expect(screen.getByText("P0")).toBeInTheDocument();
  });
});

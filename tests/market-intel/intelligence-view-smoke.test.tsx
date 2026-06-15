import { render, screen } from "@testing-library/react";
import { IntelligenceView } from "@/app/market-intel/components/IntelligenceView";
import { snapshotFull, snapshotFullRun } from "@/app/market-intel/lib/__fixtures__/snapshotFull";

describe("IntelligenceView smoke", () => {
  it("renderiza tabs y contenido sin [object Object]", () => {
    render(
      <IntelligenceView
        run={snapshotFullRun}
        snapshot={snapshotFull}
        runs={[snapshotFullRun]}
        selectedRunId={snapshotFullRun.id}
        onSelectRun={() => {}}
        onValidate={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /Panorama/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Estrategia/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Precios/i })).toBeInTheDocument();
    expect(screen.getByText("Mercado de crédito automotriz")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("[object Object]");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IntelligenceView } from "@/app/market-intel/components/IntelligenceView";
import { snapshotFull, snapshotFullRun } from "@/app/market-intel/lib/__fixtures__/snapshotFull";

describe("IntelligenceView filter integration", () => {
  it("click Alta en Hallazgos muestra solo findings con confidence alto", async () => {
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

    await userEvent.click(screen.getByRole("button", { name: /Hallazgos/i }));
    await userEvent.click(screen.getByRole("button", { name: "Alta" }));

    expect(screen.getByText(/BCRD · Informe de Estabilidad Financiera 2024/)).toBeInTheDocument();
    expect(
      screen.queryByText(/SB · Informe Cartera Vehicular 2024/),
    ).not.toBeInTheDocument();
  });

  it("click T1 en Panorama oculta instituciones Tier2 del listado HBar", async () => {
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

    await userEvent.click(screen.getByRole("button", { name: "T1" }));

    expect(screen.getAllByText("Banco Popular Dominicano").length).toBeGreaterThan(0);
    expect(screen.queryByText("BHD León")).not.toBeInTheDocument();
    expect(screen.queryByText("Motor Crédito")).not.toBeInTheDocument();
  });
});

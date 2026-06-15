import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FindingsPanel } from "@/app/market-intel/components/sections/FindingsPanel";
import { snapshotFull } from "@/app/market-intel/lib/__fixtures__/snapshotFull";

describe("FindingsPanel", () => {
  it("filtra por confianza y abre drawer al click", async () => {
    const onPick = jest.fn();
    render(
      <FindingsPanel
        findings={snapshotFull.findings}
        cur="RD$"
        onPick={onPick}
        filters={{ segment: "all", confidence: "alto", tier: "all" }}
        institutionShares={snapshotFull.market_overview.institution_shares ?? []}
      />,
    );

    expect(screen.getByText(/BCRD · Informe de Estabilidad Financiera 2024/)).toBeInTheDocument();
    expect(
      screen.queryByText(/SB · Informe Cartera Vehicular 2024/),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByText(/BCRD · Informe de Estabilidad Financiera 2024/),
    );
    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({ type: "finding", data: expect.objectContaining({ id: "f1" }) }),
    );
  });
});

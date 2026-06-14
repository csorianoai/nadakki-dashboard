import { render, screen } from "@testing-library/react";
import { MarketOverviewSection } from "@/app/market-intel/components/MarketOverviewSection";
import { snapshotFull } from "@/app/market-intel/lib/__fixtures__/snapshotFull";
import { snapshotMinimal } from "@/app/market-intel/lib/__fixtures__/snapshotMinimal";

describe("MarketOverviewSection", () => {
  it("renderiza campos poblados del snapshot completo", () => {
    render(<MarketOverviewSection overview={snapshotFull.market_overview} currency="DOP" />);

    expect(screen.getByText("Panorama de mercado")).toBeInTheDocument();
    expect(screen.getByText("6.8%")).toBeInTheDocument();
    expect(screen.getAllByText("Banco Popular").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BHD León").length).toBeGreaterThan(0);
    expect(screen.getByText(/Supervisión SIB y BCRD/)).toBeInTheDocument();
    expect(screen.getByText("Participación por institución")).toBeInTheDocument();
  });

  it("muestra placeholders cuando los campos vienen null o vacíos", () => {
    render(<MarketOverviewSection overview={snapshotMinimal.market_overview} currency="USD" />);

    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText("null")).not.toBeInTheDocument();
    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
    expect(screen.queryByText("Participación por institución")).not.toBeInTheDocument();
  });

  it("no monta InstitutionChart cuando institution_shares está vacío", () => {
    expect(() =>
      render(<MarketOverviewSection overview={snapshotMinimal.market_overview} currency="USD" />)
    ).not.toThrow();
    expect(screen.queryByRole("img", { name: /Banco Popular/i })).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { MarketOverviewSection } from "@/app/market-intel/components/sections/MarketOverviewSection";
import { snapshotFull } from "@/app/market-intel/lib/__fixtures__/snapshotFull";
import { snapshotMinimal } from "@/app/market-intel/lib/__fixtures__/snapshotMinimal";

describe("MarketOverviewSection", () => {
  it("renderiza secciones con snapshot completo", () => {
    render(
      <MarketOverviewSection
        overview={snapshotFull.market_overview}
        cur="RD$"
        fx={62}
        onPick={() => {}}
        filters={{ segment: "all", confidence: "all", tier: "all" }}
      />,
    );

    expect(screen.getByText("Mercado de crédito automotriz")).toBeInTheDocument();
    expect(screen.getByText("Marco regulatorio")).toBeInTheDocument();
    expect(screen.getAllByText("Banco Popular Dominicano").length).toBeGreaterThan(0);
  });

  it("renderiza em dash para campos null sin mostrar null", () => {
    render(
      <MarketOverviewSection
        overview={snapshotMinimal.market_overview}
        cur="RD$"
        fx={62}
        onPick={() => {}}
        filters={{ segment: "all", confidence: "all", tier: "all" }}
      />,
    );

    expect(document.body.textContent).not.toContain("null");
    expect(document.body.textContent).not.toContain("[object Object]");
  });

  it("filtra institution shares por tier", () => {
    render(
      <MarketOverviewSection
        overview={snapshotFull.market_overview}
        cur="RD$"
        fx={62}
        onPick={() => {}}
        filters={{ segment: "all", confidence: "all", tier: "Tier2" }}
      />,
    );

    expect(screen.getByText("BHD León")).toBeInTheDocument();
    expect(screen.queryByText("Banco Popular Dominicano")).not.toBeInTheDocument();
  });
});

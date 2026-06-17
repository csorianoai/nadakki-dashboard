import { render, screen } from "@testing-library/react";
import { MarketOverviewSection } from "@/app/market-intel/components/sections/MarketOverviewSection";
import { snapshotFull } from "@/app/market-intel/lib/__fixtures__/snapshotFull";
import { snapshotMinimal } from "@/app/market-intel/lib/__fixtures__/snapshotMinimal";
import type { MarketOverview } from "@/app/market-intel/lib/types";

// Mirrors the per-segment series added to the DO research_mock.yaml pack
// (backend correlative PR). aggregate last point = 12.3% CAGR, usados = 18.5%.
const overviewWithSegmentGrowth: MarketOverview = {
  ...snapshotFull.market_overview,
  growth_rate_pct: 12.3,
  growth_rate_by_year: {
    aggregate: [9.1, 9.3, 10.3, 11.3, 12.3],
    usados: [14.2, 15.5, 16.8, 17.6, 18.5],
  },
};

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

  it("usa la serie growth_rate_by_year.usados en el chart cuando segment='usados'", () => {
    render(
      <MarketOverviewSection
        overview={overviewWithSegmentGrowth}
        cur="RD$"
        fx={62}
        onPick={() => {}}
        filters={{ segment: "usados", confidence: "all", tier: "all" }}
      />,
    );

    // Etiquetas del chart "Tamaño y crecimiento" reflejan el segmento usados.
    for (const label of ["14.2%", "15.5%", "16.8%", "17.6%", "18.5%"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // CAGR recalculado por segmento (último punto de la serie usados).
    expect(screen.getByText(/18\.5% CAGR/)).toBeInTheDocument();
    // No se filtran las etiquetas/CAGR agregadas.
    expect(screen.queryByText("10.3%")).not.toBeInTheDocument();
    expect(screen.queryByText(/12\.3% CAGR/)).not.toBeInTheDocument();
  });

  it("usa la serie aggregate cuando segment='all'", () => {
    render(
      <MarketOverviewSection
        overview={overviewWithSegmentGrowth}
        cur="RD$"
        fx={62}
        onPick={() => {}}
        filters={{ segment: "all", confidence: "all", tier: "all" }}
      />,
    );

    for (const label of ["10.3%", "11.3%", "12.3%"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(/12\.3% CAGR/)).toBeInTheDocument();
    // Las etiquetas exclusivas del segmento usados no deben aparecer.
    expect(screen.queryByText("18.5%")).not.toBeInTheDocument();
  });
});

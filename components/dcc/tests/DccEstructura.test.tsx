import { fireEvent, render, screen } from "@testing-library/react";
import { DccCard } from "@/components/dcc/DccCard";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccHeader } from "@/components/dcc/DccHeader";
import { DccKpi } from "@/components/dcc/DccKpi";
import { DccGrid, DccPage } from "@/components/dcc/DccPage";

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({
    data: { display_name: "Mapaal Automotores", locale: "es-AR", currency: "ARS", logo_url: null },
  }),
}));

const MARCA = { nombre: "Mapaal Automotores", plataforma: null, logoUrl: null, formato: { locale: "es-AR", currency: "ARS" } };

describe("DccCard", () => {
  it("evidencia plegada bajo 'Ver evidencia' y rotulo tecnico en tooltip", () => {
    render(
      <DccCard titulo="Leads" tecnico="metric_key: lead_count@1.0" calidad={{ estado: "verificado" }} evidencia={<p>fuente</p>}>
        <p>cuerpo</p>
      </DccCard>,
    );
    const evidencia = screen.getByTestId("dcc-evidencia");
    expect(evidencia.tagName).toBe("DETAILS");
    expect(evidencia).not.toHaveAttribute("open");
    expect(screen.getByText("Ver evidencia")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Leads" })).toBeInTheDocument();
    expect(screen.queryByText("metric_key: lead_count@1.0", { selector: "h2" })).toBeNull();
  });

  it("altura automatica: sin alturas fijas ni overflow oculto", () => {
    render(<DccCard titulo="x" />);
    const card = screen.getByTestId("dcc-card");
    expect(card.className).toContain("h-auto");
    expect(card.className).not.toMatch(/overflow-hidden|\bh-\d/);
  });
});

describe("DccKpi", () => {
  it("con sello verificado pinta la cifra que llego", () => {
    render(<DccKpi valor="1.234" calidad={{ estado: "verificado" }} />);
    expect(screen.getByTestId("dcc-kpi-valor")).toHaveTextContent("1.234");
  });

  it.each([
    [{ estado: "bloqueado", reasonCode: "UPGRADE_REQUIRED" } as const, "bloqueado"],
    [{ estado: "no_disponible", motivo: null } as const, "no_disponible"],
  ])("sello %o no pinta cifra aunque llegue valor", (calidad, estado) => {
    render(<DccKpi valor="999" calidad={calidad} />);
    expect(screen.queryByTestId("dcc-kpi-valor")).toBeNull();
    expect(screen.getByTestId("dcc-estado")).toHaveAttribute("data-estado", estado);
  });

  it("sin valor pinta 'aún no disponible', nunca 0", () => {
    render(<DccKpi valor={null} calidad={{ estado: "verificado" }} />);
    expect(screen.getByTestId("dcc-estado")).toHaveAttribute("data-estado", "no_disponible");
  });
});

describe("DccEstado", () => {
  it("error ofrece reintentar", () => {
    const reintentar = jest.fn();
    render(<DccEstado estado="error" onReintentar={reintentar} />);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(reintentar).toHaveBeenCalled();
  });
});

describe("DccHeader / DccPage", () => {
  it("la marca del tenant arriba; la linea de plataforma solo si el tenant la trae", () => {
    const { rerender } = render(<DccHeader marca={MARCA} titulo="Inicio" theme="light" onTheme={() => {}} />);
    expect(screen.getByTestId("dcc-marca-nombre")).toHaveTextContent("Mapaal Automotores");
    expect(screen.queryByTestId("dcc-marca-plataforma")).toBeNull();
    rerender(
      <DccHeader marca={{ ...MARCA, plataforma: "con Nadakki Dealer OS" }} titulo="Inicio" theme="light" onTheme={() => {}} />,
    );
    expect(screen.getByTestId("dcc-marca-plataforma")).toHaveTextContent("con Nadakki Dealer OS");
  });

  it("la pagina arranca en claro, conmuta a oscuro y lee la marca del branding", () => {
    const { container } = render(
      <DccPage titulo="Inicio">
        <DccGrid>
          <DccCard titulo="a" />
        </DccGrid>
      </DccPage>,
    );
    const raiz = container.querySelector("[data-dcc-root]");
    expect(raiz).toHaveAttribute("data-dcc-theme", "light");
    expect(screen.getByTestId("dcc-marca-nombre")).toHaveTextContent("Mapaal Automotores");
    fireEvent.click(screen.getByTestId("dcc-theme-toggle"));
    expect(raiz).toHaveAttribute("data-dcc-theme", "dark");
    expect(screen.getByTestId("dcc-grid").className).toContain("items-start");
  });
});

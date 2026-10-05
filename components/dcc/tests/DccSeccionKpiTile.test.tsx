import { render, screen, within } from "@testing-library/react";
import { BarChart3 } from "lucide-react";
import { DccKpiTile } from "@/components/dcc/DccKpiTile";
import { DccSeccion } from "@/components/dcc/DccSeccion";

describe("DccSeccion", () => {
  it("cabecera clara tintada con titulo y metadato; contenido de altura automatica", () => {
    render(
      <DccSeccion titulo="Estado del negocio" icono={BarChart3} tono="azul" meta="total histórico">
        <p>contenido</p>
      </DccSeccion>,
    );
    const seccion = screen.getByTestId("dcc-seccion");
    expect(seccion).toHaveAttribute("data-tono", "azul");
    expect(screen.getByRole("heading", { name: "Estado del negocio" })).toBeInTheDocument();
    expect(within(seccion).getByText("total histórico")).toBeInTheDocument();
    expect(seccion.className).toContain("h-auto");
    expect(seccion.className).not.toMatch(/overflow-hidden|bg-\[var\(--ink/);
  });
});

describe("DccKpiTile", () => {
  it("con sello verificado pinta cifra, unidad y sello", () => {
    render(<DccKpiTile etiqueta="Inventario" valor="27" unidad="unidades" calidad={{ estado: "verificado" }} nota="23 publicadas" />);
    const tile = screen.getByTestId("dcc-kpi-tile");
    expect(tile).toHaveAttribute("data-con-cifra", "si");
    expect(within(tile).getByTestId("dcc-kpi-valor")).toHaveTextContent("27");
    expect(within(tile).getByText("unidades")).toBeInTheDocument();
    expect(within(tile).getByTestId("dcc-sello")).toHaveTextContent("verificado");
  });

  it.each([
    [{ estado: "bloqueado", reasonCode: "UPGRADE_REQUIRED" } as const],
    [{ estado: "no_disponible", motivo: "Falta endpoint" } as const],
  ])("sin cifra permitida no pinta numero aunque llegue valor (%o)", (calidad) => {
    render(<DccKpiTile etiqueta="Caja / Cobranzas" valor="999" calidad={calidad} />);
    const tile = screen.getByTestId("dcc-kpi-tile");
    expect(tile).toHaveAttribute("data-con-cifra", "no");
    expect(within(tile).queryByTestId("dcc-kpi-valor")).toBeNull();
    expect(within(tile).getByText("cifra no disponible")).toBeInTheDocument();
    expect(tile.textContent).not.toContain("999");
  });

  it("el rotulo tecnico va al tooltip, no a la vista", () => {
    render(<DccKpiTile etiqueta="Leads" valor="14" calidad={{ estado: "verificado" }} tecnico="metric_key: lead_count@1.0" />);
    expect(screen.queryByText("metric_key: lead_count@1.0", { selector: "p" })).toBeNull();
    expect(screen.getAllByTestId("dcc-tooltip")[0]).toHaveAttribute("title", "metric_key: lead_count@1.0");
  });
});

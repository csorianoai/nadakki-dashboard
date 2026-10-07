import { render, screen, within } from "@testing-library/react";
import { BarChart3 } from "lucide-react";
import { DccKpiTile } from "@/components/dcc/DccKpiTile";
import { DccSeccion } from "@/components/dcc/DccSeccion";

/** Texto visible: sin las descripciones `sr-only` de los tooltips. */
function visible(el: HTMLElement): string {
  const copia = el.cloneNode(true) as HTMLElement;
  copia.querySelectorAll(".sr-only").forEach((n) => n.remove());
  return copia.textContent ?? "";
}

describe("DccSeccion", () => {
  it("tarjeta clave con filo dorado; las demas sin el", () => {
    const { rerender } = render(<DccSeccion titulo="Brief del día" icono={BarChart3} clave>x</DccSeccion>);
    expect(screen.getByTestId("dcc-seccion").className).toContain("border-t-[var(--dcc-gold)]");
    rerender(<DccSeccion titulo="Hoy" icono={BarChart3}>x</DccSeccion>);
    expect(screen.getByTestId("dcc-seccion").className).not.toContain("--dcc-gold");
    expect(screen.getByRole("heading", { name: "Hoy" })).toBeInTheDocument();
  });

  it("altura automatica: sin overflow oculto", () => {
    render(<DccSeccion titulo="Estado del negocio" icono={BarChart3}>x</DccSeccion>);
    expect(screen.getByTestId("dcc-seccion").className).toContain("h-auto");
    expect(screen.getByTestId("dcc-seccion").className).not.toMatch(/overflow-hidden/);
  });
});

describe("DccKpiTile", () => {
  it("con sello verificado: cifra en dorado legible, unidad y sello", () => {
    render(<DccKpiTile etiqueta="Inventario" valor="27" unidad="unidades" calidad={{ estado: "verificado" }} nota="23 publicadas" />);
    const tile = screen.getByTestId("dcc-kpi-tile");
    expect(within(tile).getByTestId("dcc-kpi-valor")).toHaveTextContent("27");
    expect(within(tile).getByTestId("dcc-kpi-valor").className).toContain("--dcc-gold-ink");
    expect(within(tile).getByText("23 publicadas")).toBeInTheDocument();
  });

  it("sin dato: solo etiqueta y 'Próximamente' compacto; el porque va al tooltip", () => {
    render(<DccKpiTile etiqueta="Caja" valor="999" calidad={{ estado: "no_disponible", motivo: "Falta endpoint de caja" }} nota="no se ve" />);
    const tile = screen.getByTestId("dcc-kpi-tile");
    expect(tile).toHaveAttribute("data-con-cifra", "no");
    expect(tile.textContent).not.toContain("999");
    expect(within(tile).getByTestId("dcc-sello")).toHaveTextContent("Próximamente");
    expect(visible(tile)).toBe("CajaPróximamente");
    expect(within(tile).getAllByTestId("dcc-tooltip").some((t) => t.getAttribute("title")?.includes("Falta endpoint de caja"))).toBe(true);
  });

  it("bloqueado no pinta numero", () => {
    render(<DccKpiTile etiqueta="Leads" valor="14" calidad={{ estado: "bloqueado", reasonCode: "UPGRADE_REQUIRED" }} />);
    expect(screen.queryByTestId("dcc-kpi-valor")).toBeNull();
  });
});

describe("DccKpiTile sin calidad (banco v2)", () => {
  it("calidad null: pinta la cifra sin sello", () => {
    const { container } = render(<DccKpiTile etiqueta="Aprobadas" valor="12" calidad={null} />);
    expect(container.querySelector("[data-testid=dcc-kpi-valor]")).toHaveTextContent("12");
    expect(container.querySelector("[data-testid=dcc-sello]")).toBeNull();
  });
});

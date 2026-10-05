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

  it("bloqueado no pinta cifra aunque llegue valor", () => {
    render(<DccKpi valor="999" calidad={{ estado: "bloqueado", reasonCode: "UPGRADE_REQUIRED" }} />);
    expect(screen.queryByTestId("dcc-kpi-valor")).toBeNull();
    expect(screen.getByTestId("dcc-estado")).toHaveAttribute("data-estado", "bloqueado");
  });

  it("sin dato no ocupa cuerpo: ni cifra ni bloque (el sello de la cabecera basta)", () => {
    const { container } = render(<DccKpi valor="999" calidad={{ estado: "no_disponible", motivo: "Falta endpoint" }} />);
    expect(container).toBeEmptyDOMElement();
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
  it("sin bloque de marca duplicado ni recuadro de logo vacio; el logo solo si el tenant lo tiene", () => {
    const { rerender } = render(<DccHeader marca={MARCA} titulo="Inicio" theme="light" onTheme={() => {}} />);
    expect(screen.getByRole("heading", { name: "Inicio" })).toBeInTheDocument();
    expect(screen.queryByText("Mapaal Automotores")).toBeNull();
    expect(screen.queryByTestId("dcc-logo")).toBeNull();
    rerender(<DccHeader marca={{ ...MARCA, logoUrl: "https://cdn.example/logo.svg" }} titulo="Inicio" theme="light" onTheme={() => {}} />);
    expect(screen.getByTestId("dcc-logo")).toHaveAttribute("src", "https://cdn.example/logo.svg");
  });

  it("la pagina arranca en claro y conmuta a oscuro", () => {
    const { container } = render(
      <DccPage titulo="Inicio">
        <DccGrid>
          <DccCard titulo="a" />
        </DccGrid>
      </DccPage>,
    );
    const raiz = container.querySelector("[data-dcc-root]");
    expect(raiz).toHaveAttribute("data-dcc-theme", "light");
    fireEvent.click(screen.getByTestId("dcc-theme-toggle"));
    expect(raiz).toHaveAttribute("data-dcc-theme", "dark");
    expect(screen.getByTestId("dcc-grid").className).toContain("items-start");
  });
});

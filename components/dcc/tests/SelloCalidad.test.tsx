import { render, screen } from "@testing-library/react";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { DccThemeRoot } from "@/components/dcc/DccThemeRoot";

describe("SelloCalidad", () => {
  it("pinta verificado", () => {
    render(<SelloCalidad calidad={{ estado: "verificado" }} />);
    const sello = screen.getByTestId("dcc-sello");
    expect(sello).toHaveAttribute("data-estado", "verificado");
    expect(sello).toHaveTextContent("Verificado");
  });

  it("parcial n/m y el motivo va al tooltip, no a la vista", () => {
    render(
      <SelloCalidad
        calidad={{ estado: "parcial", cubiertos: 3, total: 5, motivo: "2 unidades sin costo" }}
        tecnico="metric_key: inventory_capital@1.0"
      />,
    );
    expect(screen.getByTestId("dcc-sello")).toHaveTextContent("Parcial 3/5");
    const tooltip = screen.getByTestId("dcc-tooltip");
    expect(tooltip).toHaveAttribute("title", "2 unidades sin costo · metric_key: inventory_capital@1.0");
  });

  it("bloqueado por entitlement lleva el reason_code solo en el tooltip", () => {
    render(<SelloCalidad calidad={{ estado: "bloqueado", reasonCode: "UPGRADE_REQUIRED" }} />);
    expect(screen.getByTestId("dcc-sello")).toHaveTextContent("Bloqueado por tu plan");
    expect(screen.getByTestId("dcc-sello")).not.toHaveTextContent("UPGRADE_REQUIRED");
    expect(screen.getByTestId("dcc-tooltip")).toHaveAttribute("title", "reason_code: UPGRADE_REQUIRED");
  });

  it("no disponible sin detalle no crea tooltip vacio", () => {
    render(<SelloCalidad calidad={{ estado: "no_disponible", motivo: null }} />);
    expect(screen.getByTestId("dcc-sello")).toHaveTextContent("Aún no disponible");
    expect(screen.queryByTestId("dcc-tooltip")).toBeNull();
  });
});

describe("DccThemeRoot", () => {
  it("fija el tema y sus variables en su propio contenedor", () => {
    const { container } = render(<DccThemeRoot theme="dark">x</DccThemeRoot>);
    const raiz = container.firstChild as HTMLElement;
    expect(raiz).toHaveAttribute("data-dcc-theme", "dark");
    expect(raiz.style.getPropertyValue("--dcc-canvas")).toBe("#0B1220");
  });

  it("el tema por defecto es el claro", () => {
    const { container } = render(<DccThemeRoot>x</DccThemeRoot>);
    expect(container.firstChild).toHaveAttribute("data-dcc-theme", "light");
  });
});

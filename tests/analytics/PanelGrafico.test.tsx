import { render, screen, within } from "@testing-library/react";
import { PanelGrafico } from "@/components/analytics/kit";
import { META_OK } from "./fixtures/graficos.fixture";

const tabla = { columnas: ["Dia", "Valor"], filas: [["1 nov 2026", "10"], ["2 nov 2026", "14"]] };

describe("PanelGrafico", () => {
  it("ok: titulo, grafico, fuente y fecha bajo el grafico, y tabla alternativa", () => {
    render(
      <PanelGrafico meta={META_OK} estado="ok" tabla={tabla}>
        <svg data-testid="grafico" />
      </PanelGrafico>
    );
    expect(screen.getByRole("figure", { name: /grafico de prueba/i })).toBeInTheDocument();
    expect(screen.getByTestId("grafico")).toBeInTheDocument();
    expect(screen.getByText(/Fuente: PROTOTIPO · fixture de pruebas/)).toBeInTheDocument();
    expect(screen.getByText(/Dato al 10 nov 2026/)).toBeInTheDocument();
    const detalle = screen.getByText(/ver tabla de datos/i).closest("details") as HTMLElement;
    expect(within(detalle).getByRole("table")).toBeInTheDocument();
    expect(within(detalle).getAllByRole("row")).toHaveLength(3);
  });
  it.each(["vacio", "error", "cargando", "datos_insuficientes", "pendiente_integracion"] as const)("estado %s: usa EstadoAnalitica y no pinta el grafico", (estado) => {
    render(
      <PanelGrafico meta={META_OK} estado={estado} tabla={tabla}>
        <svg data-testid="grafico" />
      </PanelGrafico>
    );
    expect(screen.queryByTestId("grafico")).not.toBeInTheDocument();
    expect(document.querySelector(`[data-estado="${estado}"]`)).not.toBeNull();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("error: reintentar llama al callback", () => {
    const onReintentar = jest.fn();
    render(
      <PanelGrafico meta={META_OK} estado="error" onReintentar={onReintentar}>
        <svg />
      </PanelGrafico>
    );
    screen.getByRole("button", { name: /reintentar/i }).click();
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
  it("pendiente de integracion no muestra fuente ni fecha inventadas", () => {
    render(
      <PanelGrafico meta={{ ...META_OK, fuente: null }} estado="pendiente_integracion">
        <svg />
      </PanelGrafico>
    );
    expect(screen.queryByText(/Fuente:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dato al/)).not.toBeInTheDocument();
  });
  it("la descripcion del meta se usa como texto accesible del grafico", () => {
    render(
      <PanelGrafico meta={{ ...META_OK, descripcion: "Leads por dia" }} estado="ok">
        <svg />
      </PanelGrafico>
    );
    expect(screen.getByText("Leads por dia")).toBeInTheDocument();
  });
});

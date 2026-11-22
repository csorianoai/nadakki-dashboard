import { render, screen } from "@testing-library/react";
import { SerieTemporal } from "@/components/analytics/kit";
import { META_OK, SERIE_ACTUAL, SERIE_ANTERIOR } from "./fixtures/graficos.fixture";

describe("SerieTemporal", () => {
  it("dibuja la serie actual como img accesible con resumen y sin NaN en el SVG", () => {
    const { container } = render(<SerieTemporal meta={META_OK} datos={{ actual: SERIE_ACTUAL }} unidad="numero" />);
    const img = screen.getByRole("img", { name: /serie temporal/i });
    expect(img.getAttribute("aria-label")).toMatch(/5 puntos/);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(container.querySelectorAll("path[data-serie='actual']")).toHaveLength(1);
  });
  it("superpone el periodo anterior de forma distinguible sin depender del color (trazo discontinuo + leyenda de texto)", () => {
    const { container } = render(<SerieTemporal meta={META_OK} datos={{ actual: SERIE_ACTUAL, anterior: SERIE_ANTERIOR }} unidad="numero" />);
    const ant = container.querySelector("path[data-serie='anterior']") as SVGPathElement;
    expect(ant).not.toBeNull();
    expect(ant.getAttribute("stroke-dasharray")).toBeTruthy();
    expect(screen.getByText("Periodo anterior")).toBeInTheDocument();
    expect(screen.getByText("Periodo actual")).toBeInTheDocument();
  });
  it("un solo punto: marca el punto, no dibuja linea y avisa que no hay tendencia", () => {
    const { container } = render(<SerieTemporal meta={META_OK} datos={{ actual: [{ x: "2026-11-01", y: 7 }] }} unidad="numero" />);
    expect(container.querySelectorAll("circle[data-punto]")).toHaveLength(1);
    expect(container.querySelector("path[data-serie='actual']")).toBeNull();
    expect(screen.getByText(/un solo punto/i)).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it("valores negativos: la escala incluye el cero y no hay NaN", () => {
    const { container } = render(
      <SerieTemporal meta={META_OK} datos={{ actual: [{ x: "a", y: -4 }, { x: "b", y: 3 }, { x: "c", y: -1 }] }} unidad="numero" />
    );
    expect(container.querySelector("line[data-cero]")).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it("huecos (y nulo) no se pintan como cero", () => {
    const { container } = render(
      <SerieTemporal meta={META_OK} datos={{ actual: [{ x: "a", y: 1 }, { x: "b", y: null }, { x: "c", y: 3 }, { x: "d", y: 4 }] }} unidad="numero" />
    );
    expect(container.querySelectorAll("circle[data-punto]")).toHaveLength(3);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it("tabla alternativa con una fila por punto y columna del periodo anterior", () => {
    render(<SerieTemporal meta={META_OK} datos={{ actual: SERIE_ACTUAL, anterior: SERIE_ANTERIOR }} unidad="numero" />);
    expect(screen.getAllByRole("row")).toHaveLength(6);
    expect(screen.getByRole("columnheader", { name: /periodo anterior/i })).toBeInTheDocument();
  });
  it("sin datos => vacio; menos de 1 punto valido => vacio; fuente nula => pendiente", () => {
    const a = render(<SerieTemporal meta={META_OK} datos={{ actual: [] }} unidad="numero" />);
    expect(a.container.querySelector('[data-estado="vacio"]')).not.toBeNull();
    a.unmount();
    const b = render(<SerieTemporal meta={META_OK} datos={{ actual: [{ x: "a", y: null }] }} unidad="numero" />);
    expect(b.container.querySelector('[data-estado="vacio"]')).not.toBeNull();
    b.unmount();
    const c = render(<SerieTemporal meta={{ ...META_OK, fuente: null }} datos={{ actual: SERIE_ACTUAL }} unidad="numero" />);
    expect(c.container.querySelector('[data-estado="pendiente_integracion"]')).not.toBeNull();
  });
  it.each(["cargando", "error", "datos_insuficientes", "pendiente_integracion", "vacio"] as const)("respeta el estado declarado %s", (estado) => {
    const { container } = render(<SerieTemporal meta={{ ...META_OK, estado }} datos={{ actual: SERIE_ACTUAL }} unidad="numero" />);
    expect(container.querySelector(`[data-estado="${estado}"]`)).not.toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });
  it("formatea el eje con la unidad (porcentaje)", () => {
    render(<SerieTemporal meta={META_OK} datos={{ actual: [{ x: "a", y: 1.5 }, { x: "b", y: 2.5 }] }} unidad="porcentaje" />);
    expect(screen.getAllByText(/%/).length).toBeGreaterThan(0);
  });
});

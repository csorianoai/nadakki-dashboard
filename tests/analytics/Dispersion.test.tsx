import { fireEvent, render, screen } from "@testing-library/react";
import { Dispersion } from "@/components/analytics/kit";
import { META_OK, PUNTOS } from "./fixtures/graficos.fixture";

const ejes = { ejeX: { etiqueta: "Impresiones", unidad: "numero" as const }, ejeY: { etiqueta: "CTR", unidad: "porcentaje" as const } };

describe("Dispersion", () => {
  it("un punto por dato, con ejes rotulados con etiqueta y unidad", () => {
    const { container } = render(<Dispersion meta={META_OK} puntos={PUNTOS} {...ejes} />);
    expect(container.querySelectorAll("circle[data-punto]")).toHaveLength(3);
    expect(screen.getAllByText(/Impresiones/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CTR/).length).toBeGreaterThan(0);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it("cada punto es focusable y tiene nombre accesible con x e y", () => {
    const { container } = render(<Dispersion meta={META_OK} puntos={PUNTOS} {...ejes} />);
    const p = container.querySelector("circle[data-punto]") as SVGCircleElement;
    expect(p.getAttribute("tabindex")).toBe("0");
    expect(p.getAttribute("aria-label")).toMatch(/Campaña A.*Impresiones.*CTR/);
  });
  it("tooltip accesible: foco muestra el detalle en una region viva y blur lo quita", () => {
    const { container } = render(<Dispersion meta={META_OK} puntos={PUNTOS} {...ejes} />);
    const p = container.querySelectorAll("circle[data-punto]")[1];
    fireEvent.focus(p);
    const region = screen.getByRole("status", { name: /detalle del punto/i });
    expect(region.textContent).toMatch(/Campaña B/);
    fireEvent.blur(p);
    expect(region.textContent).not.toMatch(/Campaña B/);
  });
  it("puntos con valor nulo o no finito se omiten y se informa", () => {
    const { container } = render(
      <Dispersion meta={META_OK} puntos={[...PUNTOS, { id: "x", etiqueta: "Sin dato", x: null, y: 1 }, { id: "y", etiqueta: "NaN", x: Number.NaN, y: 1 }]} {...ejes} />
    );
    expect(container.querySelectorAll("circle[data-punto]")).toHaveLength(3);
    expect(screen.getByText(/2 puntos omitidos/i)).toBeInTheDocument();
  });
  it("un solo punto o ejes planos no producen NaN", () => {
    const { container } = render(<Dispersion meta={META_OK} puntos={[{ id: "a", etiqueta: "A", x: 5, y: 5 }]} {...ejes} />);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(container.querySelectorAll("circle[data-punto]")).toHaveLength(1);
  });
  it("valores negativos en un eje: no hay NaN", () => {
    const { container } = render(
      <Dispersion meta={META_OK} puntos={[{ id: "a", etiqueta: "A", x: -5, y: 2 }, { id: "b", etiqueta: "B", x: 10, y: -1 }]} {...ejes} />
    );
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it("tabla alternativa con x e y", () => {
    render(<Dispersion meta={META_OK} puntos={PUNTOS} {...ejes} />);
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });
  it("sin puntos => vacio; fuente nula => pendiente; estado declarado cargando", () => {
    const a = render(<Dispersion meta={META_OK} puntos={[]} {...ejes} />);
    expect(a.container.querySelector('[data-estado="vacio"]')).not.toBeNull();
    a.unmount();
    const b = render(<Dispersion meta={{ ...META_OK, fuente: null }} puntos={PUNTOS} {...ejes} />);
    expect(b.container.querySelector('[data-estado="pendiente_integracion"]')).not.toBeNull();
    b.unmount();
    const c = render(<Dispersion meta={{ ...META_OK, estado: "cargando" }} puntos={PUNTOS} {...ejes} />);
    expect(c.container.querySelector('[data-estado="cargando"]')).not.toBeNull();
  });
});

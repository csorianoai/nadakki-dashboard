import { fireEvent, render, screen, within } from "@testing-library/react";
import { Donut } from "@/components/analytics/kit";
import { CATEGORIAS, META_OK } from "./fixtures/graficos.fixture";

describe("Donut", () => {
  it("agrupa en 'Otros' por encima del maximo y la leyenda trae etiqueta, valor y porcentaje en texto", () => {
    render(<Donut meta={META_OK} datos={CATEGORIAS} maxCategorias={4} unidad="numero" />);
    const leyenda = screen.getByRole("list", { name: /leyenda/i });
    const items = within(leyenda).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items[4].textContent).toMatch(/Otros/);
    expect(items[0].textContent).toMatch(/Google Ads/);
    expect(items[0].textContent).toMatch(/40/);
    expect(items[0].textContent).toMatch(/%/);
  });
  it("los porcentajes de la leyenda suman 100 (con tolerancia de redondeo)", () => {
    render(<Donut meta={META_OK} datos={CATEGORIAS} maxCategorias={4} unidad="numero" />);
    const total = within(screen.getByRole("list", { name: /leyenda/i }))
      .getAllByRole("listitem")
      .map((li) => parseFloat((li.lastElementChild?.textContent ?? "0").replace(/[^\d,.]/g, "").replace(",", ".")))
      .reduce((a, b) => a + b, 0);
    expect(Math.abs(total - 100)).toBeLessThan(0.6);
  });
  it("la leyenda es operable con teclado: cada item es focusable y resalta su segmento", () => {
    const { container } = render(<Donut meta={META_OK} datos={CATEGORIAS.slice(0, 3)} unidad="numero" />);
    const items = within(screen.getByRole("list", { name: /leyenda/i })).getAllByRole("listitem");
    items.forEach((i) => expect(i).toHaveAttribute("tabindex", "0"));
    fireEvent.focus(items[1]);
    expect(container.querySelector("[data-segmento][data-activo='true']")).not.toBeNull();
    fireEvent.blur(items[1]);
    expect(container.querySelector("[data-segmento][data-activo='true']")).toBeNull();
  });
  it("sin depender solo del color: cada segmento tiene titulo y el item de leyenda un indice numerico", () => {
    const { container } = render(<Donut meta={META_OK} datos={CATEGORIAS.slice(0, 3)} unidad="numero" />);
    expect(container.querySelectorAll("[data-segmento] title")).toHaveLength(3);
    const items = within(screen.getByRole("list", { name: /leyenda/i })).getAllByRole("listitem");
    expect(items[0].textContent).toMatch(/^1/);
  });
  it("una sola categoria: circulo completo sin NaN", () => {
    const { container } = render(<Donut meta={META_OK} datos={[{ etiqueta: "Unica", valor: 9 }]} unidad="numero" />);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(container.querySelectorAll("[data-segmento]")).toHaveLength(1);
  });
  it("negativos y cero se descartan y se avisa; si no queda nada => datos insuficientes", () => {
    const a = render(<Donut meta={META_OK} datos={[{ etiqueta: "A", valor: 5 }, { etiqueta: "B", valor: -3 }]} unidad="numero" />);
    expect(screen.getByText(/1 categoría descartada/i)).toBeInTheDocument();
    a.unmount();
    const b = render(<Donut meta={META_OK} datos={[{ etiqueta: "A", valor: 0 }, { etiqueta: "B", valor: -3 }]} unidad="numero" />);
    expect(b.container.querySelector('[data-estado="datos_insuficientes"]')).not.toBeNull();
    expect(b.container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it("sin datos => vacio; fuente nula => pendiente; estado declarado error", () => {
    const a = render(<Donut meta={META_OK} datos={[]} unidad="numero" />);
    expect(a.container.querySelector('[data-estado="vacio"]')).not.toBeNull();
    a.unmount();
    const b = render(<Donut meta={{ ...META_OK, fuente: null }} datos={CATEGORIAS} unidad="numero" />);
    expect(b.container.querySelector('[data-estado="pendiente_integracion"]')).not.toBeNull();
    b.unmount();
    const c = render(<Donut meta={{ ...META_OK, estado: "error" }} datos={CATEGORIAS} unidad="numero" />);
    expect(c.container.querySelector('[data-estado="error"]')).not.toBeNull();
  });
});

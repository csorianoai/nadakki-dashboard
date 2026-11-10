import { render, screen, within } from "@testing-library/react";
import { Barras } from "@/components/analytics/kit";
import { CATEGORIAS, META_OK } from "./fixtures/graficos.fixture";

describe("Barras", () => {
  it("horizontal: ordena de mayor a menor y muestra etiqueta y valor en texto", () => {
    render(<Barras meta={META_OK} datos={[{ etiqueta: "B", valor: 5 }, { etiqueta: "A", valor: 20 }, { etiqueta: "C", valor: 10 }]} unidad="numero" />);
    const lista = screen.getByRole("list", { name: /barras/i });
    const items = within(lista).getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual([expect.stringContaining("A"), expect.stringContaining("C"), expect.stringContaining("B")]);
    expect(items[0].textContent).toMatch(/20/);
  });
  it("las barras tienen ancho proporcional y acotado a 0-100 %", () => {
    const { container } = render(<Barras meta={META_OK} datos={[{ etiqueta: "A", valor: 50 }, { etiqueta: "B", valor: 25 }]} unidad="numero" />);
    const anchos = Array.from(container.querySelectorAll<HTMLElement>("[data-barra]")).map((b) => parseFloat(b.style.width));
    expect(anchos).toEqual([100, 50]);
  });
  it("valores negativos: barra divergente con cero marcado y sin NaN", () => {
    const { container } = render(<Barras meta={META_OK} datos={[{ etiqueta: "A", valor: 10 }, { etiqueta: "B", valor: -5 }]} unidad="numero" />);
    expect(container.querySelector("[data-barra][data-signo='negativo']")).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it("todos en cero no divide por cero", () => {
    const { container } = render(<Barras meta={META_OK} datos={[{ etiqueta: "A", valor: 0 }, { etiqueta: "B", valor: 0 }]} unidad="numero" />);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it("vertical: SVG con img accesible, sin NaN", () => {
    const { container } = render(<Barras meta={META_OK} datos={CATEGORIAS.slice(0, 4)} unidad="numero" orientacion="vertical" />);
    expect(screen.getByRole("img", { name: /barras/i })).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it("limita las barras visibles y lo informa; la tabla trae todas", () => {
    const muchas = Array.from({ length: 15 }, (_, i) => ({ etiqueta: `c${i}`, valor: 100 - i }));
    render(<Barras meta={META_OK} datos={muchas} unidad="numero" maximo={10} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    expect(screen.getByText(/mostrando 10 de 15/i)).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(16);
  });
  it("sin datos => vacio; todos nulos => datos insuficientes; fuente nula => pendiente", () => {
    const a = render(<Barras meta={META_OK} datos={[]} unidad="numero" />);
    expect(a.container.querySelector('[data-estado="vacio"]')).not.toBeNull();
    a.unmount();
    const b = render(<Barras meta={META_OK} datos={[{ etiqueta: "A", valor: null }]} unidad="numero" />);
    expect(b.container.querySelector('[data-estado="datos_insuficientes"]')).not.toBeNull();
    b.unmount();
    const c = render(<Barras meta={{ ...META_OK, fuente: null }} datos={CATEGORIAS} unidad="numero" />);
    expect(c.container.querySelector('[data-estado="pendiente_integracion"]')).not.toBeNull();
  });
  it.each(["cargando", "error"] as const)("respeta el estado declarado %s", (estado) => {
    const { container } = render(<Barras meta={{ ...META_OK, estado }} datos={CATEGORIAS} unidad="numero" />);
    expect(container.querySelector(`[data-estado="${estado}"]`)).not.toBeNull();
    expect(screen.queryByRole("list", { name: /barras/i })).not.toBeInTheDocument();
  });
});

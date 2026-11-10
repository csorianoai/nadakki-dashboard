import { render, screen, within } from "@testing-library/react";
import { Embudo } from "@/components/analytics/kit";
import { ETAPAS, META_OK } from "./fixtures/graficos.fixture";

describe("Embudo", () => {
  it("muestra cada etapa con valor, conversion desde la etapa anterior y conversion total", () => {
    render(<Embudo meta={META_OK} etapas={ETAPAS} />);
    const lista = screen.getByRole("list", { name: /embudo/i });
    const items = within(lista).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items[0].textContent).toMatch(/Contacto/);
    expect(items[1].textContent).toMatch(/40,0 %/);
    expect(screen.getByText(/conversión total/i).parentElement?.textContent).toMatch(/2,0 %/);
  });
  it("las barras se escalan contra la primera etapa y quedan entre 0 y 100 %", () => {
    const { container } = render(<Embudo meta={META_OK} etapas={ETAPAS} />);
    const anchos = Array.from(container.querySelectorAll<HTMLElement>("[data-barra]")).map((b) => parseFloat(b.style.width));
    expect(anchos[0]).toBe(100);
    expect(anchos.every((a) => a >= 0 && a <= 100)).toBe(true);
  });
  it("etapa previa en 0 => 'datos insuficientes' en texto, nunca NaN/Infinity", () => {
    const { container } = render(
      <Embudo meta={META_OK} etapas={[{ etiqueta: "A", valor: 0 }, { etiqueta: "B", valor: 5 }, { etiqueta: "C", valor: 2 }]} />
    );
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(screen.getAllByText(/datos insuficientes/i).length).toBeGreaterThan(0);
  });
  it("una etapa mayor que la anterior se marca para revisar", () => {
    render(<Embudo meta={META_OK} etapas={[{ etiqueta: "A", valor: 10 }, { etiqueta: "B", valor: 15 }]} />);
    expect(screen.getByText(/revisar definición de etapas/i)).toBeInTheDocument();
  });
  it("tabla alternativa con conversion", () => {
    render(<Embudo meta={META_OK} etapas={ETAPAS} />);
    expect(screen.getByRole("columnheader", { name: /conversión desde la etapa anterior/i })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(6);
  });
  it("en movil las etapas se apilan (una columna, sin ancho fijo)", () => {
    const { container } = render(<Embudo meta={META_OK} etapas={ETAPAS} />);
    const lista = container.querySelector("ol") as HTMLElement;
    expect(lista.className).toMatch(/flex-col|grid-cols-1/);
    expect(container.innerHTML).not.toMatch(/min-w-\[\d{3,}/);
  });
  it("sin etapas => vacio; una sola etapa => datos insuficientes; fuente nula => pendiente", () => {
    const a = render(<Embudo meta={META_OK} etapas={[]} />);
    expect(a.container.querySelector('[data-estado="vacio"]')).not.toBeNull();
    a.unmount();
    const b = render(<Embudo meta={META_OK} etapas={[{ etiqueta: "A", valor: 3 }]} />);
    expect(b.container.querySelector('[data-estado="datos_insuficientes"]')).not.toBeNull();
    b.unmount();
    const c = render(<Embudo meta={{ ...META_OK, fuente: null }} etapas={ETAPAS} />);
    expect(c.container.querySelector('[data-estado="pendiente_integracion"]')).not.toBeNull();
  });
  it.each(["cargando", "error"] as const)("respeta el estado declarado %s", (estado) => {
    const { container } = render(<Embudo meta={{ ...META_OK, estado }} etapas={ETAPAS} />);
    expect(container.querySelector(`[data-estado="${estado}"]`)).not.toBeNull();
  });
});

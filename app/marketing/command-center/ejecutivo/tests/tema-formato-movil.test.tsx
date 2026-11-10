/**
 * PROTOTIPO — tema oscuro por defecto (azul noche), formato por tenant y experiencia movil de la pantalla patron.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CommandCenterEjecutivo } from "../CommandCenterEjecutivo";
import { AHORA_DEMO, DATOS_DEMO } from "../demo/datos-demo";

function conMatchMedia(movil: boolean) {
  const mql = { matches: movil, media: "", addEventListener: () => {}, removeEventListener: () => {} };
  Object.defineProperty(window, "matchMedia", { writable: true, configurable: true, value: () => mql });
}
afterEach(() => Reflect.deleteProperty(window, "matchMedia"));

const montar = (extra: Partial<React.ComponentProps<typeof CommandCenterEjecutivo>> = {}) =>
  render(<CommandCenterEjecutivo datos={DATOS_DEMO} ahora={AHORA_DEMO} demo {...extra} />);

describe("tema", () => {
  it("por defecto es OSCURO (azul noche): data-theme='dark' en la raiz", () => {
    montar();
    expect(screen.getByTestId("command-center-ejecutivo")).toHaveAttribute("data-theme", "dark");
  });

  it("respeta el tema claro cuando se pide", () => {
    montar({ tema: "light" });
    expect(screen.getByTestId("command-center-ejecutivo")).toHaveAttribute("data-theme", "light");
  });

  it("la raiz usa los tokens del kit (kit-tema / kit-fondo), sin colores fijos", () => {
    montar();
    const raiz = screen.getByTestId("command-center-ejecutivo");
    expect(raiz.className).toMatch(/kit-tema/);
    expect(raiz.className).toMatch(/kit-fondo/);
  });

  it("boton de tema: aria-pressed refleja el oscuro y alterna a claro y de vuelta", () => {
    montar();
    const b = screen.getByRole("button", { name: /Tema oscuro/i });
    expect(b).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(b);
    expect(screen.getByTestId("command-center-ejecutivo")).toHaveAttribute("data-theme", "light");
    expect(b).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(b);
    expect(screen.getByTestId("command-center-ejecutivo")).toHaveAttribute("data-theme", "dark");
  });
});

describe("formato por tenant (nada fijo)", () => {
  it("sin formato del tenant: es-US / USD ($612.40, 4,820)", () => {
    const { container } = montar();
    expect(container.textContent).toContain("$612.40");
    expect(container.textContent).toContain("4,820");
  });

  it("tenant es-AR / ARS: separadores argentinos en las cifras sin moneda propia (4.820)", () => {
    const { container } = montar({ formato: { locale: "es-AR", moneda: "ARS" } });
    expect(container.textContent).toContain("4.820");
    expect(container.textContent).not.toContain("4,820");
  });

  it("la moneda propia de la cifra manda sobre la del tenant (el CPA demo es USD)", () => {
    const { container } = montar({ formato: { locale: "es-AR", moneda: "ARS" } });
    expect(container.textContent).toMatch(/US\$\s?47,11|\$\s?47,11/);
    expect(container.textContent).not.toMatch(/ARS/);
  });

  it("formato invalido cae al por defecto sin lanzar", () => {
    const { container } = montar({ formato: { locale: "xx-INVALIDO", moneda: "no" } });
    expect(container.textContent).toContain("4,820");
  });
});

describe("experiencia movil (390 y 320 px): lo esencial primero, el detalle se expande", () => {
  it("el CPA va primero, antes que inversion y leads", () => {
    conMatchMedia(true);
    montar();
    const cpa = screen.getByTestId("kpi-cpa");
    const inv = screen.getByRole("group", { name: "Inversión" });
    const leads = screen.getByRole("group", { name: "Leads atribuidos" });
    expect(cpa.compareDocumentPosition(inv) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(inv.compareDocumentPosition(leads) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("tres pestañas (Resumen, Campañas, Calidad) como navegacion principal", () => {
    conMatchMedia(true);
    montar();
    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Resumen", "Campañas", "Calidad"]);
  });

  it("el estado del semaforo y el aviso de CRM estan visibles sin expandir nada", () => {
    conMatchMedia(true);
    montar();
    expect(screen.getByTestId("cpa-lectura")).toBeVisible();
    expect(screen.getByTestId("cpa-rentabilidad")).toBeVisible();
    expect(screen.getByTestId("semaforo-barra")).toBeVisible();
    expect(screen.getByTestId("resumen-supuestos")).toBeVisible();
  });

  it("indicadores secundarios y detalle de supuestos van en bloques expandibles (<details>) cerrados por defecto", () => {
    conMatchMedia(true);
    montar();
    const sec = screen.getByTestId("detalle-secundarios") as HTMLDetailsElement;
    const sup = screen.getByTestId("detalle-supuestos") as HTMLDetailsElement;
    expect(sec.tagName).toBe("DETAILS");
    expect(sup.tagName).toBe("DETAILS");
    expect(sec.open).toBe(false);
    expect(sup.open).toBe(false);
    expect(within(sec).getByText(/Indicadores secundarios/)).toBeInTheDocument();
    fireEvent.click(within(sec).getByText(/Indicadores secundarios/));
    expect(sec.open).toBe(true);
  });

  it("en escritorio los secundarios y los supuestos estan siempre a la vista (sin <details>)", () => {
    conMatchMedia(false);
    montar();
    expect(screen.queryByTestId("detalle-secundarios")).toBeNull();
    expect(screen.queryByTestId("detalle-supuestos")).toBeNull();
    expect(screen.getByRole("region", { name: "Indicadores secundarios" })).toBeVisible();
    expect(screen.getByTestId("semaforo")).toBeVisible();
  });

  it("las otras secciones y la comparacion no estorban arriba en movil: van en un bloque expandible ('Más opciones')", () => {
    conMatchMedia(true);
    montar();
    const otras = screen.getByTestId("detalle-secciones") as HTMLDetailsElement;
    expect(otras.open).toBe(false);
    expect(within(otras).getAllByRole("button", { name: /Campaign Intelligence|Conversiones e ingresos|Aprobaciones|Modelo económico/ }).length).toBe(4);
    expect(within(otras).getByRole("button", { name: /Comparar: periodo anterior/ })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("jerarquia ejecutiva (estructura)", () => {
  it("en escritorio el orden del DOM es: tres KPI, secundarios y despues el grafico principal junto al semaforo", () => {
    conMatchMedia(false);
    montar();
    const inv = screen.getByRole("group", { name: "Inversión" });
    const cpa = screen.getByTestId("kpi-cpa");
    const leads = screen.getByRole("group", { name: "Leads atribuidos" });
    const grafico = screen.getAllByText(/Inversión diaria/)[0];
    const orden = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(orden(inv, cpa)).toBe(true);
    expect(orden(cpa, leads)).toBe(true);
    expect(orden(leads, grafico)).toBe(true);
    expect(orden(grafico, screen.getByRole("table", { name: "Campañas" }))).toBe(true);
  });
});

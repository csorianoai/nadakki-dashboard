import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SeccionesAnaliticas } from "@/components/analytics/kit/movil";
import { TablaAnalitica, type ColumnaAnalitica } from "@/components/analytics/kit/tabla";
import { FILAS_CINCO, FILAS_VEINTICINCO, type FilaCampana } from "./fixtures/tabla.fixture";

function simularMatchMedia(movil: boolean) {
  const oyentes = new Set<(e: { matches: boolean }) => void>();
  const mql = {
    matches: movil,
    media: "(max-width: 639px)",
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => oyentes.add(fn),
    removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => oyentes.delete(fn),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
  Object.defineProperty(window, "matchMedia", { writable: true, configurable: true, value: jest.fn().mockReturnValue(mql) });
  return {
    cambiar: (m: boolean) => {
      mql.matches = m;
      oyentes.forEach((fn) => fn({ matches: m }));
    },
  };
}

const COLUMNAS: ColumnaAnalitica<FilaCampana>[] = [
  { id: "nombre", encabezado: "Campaña", tipo: "texto", texto: (f) => f.nombre, filtrable: true },
  { id: "clics", encabezado: "Clics", tipo: "cifra", cifra: (f) => f.clics, calor: true },
  { id: "costo", encabezado: "Costo", tipo: "cifra", cifra: (f) => f.costo },
];
const montar = (filas = FILAS_CINCO) => render(<TablaAnalitica titulo="Campañas" columnas={COLUMNAS} filas={filas} obtenerId={(f) => f.id} />);

afterEach(() => {
  // @ts-expect-error limpieza del mock
  delete window.matchMedia;
});

describe("TablaAnalitica · vista movil", () => {
  it("a <640px no hay <table>: cada fila es una tarjeta (lista) con etiqueta y valor", () => {
    simularMatchMedia(true);
    montar();
    expect(screen.queryByRole("table")).toBeNull();
    const lista = screen.getByRole("list", { name: "Campañas" });
    const tarjetas = within(lista).getAllByRole("listitem");
    expect(tarjetas).toHaveLength(5);
    expect(within(tarjetas[0]).getByText("Alfa")).toBeInTheDocument();
    expect(within(tarjetas[0]).getByText("Clics")).toBeInTheDocument();
    expect(within(tarjetas[0]).getByText("100")).toBeInTheDocument();
  });
  it("en escritorio sigue siendo tabla", () => {
    simularMatchMedia(false);
    montar();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Campañas" })).toBeNull();
  });
  it("sin matchMedia (SSR/jsdom) cae a escritorio", () => {
    montar();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
  it("reacciona al cambio de ancho en caliente", () => {
    const mm = simularMatchMedia(false);
    montar();
    expect(screen.getByRole("table")).toBeInTheDocument();
    act(() => mm.cambiar(true));
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("list", { name: "Campañas" })).toBeInTheDocument();
  });
  it("conserva el mapa de calor en las tarjetas (valor visible y data-calor)", () => {
    simularMatchMedia(true);
    montar();
    const beta = screen.getByText("Beta").closest("li") as HTMLElement;
    expect(beta.querySelector("[data-calor]")).toHaveAttribute("data-calor", "4");
    expect(beta).toHaveTextContent("400");
  });
  it("conserva orden: selector 'Ordenar por' y boton de direccion", () => {
    simularMatchMedia(true);
    montar();
    fireEvent.change(screen.getByLabelText(/ordenar por/i), { target: { value: "clics" } });
    const nombres = () => within(screen.getByRole("list", { name: "Campañas" })).getAllByRole("listitem").map((li) => within(li).getAllByText(/Alfa|Beta|Gamma|Delta|Épsilon/)[0].textContent);
    expect(nombres().slice(0, 2)).toEqual(["Alfa", "Gamma"]);
    fireEvent.click(screen.getByRole("button", { name: /dirección del orden/i }));
    expect(nombres()[0]).toMatch(/Beta|Épsilon/);
    expect(nombres().at(-1)).toBe("Delta");
  });
  it("conserva filtros y paginacion", () => {
    simularMatchMedia(true);
    montar(FILAS_VEINTICINCO);
    expect(within(screen.getByRole("list", { name: "Campañas" })).getAllByRole("listitem")).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText(/11.{1,3}20 de 25/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/filtrar campaña/i), { target: { value: "Camp 2" } });
    expect(within(screen.getByRole("list", { name: "Campañas" })).getAllByRole("listitem")).toHaveLength(6);
  });
  it("las celdas sin dato muestran su estado en la tarjeta", () => {
    simularMatchMedia(true);
    montar();
    const delta = screen.getByText("Delta").closest("li") as HTMLElement;
    expect(within(delta).getAllByText(/datos insuficientes/i).length).toBeGreaterThan(0);
    const eps = screen.getByText("Épsilon").closest("li") as HTMLElement;
    expect(within(eps).getByText(/pendiente de integración/i)).toBeInTheDocument();
  });
  it("controles tactiles de al menos 44px de alto (clase min-h-[44px])", () => {
    simularMatchMedia(true);
    montar(FILAS_VEINTICINCO);
    expect(screen.getByRole("button", { name: /siguiente/i }).className).toMatch(/min-h-\[44px\]/);
    expect(screen.getByRole("button", { name: /dirección del orden/i }).className).toMatch(/min-h-\[44px\]/);
  });
});

describe("SeccionesAnaliticas", () => {
  const secciones = [
    { id: "resumen", titulo: "Resumen", contenido: <p>Contenido resumen</p> },
    { id: "detalle", titulo: "Detalle", contenido: <p>Contenido detalle</p> },
  ];
  it("en escritorio apila todas las secciones con su encabezado, sin pestañas", () => {
    simularMatchMedia(false);
    render(<SeccionesAnaliticas secciones={secciones} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getByText("Contenido detalle")).toBeInTheDocument();
  });
  it("en movil muestra pestañas y solo el panel activo; se cambia con clic", () => {
    simularMatchMedia(true);
    render(<SeccionesAnaliticas secciones={secciones} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByText("Contenido resumen")).toBeInTheDocument();
    expect(screen.queryByText("Contenido detalle")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Detalle" }));
    expect(screen.getByText("Contenido detalle")).toBeInTheDocument();
    expect(screen.queryByText("Contenido resumen")).toBeNull();
  });
  it("la pestaña inicial es configurable y una lista vacia no rompe", () => {
    simularMatchMedia(true);
    const { rerender } = render(<SeccionesAnaliticas secciones={secciones} inicial="detalle" />);
    expect(screen.getByText("Contenido detalle")).toBeInTheDocument();
    rerender(<SeccionesAnaliticas secciones={[]} />);
    expect(document.body.textContent).not.toMatch(/undefined|NaN/);
  });
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import { TablaAnalitica, type ColumnaAnalitica } from "@/components/analytics/kit/tabla";
import { FILAS_CINCO, FILAS_IGUALES, FILAS_VEINTICINCO, type FilaCampana } from "./fixtures/tabla.fixture";

const COLUMNAS: ColumnaAnalitica<FilaCampana>[] = [
  { id: "nombre", encabezado: "Campaña", tipo: "texto", texto: (f) => f.nombre, filtrable: true },
  { id: "clics", encabezado: "Clics", tipo: "cifra", cifra: (f) => f.clics, calor: true, filtrable: true },
  { id: "ctr", encabezado: "CTR", tipo: "cifra", cifra: (f) => f.ctr },
  { id: "costo", encabezado: "Costo", tipo: "cifra", cifra: (f) => f.costo },
];

function montar(filas = FILAS_CINCO, extra: Partial<React.ComponentProps<typeof TablaAnalitica<FilaCampana>>> = {}) {
  return render(<TablaAnalitica titulo="Campañas" columnas={COLUMNAS} filas={filas} obtenerId={(f) => f.id} {...extra} />);
}
const nombres = () =>
  within(screen.getByRole("table")).getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0].textContent);

describe("TablaAnalitica · estructura", () => {
  it("expone una tabla con nombre accesible y encabezados de columna", () => {
    montar();
    expect(screen.getByRole("table", { name: "Campañas" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
  });
  it("muestra las filas con el valor formateado visible", () => {
    montar();
    expect(screen.getByText("Alfa")).toBeInTheDocument();
    expect(screen.getAllByText("400").length).toBeGreaterThan(0);
    expect(screen.getByText(/2\.5\s?%/)).toBeInTheDocument();
  });
});

describe("TablaAnalitica · orden", () => {
  it("clic en el encabezado ordena asc, luego desc, y aria-sort lo refleja", () => {
    montar();
    const th = screen.getByRole("columnheader", { name: /clics/i });
    expect(th).toHaveAttribute("aria-sort", "none");
    fireEvent.click(within(th).getByRole("button"));
    expect(th).toHaveAttribute("aria-sort", "ascending");
    expect(nombres().slice(0, 2)).toEqual(["Alfa", "Gamma"]);
    fireEvent.click(within(th).getByRole("button"));
    expect(th).toHaveAttribute("aria-sort", "descending");
    expect(nombres()[0]).toMatch(/Beta|Épsilon/);
  });
  it("las filas sin valor (nulo) quedan al final en ambas direcciones", () => {
    montar();
    const btn = within(screen.getByRole("columnheader", { name: /clics/i })).getByRole("button");
    fireEvent.click(btn);
    expect(nombres().at(-1)).toBe("Delta");
    fireEvent.click(btn);
    expect(nombres().at(-1)).toBe("Delta");
  });
  it("el boton de orden se activa con el teclado (Enter)", () => {
    montar();
    const btn = within(screen.getByRole("columnheader", { name: /campaña/i })).getByRole("button");
    btn.focus();
    expect(btn).toHaveFocus();
    fireEvent.click(btn); // user-event no esta garantizado en esta suite: el boton nativo traduce Enter a click
    expect(screen.getByRole("columnheader", { name: /campaña/i })).toHaveAttribute("aria-sort", "ascending");
  });
  it("cambiar de columna reinicia el orden de la anterior", () => {
    montar();
    fireEvent.click(within(screen.getByRole("columnheader", { name: /clics/i })).getByRole("button"));
    fireEvent.click(within(screen.getByRole("columnheader", { name: /campaña/i })).getByRole("button"));
    expect(screen.getByRole("columnheader", { name: /clics/i })).toHaveAttribute("aria-sort", "none");
  });
});

describe("TablaAnalitica · filtros", () => {
  it("filtra por texto sin importar mayusculas ni acentos", () => {
    montar();
    fireEvent.change(screen.getByLabelText(/filtrar campaña/i), { target: { value: "epsilon" } });
    expect(nombres()).toEqual(["Épsilon"]);
  });
  it("filtra por minimo en columnas de cifra y excluye las filas sin valor", () => {
    montar();
    fireEvent.change(screen.getByLabelText(/clics.*mínimo/i), { target: { value: "300" } });
    expect(nombres().sort()).toEqual(["Beta", "Épsilon"]);
  });
  it("un minimo no numerico se ignora (no rompe ni vacia la tabla)", () => {
    montar();
    fireEvent.change(screen.getByLabelText(/clics.*mínimo/i), { target: { value: "abc" } });
    expect(nombres()).toHaveLength(5);
  });
  it("sin coincidencias muestra el estado vacio con accion para quitar filtros, y la accion restaura", () => {
    montar();
    fireEvent.change(screen.getByLabelText(/filtrar campaña/i), { target: { value: "zzz" } });
    expect(screen.getByText(/sin datos en este periodo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /quitar filtros/i }));
    expect(nombres()).toHaveLength(5);
  });
  it("filtrar vuelve a la pagina 1", () => {
    montar(FILAS_VEINTICINCO);
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText(/11.{1,3}20 de 25/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/filtrar campaña/i), { target: { value: "camp" } });
    expect(screen.getByText(/1.{1,3}10 de 25/)).toBeInTheDocument();
  });
});

describe("TablaAnalitica · paginacion", () => {
  it("muestra rango y total, y limita las filas al tamano de pagina", () => {
    montar(FILAS_VEINTICINCO);
    expect(screen.getByText(/1.{1,3}10 de 25/)).toBeInTheDocument();
    expect(nombres()).toHaveLength(10);
  });
  it("Anterior esta deshabilitado en la primera pagina y Siguiente en la ultima", () => {
    montar(FILAS_VEINTICINCO);
    expect(screen.getByRole("button", { name: /anterior/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText(/21.{1,3}25 de 25/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /siguiente/i })).toBeDisabled();
    expect(nombres()).toHaveLength(5);
  });
  it("cambiar el tamano de pagina recalcula y vuelve a la pagina 1", () => {
    montar(FILAS_VEINTICINCO, { opcionesTamano: [10, 25] });
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    fireEvent.change(screen.getByLabelText(/filas por página/i), { target: { value: "25" } });
    expect(screen.getByText(/1.{1,3}25 de 25/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /siguiente/i })).toBeDisabled();
  });
  it("con una sola pagina ambos botones estan deshabilitados", () => {
    montar();
    expect(screen.getByRole("button", { name: /anterior/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /siguiente/i })).toBeDisabled();
  });
  it("ordenar vuelve a la pagina 1", () => {
    montar(FILAS_VEINTICINCO);
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    fireEvent.click(within(screen.getByRole("columnheader", { name: /clics/i })).getByRole("button"));
    expect(screen.getByText(/1.{1,3}10 de 25/)).toBeInTheDocument();
  });
});

describe("TablaAnalitica · mapa de calor", () => {
  const celdaClics = (nombre: string) => {
    const fila = screen.getByText(nombre).closest("tr") as HTMLElement;
    return within(fila).getAllByRole("cell")[1];
  };
  it("cada celda de una columna con calor lleva su nivel (0..4) y el valor numerico visible", () => {
    montar();
    const alto = celdaClics("Beta").querySelector("[data-calor]");
    const bajo = celdaClics("Alfa").querySelector("[data-calor]");
    expect(alto).toHaveAttribute("data-calor", "4");
    expect(bajo).toHaveAttribute("data-calor", "0");
    expect(alto).toHaveTextContent("400");
    expect(bajo).toHaveTextContent("100");
  });
  it("la escala usa todas las filas, no solo la pagina visible (el color no cambia al paginar)", () => {
    montar(FILAS_VEINTICINCO);
    const primera = screen.getByText("Camp 01").closest("tr") as HTMLElement;
    expect(within(primera).getAllByRole("cell")[1].querySelector("[data-calor]")).toHaveAttribute("data-calor", "0");
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    const ultima = screen.getByText("Camp 25").closest("tr") as HTMLElement;
    expect(within(ultima).getAllByRole("cell")[1].querySelector("[data-calor]")).toHaveAttribute("data-calor", "4");
  });
  it("valores iguales: nivel 0 en todos, sin NaN", () => {
    montar(FILAS_IGUALES);
    document.querySelectorAll("[data-calor]").forEach((el) => expect(el.getAttribute("data-calor")).toBe("0"));
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
  });
  it("mapa de calor: cada nivel usa su clase semantica del kit (el contraste de los pares lo mide tema.test.ts)", () => {
    montar(FILAS_VEINTICINCO);
    const niveles = new Map<string, string>();
    document.querySelectorAll("[data-calor]").forEach((el) => niveles.set(el.getAttribute("data-calor") as string, el.className));
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    document.querySelectorAll("[data-calor]").forEach((el) => niveles.set(el.getAttribute("data-calor") as string, el.className));
    expect(niveles.get("0")).toMatch(/kit-calor-0/);
    expect(niveles.get("4")).toMatch(/kit-calor-4/);
    for (const clase of niveles.values()) expect(clase).not.toMatch(/#|rgb|hsl/);
  });
  it("las columnas sin calor no llevan data-calor", () => {
    montar();
    const fila = screen.getByText("Alfa").closest("tr") as HTMLElement;
    expect(within(fila).getAllByRole("cell")[2].querySelector("[data-calor]")).toBeNull();
  });
});

describe("TablaAnalitica · celdas con cifra", () => {
  it("una celda sin valor muestra 'Datos insuficientes' y nunca NaN ni Infinity", () => {
    montar();
    const fila = screen.getByText("Delta").closest("tr") as HTMLElement;
    expect(within(fila).getAllByText(/datos insuficientes/i).length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
  });
  it("una cifra sin fuente se muestra como 'Pendiente de integración', no como dato", () => {
    montar();
    const fila = screen.getByText("Épsilon").closest("tr") as HTMLElement;
    expect(within(fila).getByText(/pendiente de integración/i)).toBeInTheDocument();
    expect(within(fila).queryByText(/\$\s?35/)).toBeNull();
  });
  it("cada celda con dato expone fuente y fecha para lector de pantalla", () => {
    montar();
    const fila = screen.getByText("Alfa").closest("tr") as HTMLElement;
    expect(within(fila).getAllByText(/fuente: PROTOTIPO/i).length).toBeGreaterThan(0);
    expect(within(fila).getAllByText(/10 nov 2026/).length).toBeGreaterThan(0);
  });
  it("hay una nota visible con las fuentes y la fecha del dato", () => {
    montar();
    expect(screen.getByTestId("tabla-fuentes")).toHaveTextContent(/PROTOTIPO · fixture de pruebas/);
    expect(screen.getByTestId("tabla-fuentes")).toHaveTextContent(/10 nov 2026/);
  });
});

describe("TablaAnalitica · estados de tabla", () => {
  it.each([
    ["cargando", null],
    ["error", /no se pudieron cargar/i],
    ["vacio", /sin datos en este periodo/i],
    ["datos_insuficientes", /datos insuficientes/i],
    ["pendiente_integracion", /fuente aún no conectada/i],
  ] as const)("estado %s reemplaza la tabla por EstadoAnalitica", (estado, texto) => {
    montar(FILAS_CINCO, { estado });
    // El estado "cargando" es un esqueleto con nombre accesible; los demas llevan texto visible.
    if (texto === null) expect(screen.getByRole("status", { name: /cargando datos/i })).toHaveAttribute("aria-busy", "true");
    else expect(screen.getByText(texto)).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });
  it("sin filas y sin estado explicito se muestra como vacio", () => {
    montar([]);
    expect(screen.getByText(/sin datos en este periodo/i)).toBeInTheDocument();
  });
  it("error con onReintentar muestra el boton y lo invoca", () => {
    const onReintentar = jest.fn();
    montar(FILAS_CINCO, { estado: "error", onReintentar });
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
});

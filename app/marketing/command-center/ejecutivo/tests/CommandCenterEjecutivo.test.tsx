/**
 * PROTOTIPO — pruebas de la pantalla patron con los datos DEMO (solo tests importan ../demo).
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CommandCenterEjecutivo } from "../CommandCenterEjecutivo";
import { AHORA_DEMO, DATOS_DEMO } from "../demo/datos-demo";
import type { DatosCommandCenter } from "../tipos";

const montar = (extra: Partial<React.ComponentProps<typeof CommandCenterEjecutivo>> = {}) =>
  render(<CommandCenterEjecutivo datos={DATOS_DEMO} ahora={AHORA_DEMO} demo {...extra} />);

describe("Executive Command Center · contenido con datos DEMO", () => {
  it("marca la pantalla como DEMO de forma visible y accesible", () => {
    montar();
    const nota = screen.getByTestId("banner-demo");
    expect(nota).toHaveAttribute("role", "note");
    expect(nota).toHaveTextContent(/DEMO/);
    expect(nota).toHaveTextContent(/no son cifras reales/i);
  });

  it("no muestra el banner DEMO cuando no es demo (datos reales)", () => {
    montar({ demo: false });
    expect(screen.queryByTestId("banner-demo")).toBeNull();
  });

  it("encabezado: un h1, tenant, cuentas y actualizacion en UTC", () => {
    montar();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Executive Command Center");
    expect(screen.getByText("BAYLARA")).toBeInTheDocument();
    expect(screen.getByText(/Actualizado 9 nov 2026, 14:00 UTC/)).toBeInTheDocument();
    expect(screen.getByText(/pueden recibir conversiones tardías/)).toBeInTheDocument();
  });

  it("indicadores principales: Inversion, CPA y Leads, cada uno con fuente y fecha", () => {
    montar();
    for (const nombre of ["Inversión", "CPA", "Leads atribuidos"]) {
      const g = screen.getByRole("group", { name: nombre });
      expect(within(g).getByText(/Fuente: DEMO/)).toBeInTheDocument();
      expect(within(g).getByText(/Dato al 9 nov 2026/)).toBeInTheDocument();
    }
    expect(within(screen.getByRole("group", { name: "Inversión" })).getByTestId("cifra-variacion")).toHaveTextContent("+12.0%");
  });

  it("CPA: un costo que baja es mejora; con 13 conversiones la lectura es 'Rendimiento preliminar' (no 'Bajo objetivo' a secas)", () => {
    montar();
    const cpa = screen.getByTestId("kpi-cpa");
    expect(within(cpa).getByTestId("cifra-variacion")).toHaveAttribute("data-sentido", "mejor");
    expect(within(cpa).getByTestId("cpa-lectura")).toHaveTextContent(/Rendimiento preliminar/i);
    expect(within(cpa).getByTestId("cpa-vs-objetivo")).toHaveTextContent(/CPA por debajo del objetivo/i);
  });

  it("indicadores secundarios: cinco, con fuente comun", () => {
    montar();
    const sec = screen.getByRole("region", { name: "Indicadores secundarios" });
    for (const id of ["clics", "cpc", "impresiones", "ctr", "conversiones"]) {
      expect(within(sec).getByTestId(`secundaria-${id}`)).toBeInTheDocument();
    }
    expect(sec.querySelector("p")).toHaveTextContent(/Fuente: DEMO · Google Ads \(datos de ejemplo\) · dato al 9 nov 2026/);
  });

  it("serie de inversion con periodo anterior y resumen de conversiones en texto", () => {
    montar();
    expect(screen.getAllByText(/Inversión diaria/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("tira-conversiones")).toHaveTextContent("Días con conversión: 12 de 30 (13 conversiones en total)");
    expect(screen.getByText(/Los 3 últimos días \(7 nov–9 nov\) pueden estar incompletos/)).toBeInTheDocument();
  });

  it("semaforo economico: rendimiento preliminar, muestra pequena y rentabilidad pendiente de CRM", () => {
    montar();
    const s = screen.getByTestId("semaforo");
    expect(within(s).getByTestId("semaforo-lectura")).toHaveTextContent("Rendimiento preliminar");
    expect(within(s).getByText(/muestra pequeña/)).toBeInTheDocument();
    expect(within(s).getByText("Pendiente CRM")).toBeInTheDocument();
    expect(within(s).getByText(/no prueba rentabilidad/)).toBeInTheDocument();
    expect(within(s).getByTestId("semaforo-barra")).toHaveAttribute("role", "img");
  });

  it("campañas: tabla con las tres filas; con menos de 5 conversiones el CPA es 'Datos insuficientes'", () => {
    montar();
    const t = screen.getByRole("table", { name: "Campañas" });
    expect(within(t).getAllByRole("row")).toHaveLength(4);
    expect(within(t).getAllByText("Datos insuficientes").length).toBeGreaterThanOrEqual(2);
    expect(within(t).getByText(/Intracoastal Yacht Club/)).toBeInTheDocument();
  });

  it("calidad de los datos y decisiones pendientes", () => {
    montar();
    expect(screen.getByRole("heading", { name: "Calidad de los datos" })).toBeInTheDocument();
    expect(screen.getByText("Cierres reales (CRM)")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText(/2 negativas propuestas/)).toBeInTheDocument();
    expect(screen.getByText(/Nada se ejecuta solo/)).toBeInTheDocument();
  });
});

describe("Executive Command Center · reglas duras con datos degradados", () => {
  const con = (cambio: (d: DatosCommandCenter) => DatosCommandCenter) => cambio(JSON.parse(JSON.stringify(DATOS_DEMO)) as DatosCommandCenter);

  it("periodo anterior en cero: 'datos insuficientes' para comparar, nunca Infinity ni NaN", () => {
    const d = con((x) => ({ ...x, inversion: { ...x.inversion, valor_anterior: 0 } }));
    const { container } = montar({ datos: d });
    expect(screen.getByTestId("cifra-variacion-insuficiente")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
  });

  it("cifra sin fuente => 'pendiente de integracion', no un numero", () => {
    const d = con((x) => ({ ...x, leads: { ...x.leads, fuente: null } }));
    montar({ datos: d });
    const g = screen.getByRole("group", { name: "Leads atribuidos" });
    expect(within(g).getByText("Fuente aún no conectada")).toBeInTheDocument();
    expect(within(g).queryByText("13")).toBeNull();
  });

  it("cifra secundaria sin fecha => pendiente de integracion", () => {
    const d = con((x) => ({ ...x, secundarias: x.secundarias.map((c) => (c.id === "ctr" ? { ...c, fecha_dato: null } : c)) }));
    montar({ datos: d });
    expect(within(screen.getByTestId("secundaria-ctr")).getByText("Pendiente de integración")).toBeInTheDocument();
  });

  it("supuestos sin equilibrio: el semaforo no emite juicio", () => {
    const d = con((x) => ({ ...x, supuestos: { ...x.supuestos, equilibrio: null } }));
    montar({ datos: d });
    const s = screen.getByTestId("semaforo");
    expect(within(s).queryByTestId("semaforo-lectura")).toBeNull();
    expect(within(s).getByText(/no se emite un juicio económico/)).toBeInTheDocument();
  });

  it("serie vacia: el panel de inversion muestra 'Sin datos', sin romper el resto", () => {
    const d = con((x) => ({ ...x, serie: { ...x.serie, gasto: [], gasto_anterior: [], conversiones: [] } }));
    montar({ datos: d });
    expect(screen.getAllByText(/Sin datos en este periodo/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("table", { name: "Campañas" })).toBeInTheDocument();
  });
});

describe("Executive Command Center · estados de la pantalla", () => {
  it("cargando: estado accesible y ninguna cifra", () => {
    montar({ estado: "cargando" });
    expect(screen.getByRole("status", { name: /Cargando datos/ })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("group", { name: "Inversión" })).toBeNull();
  });

  it("error: alerta con boton Reintentar que llama al callback", () => {
    const onReintentar = jest.fn();
    montar({ estado: "error", onReintentar });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("vacio: 'Sin datos en este periodo'", () => {
    montar({ estado: "vacio" });
    expect(screen.getByText("Sin datos en este periodo")).toBeInTheDocument();
  });

  it("datos null con estado ok equivale a vacio (nunca inventa cifras)", () => {
    montar({ datos: null });
    expect(screen.getByText("Sin datos en este periodo")).toBeInTheDocument();
  });

  it("desactualizado: aviso con la fecha del ultimo dato, y los datos siguen visibles", () => {
    montar({ ahora: "2026-11-12T10:00:00Z" });
    const aviso = screen.getByTestId("aviso-desactualizado");
    expect(aviso).toHaveAttribute("role", "status");
    expect(aviso).toHaveTextContent("Datos desactualizados");
    expect(aviso).toHaveTextContent("9 nov 2026, 14:00 UTC");
    expect(screen.getByRole("group", { name: "Inversión" })).toBeInTheDocument();
  });

  it("al dia: sin aviso de desactualizado", () => {
    montar();
    expect(screen.queryByTestId("aviso-desactualizado")).toBeNull();
  });
});

describe("Executive Command Center · controles", () => {
  it("periodo: radiogroup operable; otro periodo sin datos demo => pendiente de integracion (no inventa)", () => {
    montar();
    const grupo = screen.getByRole("radiogroup", { name: "Periodo" });
    expect(within(grupo).getByRole("radio", { name: "30 días" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(within(grupo).getByRole("radio", { name: "7 días" }));
    expect(within(grupo).getByRole("radio", { name: "7 días" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("aviso-periodo")).toHaveTextContent(/solo incluye 30 días/);
    expect(screen.queryByRole("group", { name: "Inversión" })).toBeNull();
    fireEvent.click(within(grupo).getByRole("radio", { name: "30 días" }));
    expect(screen.getByRole("group", { name: "Inversión" })).toBeInTheDocument();
  });

  it("comparar periodo anterior: boton con aria-pressed que alterna", () => {
    montar();
    const b = screen.getByRole("button", { name: /Comparar: periodo anterior/ });
    expect(b).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(b);
    expect(b).toHaveAttribute("aria-pressed", "false");
  });

  it("todo control apagado es aria-disabled, explica 'Disponible cuando …' y no ejecuta nada", () => {
    montar();
    const apagados = Array.from(document.querySelectorAll<HTMLElement>('[data-control="inhabilitado"]'));
    expect(apagados.length).toBeGreaterThanOrEqual(5);
    for (const el of apagados) {
      expect(el).toHaveAttribute("aria-disabled", "true");
      const id = el.getAttribute("aria-describedby");
      expect(id).toBeTruthy();
      expect(document.getElementById(id as string)?.textContent).toMatch(/^Disponible cuando /);
      const evento = new MouseEvent("click", { bubbles: true, cancelable: true });
      el.dispatchEvent(evento);
      expect(evento.defaultPrevented).toBe(true);
    }
  });

  it("no hay enlaces a pantallas que aun no existen (Campaign Intelligence, Conversiones)", () => {
    montar();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    const nav = screen.getByRole("navigation", { name: /Secciones de Marketing Intelligence/ });
    expect(within(nav).getByText("Command Center").closest("[aria-current]")).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("button", { name: /Campaign Intelligence/ })).toHaveAttribute("aria-disabled", "true");
    expect(within(nav).getByRole("button", { name: /Conversiones e ingresos/ })).toHaveAttribute("aria-disabled", "true");
  });
});

/**
 * PROTOTIPO — decision de Cesar (10-nov-2026): umbral PROVISIONAL de 15 conversiones como «muestra de seguimiento»,
 * NO como prueba de significacion estadistica NI como rentabilidad confirmada. Tres estados de muestra:
 *   0-4 conversiones  => «Datos muy limitados»
 *   5-14              => «Rendimiento preliminar»
 *   15 o mas          => «Muestra de seguimiento» con incertidumbre (no es rentabilidad confirmada)
 * Los supuestos financieros y la ausencia de cierres CRM estan SIEMPRE visibles; «CPA por debajo del objetivo» no es rentabilidad.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CommandCenterEjecutivo } from "../CommandCenterEjecutivo";
import { AHORA_DEMO, DATOS_DEMO } from "../demo/datos-demo";
import { MUESTRA_MUY_LIMITADA_MAX, MUESTRA_PRELIMINAR_MAX, MUESTRA_SEGUIMIENTO_MIN, MIN_CONVERSIONES, estadoMuestra, evaluarRendimiento, lecturaCampana, muestraPequena, textoMuestra } from "../semaforo";
import type { DatosCommandCenter } from "../tipos";

const clon = (cambio: (d: DatosCommandCenter) => DatosCommandCenter) => cambio(JSON.parse(JSON.stringify(DATOS_DEMO)) as DatosCommandCenter);
const conConversiones = (n: number | null) => clon((x) => ({ ...x, conversiones_total: n }));

function conMatchMedia(movil: boolean) {
  const mql = { matches: movil, media: "", addEventListener: () => {}, removeEventListener: () => {} };
  Object.defineProperty(window, "matchMedia", { writable: true, configurable: true, value: () => mql });
}
afterEach(() => Reflect.deleteProperty(window, "matchMedia"));

const montar = (datos: DatosCommandCenter, movil = false) => {
  conMatchMedia(movil);
  return render(<CommandCenterEjecutivo datos={datos} ahora={AHORA_DEMO} demo />);
};

/** Lo unico permitido con estas palabras es NEGAR la rentabilidad confirmada («no es rentabilidad confirmada», «sin confirmar»). */
function afirmaAlgoProhibido(texto: string): string[] {
  const sinNegacion = texto.replace(/no es rentabilidad confirmada/gi, "");
  const prohibidos = [/\brentables?\b/i, /rentabilidad (confirmada|probada|positiva|demostrada)/i, /estad[ií]sticamente/i, /significativ/i, /significaci[oó]n/i, /concluyente/i, /\bprobad[oa]s?\b/i];
  return prohibidos.filter((re) => re.test(sinNegacion)).map(String);
}

describe("constantes nombradas del umbral provisional", () => {
  it("0-4 / 5-14 / 15+ y el minimo de datos coinciden", () => {
    expect(MUESTRA_MUY_LIMITADA_MAX).toBe(4);
    expect(MUESTRA_PRELIMINAR_MAX).toBe(14);
    expect(MUESTRA_SEGUIMIENTO_MIN).toBe(15);
    expect(MIN_CONVERSIONES).toBe(MUESTRA_MUY_LIMITADA_MAX + 1);
    expect(MUESTRA_SEGUIMIENTO_MIN).toBe(MUESTRA_PRELIMINAR_MAX + 1);
  });
});

describe("estadoMuestra: fronteras 4->5 y 14->15", () => {
  it.each([
    [0, "muy_limitada"],
    [1, "muy_limitada"],
    [4, "muy_limitada"],
    [5, "preliminar"],
    [13, "preliminar"],
    [14, "preliminar"],
    [15, "seguimiento"],
    [16, "seguimiento"],
    [400, "seguimiento"],
  ])("%s conversiones => %s", (n, esperado) => {
    expect(estadoMuestra(n)).toBe(esperado);
  });

  it.each([[null], [undefined], [Number.NaN], [-1], [-0.5], [Number.POSITIVE_INFINITY], [Number.NEGATIVE_INFINITY]])("entrada invalida (%s) cae a «datos muy limitados» sin lanzar", (n) => {
    expect(() => estadoMuestra(n as number | null)).not.toThrow();
    expect(estadoMuestra(n as number | null)).toBe("muy_limitada");
  });

  it("muestraPequena sigue siendo verdadera salvo en la muestra de seguimiento", () => {
    expect(muestraPequena(4)).toBe(true);
    expect(muestraPequena(14)).toBe(true);
    expect(muestraPequena(15)).toBe(false);
    expect(muestraPequena(null)).toBe(true);
  });
});

describe("evaluarRendimiento: informa el estado de muestra y jamas confirma rentabilidad", () => {
  const e = (conversiones: number | null, cierresCrm: number | null = null) => ({ cpa: 47.11, objetivo: 50, equilibrio: 75, conversiones, cierresCrm });
  it.each([
    [3, "muy_limitada", true],
    [5, "preliminar", true],
    [14, "preliminar", true],
    [15, "seguimiento", false],
    [40, "seguimiento", false],
  ])("%s conversiones => muestra %s (preliminar=%s) y rentabilidad sin confirmar", (n, muestra, preliminar) => {
    const r = evaluarRendimiento(e(n));
    expect(r.muestra).toBe(muestra);
    expect(r.preliminar).toBe(preliminar);
    expect(r.rentabilidad).toBe("sin_confirmar");
  });
  it("con cierres CRM la rentabilidad queda «en revision», nunca «confirmada»", () => {
    expect(evaluarRendimiento(e(40, 3)).rentabilidad).toBe("en_revision");
    expect(JSON.stringify(evaluarRendimiento(e(40, 3)))).not.toMatch(/confirmada/);
  });
  it("conversiones invalidas => muestra muy limitada sin lanzar", () => {
    expect(() => evaluarRendimiento(e(Number.NaN))).not.toThrow();
    expect(evaluarRendimiento(e(Number.NaN)).muestra).toBe("muy_limitada");
    expect(evaluarRendimiento(e(null)).muestra).toBe("muy_limitada");
  });
});

describe("textoMuestra breve (movil): mismo estado, sin el rango entre parentesis", () => {
  it.each([
    [3, "3 conversiones · hacen falta al menos 5"],
    [13, "13 conversiones · muestra pequeña"],
    [17, "17 conversiones · con incertidumbre: no es rentabilidad confirmada"],
  ])("%s => «%s»", (n, texto) => {
    expect(textoMuestra(n, true)).toBe(texto);
  });
});

describe("textoMuestra (texto exacto de cada estado)", () => {
  it.each([
    [0, "0 conversiones · hacen falta al menos 5"],
    [1, "1 conversión · hacen falta al menos 5"],
    [3, "3 conversiones · hacen falta al menos 5"],
    [5, "5 conversiones · muestra pequeña (de 5 a 14)"],
    [13, "13 conversiones · muestra pequeña (de 5 a 14)"],
    [14, "14 conversiones · muestra pequeña (de 5 a 14)"],
    [15, "15 conversiones · con incertidumbre: no es rentabilidad confirmada"],
    [17, "17 conversiones · con incertidumbre: no es rentabilidad confirmada"],
    [null, "Conversiones no disponibles · hacen falta al menos 5"],
  ])("%s => «%s»", (n, texto) => {
    expect(textoMuestra(n as number | null)).toBe(texto);
  });
});

describe.each([
  ["escritorio", false],
  ["movil", true],
] as const)("pantalla (%s): tres estados de muestra con su texto exacto", (_nombre, movil) => {
  // En movil la tarjeta del CPA usa el texto breve (el rango «de 5 a 14» consta completo en «Supuestos financieros y fuentes»).
  const muestraEsperada = (n: number) => textoMuestra(n, movil);
  it("3 conversiones => «Datos muy limitados», sin juicio frente al objetivo", () => {
    montar(conConversiones(3), movil);
    const cpa = screen.getByTestId("kpi-cpa");
    expect(within(cpa).getByTestId("cpa-lectura")).toHaveTextContent("Datos muy limitados");
    expect(within(cpa).getByTestId("cpa-vs-objetivo")).toHaveTextContent("Sin juicio frente al objetivo");
    expect(within(cpa).getByTestId("cpa-vs-objetivo").textContent).not.toMatch(/por debajo del objetivo/i);
    expect(within(cpa).getByTestId("cpa-muestra")).toHaveTextContent(muestraEsperada(3));
    expect(within(cpa).getByTestId("cpa-muestra")).toHaveTextContent("3 conversiones · hacen falta al menos 5");
  });

  it("13 conversiones => «Rendimiento preliminar» con «CPA por debajo del objetivo»", () => {
    montar(conConversiones(13), movil);
    const cpa = screen.getByTestId("kpi-cpa");
    expect(within(cpa).getByTestId("cpa-lectura")).toHaveTextContent("Rendimiento preliminar");
    expect(within(cpa).getByTestId("cpa-vs-objetivo")).toHaveTextContent(/CPA por debajo del objetivo/);
    expect(within(cpa).getByTestId("cpa-muestra")).toHaveTextContent(muestraEsperada(13));
    expect(within(cpa).getByTestId("cpa-muestra").textContent).toBe(movil ? "13 conversiones · muestra pequeña" : "13 conversiones · muestra pequeña (de 5 a 14)");
  });

  it("17 conversiones => «Muestra de seguimiento» con incertidumbre explicita", () => {
    montar(conConversiones(17), movil);
    const cpa = screen.getByTestId("kpi-cpa");
    expect(within(cpa).getByTestId("cpa-lectura")).toHaveTextContent("Muestra de seguimiento");
    expect(within(cpa).getByTestId("cpa-lectura").textContent).not.toMatch(/preliminar/i);
    expect(within(cpa).getByTestId("cpa-vs-objetivo")).toHaveTextContent(/CPA por debajo del objetivo/);
    const muestra = within(cpa).getByTestId("cpa-muestra");
    expect(muestra).toHaveTextContent("17 conversiones · con incertidumbre: no es rentabilidad confirmada");
    expect(muestra.textContent).toMatch(/incertidumbre/);
    expect(muestra.textContent).toMatch(/no es rentabilidad confirmada/);
  });

  it.each([4, 5, 14, 15])("frontera: %s conversiones muestra el estado que corresponde", (n) => {
    montar(conConversiones(n), movil);
    const esperado = n <= 4 ? "Datos muy limitados" : n <= 14 ? "Rendimiento preliminar" : "Muestra de seguimiento";
    expect(screen.getByTestId("cpa-lectura")).toHaveTextContent(esperado);
  });

  it.each([null, -3, Number.NaN])("conversiones invalidas (%s) => «Datos muy limitados» y no lanza", (n) => {
    expect(() => montar(conConversiones(n as number | null), movil)).not.toThrow();
    expect(screen.getByTestId("cpa-lectura")).toHaveTextContent("Datos muy limitados");
  });

  it.each([0, 3, 4, 5, 13, 14, 15, 17, 40, 400])("%s conversiones: nunca afirma rentabilidad ni significacion estadistica en ninguna parte", (n) => {
    const { container } = montar(conConversiones(n), movil);
    expect(afirmaAlgoProhibido(container.textContent ?? "")).toEqual([]);
    expect(container.textContent).not.toMatch(/NaN|Infinity|undefined/);
  });

  it.each([0, 3, 13, 17, 40])("%s conversiones: supuestos financieros y ausencia de cierres CRM SIEMPRE visibles junto al CPA", (n) => {
    montar(conConversiones(n), movil);
    expect(screen.getByTestId("cpa-rentabilidad")).toBeVisible();
    expect(screen.getByTestId("cpa-rentabilidad")).toHaveTextContent(/Rentabilidad: sin confirmar/);
    expect(screen.getByTestId("cpa-rentabilidad")).toHaveTextContent(/cierres CRM pendientes/i);
    expect(screen.getByTestId("resumen-supuestos")).toBeVisible();
    expect(screen.getByTestId("resumen-supuestos")).toHaveTextContent(/objetivo \$50\.00/i);
    expect(screen.getByTestId("resumen-supuestos")).toHaveTextContent(/equilibrio \$75\.00/i);
  });

  it("«CPA por debajo del objetivo» no es rentabilidad: la frase y el aviso de rentabilidad son elementos distintos", () => {
    montar(conConversiones(17), movil);
    const frase = screen.getByTestId("cpa-vs-objetivo");
    const aviso = screen.getByTestId("cpa-rentabilidad");
    expect(frase).not.toBe(aviso);
    expect(frase.textContent).not.toMatch(/rentab/i);
    expect(aviso).toHaveTextContent(/sin confirmar/);
  });
});

describe("escritorio: el semaforo economico titula con el mismo estado", () => {
  it.each([
    [3, "Datos muy limitados"],
    [13, "Rendimiento preliminar"],
    [17, "Muestra de seguimiento"],
  ])("%s conversiones => titulo «%s» y el texto de la muestra", (n, titulo) => {
    montar(conConversiones(n), false);
    const s = screen.getByTestId("semaforo");
    expect(within(s).getByTestId("semaforo-lectura")).toHaveTextContent(titulo);
    expect(s.textContent).toContain(textoMuestra(n));
    expect(s.textContent).toMatch(/Rentabilidad real[\s\S]*Pendiente CRM/);
    expect(s.textContent).toMatch(/no prueba rentabilidad/i);
  });

  it("el semaforo ya NO dice que la rentabilidad «se confirma con 15 o mas»", () => {
    const { container } = montar(conConversiones(13), false);
    expect(container.textContent).not.toMatch(/se confirma con/i);
  });
});

describe("sin juicio (menos de 5 conversiones): sin marcador sobre la barra del semaforo", () => {
  it.each([false, true])("3 conversiones (movil=%s): no hay barra con marcador, pero el estado y el aviso de CRM siguen", (movil) => {
    montar(conConversiones(3), movil);
    expect(screen.queryByTestId("semaforo-barra")).toBeNull();
    expect(screen.queryByTestId("semaforo-marcador")).toBeNull();
    expect(screen.getByTestId("cpa-lectura")).toHaveTextContent("Datos muy limitados");
    expect(screen.getByTestId("cpa-rentabilidad")).toBeVisible();
  });
  it.each([false, true])("5 y 17 conversiones (movil=%s): la barra con su marcador si aparece", (movil) => {
    for (const n of [5, 17]) {
      const { unmount } = montar(conConversiones(n), movil);
      expect(screen.getByTestId("semaforo-barra")).toBeInTheDocument();
      expect(screen.getByTestId("semaforo-marcador")).toBeInTheDocument();
      unmount();
    }
  });
  it("escritorio: el panel del semaforo no cae al estado «pendiente» con 3 conversiones, titula «Datos muy limitados»", () => {
    montar(conConversiones(3), false);
    const s = screen.getByTestId("semaforo");
    expect(within(s).getByTestId("semaforo-lectura")).toHaveTextContent("Datos muy limitados");
    expect(s.textContent).toContain("Sin juicio frente al objetivo");
    expect(s.textContent).not.toMatch(/Sin CPA, objetivo o equilibrio válidos/);
  });
});

describe("movil: reorganizacion de las tarjetas (inversion, CPA y leads primero)", () => {
  const orden = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

  it("orden: CPA (con la barra del semaforo y el aviso minimo de supuestos + CRM dentro), inversion, leads y despues el grafico", () => {
    montar(DATOS_DEMO, true);
    const cpa = screen.getByTestId("kpi-cpa");
    const inv = screen.getByRole("group", { name: "Inversión" });
    const leads = screen.getByRole("group", { name: "Leads atribuidos" });
    const aviso = screen.getByTestId("aviso-minimo");
    const barra = screen.getByTestId("semaforo-barra");
    const grafico = screen.getAllByText(/Inversión diaria/)[0];
    expect(cpa.contains(aviso)).toBe(true);
    expect(cpa.contains(barra)).toBe(true);
    expect(orden(barra, aviso)).toBe(true);
    expect(orden(cpa, inv)).toBe(true);
    expect(orden(inv, leads)).toBe(true);
    expect(orden(leads, grafico)).toBe(true);
  });

  it("el aviso minimo trae CRM y supuestos en un bloque compacto, visible sin expandir nada", () => {
    montar(DATOS_DEMO, true);
    const aviso = screen.getByTestId("aviso-minimo");
    expect(aviso).toBeVisible();
    expect(aviso.textContent).toMatch(/Rentabilidad: sin confirmar/);
    expect(aviso.textContent).toMatch(/cierres CRM pendientes/i);
    expect(aviso.textContent).toMatch(/objetivo \$50\.00/i);
    expect(aviso.textContent).toMatch(/equilibrio \$75\.00/i);
  });

  it("cabecera compacta: el selector de periodo y las opciones van dentro de UN solo bloque expandible, con el periodo en el resumen", () => {
    montar(DATOS_DEMO, true);
    const det = screen.getByTestId("detalle-secciones") as HTMLDetailsElement;
    expect(det.open).toBe(false);
    expect(within(det).getByText(/Periodo y opciones/)).toBeInTheDocument();
    expect(det.querySelector("summary")?.textContent).toMatch(/30 días/);
    expect(within(det).getByRole("radiogroup", { name: "Periodo" })).toBeInTheDocument();
    expect(within(det).getByRole("button", { name: /Comparar: periodo anterior/ })).toBeInTheDocument();
    expect(within(det).getByRole("button", { name: /Tema oscuro/ })).toBeInTheDocument();
    // Fuera del bloque ya no hay otro selector de periodo ni boton de tema.
    expect(screen.getAllByRole("radiogroup", { name: "Periodo" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /Tema oscuro/ })).toHaveLength(1);
  });

  it("el periodo vigente y la fecha de actualizacion se ven en el resumen del bloque aunque este plegado", () => {
    montar(DATOS_DEMO, true);
    const resumen = screen.getByTestId("subtitulo-movil");
    expect(resumen).toBeVisible();
    expect(resumen.textContent).toMatch(/30 días/);
    expect(resumen.textContent).toMatch(/Actualizado 9 nov 2026, 14:00 UTC/);
  });

  it("pestañas compactas: tres pestañas en una fila, navegables con flechas, Inicio y Fin (patron WAI-ARIA)", () => {
    montar(DATOS_DEMO, true);
    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Resumen", "Campañas", "Calidad"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveFocus();
    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(tabs[2], { key: "ArrowRight" });
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(tabs[2], { key: "Home" });
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", tabs[0].id);
    expect(tabs[0]).toHaveAttribute("aria-controls", panel.id);
  });

  it("la pestaña «Campañas» muestra la lista de campañas y «Calidad» el estado de los datos", () => {
    montar(DATOS_DEMO, true);
    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab");
    fireEvent.click(tabs[1]);
    expect(screen.getByRole("list", { name: "Campañas" })).toBeInTheDocument();
    fireEvent.click(tabs[2]);
    expect(screen.getByRole("region", { name: "Estado de la calidad de los datos" })).toBeInTheDocument();
  });

  it("cada cifra sigue con fuente y fecha: una linea agrupada de fuentes cubre inversion, CPA y leads", () => {
    montar(DATOS_DEMO, true);
    const f = screen.getByTestId("fuentes-resumen");
    expect(f).toBeVisible();
    expect(f.textContent).toMatch(/Fuente: DEMO · Google Ads/);
    expect(f.textContent).toMatch(/Dato al 9 nov 2026/);
    for (const c of [/Inversión/, /CPA/, /Leads/]) expect(f.textContent).toMatch(c);
  });

  it("si las fuentes difieren, cada una consta por separado con las cifras que cubre", () => {
    const d = clon((x) => ({ ...x, leads: { ...x.leads, fuente: "DEMO · CRM (ejemplo)", fecha_dato: "2026-11-08" } }));
    montar(d, true);
    const f = screen.getByTestId("fuentes-resumen");
    expect(f.textContent).toMatch(/DEMO · CRM \(ejemplo\)/);
    expect(f.textContent).toMatch(/Dato al 8 nov 2026/);
    expect(f.textContent).toMatch(/DEMO · Google Ads/);
  });

  it("en escritorio las tarjetas siguen llevando su propia fuente y no hay linea agrupada", () => {
    montar(DATOS_DEMO, false);
    expect(screen.queryByTestId("fuentes-resumen")).toBeNull();
    expect(screen.queryByTestId("aviso-minimo")).toBeNull();
    expect(within(screen.getByRole("group", { name: "Inversión" })).getByText(/Fuente:/)).toBeInTheDocument();
  });
});

describe("lectura de cada campana: el CPA frente al objetivo siempre lleva su estado de muestra", () => {
  it.each([
    ["bajo_objetivo", 9, "Preliminar: bajo objetivo"],
    ["entre_objetivo_equilibrio", 14, "Preliminar: entre objetivo y equilibrio"],
    ["sobre_equilibrio", 5, "Preliminar: sobre el equilibrio"],
    ["bajo_objetivo", 15, "Seguimiento: bajo objetivo"],
    ["bajo_objetivo", 40, "Seguimiento: bajo objetivo"],
    ["bajo_objetivo", 3, "Datos insuficientes"],
    ["bajo_objetivo", null, "Datos insuficientes"],
    ["datos_insuficientes", 20, "Datos insuficientes"],
  ] as const)("%s con %s conversiones => «%s»", (lectura, n, texto) => {
    expect(lecturaCampana(lectura, n)).toBe(texto);
  });

  it("en la tabla de campañas ninguna fila dice «Bajo objetivo» a secas (9 leads es muestra preliminar)", () => {
    const { container } = montar(DATOS_DEMO, false);
    const tabla = within(screen.getByRole("table", { name: "Campañas" }));
    expect(tabla.getByText("Preliminar: bajo objetivo")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/(^|[^:] )Bajo objetivo/);
  });

  it("en movil la tarjeta de la campaña tambien lleva «Preliminar: …»", () => {
    montar(DATOS_DEMO, true);
    fireEvent.click(within(screen.getByRole("tablist")).getAllByRole("tab")[1]);
    expect(screen.getByText("Preliminar: bajo objetivo")).toBeInTheDocument();
  });
});

/**
 * PROTOTIPO — criterio 3 de Cesar (semaforo responsable): «CPA por debajo del objetivo» NO es «rentabilidad confirmada».
 * Con muestra pequena se muestra RENDIMIENTO PRELIMINAR; los supuestos financieros y la ausencia de cierres CRM estan siempre visibles.
 */
import { render, screen, within } from "@testing-library/react";
import { CommandCenterEjecutivo } from "../CommandCenterEjecutivo";
import { AHORA_DEMO, DATOS_DEMO } from "../demo/datos-demo";
import { MIN_CONVERSIONES, MUESTRA_SEGUIMIENTO_MIN, evaluarRendimiento, muestraPequena } from "../semaforo";
import type { DatosCommandCenter } from "../tipos";

const clon = (cambio: (d: DatosCommandCenter) => DatosCommandCenter) => cambio(JSON.parse(JSON.stringify(DATOS_DEMO)) as DatosCommandCenter);
const montar = (datos: DatosCommandCenter = DATOS_DEMO) => render(<CommandCenterEjecutivo datos={datos} ahora={AHORA_DEMO} demo />);

/**
 * Palabras que afirman rentabilidad. «Rentabilidad: sin confirmar» y «no es rentabilidad confirmada» NO afirman nada y estan permitidos
 * (la muestra de seguimiento dice explicitamente que NO es rentabilidad confirmada).
 */
const AFIRMA_RENTABILIDAD = /\brentables?\b|(?<!no es )rentabilidad (confirmada|probada|positiva|demostrada|real confirmada)|(es|resulta|queda|esta|está) rentable|campaña rentable|ganancia confirmada/i;

describe("umbral de muestra pequeña (constante nombrada y documentada)", () => {
  it("el umbral de seguimiento es una constante exportada, mayor que el minimo de datos insuficientes", () => {
    expect(MIN_CONVERSIONES).toBe(5);
    expect(MUESTRA_SEGUIMIENTO_MIN).toBe(15);
    expect(MUESTRA_SEGUIMIENTO_MIN).toBeGreaterThan(MIN_CONVERSIONES);
    expect(muestraPequena(MUESTRA_SEGUIMIENTO_MIN - 1)).toBe(true);
    expect(muestraPequena(MUESTRA_SEGUIMIENTO_MIN)).toBe(false);
    expect(muestraPequena(null)).toBe(true);
  });
});

describe("evaluarRendimiento (logica pura)", () => {
  it("CPA bajo objetivo con muestra pequeña => preliminar, nunca rentabilidad confirmada", () => {
    const r = evaluarRendimiento({ cpa: 47.11, objetivo: 50, equilibrio: 75, conversiones: 13, cierresCrm: null });
    expect(r.lectura).toBe("bajo_objetivo");
    expect(r.preliminar).toBe(true);
    expect(r.rentabilidad).toBe("sin_confirmar");
  });
  it("muestra suficiente: deja de ser preliminar, pero la rentabilidad sigue SIN confirmar mientras no haya cierres CRM", () => {
    const r = evaluarRendimiento({ cpa: 47.11, objetivo: 50, equilibrio: 75, conversiones: 40, cierresCrm: null });
    expect(r.preliminar).toBe(false);
    expect(r.rentabilidad).toBe("sin_confirmar");
  });
  it("nunca devuelve 'confirmada': con cierres CRM tambien queda 'en_revision' (esta pantalla no confirma rentabilidad)", () => {
    const r = evaluarRendimiento({ cpa: 47.11, objetivo: 50, equilibrio: 75, conversiones: 40, cierresCrm: 3 });
    expect(r.rentabilidad).toBe("en_revision");
    expect(JSON.stringify(r)).not.toMatch(/confirmada/);
  });
  it("sin CPA valido => datos insuficientes y no preliminar", () => {
    const r = evaluarRendimiento({ cpa: null, objetivo: 50, equilibrio: 75, conversiones: 13, cierresCrm: null });
    expect(r.lectura).toBe("datos_insuficientes");
    expect(r.preliminar).toBe(false);
  });
});

describe("pantalla: semaforo responsable con los datos DEMO (13 conversiones, bajo objetivo)", () => {
  it("el KPI de CPA dice 'Rendimiento preliminar' y 'CPA por debajo del objetivo', no 'rentable'", () => {
    montar();
    const cpa = screen.getByTestId("kpi-cpa");
    expect(within(cpa).getByTestId("cpa-lectura")).toHaveTextContent(/Rendimiento preliminar/i);
    expect(within(cpa).getByTestId("cpa-vs-objetivo")).toHaveTextContent(/CPA por debajo del objetivo/i);
    expect(cpa.textContent).not.toMatch(AFIRMA_RENTABILIDAD);
  });

  it("en ninguna parte de la pantalla se afirma rentabilidad (muestra bajo el umbral)", () => {
    const { container } = montar();
    expect(container.textContent).not.toMatch(AFIRMA_RENTABILIDAD);
  });

  it("el CPA y el aviso de CRM estan juntos: 'Rentabilidad: sin confirmar' y 'cierres CRM pendientes'", () => {
    montar();
    const cpa = screen.getByTestId("kpi-cpa");
    expect(within(cpa).getByTestId("cpa-rentabilidad")).toHaveTextContent(/Rentabilidad: sin confirmar/);
    expect(within(cpa).getByTestId("cpa-rentabilidad")).toHaveTextContent(/cierres CRM pendientes/i);
  });

  it("los supuestos financieros estan siempre visibles: objetivo, equilibrio, comision y tasa de cierre", () => {
    montar();
    const s = screen.getByTestId("semaforo");
    for (const t of [/objetivo/i, /equilibrio/i, /comisión/i, /cierre/i]) expect(s.textContent).toMatch(t);
    expect(s.textContent).toMatch(/\$50/);
    expect(s.textContent).toMatch(/\$75/);
    expect(s.textContent).toMatch(/\$1,500/);
    expect(s.textContent).toMatch(/5%|5 %/);
  });

  it("el semaforo titula la lectura como preliminar y explica por que (13 conversiones: muestra pequeña de 5 a 14)", () => {
    montar();
    const s = screen.getByTestId("semaforo");
    expect(within(s).getByTestId("semaforo-lectura")).toHaveTextContent(/Rendimiento preliminar/i);
    expect(s.textContent).toMatch(/13 conversiones · muestra pequeña \(de 5 a 14\)/);
    expect(s.textContent).toMatch(/Rentabilidad real[\s\S]*Pendiente CRM/);
  });
});

describe("pantalla: otras lecturas del semaforo", () => {
  it("muestra de seguimiento y bajo objetivo: ya no es 'preliminar', pero tampoco dice 'rentable' y mantiene el aviso de CRM", () => {
    const d = clon((x) => ({ ...x, conversiones_total: 40 }));
    const { container } = montar(d);
    const cpa = screen.getByTestId("kpi-cpa");
    expect(within(cpa).getByTestId("cpa-lectura")).toHaveTextContent(/Muestra de seguimiento/i);
    expect(within(cpa).getByTestId("cpa-lectura")).not.toHaveTextContent(/preliminar/i);
    expect(within(cpa).getByTestId("cpa-muestra")).toHaveTextContent(/con incertidumbre: no es rentabilidad confirmada/);
    expect(within(cpa).getByTestId("cpa-rentabilidad")).toHaveTextContent(/Rentabilidad: sin confirmar/);
    expect(container.textContent).not.toMatch(AFIRMA_RENTABILIDAD);
  });

  it("sobre el equilibrio con muestra pequeña: preliminar tambien (no se declara perdida ni ganancia)", () => {
    const d = clon((x) => ({ ...x, cpa: { ...x.cpa, valor: 90 } }));
    montar(d);
    expect(within(screen.getByTestId("kpi-cpa")).getByTestId("cpa-lectura")).toHaveTextContent(/Rendimiento preliminar/i);
    expect(within(screen.getByTestId("kpi-cpa")).getByTestId("cpa-vs-objetivo")).toHaveTextContent(/sobre el equilibrio/i);
  });

  it("sin cierres CRM informados (null) se dice 'pendientes'; con un numero se informa el conteo sin afirmar rentabilidad", () => {
    const d = clon((x) => ({ ...x, supuestos: { ...x.supuestos, cierres_crm: 2 } }));
    const { container } = montar(d);
    expect(within(screen.getByTestId("kpi-cpa")).getByTestId("cpa-rentabilidad")).toHaveTextContent(/2 cierres CRM/);
    expect(container.textContent).not.toMatch(AFIRMA_RENTABILIDAD);
  });

  it("supuestos incompletos: sin juicio economico, pero el aviso de CRM sigue visible", () => {
    const d = clon((x) => ({ ...x, supuestos: { ...x.supuestos, equilibrio: null } }));
    montar(d);
    expect(within(screen.getByTestId("semaforo")).queryByTestId("semaforo-lectura")).toBeNull();
    expect(within(screen.getByTestId("kpi-cpa")).getByTestId("cpa-rentabilidad")).toBeInTheDocument();
  });
});

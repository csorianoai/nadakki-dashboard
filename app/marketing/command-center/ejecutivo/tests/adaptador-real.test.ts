import { FUENTE_REAL, adaptarResumen, rangoDePeriodo } from "../adaptador-real";
import { MIN_CONVERSIONES } from "../semaforo";
import { resumen } from "./fixtures-real";

const P = { tipo: "30d" } as const;
const datos = (r = resumen()) => {
  const a = adaptarResumen(r, P);
  if (a.tipo !== "datos") throw new Error(a.tipo);
  return a;
};

describe("rangoDePeriodo", () => {
  it("30d termina hoy (UTC) y abarca 30 dias", () => {
    expect(rangoDePeriodo(P, new Date("2026-11-10T23:30:00Z"))).toEqual({ from: "2026-10-12", to: "2026-11-10" });
  });
  it("personalizado valido pasa; invalido => null", () => {
    expect(rangoDePeriodo({ tipo: "personalizado", desde: "2026-01-01", hasta: "2026-01-31" }, new Date())).toEqual({ from: "2026-01-01", to: "2026-01-31" });
    expect(rangoDePeriodo({ tipo: "personalizado", desde: "2026-02-01", hasta: "2026-01-31" }, new Date())).toBeNull();
  });
});

describe("adaptarResumen: moneda de la cuenta", () => {
  it("moneda confirmada => las cifras de dinero llevan la moneda de la cuenta", () => {
    const a = datos();
    expect(a.moneda).toBe("DOP");
    expect(a.datos.inversion).toMatchObject({ unidad: "moneda", moneda: "DOP", valor: 1000, fuente: FUENTE_REAL });
    expect(a.datos.cpa).toMatchObject({ unidad: "moneda", moneda: "DOP" });
  });
  it("moneda no confirmada => numero sin simbolo y mensaje; nunca se supone USD", () => {
    const a = datos(resumen({ currency: { code: null, source: null, confirmed: false } }));
    expect(a.moneda).toBeNull();
    expect(a.datos.inversion.unidad).toBe("numero");
    expect(a.datos.inversion.moneda).toBeUndefined();
    expect(a.datos.inversion.mensaje).toBe("Moneda no confirmada");
    expect(a.datos.campanas[0].inversion.unidad).toBe("numero");
  });
  it("code presente pero confirmed=false => tambien no confirmada", () => {
    expect(datos(resumen({ currency: { code: "USD", source: "google_ads_api", confirmed: false } })).moneda).toBeNull();
  });
});

describe("adaptarResumen: contenido", () => {
  it("CTR se escala x100 (0.05 -> 5 %)", () => {
    const ctr = datos().datos.secundarias.find((c) => c.id === "ctr");
    expect(ctr).toMatchObject({ unidad: "porcentaje", valor: 5 });
  });
  it("CPA de campana con menos de MIN_CONVERSIONES => sin valor y sin juicio", () => {
    const f = datos().datos.campanas.find((c) => c.nombre === "Camp B")!;
    expect(2).toBeLessThan(MIN_CONVERSIONES);
    expect(f.cpa.valor).toBeNull();
    expect(f.cpa.estado).toBe("datos_insuficientes");
    expect(f.lectura).toBe("datos_insuficientes");
  });
  it("supuestos economicos y decisiones quedan pendientes (nada inventado)", () => {
    const d = datos().datos;
    expect(d.supuestos.objetivo).toBeNull();
    expect(d.decisiones).toEqual({ negativas_propuestas: null, riesgo: null, presupuesto_propuestas: null });
  });
  it("sin as_of => sin fecha del dato", () => {
    expect(datos(resumen({ as_of: null })).datos.inversion.fecha_dato).toBeNull();
  });
  it("las series salen del contrato", () => {
    expect(datos().datos.serie.gasto).toEqual([{ x: "2026-11-09", y: 30 }]);
  });
});

describe("adaptarResumen: estados", () => {
  it("varias monedas => requiere cuenta y NO hay datos agregados", () => {
    const cuentas = [{ customer_id: "1", label: "1**", currency: "USD" }, { customer_id: "2", label: "2**", currency: "DOP" }];
    expect(adaptarResumen(resumen({ requires_account_selection: true, accounts: cuentas, kpis: null }), P)).toEqual({ tipo: "requiere_cuenta", cuentas });
  });
  it("tablas ausentes => vacio sin_tablas", () => {
    expect(adaptarResumen(resumen({ coverage: { days_in_period: 30, days_with_data: 0, tables_present: false }, kpis: null }), P)).toEqual({ tipo: "vacio", motivo: "sin_tablas" });
  });
  it("sin filas => vacio sin_filas", () => {
    expect(adaptarResumen(resumen({ coverage: { days_in_period: 30, days_with_data: 0, tables_present: true }, kpis: {} }), P)).toEqual({ tipo: "vacio", motivo: "sin_filas" });
  });
});

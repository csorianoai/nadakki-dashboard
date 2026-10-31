/**
 * Logica pura de las pantallas Analisis de Costos y de Gastos (F2).
 * Los totales que se pintan salen del endpoint de F1; aqui solo se agrupa.
 */
import {
  agrupar,
  hrefVehiculo,
  parseCostos,
  parseGastos,
  rangoDePeriodo,
  reportePath,
} from "../analisis";

const COSTOS = {
  moneda: "DOP",
  total: 1500,
  filas: [
    { vehicle_id: "v1", cost_type: "repair", mes: "2026-09", currency: "DOP", total: 1000 },
    { vehicle_id: "v1", cost_type: "purchase", mes: "2026-10", currency: "DOP", total: 200 },
    { vehicle_id: "v2", cost_type: "repair", mes: "2026-10", currency: "DOP", total: 300 },
    { vehicle_id: "v3", cost_type: "repair", mes: "2026-10", currency: "USD", total: 99 },
  ],
  totales_por_moneda: [
    { currency: "DOP", total: 1500 },
    { currency: "USD", total: 99 },
  ],
};

describe("rangoDePeriodo", () => {
  const hoy = new Date(2026, 9, 31); // 31-oct-2026
  it("todo no manda fechas", () => {
    expect(rangoDePeriodo("todo", hoy)).toEqual({});
  });
  it("3m va del primer dia de hace dos meses a hoy", () => {
    expect(rangoDePeriodo("3m", hoy)).toEqual({ desde: "2026-08-01", hasta: "2026-10-31" });
  });
  it("anio va del 1 de enero a hoy", () => {
    expect(rangoDePeriodo("anio", hoy)).toEqual({ desde: "2026-01-01", hasta: "2026-10-31" });
  });
  it("12m cruza el cambio de año", () => {
    expect(rangoDePeriodo("12m", hoy).desde).toBe("2025-11-01");
  });
});

describe("reportePath", () => {
  it("usa el endpoint de F1 sin tenant en la ruta ni en la query", () => {
    expect(reportePath("costos", {})).toBe("/api/v1/contable/reports/costos-por-vehiculo-tipo-mes");
    expect(reportePath("gastos", { desde: "2026-08-01", hasta: "2026-10-31" })).toBe(
      "/api/v1/contable/reports/gastos-por-cuenta-mes?desde=2026-08-01&hasta=2026-10-31",
    );
  });
});

describe("parseCostos / parseGastos", () => {
  it("conserva moneda y total del endpoint", () => {
    const r = parseCostos(COSTOS);
    expect(r.moneda).toBe("DOP");
    expect(r.total).toBe(1500);
    expect(r.filas).toHaveLength(4);
  });
  it("sin moneda funcional falla cerrado", () => {
    expect(() => parseCostos({ ...COSTOS, moneda: "" })).toThrow();
    expect(() => parseGastos({ filas: [], total: 0 })).toThrow();
  });
  it("descarta filas sin importe numerico", () => {
    const r = parseGastos({
      moneda: "DOP",
      total: 5,
      filas: [
        { mes: "2026-10", codigo: "5101", nombre: "Sueldos", total: "5" },
        { mes: "2026-10", codigo: "5102", nombre: "Raro", total: null },
      ],
    });
    expect(r.filas).toEqual([{ mes: "2026-10", codigo: "5101", nombre: "Sueldos", total: 5 }]);
  });
});

describe("agrupar", () => {
  it("suma por clave solo en la moneda funcional y cuadra con el total del endpoint", () => {
    const { moneda, filas, total } = parseCostos(COSTOS);
    const porVehiculo = agrupar(filas.filter((f) => f.currency === moneda), (f) => f.vehicle_id);
    expect(porVehiculo).toEqual([
      { clave: "v1", total: 1200 },
      { clave: "v2", total: 300 },
    ]);
    expect(porVehiculo.reduce((s, x) => s + x.total, 0)).toBe(total);
  });
  it("por mes sale en orden cronologico", () => {
    const { filas } = parseCostos(COSTOS);
    const porMes = agrupar(filas.filter((f) => f.currency === "DOP"), (f) => f.mes, "clave");
    expect(porMes.map((x) => x.clave)).toEqual(["2026-09", "2026-10"]);
  });
});

describe("enlaces al detalle", () => {
  it("vehiculo va a su ficha", () => {
    expect(hrefVehiculo("a b")).toBe("/autos/dealer/inventario/a%20b");
  });
});

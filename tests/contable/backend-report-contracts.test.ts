let api: typeof import("@/app/hooks/contable");
const originalFetch = global.fetch;
const previousMocks = process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS;
// Fixtures mirror SELECT fields and response envelopes in asientos_router.py/reports_router.py.
const periods = [
 { id: "nov", fiscal_year: 2026, period_number: 11, start_date: "2026-11-01", end_date: "2026-11-30", tenant_id: "t" },
 { id: "oct", fiscal_year: 2026, period_number: 10, start_date: "2026-10-01", end_date: "2026-10-31", tenant_id: "t" },
 { id: "dec", fiscal_year: 2026, period_number: 12, start_date: "2026-12-01", end_date: "2026-12-31", tenant_id: "t" },
];
const november = [
 { tipo_cuenta: "ingreso", codigo: "4010", nombre: "Ventas", total_debe: "0", total_haber: "1000", saldo: "1000" },
 { tipo_cuenta: "gasto", codigo: "5010", nombre: "Costo de ventas", total_debe: "600", total_haber: "0", saldo: "600" },
 { tipo_cuenta: "gasto", codigo: "6010", nombre: "Servicios", total_debe: "100", total_haber: "0", saldo: "100" },
];
let fetchMock: jest.Mock;
const json = (value: unknown) => ({ ok: true, status: 200, text: async () => JSON.stringify(value) });
beforeAll(async () => {
 process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS = "false";
 api = await import("@/app/hooks/contable");
});
let resultadoSinCerrar: unknown[] = [];
let balanceGeneral: unknown[] = [];
beforeEach(() => {
 resultadoSinCerrar = [];
 balanceGeneral = [{ tipo_cuenta: "activo", codigo: "1010", nombre: "Caja", saldo: "1000" }, { tipo_cuenta: "pasivo", codigo: "2010", nombre: "Proveedores", saldo: "400" }, { tipo_cuenta: "patrimonio", codigo: "3010", nombre: "Capital", saldo: "600" }];
 fetchMock = jest.fn(async (input) => {
  const url = new URL(String(input), "https://dashboard.example");
  if (url.pathname.endsWith("/periodos")) return json(periods);
  if (url.pathname.endsWith("/plan-cuentas")) return json([{ id: "cash", codigo: "1010", nombre: "Caja", tipo_cuenta: "activo" }, { id: "expense", codigo: "6010", nombre: "Servicios", tipo_cuenta: "gasto" }]);
  if (url.pathname.endsWith("/balance-comprobacion")) return json({ cuentas: [{ cuenta_id: "cash", codigo: "1010", nombre: "Caja", total_debe: "1000", total_haber: "1000", saldo: "0" }], total_debe: "1000", total_haber: "1000", cuadra: true });
  if (url.pathname.endsWith("/mayor")) return json([{ cuenta_id: "cash", codigo: "1010", nombre: "Caja", periodo_id: "nov", total_debe: "1000", total_haber: "400", saldo: "600" }]);
  if (url.pathname.endsWith("/estado-resultados") && !url.searchParams.has("periodo_id")) return json(resultadoSinCerrar);
  if (url.pathname.endsWith("/estado-resultados")) return json(url.searchParams.get("periodo_id") === "nov" ? november : [{ tipo_cuenta: "gasto", codigo: "6010", nombre: "Servicios", saldo: "50" }]);
  if (url.pathname.endsWith("/balance-general")) return json(balanceGeneral);
  throw new Error("Ruta no contemplada " + input);
 }); global.fetch = fetchMock;
});
afterAll(() => { global.fetch = originalFetch; if (previousMocks === undefined) delete process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS; else process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS = previousMocks; });
it("balance convierte cuentas, totales y periodo elegido", async () => {
 const report = await api.getBalanceComprobacion("t", "nov");
 expect(report.rows[0]).toMatchObject({ total_debe: 1000, total_haber: 1000, saldo: 0, tipo_cuenta: "activo" });
 expect(report.totals).toEqual({ total_debe: 1000, total_haber: 1000, cuadra: true });
 expect(report.periodo_id).toBe("nov"); expect(report.fiscal_year).toBe(2026); expect(report.label).toMatch(/noviembre/i);
});
it("mayor muestra una sola linea de totales sin inventar asientos", async () => {
 const report = await api.getLibroMayor("t", "cash", "nov");
 expect(report.movimientos).toEqual([expect.objectContaining({ descripcion: "Total del período", debe_base: 1000, haber_base: 400, saldo_acumulado: 600, asiento_id: "", fecha: "" })]);
 expect(report.saldo_final).toBe(600); expect(Number.isNaN(report.saldo_inicial)).toBe(true);
});
it("noviembre separa ingreso, costo 5010 y gasto con utilidad correcta", async () => {
 const report = await api.getEstadoResultados("t", "2026-11-01", "2026-11-26");
 expect(report).toMatchObject({ total_ingresos: 1000, total_costos: 600, total_gastos: 100, utilidad_bruta: 400, utilidad_neta: 300, margen_bruto_pct: 40, margen_neto_pct: 30 });
 expect(report.costos[0].codigo).toBe("5010"); expect(report.gastos[0].codigo).toBe("6010");
 const urls = fetchMock.mock.calls.map(([url]) => String(url)).filter((u) => u.includes("estado-resultados"));
 expect(urls).toEqual(["/api/v1/contable/reports/estado-resultados?periodo_id=nov"]);
});
it("suma varios periodos y agrupa cuentas repetidas", async () => {
 const report = await api.getEstadoResultados("t", "2026-10-01", "2026-11-30");
 expect(report.total_gastos).toBe(150); expect(report.gastos).toHaveLength(1); expect(report.utilidad_neta).toBe(250);
});
it("sin ingresos devuelve margenes cero", async () => {
 const report = await api.getEstadoResultados("t", "2026-10-01", "2026-10-31");
 expect(report.margen_bruto_pct).toBe(0); expect(report.margen_neto_pct).toBe(0);
});
it("situacion usa balance-general actual sin inventar desglose", async () => {
 const report = await api.getSituacionFinanciera("t", new Date().toISOString().slice(0, 10));
 expect(report.activos.total).toBe(1000); expect(report.pasivos.total).toBe(400); expect(report.patrimonio.total).toBe(600); expect(report.ecuacion_cuadra).toBe(true);
 expect(Number.isNaN(report.activos.corriente)).toBe(true);
 await expect(api.getSituacionFinanciera("t", "2000-01-01")).rejects.toThrow(/histórica/);
});
it("monitor compara gastos operativos de periodos reales sin incluir costo de ventas", async () => {
 const report = await api.getGastosMonitor("t", "nov");
 expect(report.total_gastos).toBe(100); expect(report.variacion_total_pct).toBe(100);
 expect(report.gastos).toEqual([expect.objectContaining({ codigo: "6010", cuenta_id: "expense", periodo_actual: 100, periodo_anterior: 50 })]);
 expect(fetchMock.mock.calls.every(([url]) => !String(url).includes("gastos-monitor"))).toBe(true);
});

it("situacion suma al patrimonio el resultado del ejercicio sin cerrar (caso Cowork 26-nov)", async () => {
 // Activos 83.350.000 = pasivos 78.821.487,62 + utilidad 4.528.512,38 (medido en qa-dealer-nadakki).
 balanceGeneral = [{ tipo_cuenta: "activo", codigo: "1220", nombre: "Inventario", saldo: "83350000.00" }, { tipo_cuenta: "pasivo", codigo: "2010", nombre: "Proveedores", saldo: "78821487.62" }];
 resultadoSinCerrar = [{ tipo_cuenta: "ingreso", codigo: "4010", nombre: "Ventas", saldo: "40528512.38" }, { tipo_cuenta: "gasto", codigo: "5010", nombre: "Costo de ventas", saldo: "36000000.00" }];
 const report = await api.getSituacionFinanciera("t", new Date().toISOString().slice(0, 10));
 expect(report.patrimonio.detalle).toContainEqual(expect.objectContaining({ nombre: "Resultado del ejercicio (sin cerrar)", saldo: 4528512.38 }));
 expect(report.patrimonio.total).toBeCloseTo(4528512.38, 2);
 expect(report.ecuacion_cuadra).toBe(true);
});

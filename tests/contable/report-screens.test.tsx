import { fireEvent, render, screen } from "@testing-library/react";
import { BalanceComprobacionClient } from "@/components/contable/BalanceComprobacionClient";
import { LibroMayorClient } from "@/components/contable/LibroMayorClient";
import { EstadoResultadosClient } from "@/components/contable/EstadoResultadosClient";
import { getBalanceComprobacion, getLibroMayor, getEstadoResultados } from "@/app/hooks/contable";
import { numeroFijo } from "@/lib/contable/numero-seguro";
jest.mock("@/components/contable/FacturacionElectronicaAviso", () => ({ FacturacionElectronicaAviso: () => null }));
jest.mock("@/components/contable/useContableTenantId", () => ({ useContableTenantId: () => "t" }));
jest.mock("@/components/contable/monedaFuncional", () => ({ useMonedaFuncional: () => ({ locale: "es-AR", currency: "ARS" }), MonedaFuncionalNota: () => null, formateaImporteContable: (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "—" }));
jest.mock("recharts", () => new Proxy({}, { get: () => () => null }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("@/app/hooks/contable", () => ({
 ContableApiError: class extends Error {},
 listPeriodos: jest.fn(async () => [{ id: "nov", status: "open", fiscal_year: 2026, period_number: 11, label: "Noviembre 2026", fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30" }]),
 listCuentas: jest.fn(async () => [{ id: "cash", codigo: "1010", nombre: "Caja" }]),
 getBalanceComprobacion: jest.fn(), getLibroMayor: jest.fn(), getEstadoResultados: jest.fn(),
}));
it("balance muestra totales y cuadra", async () => {
 (getBalanceComprobacion as jest.Mock).mockResolvedValue({ rows: [], totals: { total_debe: 1000, total_haber: 1000, cuadra: true } });
 render(<BalanceComprobacionClient />);
 expect(await screen.findByTestId("balance-veredicto")).toHaveTextContent("CUADRAN");
 expect(screen.getAllByText("1000.00")).toHaveLength(2);
});
it("mayor identifica total y explica que no hay detalle por asiento", async () => {
 (getLibroMayor as jest.Mock).mockResolvedValue({ cuenta_codigo: "1010", cuenta_nombre: "Caja", saldo_final: 600, movimientos: [{ id: "total", asiento_id: "", fecha: "", descripcion: "Total del período", debe_base: 1000, haber_base: 400, saldo_acumulado: 600 }] });
 render(<LibroMayorClient />);
 expect(await screen.findByText("Total del período")).toBeVisible();
 expect(screen.getByText(/El detalle por asiento/)).toBeVisible();
});
it("campo de margen faltante no rompe pantalla", async () => {
 (getEstadoResultados as jest.Mock).mockResolvedValue({ ingresos: [], costos: [], gastos: [], total_ingresos: 0, total_costos: 0, total_gastos: 0 });
 render(<EstadoResultadosClient />); fireEvent.click(screen.getByRole("button", { name: "Generar reporte" }));
 expect(await screen.findByText("Margen bruto: —")).toBeVisible();
 expect(screen.getByText("Margen neto: —")).toBeVisible();
});
it.each([undefined, null, "10", NaN, Infinity])("numero desconocido %s se muestra como guion", (value) => { expect(numeroFijo(value)).toBe("—"); });

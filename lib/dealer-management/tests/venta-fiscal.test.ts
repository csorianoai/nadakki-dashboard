import {
  VENTA_FISCAL_EMPTY,
  validateVentaFiscal,
  ventaFiscalPayload,
  mensajeVenta,
} from "../venta-fiscal";

const permuta = { make: "Toyota", model: "Corolla", year: "2018", value: "5.000.000,50", acquisition_mode_code: "compra_local" };

describe("venta fiscal (F4F-6 parte 3)", () => {
  it("sin alicuota ni permuta no viaja bloque fiscal (no se inventa)", () => {
    expect(ventaFiscalPayload(VENTA_FISCAL_EMPTY)).toEqual({});
    expect(validateVentaFiscal(VENTA_FISCAL_EMPTY)).toEqual({});
  });

  it("la alicuota se escribe, no tiene valor por defecto y no acepta basura", () => {
    expect(VENTA_FISCAL_EMPTY.vat_rate).toBe("");
    expect(validateVentaFiscal({ ...VENTA_FISCAL_EMPTY, vat_rate: "abc" }).vat_rate).toMatch(/alícuota/i);
    expect(validateVentaFiscal({ ...VENTA_FISCAL_EMPTY, vat_rate: "101" }).vat_rate).toBeDefined();
    expect(ventaFiscalPayload({ ...VENTA_FISCAL_EMPTY, vat_rate: "10,5" })).toEqual({ vat: { rate: "10.5" } });
  });

  it("NUNCA envia la base del IVA (la deriva el backend)", () => {
    const p = JSON.stringify(ventaFiscalPayload({ ...VENTA_FISCAL_EMPTY, vat_rate: "21" }));
    expect(p).not.toContain("vat_base");
  });

  it("la permuta exige marca, modelo, anio, valor y origen; el origen no se supone", () => {
    const f = { ...VENTA_FISCAL_EMPTY, trade_in: true };
    expect(Object.keys(validateVentaFiscal(f)).sort()).toEqual(
      ["ti_acquisition_mode_code", "ti_make", "ti_model", "ti_value", "ti_year"].sort(),
    );
    const ok = { ...f, ti_make: "Toyota", ti_model: "Corolla", ti_year: "2018", ti_value: "5.000.000,50", ti_acquisition_mode_code: "consignacion" };
    expect(validateVentaFiscal(ok)).toEqual({});
    expect(ventaFiscalPayload(ok)).toEqual({
      trade_in: { value: "5000000.50", acquisition_mode_code: "consignacion", make: "Toyota", model: "Corolla", year: 2018 },
    });
  });

  it("el VIN, si se escribe, tiene 17 caracteres validos", () => {
    const base = { ...VENTA_FISCAL_EMPTY, trade_in: true, ti_make: "A", ti_model: "B", ti_year: "2018", ti_value: "100", ti_acquisition_mode_code: "compra_local" };
    expect(validateVentaFiscal({ ...base, ti_vin: "123" }).ti_vin).toBeDefined();
    expect(validateVentaFiscal({ ...base, ti_vin: "1HGCM82633A004352" })).toEqual({});
  });

  it("textos llanos para lo que el servidor rechaza", () => {
    expect(mensajeVenta("ESQUEMA_FISCAL_NO_APLICADO")).toMatch(/Disponible cuando se active la contabilidad fiscal/);
    expect(mensajeVenta("SALE_VAT_BASE_UNKNOWN")).toMatch(/factura/i);
    expect(mensajeVenta("SALE_COST_UNKNOWN")).toBeTruthy();
    expect(mensajeVenta("ALGO_RARO")).toBeNull();
  });
});

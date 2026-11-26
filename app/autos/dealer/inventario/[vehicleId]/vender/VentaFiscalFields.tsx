"use client";

/**
 * F4F-6 parte 3: alicuota, base del IVA (solo lectura) y permuta dentro de la venta.
 * La base la deriva el backend segun como se compro el vehiculo: se muestra, no se edita ni se envia.
 */
import { ORIGEN_USADO, type VentaFiscalForm } from "@/lib/dealer-management/venta-fiscal";

const FIELD =
  "mt-1 min-h-11 w-full min-w-0 max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg disabled:opacity-60 read-only:bg-nk-surface-2";
const LABEL = "block text-sm font-semibold text-nk-fg";

export function VentaFiscalFields({
  value,
  onChange,
  errors,
  baseIva = null,
  country = null,
}: {
  value: VentaFiscalForm;
  onChange: (next: VentaFiscalForm) => void;
  errors: Record<string, string>;
  /** Base que devolvio el servidor tras registrar; antes de eso se dice que la calcula el sistema. */
  baseIva?: string | null;
  country?: string | null;
}) {
  const set = (k: keyof VentaFiscalForm, v: string | boolean) => onChange({ ...value, [k]: v });
  const err = (k: string) =>
    errors[k] ? <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">{errors[k]}</span> : null;
  const campo = (k: keyof VentaFiscalForm, label: string, mode?: "decimal" | "numeric", max?: number) => (
    <label className="block min-w-0">
      <span className={LABEL}>{label}</span>
      <input
        name={k}
        value={String(value[k])}
        onChange={(e) => set(k, e.target.value)}
        inputMode={mode}
        maxLength={max}
        aria-invalid={errors[k] ? true : undefined}
        className={FIELD}
      />
      {err(k)}
    </label>
  );

  return (
    <fieldset data-testid="venta-fiscal" className="min-w-0 space-y-3">
      <legend className="text-sm font-bold text-nk-fg">{country === "DO" ? "ITBIS y permuta" : "IVA y permuta"}</legend>
      <label className="block min-w-0">
        <span className={LABEL}>{country === "DO" ? "ITBIS (%)" : "Alícuota del IVA (%)"}</span>
        <input
          name="vat_rate"
          readOnly={country === "DO"}
          value={value.vat_rate}
          onChange={(e) => set("vat_rate", e.target.value)}
          inputMode="decimal"
          aria-invalid={errors.vat_rate ? true : undefined}
          className={FIELD}
        />
        <span className="mt-1 block text-xs text-nk-fg-muted">
          {country === "DO"
            ? "En República Dominicana el ITBIS de la venta de un vehículo es 18 %. Va sobre el precio total en inventario propio y sobre la comisión en consignados."
            : country === "AR" ? "Indica la alícuota del IVA antes de registrar la venta."
            : "Indica la alícuota aplicable a la venta."}
        </span>
        {err("vat_rate")}
      </label>
      <label className="block min-w-0">
        <span className={LABEL}>{country === "DO" ? "Base del ITBIS" : "Base del IVA"}</span>
        <input
          data-testid="venta-base-iva"
          name="vat_base_display"
          readOnly
          tabIndex={-1}
          value={baseIva ?? "Se calcula al registrar"}
          className={FIELD}
        />
        <span className="mt-1 block text-xs text-nk-fg-muted">
          La calcula el sistema según cómo se compró: sobre la diferencia entre venta y costo (consignado o comprado a
          un particular) o sobre el precio completo (comprado con factura). No se puede cambiar.
        </span>
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold text-nk-fg">
        <input type="checkbox" checked={value.trade_in} onChange={(e) => set("trade_in", e.target.checked)} />
        Recibo un usado como parte de pago
      </label>
      {value.trade_in ? (
        <div data-testid="venta-permuta" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {campo("ti_value", "Valor de toma", "decimal")}
          <label className="block min-w-0">
            <span className={LABEL}>Origen del usado</span>
            <select
              name="ti_acquisition_mode_code"
              value={value.ti_acquisition_mode_code}
              onChange={(e) => set("ti_acquisition_mode_code", e.target.value)}
              aria-invalid={errors.ti_acquisition_mode_code ? true : undefined}
              className={FIELD}
            >
              <option value="">Elige el origen</option>
              {ORIGEN_USADO.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {err("ti_acquisition_mode_code")}
          </label>
          {campo("ti_make", "Marca")}
          {campo("ti_model", "Modelo")}
          {campo("ti_year", "Año", "numeric", 4)}
          {campo("ti_vin", "VIN (opcional)", undefined, 17)}
          {campo("ti_mileage_km", "Kilómetros (opcional)", "numeric")}
          {campo("ti_plate", "Patente (opcional)", undefined, 16)}
          <p data-testid="venta-permuta-consignado" className="text-xs text-nk-fg md:col-span-2">
            El usado entra a inventario. Si el vehículo que vendes es consignado, no se reconoce ganancia por esta
            permuta; si lo compraste con factura, se reconoce como parte de la venta. Lo decide el sistema según cómo
            compraste el vehículo que vendes, no según el origen del usado.
          </p>
        </div>
      ) : null}
    </fieldset>
  );
}

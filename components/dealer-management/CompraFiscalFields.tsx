"use client";

/**
 * F4F-6 parte 1: condicion fiscal del vendedor y comprobante (criterio del contador, punto 1).
 * Controlado: el estado vive en el formulario de la compra. Con un particular no hay factura, solo comprobante
 * interno; con una empresa se pide factura. La alicuota empieza vacia: no se supone.
 */
import { SELLER_TAX_STATUS, esParticular, conCondicion, tipoComprobante, type FiscalFields } from "@/lib/dealer-management/compra-fiscal";

const FIELD =
  "mt-1 min-h-11 w-full min-w-0 max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg disabled:cursor-not-allowed disabled:opacity-60";
const LABEL = "block text-sm font-semibold text-nk-fg";

export function CompraFiscalFields<T extends FiscalFields>({
  value,
  onChange,
  errors,
  disabled = false,
}: {
  value: T;
  onChange: (next: NoInfer<T>) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}) {
  const set = (name: keyof FiscalFields, v: string) => onChange({ ...value, [name]: v });
  const err = (k: string) =>
    errors[k] ? <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">{errors[k]}</span> : null;
  const campo = (name: keyof FiscalFields, label: string, opts: { maxLength?: number; inputMode?: "decimal" | "numeric"; ayuda?: string } = {}) => (
    <label className="block min-w-0">
      <span className={LABEL}>{label}</span>
      <input
        name={`purchase_${name}`}
        value={value[name]}
        onChange={(e) => set(name, e.target.value)}
        disabled={disabled}
        maxLength={opts.maxLength}
        inputMode={opts.inputMode}
        aria-invalid={errors[name] ? true : undefined}
        className={FIELD}
      />
      {opts.ayuda && !errors[name] ? <span className="mt-1 block text-xs text-nk-fg-muted">{opts.ayuda}</span> : null}
      {err(name)}
    </label>
  );
  const factura = conCondicion(value) && tipoComprobante(value) === "factura";

  return (
    <fieldset data-testid="compra-fiscal" className="min-w-0 space-y-3" disabled={disabled}>
      <legend className="text-sm font-bold text-nk-fg">Vendedor y comprobante</legend>
      <label className="block min-w-0">
        <span className={LABEL}>Condición fiscal del vendedor</span>
        <select
          name="purchase_seller_tax_status"
          value={value.seller_tax_status}
          onChange={(e) => set("seller_tax_status", e.target.value)}
          aria-invalid={errors.seller_tax_status ? true : undefined}
          className={FIELD}
        >
          <option value="">Sin indicar</option>
          {SELLER_TAX_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {!value.seller_tax_status ? (
          <span className="mt-1 block text-xs text-nk-fg-muted">
            Sin este dato la compra queda sin información fiscal y la venta de esta unidad no se podrá registrar.
          </span>
        ) : null}
        {err("seller_tax_status")}
      </label>

      {esParticular(value) ? (
        <p data-testid="compra-comprobante-interno" className="text-sm text-nk-fg">
          A un particular no se le pide factura: la compra se registra con un comprobante interno del sistema por la
          salida de fondos.
        </p>
      ) : null}

      {conCondicion(value) && !esParticular(value) ? (
        <label className="block min-w-0">
          <span className={LABEL}>Comprobante</span>
          <select
            name="purchase_voucher_kind"
            value={tipoComprobante(value)}
            onChange={(e) => set("voucher_kind", e.target.value)}
            className={FIELD}
          >
            <option value="factura">Factura del vendedor</option>
            <option value="interno">Todavía no tengo la factura (comprobante interno)</option>
          </select>
          {tipoComprobante(value) === "interno" ? (
            <span className="mt-1 block text-xs text-nk-fg-muted">
              La venta no se podrá registrar hasta cargar la factura de esta compra.
            </span>
          ) : null}
        </label>
      ) : null}

      {factura ? (
        <div data-testid="compra-factura" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block min-w-0">
            <span className={LABEL}>Letra de la factura</span>
            <select
              name="purchase_invoice_letter"
              value={value.invoice_letter}
              onChange={(e) => set("invoice_letter", e.target.value)}
              aria-invalid={errors.invoice_letter ? true : undefined}
              className={FIELD}
            >
              <option value="">Elige la letra</option>
              {["A", "B", "C"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            {err("invoice_letter")}
          </label>
          {campo("invoice_pos", "Punto de venta", { maxLength: 5, inputMode: "numeric" })}
          {campo("invoice_number", "Número de factura", { maxLength: 8, inputMode: "numeric" })}
          {campo("net_amount", "Neto de la factura", { inputMode: "decimal", ayuda: "Sin IVA. Ejemplo: 1000000,00." })}
          {campo("vat_amount", "IVA de la factura", { inputMode: "decimal" })}
          {campo("vat_rate", "Alícuota del IVA (%)", { inputMode: "decimal", ayuda: "Tal como figura en la factura. No se completa sola." })}
        </div>
      ) : null}
    </fieldset>
  );
}

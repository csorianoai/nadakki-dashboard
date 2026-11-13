"use client";

/**
 * Seccion "Compra" del alta de vehiculo (F4C-5, 3.1 de backend#2548).
 *
 * Es controlada: el estado y la validacion viven en `VehicleManualForm` (que usa
 * `validatePurchase`). Aqui solo se pintan los campos, la suma de pagos contra
 * el costo y los errores junto a su campo.
 *
 * Sin selector del contacto vendedor (F4C-7) no hay compra posible: la seccion
 * va deshabilitada con "Disponible cuando ..." y no se inventa ningun contacto.
 */

import type { ReactNode } from "react";
import {
  DOC_ITEMS,
  EMPTY_LINE,
  FX_SOURCES,
  PAYMENT_METHODS,
  centavos,
  sumaPagos,
  type PaymentLine,
  type PurchaseErrors,
  type PurchaseForm,
} from "@/lib/dealer-management/vehicle-purchase";

const FIELD =
  "mt-1 min-h-11 w-full max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg disabled:cursor-not-allowed disabled:opacity-60";
const LABEL = "block text-sm font-semibold text-nk-fg";

export type SellerSelectorProps = { value: string; onChange: (id: string) => void; error?: string };

export type VehiclePurchaseSectionProps = {
  value: PurchaseForm;
  onChange: (next: PurchaseForm) => void;
  errors: PurchaseErrors;
  functionalCurrency: string | null;
  busy?: boolean;
  sellerSelector?: (props: SellerSelectorProps) => ReactNode;
};

/** Misma regla fail-closed que `validatePurchase`: sin moneda funcional conocida se pide tipo de cambio. */
function needsFx(moneda: string, functionalCurrency: string | null): boolean {
  return !functionalCurrency?.trim() || moneda !== functionalCurrency.trim().toUpperCase();
}

/** Centavos -> "1.234,50" (es-AR), para decir en pantalla cuanto suman los pagos. */
function formatoCentavos(n: number): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n / 100);
}

export function VehiclePurchaseSection({
  value,
  onChange,
  errors,
  functionalCurrency,
  busy = false,
  sellerSelector,
}: VehiclePurchaseSectionProps) {
  const unavailable = !sellerSelector;
  const off = busy || unavailable;
  const set = (name: keyof PurchaseForm, v: string) => onChange({ ...value, [name]: v });
  const setLine = (i: number, patch: Partial<PaymentLine>) =>
    onChange({ ...value, payment_lines: value.payment_lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

  const moneda = value.currency.trim().toUpperCase();
  const fx = needsFx(moneda, functionalCurrency);
  const costo = centavos(value.cost);
  const suma = sumaPagos(value.payment_lines);

  function text(name: keyof PurchaseForm, label: string, opts: { type?: string; maxLength?: number; ayuda?: string; inputMode?: "decimal" } = {}) {
    const error = errors[name];
    return (
      <label className="block">
        <span className={LABEL}>{label}</span>
        <input
          name={`purchase_${name}`}
          type={opts.type ?? "text"}
          value={value[name] as string}
          onChange={(e) => set(name, e.target.value)}
          disabled={off}
          maxLength={opts.maxLength}
          inputMode={opts.inputMode}
          aria-invalid={error ? true : undefined}
          className={FIELD}
        />
        {opts.ayuda && !error ? <span className="mt-1 block text-xs text-nk-fg-muted">{opts.ayuda}</span> : null}
        {error ? <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
      </label>
    );
  }

  function err(key: string) {
    return errors[key] ? <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">{errors[key]}</span> : null;
  }

  return (
    <section data-testid="vehicle-purchase" className="space-y-3 rounded-xl border border-nk-border bg-nk-surface p-4">
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Compra</h2>
      {unavailable ? (
        <p data-testid="purchase-unavailable" className="text-sm text-nk-fg-muted">
          Disponible cuando el selector del contacto vendedor (Contactos) esté activo. Hasta entonces la compra no se
          puede registrar desde aquí.
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {text("cost", "Costo de compra *", { inputMode: "decimal", ayuda: "Sin IVA recuperable. Ejemplo: 18500000,50." })}
        {text("acquired_on", "Fecha de adquisición *", { type: "date" })}
        {text("currency", "Moneda de la compra *", { maxLength: 3, ayuda: "Código de 3 letras." })}
        {text("country_code", "País de adquisición *", { maxLength: 2, ayuda: "Código de 2 letras." })}
        {text("acquisition_mode_code", "Código de adquisición *", { maxLength: 40, ayuda: "El vigente en tu concesionario." })}
        {text("engine_number", "Número de motor (privado)", { maxLength: 40, ayuda: "Solo lo ves tú; no se publica." })}
      </div>

      {fx ? (
        <div className="grid gap-3 md:grid-cols-2" data-testid="purchase-fx">
          {text("fx_rate", "Tipo de cambio *", { inputMode: "decimal" })}
          {text("fx_as_of", "Fecha del tipo de cambio *", { type: "date" })}
          <label className="block">
            <span className={LABEL}>Fuente del tipo de cambio *</span>
            <select
              name="purchase_fx_source"
              value={value.fx_source}
              onChange={(e) => set("fx_source", e.target.value)}
              disabled={off}
              className={FIELD}
            >
              <option value="">Elige una fuente</option>
              {FX_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {err("fx_source")}
          </label>
          {value.fx_source === "otra" ? text("fx_source_detail", "Detalle de la fuente *", { maxLength: 200 }) : null}
        </div>
      ) : null}

      <fieldset className="space-y-3" disabled={off}>
        <legend className="text-sm font-bold text-nk-fg">Pagos</legend>
        {value.payment_lines.map((line, i) => (
          <div key={i} className="grid gap-3 rounded-r-sm border border-nk-border p-3 md:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Medio de pago {i + 1}</span>
              <select
                value={line.method}
                onChange={(e) => setLine(i, { method: e.target.value as PaymentLine["method"] })}
                className={FIELD}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              {err(`payment_${i}_method`)}
            </label>
            <label className="block">
              <span className={LABEL}>Importe del pago {i + 1}</span>
              <input value={line.amount} inputMode="decimal" onChange={(e) => setLine(i, { amount: e.target.value })} className={FIELD} />
              {err(`payment_${i}_amount`)}
            </label>
            {line.method === "cheque" ? (
              <>
                <label className="block">
                  <span className={LABEL}>Número del cheque {i + 1}</span>
                  <input value={line.cheque_number} onChange={(e) => setLine(i, { cheque_number: e.target.value })} className={FIELD} />
                  {err(`payment_${i}_cheque_number`)}
                </label>
                <label className="block">
                  <span className={LABEL}>Banco del cheque {i + 1}</span>
                  <input value={line.bank} onChange={(e) => setLine(i, { bank: e.target.value })} className={FIELD} />
                  {err(`payment_${i}_bank`)}
                </label>
                <label className="block">
                  <span className={LABEL}>Fecha de cobro {i + 1}</span>
                  <input type="date" value={line.cobro_date} onChange={(e) => setLine(i, { cobro_date: e.target.value })} className={FIELD} />
                  {err(`payment_${i}_cobro_date`)}
                </label>
              </>
            ) : null}
            {line.method === "other" ? (
              <label className="block">
                <span className={LABEL}>Detalle del pago {i + 1}</span>
                <input value={line.detail} onChange={(e) => setLine(i, { detail: e.target.value })} className={FIELD} />
                {err(`payment_${i}_detail`)}
              </label>
            ) : null}
            {value.payment_lines.length > 1 ? (
              <button
                type="button"
                aria-label={`Quitar pago ${i + 1}`}
                onClick={() => onChange({ ...value, payment_lines: value.payment_lines.filter((_, j) => j !== i) })}
                className="min-h-11 self-end rounded-full border border-nk-border px-4 text-sm font-semibold text-nk-fg"
              >
                Quitar pago
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...value, payment_lines: [...value.payment_lines, EMPTY_LINE] })}
          disabled={value.payment_lines.length >= 20}
          className="min-h-11 rounded-full border border-nk-border px-4 text-sm font-semibold text-nk-fg disabled:opacity-60"
        >
          Agregar pago
        </button>
        <p data-testid="purchase-sum" aria-live="polite" className="text-sm text-nk-fg">
          Pagos: {formatoCentavos(suma)} de {costo === null ? "—" : formatoCentavos(costo)}
          {costo !== null && suma === costo ? " ✓" : ""}
        </p>
        {err("payment_sum")}
      </fieldset>

      <div>
        <span className={LABEL}>Contacto vendedor *</span>
        {sellerSelector ? (
          sellerSelector({ value: value.seller_contact_id, onChange: (id) => set("seller_contact_id", id), error: errors.seller_contact_id })
        ) : (
          <p className="mt-1 text-sm text-nk-fg-muted">Disponible cuando el selector de contactos esté activo.</p>
        )}
        {err("seller_contact_id")}
      </div>

      <fieldset className="space-y-2" disabled={busy}>
        <legend className="text-sm font-bold text-nk-fg">Documentación recibida (informativo)</legend>
        <p className="text-xs text-nk-fg-muted">Es solo un recordatorio: no se envía ni bloquea la compra.</p>
        <div className="flex flex-wrap gap-4">
          {DOC_ITEMS.map((d) => (
            <label key={d.key} className="flex min-h-11 items-center gap-2 text-sm text-nk-fg">
              <input
                type="checkbox"
                checked={value.docs[d.key]}
                onChange={(e) => onChange({ ...value, docs: { ...value.docs, [d.key]: e.target.checked } })}
              />
              {d.key === "cheque" ? "Cheque (documentación)" : d.label}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

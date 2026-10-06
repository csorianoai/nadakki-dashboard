"use client";

/**
 * Panel de costos de UN vehiculo: total por moneda y alta de costo.
 *
 * No pinta una tabla de asientos: el backend no tiene GET de la lista, solo
 * `/costs/total`. Decirlo es mas util que inventar filas.
 *
 * Reparacion no es un tipo mas: viaja por POST /repair-invoices y exige
 * proveedor, n.o de factura y el `document_id` de un documento ya subido. El
 * dealer no escribe ese id: elige el archivo en "Subir factura", se sube por
 * POST /documents y el id que devuelve rellena el campo. El enrutado lo decide
 * `postCost`.
 *
 * Al registrar se espera a releer el total ANTES de confirmar, para que "Costo
 * registrado." y el total nuevo lleguen juntos. Un error se dice en castellano;
 * el codigo queda aparte, para soporte.
 */

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccessApiError } from "@/lib/access/client";
import { formateaMoneda, type LocaleTenant } from "@/lib/dealer-management/formato";
import {
  AYUDA_POR_TIPO_DE_COSTO,
  AYUDA_REVERSIONES,
  REGLAS_CONTABLES,
  REGLAS_CONTABLES_BASE,
  REGLAS_CONTABLES_CIERRE,
  REGLAS_CONTABLES_TITULO,
} from "./ayuda-contable";
import {
  COSTS_LIST_MISSING_ENDPOINT,
  COST_FORM_EMPTY,
  COST_PENDING_FIELDS,
  COST_TYPES,
  FACTURA_MAX_BYTES,
  esReparacion,
  fetchVehicleCostTotals,
  mensajeDeErrorCosto,
  postCost,
  totalEnMoneda,
  uploadRepairInvoice,
  validateCostForm,
  type CostForm,
  type CostFormErrors,
  type CostTotalRow,
} from "@/lib/dealer-management/vehicle-costs";

const FIELD_CLASS =
  "mt-1 min-h-11 w-full max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg disabled:cursor-not-allowed disabled:opacity-60";

const LABEL_CLASS = "block text-sm font-semibold text-nk-fg";

const CARD_CLASS = "rounded-xl border border-nk-border bg-nk-surface p-4";

/**
 * Los tres que `RepairInvoiceIn` exige. No son opcionales. `document_id` se
 * pinta como "Subir factura" (archivo), no como texto: lo rellena la subida.
 */
const REPAIR_FIELDS = [
  { name: "supplier_name", label: "Proveedor" },
  { name: "invoice_number", label: "N.º de factura" },
  { name: "document_id", label: "Subir factura" },
] as const;

function reasonOf(error: unknown): string {
  if (error instanceof AccessApiError) return error.reason_code ?? `HTTP_${error.status}`;
  return "DEFAULT_DENY";
}

/** Formatea con la moneda de la FILA, no con una escrita a mano. */
function importe(row: CostTotalRow, locale: LocaleTenant): string {
  return formateaMoneda(row.total, { locale: locale.locale, currency: row.currency });
}

export function CostosVehiculoPanel({
  vehicleId,
  tenantId,
  locale,
}: {
  vehicleId: string;
  tenantId: string;
  locale: LocaleTenant;
}) {
  const client = useQueryClient();
  const [form, setForm] = useState<CostForm>(COST_FORM_EMPTY);
  const [errors, setErrors] = useState<CostFormErrors>({});
  const [ack, setAck] = useState<string | null>(null);
  const [factura, setFactura] = useState<{ nombre: string; error: unknown } | null>(null);

  const totals = useQuery({
    queryKey: ["vehicle-cost-totals", tenantId, vehicleId],
    queryFn: () => fetchVehicleCostTotals(vehicleId, tenantId),
    retry: false,
  });

  const alta = useMutation({
    mutationFn: (payload: CostForm) =>
      postCost(vehicleId, tenantId, payload, locale.currency as string),
    onSuccess: async () => {
      setForm({ ...COST_FORM_EMPTY, cost_type: form.cost_type });
      setFactura(null);
      await client.refetchQueries({ queryKey: ["vehicle-cost-totals", tenantId, vehicleId] });
      setAck("Costo registrado.");
    },
  });

  const subida = useMutation({
    mutationFn: (file: File) => uploadRepairInvoice(vehicleId, tenantId, file),
    onSuccess: (id) => setForm((prev) => ({ ...prev, document_id: id })),
    onError: (error, file) => setFactura({ nombre: file.name, error }),
  });

  function elegirFactura(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setForm((prev) => ({ ...prev, document_id: "" }));
    if (!file) return setFactura(null);
    if (file.size > FACTURA_MAX_BYTES) {
      return setFactura({ nombre: file.name, error: new Error("413") });
    }
    setFactura({ nombre: file.name, error: null });
    subida.mutate(file);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAck(null);
    const found = validateCostForm(form, locale.currency);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    alta.mutate(form);
  }

  const reparacion = esReparacion(form.cost_type);
  const propio = totalEnMoneda(totals.data ?? [], locale.currency);
  const otras = (totals.data ?? []).filter((row) => row.currency !== propio?.currency);

  return (
    <div className="space-y-4">
      <section className={CARD_CLASS} data-testid="costos-total">
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Costo total acumulado</h2>
        {totals.isPending || totals.isLoading ? (
          <p className="mt-2 animate-pulse text-sm text-nk-fg-muted">Cargando el total…</p>
        ) : totals.error ? (
          <p
            role="alert"
            data-testid="costos-total-error"
            data-reason-code={reasonOf(totals.error)}
            className="mt-2 text-sm text-nk-fg"
          >
            No se pudo leer el total de costos. {mensajeDeErrorCosto(totals.error)}
          </p>
        ) : !locale.currency ? (
          <p role="alert" data-testid="costos-sin-moneda" className="mt-2 text-sm text-nk-fg">
            Falta la moneda funcional del tenant. El total no se muestra con una moneda inventada.
          </p>
        ) : (
          <>
            <p data-testid="costos-total-valor" className="mt-2 font-manrope text-2xl font-extrabold text-nk-fg">
              {importe(propio ?? { currency: locale.currency, total: 0 }, locale)}
            </p>
            {propio ? null : (
              <p className="mt-1 text-sm text-nk-fg-muted">
                Todavía no hay costos registrados en {locale.currency} para este vehículo.
              </p>
            )}
            {otras.length > 0 ? (
              <div className="mt-3" data-testid="costos-otras-monedas">
                <p className="text-xs font-bold uppercase tracking-wide text-nk-fg-muted">
                  Costos en otras monedas · no se suman
                </p>
                <ul className="mt-1 space-y-1 text-sm text-nk-fg">
                  {otras.map((row) => <li key={row.currency}>{importe(row, locale)}</li>)}
                </ul>
              </div>
            ) : null}
          </>
        )}
        {ack ? (
          <p data-testid="costos-total-actualizado" className="mt-1 text-xs font-semibold text-nk-fg">
            El total ya incluye el último costo registrado.
          </p>
        ) : null}
        <p data-missing-endpoint={COSTS_LIST_MISSING_ENDPOINT} className="mt-3 text-xs text-nk-fg-muted">
          Por ahora se muestra el total por moneda; el detalle de cada costo todavía no está disponible.
        </p>
      </section>

      <form onSubmit={submit} noValidate data-testid="costo-alta-form" className={`${CARD_CLASS} space-y-3`}>
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Registrar un costo</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className={LABEL_CLASS}>Tipo de costo</span>
            <select
              name="cost_type"
              value={form.cost_type}
              onChange={(event) => setForm({ ...form, cost_type: event.target.value })}
              disabled={alta.isPending}
              className={FIELD_CLASS}
            >
              {COST_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {/* Ayuda del tipo ELEGIDO: la regla se lee donde se decide, no en
                una pagina aparte. Un tipo sin ayuda no pinta nada en vez de un
                texto de relleno. */}
            {AYUDA_POR_TIPO_DE_COSTO[form.cost_type] ? (
              <span
                data-testid="ayuda-tipo-de-costo"
                data-cost-type={form.cost_type}
                className="mt-1 block text-xs text-nk-fg-muted"
              >
                {AYUDA_POR_TIPO_DE_COSTO[form.cost_type]}
              </span>
            ) : null}
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Monto</span>
            <input
              name="amount"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              inputMode="decimal"
              disabled={alta.isPending}
              aria-invalid={errors.amount ? true : undefined}
              className={FIELD_CLASS}
            />
            {errors.amount ? (
              <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">
                {errors.amount}
              </span>
            ) : null}
          </label>
          <div>
            <span className={LABEL_CLASS}>Moneda</span>
            <p data-testid="costo-moneda" className="mt-1 min-h-11 pt-3 text-sm font-bold text-nk-fg">
              {locale.currency ?? "sin moneda funcional configurada"}
            </p>
          </div>
          <label className="block">
            <span className={LABEL_CLASS}>Fecha</span>
            <input
              type="date"
              name="incurred_at"
              value={form.incurred_at}
              onChange={(event) => setForm({ ...form, incurred_at: event.target.value })}
              disabled={alta.isPending}
              aria-invalid={errors.incurred_at ? true : undefined}
              className={FIELD_CLASS}
            />
            {errors.incurred_at ? (
              <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">
                {errors.incurred_at}
              </span>
            ) : null}
          </label>
        </div>

        {reparacion ? (
          <div data-testid="costo-reparacion" className="grid gap-3 rounded-r-sm border border-nk-border p-3 md:grid-cols-3">
            <p className="text-xs text-nk-fg-muted md:col-span-3">
              Una reparación necesita proveedor, n.º de factura y la factura subida (PDF o foto, hasta 10 MB).
            </p>
            {REPAIR_FIELDS.map((field) =>
              field.name === "document_id" ? (
                <label key={field.name} className="block">
                  <span className={LABEL_CLASS}>
                    {field.label}
                    <span aria-hidden> *</span>
                  </span>
                  <input
                    type="file"
                    name={field.name}
                    accept=".pdf,image/*"
                    onChange={elegirFactura}
                    disabled={alta.isPending || subida.isPending}
                    aria-invalid={errors.document_id || factura?.error ? true : undefined}
                    className="mt-1 block w-full max-w-full text-sm text-nk-fg"
                  />
                  <span data-testid="costo-factura-estado" className="mt-1 block text-xs text-nk-fg-muted">
                    {subida.isPending
                      ? "Subiendo la factura…"
                      : form.document_id
                        ? `Factura subida: ${factura?.nombre ?? "lista"}`
                        : null}
                  </span>
                  {factura?.error ? (
                    <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">
                      No se pudo subir la factura. {factura.error instanceof Error && factura.error.message === "413"
                        ? "El archivo pesa más de 10 MB."
                        : mensajeDeErrorCosto(factura.error)}
                    </span>
                  ) : errors.document_id ? (
                    <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">
                      {errors.document_id}
                    </span>
                  ) : null}
                </label>
              ) : (
              <label key={field.name} className="block">
                <span className={LABEL_CLASS}>
                  {field.label}
                  <span aria-hidden> *</span>
                </span>
                <input
                  name={field.name}
                  value={form[field.name]}
                  onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                  disabled={alta.isPending}
                  aria-invalid={errors[field.name] ? true : undefined}
                  className={FIELD_CLASS}
                />
                {errors[field.name] ? (
                  <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">
                    {errors[field.name]}
                  </span>
                ) : null}
              </label>
              ),
            )}
          </div>
        ) : null}

        <div data-testid="costo-pendientes" className="rounded-r-sm border border-dashed border-nk-border p-3">
          <p className="text-xs text-nk-fg-muted">
            Esto el contrato todavía no lo acepta, así que no se habilita: lo que se escribiera aquí no
            quedaría registrado.
          </p>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            {COST_PENDING_FIELDS.map((field) => (
              <label key={field.name} className="block">
                <span className={LABEL_CLASS}>{field.label} · Próximamente</span>
                <input name={field.name} value="" disabled readOnly className={FIELD_CLASS} />
              </label>
            ))}
          </div>
        </div>

        {errors.currency ? (
          <p role="alert" data-testid="costo-sin-moneda" className="text-sm font-semibold text-nk-fg">
            {errors.currency}
          </p>
        ) : null}

        {alta.error ? (
          <p
            role="alert"
            data-testid="costo-alta-error"
            data-reason-code={reasonOf(alta.error)}
            className="text-sm text-nk-fg"
          >
            No se pudo registrar el costo. {mensajeDeErrorCosto(alta.error)}
            <span className="mt-1 block text-xs text-nk-fg-muted">Código para soporte: {reasonOf(alta.error)}</span>
          </p>
        ) : null}

        {ack ? (
          <p role="status" data-testid="costo-alta-ack" className="text-sm font-semibold text-nk-fg">
            {ack}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={alta.isPending || subida.isPending || !locale.currency}
          className="min-h-11 w-full rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-bold text-nk-fg disabled:opacity-60 sm:w-auto"
        >
          {alta.isPending ? "Registrando…" : "Registrar costo"}
        </button>

        {/* Reglas de carga, verbatim de GUIA-CARGA-MAPAAL. Van en el formulario
            porque son la diferencia entre capitalizar el neto y capitalizar el
            IVA recuperable, y eso se decide al escribir el monto. */}
        <section data-testid="reglas-contables-costos" className="mt-4 rounded-xl border border-nk-border p-3">
          <h3 className="text-sm font-semibold text-nk-fg">{REGLAS_CONTABLES_TITULO}</h3>
          <p className="mt-1 text-xs text-nk-fg-muted">{REGLAS_CONTABLES_BASE}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-nk-fg-muted">
            {REGLAS_CONTABLES.map((regla) => (
              <li key={regla}>{regla}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-nk-fg-muted">{REGLAS_CONTABLES_CIERRE}</p>
          <p className="mt-2 text-xs text-nk-fg-muted">{AYUDA_REVERSIONES}</p>
        </section>
      </form>
    </div>
  );
}

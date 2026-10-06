"use client";

/**
 * Edicion de precio, referencia, dominio y n.o de stock en la ficha, y el paso
 * a DISPONIBLE (P2 del backend, #1545 y #1564).
 *
 * "Pasar a DISPONIBLE" solo se ofrece con un precio YA GUARDADO: el backend lo
 * exige (`PRICE_REQUIRED_FOR_DISPONIBLE`) y un boton que siempre falla no ayuda.
 * Sin precio se dice que falta, en vez de esconder la accion.
 *
 * Errores en español junto al campo; el `reason_code` del backend se traduce al
 * campo que hay que corregir con la misma tabla que el alta.
 */

import { useMemo, useState, type FormEvent } from "react";
import { AccessApiError } from "@/lib/access/client";
import type { DealerVehicleStatusRow } from "@/lib/dealer/vehicle-status";
import { localeDeTenant } from "@/lib/dealer-management/formato";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import {
  ESTADOS_PUBLICABLES,
  cambiosDeEdicion,
  formDeFicha,
  guardarEdicion,
  pasarADisponible,
  validarEdicion,
} from "@/lib/dealer-management/vehicle-edit";
import {
  MOTIVO_EN_CAMPO,
  vehiclePriceFields,
  type VehicleDealerIdentity,
  type VehicleFormErrors,
  type VehicleManualForm,
} from "@/lib/dealer-management/vehicle-manual";

const FIELD_CLASS =
  "mt-1 min-h-11 w-full max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg disabled:opacity-60";
const BOTON =
  "min-h-11 w-full rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-bold text-nk-fg disabled:opacity-60 sm:w-auto";

type Campo = { name: keyof VehicleManualForm; label: string; maxLength?: number; decimal?: boolean };

function nuevaClave(): string | undefined {
  const api = typeof globalThis.crypto === "undefined" ? null : globalThis.crypto;
  return typeof api?.randomUUID === "function" ? api.randomUUID() : undefined;
}

function codigoDe(error: unknown): string {
  return error instanceof AccessApiError ? (error.reason_code ?? `HTTP_${error.status}`) : "SIN_RESPUESTA";
}

export type VehicleEditPanelProps = {
  ficha: DealerVehicleStatusRow;
  context: VehicleDealerIdentity | null;
  onSaved: () => void;
};

export function VehicleEditPanel({ ficha, context, onSaved }: VehicleEditPanelProps) {
  const original = useMemo(() => formDeFicha(ficha), [ficha]);
  const [form, setForm] = useState<VehicleManualForm>(original);
  const [errors, setErrors] = useState<VehicleFormErrors>({});
  const [codigo, setCodigo] = useState<string | null>(null);
  const [ack, setAck] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const branding = useDealerManagementBranding();
  const moneda = useMemo(() => localeDeTenant(branding.data).currency, [branding.data]);
  const [precio, referencia] = vehiclePriceFields(moneda, form.display_price_currency.trim() || null);
  const motivo = codigo ? MOTIVO_EN_CAMPO[codigo] : undefined;

  const campos: Campo[] = [
    { name: "price_amount", label: precio.label, decimal: true },
    { name: "display_price_amount", label: referencia.label, decimal: true },
    { name: "display_price_currency", label: "Moneda de la referencia", maxLength: 3 },
    { name: "plate", label: "Dominio", maxLength: 16 },
    { name: "plate_country", label: "País del dominio", maxLength: 2 },
    { name: "stock_number", label: "Número de stock", maxLength: 32 },
  ];

  const publicable = ESTADOS_PUBLICABLES.has(ficha.status ?? "");
  const conPrecio = Boolean(ficha.price_amount);

  async function correr(accion: () => Promise<unknown>, exito: string) {
    if (!context) return;
    setBusy(true);
    setCodigo(null);
    setAck(null);
    try {
      await accion();
      setAck(exito);
      onSaved();
    } catch (error) {
      setCodigo(codigoDe(error));
    } finally {
      setBusy(false);
    }
  }

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validarEdicion(form, original, moneda);
    setErrors(found);
    setAck(null);
    if (Object.keys(found).length > 0 || !context) return;
    const cambios = cambiosDeEdicion(form, original);
    if (Object.keys(cambios).length === 0) {
      setAck("No hay cambios para guardar.");
      return;
    }
    void correr(() => guardarEdicion(context, ficha.id, cambios, nuevaClave()), "Cambios guardados.");
  }

  function publicar() {
    if (!context) return;
    void correr(() => pasarADisponible(context, ficha.id, nuevaClave()), "El vehículo quedó DISPONIBLE.");
  }

  return (
    <section data-testid="vehicle-edit-panel" className="space-y-4 rounded-r-sm border border-nk-border bg-nk-surface p-4">
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Precio, dominio y stock</h2>
      <form onSubmit={guardar} noValidate data-testid="vehicle-edit-form" className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {campos.map((campo) => {
            const error = errors[campo.name] ?? (motivo?.campo === campo.name ? motivo.mensaje : undefined);
            return (
              <label key={campo.name} className="block">
                <span className="block text-sm font-semibold text-nk-fg">{campo.label}</span>
                <input
                  name={campo.name}
                  value={form[campo.name]}
                  onChange={(event) => setForm((prev) => ({ ...prev, [campo.name]: event.target.value }))}
                  disabled={busy || !context}
                  maxLength={campo.maxLength}
                  inputMode={campo.decimal ? "decimal" : undefined}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `edit-${campo.name}-error` : undefined}
                  className={FIELD_CLASS}
                />
                {error ? (
                  <span id={`edit-${campo.name}-error`} role="alert" className="mt-1 block text-xs font-semibold text-red-600">
                    {error}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={busy || !context} className={BOTON}>
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
          {publicable && conPrecio ? (
            <button type="button" onClick={publicar} disabled={busy || !context} data-testid="vehicle-publicar" className={BOTON}>
              Pasar a DISPONIBLE
            </button>
          ) : null}
        </div>
        {publicable && !conPrecio ? (
          <p data-testid="vehicle-publicar-falta-precio" className="text-sm text-nk-fg-muted">
            Para pasar a DISPONIBLE primero cargá el precio y guardá.
          </p>
        ) : null}
      </form>
      {codigo && !motivo ? (
        <p role="alert" data-testid="vehicle-edit-error" data-reason-code={codigo} className="text-sm text-nk-fg">
          No se pudo guardar. Revisá los datos e intentá de nuevo.
          <span className="mt-1 block text-xs text-nk-fg-muted">Código para soporte: {codigo}</span>
        </p>
      ) : null}
      {ack ? (
        <p role="status" data-testid="vehicle-edit-ack" className="text-sm font-semibold text-nk-fg">
          {ack}
        </p>
      ) : null}
    </section>
  );
}

"use client";

import { useState } from "react";
import type { Contacto, ContactoPayload } from "./contactos-tipos";
import {
  IVA_CONDITIONS,
  KINDS,
  MARITAL_STATUSES,
  emailValido,
  validarCuit,
  validarDni,
} from "./contactos-validar";

type Errores = Record<string, string>;

const INPUT = "mt-1 w-full rounded-md border border-nk-border bg-nk-surface px-2 py-1.5 text-sm text-nk-fg";

function Campo(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  ayuda?: string;
  obligatorio?: boolean;
  disabled?: boolean;
  type?: string;
}) {
  const { id, label, value, onChange, error, ayuda, obligatorio, disabled, type } = props;
  const desc = [ayuda ? `${id}-ayuda` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-nk-fg">
        {label}
      </label>
      <input
        id={id}
        type={type ?? "text"}
        value={value}
        disabled={disabled}
        aria-required={obligatorio || undefined}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={desc}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1 text-xs text-nk-fg-muted">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function Selector(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  opciones: readonly { value: string; label: string }[];
  error?: string;
}) {
  const { id, label, value, onChange, opciones, error } = props;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-nk-fg">
        {label}
      </label>
      <select
        id={id}
        value={value}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      >
        <option value="">Elegir…</option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const REQ = "Obligatorio.";
const SIN_GUARDAR = [
  ["c-tel", "Teléfonos", "telefonos"], ["c-mail", "Email", "email", "email"], ["c-calle", "Calle", "calle"],
  ["c-loc", "Localidad", "localidad"], ["c-prov", "Provincia", "provincia"], ["c-cp", "Código postal", "cp"],
] as const satisfies readonly (readonly [string, string, string, string?])[];

/**
 * Alta y edicion. DNI/CUIT llegan enmascarados al editar: el campo arranca VACIO (nunca se reenvia la mascara) y solo
 * viaja lo que se escribe. Telefonos, email y direccion: el backend de F4C-3 aun no los guarda, se muestran
 * deshabilitados y NO se envian.
 */
export function ContactoForm({
  inicial,
  onSubmit,
  onCancel,
  enviando,
  errorServidor,
}: {
  inicial?: Contacto;
  onSubmit: (payload: ContactoPayload) => void;
  onCancel?: () => void;
  enviando?: boolean;
  errorServidor?: { reason_code: string | null; field: string | null } | null;
}) {
  const [f, setF] = useState({
    kind: inicial?.kind ?? "fisica",
    first_name: inicial?.first_name ?? "",
    last_name: inicial?.last_name ?? "",
    business_name: inicial?.business_name ?? "",
    dni: "",
    cuit: "",
    iva_condition: inicial?.iva_condition ?? "",
    iibb_number: inicial?.iibb_number ?? "",
    marital_status: inicial?.marital_status ?? "",
    spouse_first_name: inicial?.spouse_first_name ?? "",
    spouse_last_name: inicial?.spouse_last_name ?? "",
    spouse_dni: "",
    telefonos: "",
    email: "",
    calle: "",
    localidad: "",
    provincia: "",
    cp: "",
  });
  const [errores, setErrores] = useState<Errores>({});
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const fisica = f.kind === "fisica";
  const casado = fisica && f.marital_status === "casado";
  const e = (k: string) => errores[k] ?? (errorServidor?.field === k ? `El servidor rechazó este campo (${errorServidor.reason_code}).` : undefined);

  function validar(): Errores {
    const r: Errores = {};
    const vacio = (v: string) => !v.trim();
    if (fisica) {
      if (vacio(f.first_name)) r.first_name = REQ;
      if (vacio(f.last_name)) r.last_name = REQ;
    } else if (vacio(f.business_name)) r.business_name = REQ;
    if (f.dni && fisica) r.dni = validarDni(f.dni) ?? "";
    if (f.cuit) r.cuit = validarCuit(f.cuit) ?? "";
    if (vacio(f.dni) && vacio(f.cuit) && !(inicial?.dni || inicial?.cuit)) {
      r[fisica ? "dni" : "cuit"] = fisica ? "Falta el DNI o el CUIT." : "Falta el CUIT.";
    }
    if (vacio(f.iva_condition)) r.iva_condition = REQ;
    if (casado) {
      if (vacio(f.spouse_first_name)) r.spouse_first_name = "Casado/a: falta el nombre del cónyuge.";
      if (vacio(f.spouse_last_name)) r.spouse_last_name = "Casado/a: falta el apellido del cónyuge.";
      if (f.spouse_dni) r.spouse_dni = validarDni(f.spouse_dni) ?? "";
      else if (!inicial?.spouse_dni) r.spouse_dni = "Casado/a: falta el DNI del cónyuge.";
    }
    if (f.email && !emailValido(f.email)) r.email = "Email no válido.";
    return Object.fromEntries(Object.entries(r).filter(([, v]) => v));
  }

  function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length) return;
    const t = (v: string) => (v.trim() ? v.trim() : undefined);
    const p: ContactoPayload = {
      kind: f.kind,
      iva_condition: f.iva_condition,
      iibb_number: t(f.iibb_number),
    };
    if (fisica) {
      Object.assign(p, { first_name: t(f.first_name), last_name: t(f.last_name), marital_status: t(f.marital_status) });
      if (f.dni.trim()) p.dni = f.dni.trim().replace(/\./g, "");
    } else p.business_name = t(f.business_name);
    if (f.cuit.trim()) p.cuit = f.cuit.replace(/[-\s]/g, "");
    if (casado) {
      Object.assign(p, { spouse_first_name: t(f.spouse_first_name), spouse_last_name: t(f.spouse_last_name) });
      if (f.spouse_dni.trim()) p.spouse_dni = f.spouse_dni.trim().replace(/\./g, "");
    }
    if (inicial) delete p.kind; // PATCH no cambia el tipo
    onSubmit(Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
  }

  const resumen = Object.values(errores);
  const mascara = (m: string | null) => (m ? `Guardado: ${m}. Déjelo vacío para conservarlo.` : undefined);

  return (
    <form onSubmit={enviar} noValidate aria-label={inicial ? "Editar contacto" : "Nuevo contacto"} className="space-y-4">
      {(resumen.length > 0 || errorServidor) && (
        <div role="alert" className="rounded-md border border-red-700 bg-nk-surface p-3 text-sm text-red-700">
          {errorServidor ? `El servidor rechazó el contacto (${errorServidor.reason_code ?? "error"}).` : "Revise los campos marcados."}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {!inicial && <Selector id="c-kind" label="Tipo de persona" value={f.kind} onChange={set("kind")} opciones={KINDS} />}
        {fisica ? (
          <>
            <Campo id="c-first" label="Nombre" value={f.first_name} onChange={set("first_name")} error={e("first_name")} obligatorio />
            <Campo id="c-last" label="Apellido" value={f.last_name} onChange={set("last_name")} error={e("last_name")} obligatorio />
            <Campo id="c-dni" label="DNI" value={f.dni} onChange={set("dni")} error={e("dni")} ayuda={mascara(inicial?.dni ?? null)} />
          </>
        ) : (
          <Campo id="c-biz" label="Razón social" value={f.business_name} onChange={set("business_name")} error={e("business_name")} obligatorio />
        )}
        <Campo id="c-cuit" label="CUIT / CUIL" value={f.cuit} onChange={set("cuit")} error={e("cuit")} ayuda={mascara(inicial?.cuit ?? null)} />
        <Selector id="c-iva" label="Condición de IVA" value={f.iva_condition} onChange={set("iva_condition")} opciones={IVA_CONDITIONS} error={e("iva_condition")} />
        <Campo id="c-iibb" label="IIBB (número)" value={f.iibb_number} onChange={set("iibb_number")} error={e("iibb_number")} />
        {fisica && <Selector id="c-civil" label="Estado civil" value={f.marital_status} onChange={set("marital_status")} opciones={MARITAL_STATUSES} />}
      </div>
      {casado && (
        <fieldset className="grid grid-cols-1 gap-3 rounded-md border border-nk-border p-3 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium text-nk-fg">Cónyuge</legend>
          <Campo id="c-sp-first" label="Nombre del cónyuge" value={f.spouse_first_name} onChange={set("spouse_first_name")} error={e("spouse_first_name")} obligatorio />
          <Campo id="c-sp-last" label="Apellido del cónyuge" value={f.spouse_last_name} onChange={set("spouse_last_name")} error={e("spouse_last_name")} obligatorio />
          <Campo id="c-sp-dni" label="DNI del cónyuge" value={f.spouse_dni} onChange={set("spouse_dni")} error={e("spouse_dni")} ayuda={mascara(inicial?.spouse_dni ?? null)} obligatorio />
        </fieldset>
      )}
      <fieldset disabled className="grid grid-cols-1 gap-3 rounded-md border border-nk-border p-3 sm:grid-cols-2">
        <legend className="px-1 text-sm font-medium text-nk-fg">Contacto y dirección</legend>
        <p className="text-xs text-nk-fg-muted sm:col-span-2">
          Todavía no se guardan: el servidor de contactos (F4C-3) no tiene aún endpoint para teléfonos, email ni dirección.
        </p>
        {SIN_GUARDAR.map(([id, label, k, type]) => (
          <Campo key={id} id={id} label={label} value={f[k]} onChange={set(k)} disabled type={type} />
        ))}
      </fieldset>
      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className="rounded-md bg-nk-fg px-4 py-2 text-sm font-medium text-nk-surface">
          {enviando ? "Guardando…" : "Guardar"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border border-nk-border px-4 py-2 text-sm text-nk-fg">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

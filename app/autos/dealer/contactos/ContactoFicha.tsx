"use client";

import type { Contacto } from "./contactos-tipos";
import { IVA_CONDITIONS, KINDS, MARITAL_STATUSES } from "./contactos-validar";

const etiqueta = (lista: readonly { value: string; label: string }[], v: string | null) =>
  lista.find((x) => x.value === v)?.label ?? v ?? "—";

function Dato({ nombre, valor }: { nombre: string; valor: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-nk-fg-muted">{nombre}</dt>
      <dd className="text-sm text-nk-fg">{valor || "—"}</dd>
    </div>
  );
}

/** DNI y CUIT se pintan EXACTAMENTE como llegan: el backend los enmascara salvo gerente/contador. */
export function ContactoFicha({
  contacto: c,
  onEditar,
  onBaja,
  onReactivar,
}: {
  contacto: Contacto;
  onEditar?: () => void;
  onBaja?: () => void;
  onReactivar?: () => void;
}) {
  const baja = Boolean(c.deactivated_at);
  return (
    <section aria-label={`Ficha de ${c.display_name}`} className="rounded-xl border border-nk-border bg-nk-surface p-4">
      <h2 className="text-lg font-semibold text-nk-fg">{c.display_name}</h2>
      {baja && (
        <p className="mt-1 text-sm font-medium text-nk-fg">Dado de baja{c.deactivation_reason ? `: ${c.deactivation_reason}` : ""}</p>
      )}
      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Dato nombre="Tipo" valor={etiqueta(KINDS, c.kind)} />
        <Dato nombre="DNI" valor={c.dni} />
        <Dato nombre="CUIT/CUIL" valor={c.cuit} />
        <Dato nombre="Condición de IVA" valor={etiqueta(IVA_CONDITIONS, c.iva_condition)} />
        <Dato nombre="IIBB" valor={c.iibb_number} />
        {c.kind === "fisica" && <Dato nombre="Estado civil" valor={etiqueta(MARITAL_STATUSES, c.marital_status)} />}
        {c.marital_status === "casado" && (
          <>
            <Dato nombre="Cónyuge" valor={[c.spouse_first_name, c.spouse_last_name].filter(Boolean).join(" ")} />
            <Dato nombre="DNI del cónyuge" valor={c.spouse_dni} />
          </>
        )}
      </dl>
      <div className="mt-4 flex gap-2">
        {onEditar && (
          <button type="button" onClick={onEditar} className="rounded-md border border-nk-border px-3 py-1.5 text-sm text-nk-fg">
            Editar
          </button>
        )}
        {!baja && onBaja && (
          <button type="button" onClick={onBaja} className="rounded-md border border-nk-border px-3 py-1.5 text-sm text-nk-fg">
            Dar de baja
          </button>
        )}
        {baja && onReactivar && (
          <button type="button" onClick={onReactivar} className="rounded-md border border-nk-border px-3 py-1.5 text-sm text-nk-fg">
            Reactivar
          </button>
        )}
      </div>
    </section>
  );
}

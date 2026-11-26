"use client";

/** Comprador y forma de pago de la venta (decision de Cesar 26-nov, validacion Cowork). */

import { useState } from "react";
import Link from "next/link";
import { buscarContactos } from "@/app/autos/dealer/contactos/contactos-api";
import type { Contacto } from "@/app/autos/dealer/contactos/contactos-tipos";
import { PAYMENT_METHOD_LABELS, type CompradorYPago, type SalePaymentMethod } from "@/lib/dealer-management/vehicle-sale";

const FIELD = "mt-1 min-h-11 w-full max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg";

export function CompradorYPagoFields({ value, onChange, errors }: {
  value: CompradorYPago;
  onChange: (next: CompradorYPago) => void;
  errors: Record<string, string>;
}) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Contacto[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [falloBusqueda, setFalloBusqueda] = useState(false);

  async function buscar() {
    setBuscando(true);
    setFalloBusqueda(false);
    try {
      setResultados((await buscarContactos(texto, 20)).filter((c) => !c.deactivated_at));
    } catch {
      setResultados(null);
      setFalloBusqueda(true);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <fieldset data-testid="venta-comprador-pago" className="min-w-0 space-y-3">
      <legend className="text-sm font-bold text-nk-fg">Comprador y forma de pago</legend>
      {value.buyer_contact_id ? (
        <p className="text-sm text-nk-fg" data-testid="venta-comprador-elegido">
          Comprador: <strong>{value.buyer_name}</strong>{" "}
          <button type="button" className="underline" onClick={() => onChange({ ...value, buyer_contact_id: "", buyer_name: "" })}>
            Cambiar
          </button>
        </p>
      ) : (
        <div className="min-w-0">
          <label className="block text-sm text-nk-fg">
            Buscar comprador (nombre, DNI o CUIT)
            <input
              name="buyer_search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void buscar(); } }}
              className={FIELD}
            />
          </label>
          <button type="button" onClick={() => void buscar()} disabled={buscando}
            className="mt-2 min-h-11 rounded-full border border-brand-2 px-4 text-sm font-semibold text-nk-fg">
            Buscar
          </button>
          {falloBusqueda ? <p role="alert" className="text-sm">No se pudo buscar en tus contactos. Intenta de nuevo.</p> : null}
          {resultados && resultados.length === 0 ? (
            <p className="text-sm">
              No hay contactos con ese dato.{" "}
              <Link href="/autos/dealer/contactos" target="_blank" className="underline">Dar de alta un contacto</Link>
            </p>
          ) : null}
          {resultados && resultados.length > 0 ? (
            <ul className="mt-2 space-y-1" aria-label="Contactos encontrados">
              {resultados.map((c) => (
                <li key={c.id}>
                  <button type="button" className="min-h-11 w-full rounded border border-nk-border px-3 text-left text-sm"
                    onClick={() => onChange({ ...value, buyer_contact_id: c.id, buyer_name: c.display_name })}>
                    {c.display_name}{c.dni ? ` · DNI ${c.dni}` : c.cuit ? ` · CUIT ${c.cuit}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {errors.buyer_contact_id ? <span role="alert" className="text-xs">{errors.buyer_contact_id}</span> : null}
        </div>
      )}
      <div role="radiogroup" aria-label="Forma de pago" className="space-y-1">
        {(Object.keys(PAYMENT_METHOD_LABELS) as SalePaymentMethod[]).map((m) => (
          <label key={m} className="flex min-h-11 items-center gap-2 text-sm text-nk-fg">
            <input type="radio" name="payment_method" value={m} checked={value.payment_method === m}
              onChange={() => onChange({ ...value, payment_method: m })} />
            {PAYMENT_METHOD_LABELS[m]}
          </label>
        ))}
        {errors.payment_method ? <span role="alert" className="text-xs">{errors.payment_method}</span> : null}
      </div>
    </fieldset>
  );
}

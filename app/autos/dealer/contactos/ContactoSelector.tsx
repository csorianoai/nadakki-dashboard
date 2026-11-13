"use client";

import { useState } from "react";
import { buscarContactos, errorContacto } from "./contactos-api";
import type { Contacto } from "./contactos-tipos";

/**
 * Selector de contacto para compra y venta (lo consumen F4C-5-ALTA-UI y F4C-6-FICHA-UI). Busca por nombre, DNI o
 * CUIT; DNI/CUIT se muestran tal como llegan (enmascarados salvo gerente/contador).
 */
export function ContactoSelector({
  rol,
  onSelect,
}: {
  rol: "vendedor" | "comprador";
  onSelect: (contacto: Contacto) => void;
}) {
  const [texto, setTexto] = useState("");
  const [items, setItems] = useState<Contacto[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buscar() {
    setCargando(true);
    setError(null);
    try {
      setItems(await buscarContactos(texto));
    } catch (e) {
      setItems(null);
      setError(errorContacto(e).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={`sel-${rol}`} className="text-sm font-medium text-nk-fg">
        Buscar contacto ({rol})
      </label>
      <div className="flex gap-2">
        <input
          id={`sel-${rol}`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void buscar())}
          placeholder="Nombre, DNI o CUIT"
          className="w-full rounded-md border border-nk-border bg-nk-surface px-2 py-1.5 text-sm text-nk-fg"
        />
        <button type="button" onClick={() => void buscar()} className="rounded-md border border-nk-border px-3 py-1.5 text-sm text-nk-fg">
          Buscar
        </button>
      </div>
      {cargando && <p role="status" className="text-sm text-nk-fg-muted">Buscando…</p>}
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      {items && items.length === 0 && <p className="text-sm text-nk-fg-muted">Sin resultados.</p>}
      {items && items.length > 0 && (
        <ul role="listbox" aria-label={`Contactos para ${rol}`} className="divide-y divide-nk-border rounded-md border border-nk-border">
          {items.map((c) => (
            <li key={c.id} role="none">
              <button type="button" role="option" aria-selected={false} onClick={() => onSelect(c)} className="w-full px-3 py-2 text-left text-sm text-nk-fg">
                {c.display_name}
                <span className="ml-2 text-xs text-nk-fg-muted">{c.cuit ?? c.dni ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

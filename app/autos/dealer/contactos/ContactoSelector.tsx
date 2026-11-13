"use client";
import { useEffect, useId, useState } from "react";
import { contactosApi } from "./contactos-api";
import type { Contacto } from "./contactos-tipos";

/** Selección explícita: nunca crea contactos ni elige el primero automáticamente. */
export function ContactoSelector({ value, onChange, disabled, label = "Contacto vendedor" }: {
  value: string; onChange: (id: string) => void; disabled?: boolean; label?: string;
}) {
  const id = useId();
  const [items, setItems] = useState<Contacto[]>([]);
  const [estado, setEstado] = useState("carga");
  useEffect(() => {
    const abort = new AbortController();
    contactosApi.listar(abort.signal).then((r) => { if (!abort.signal.aborted) { setItems(r.items); setEstado("listo"); } })
      .catch(() => { if (!abort.signal.aborted) setEstado("error"); });
    return () => abort.abort();
  }, []);
  return <div>
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} disabled={disabled || estado !== "listo"} onChange={(e) => onChange(e.target.value)} className="block w-full rounded border border-nk-border bg-nk-surface p-2 text-nk-fg">
      <option value="">Seleccionar contacto</option>
      {items.filter((c) => !c.deactivated_at).map((c) => <option key={c.id} value={c.id}>{c.display_name} {c.dni || c.cuit || ""}</option>)}
    </select>
    {estado === "carga" && <p role="status">Cargando contactos…</p>}
    {estado === "error" && <p role="alert">No se pudieron cargar los contactos. Revisa tus permisos e inténtalo de nuevo.</p>}
    {estado === "listo" && !items.length && <p>No hay contactos vigentes.</p>}
    <a href="/autos/dealer/contactos" className="underline">Gestionar contactos</a>
  </div>;
}

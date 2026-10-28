"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Lang } from "@/lib/realtor/clientes/copy";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { assignProperty, fetchAssignments, fetchPropertyOptions, type Assignment, type PropertyOption } from "./asignacion-api";

const COPY = {
  es: {
    title: "Propiedades asignadas", pick: "Propiedad", choose: "Elige una propiedad", assign: "Asignar propiedad", assigning: "Asignando…", none: "Sin propiedades asignadas.",
    done: "Propiedad asignada.", loadErr: "No se pudieron cargar las propiedades asignadas.",
    e0: "No se pudo conectar. Inténtalo de nuevo.", e5: "El servidor no pudo asignar la propiedad. Inténtalo de nuevo.",
    e401: "Tu sesión terminó: vuelve a iniciar sesión.", e403: "No tienes permiso para asignar propiedades con esta cuenta.",
    e404: "La propiedad o el contacto no existe o no pertenece a tu cuenta.", e409: "Esa propiedad ya está asignada a este contacto.",
    e422: "Revisa los datos: la propiedad elegida no es válida.", eNone: "Elige una propiedad antes de asignar.",
  },
  en: {
    title: "Assigned properties", pick: "Property", choose: "Choose a property", assign: "Assign property", assigning: "Assigning…", none: "No properties assigned.",
    done: "Property assigned.", loadErr: "Assigned properties could not be loaded.",
    e0: "Could not connect. Try again.", e5: "The server could not assign the property. Try again.",
    e401: "Your session ended: sign in again.", e403: "You do not have permission to assign properties with this account.",
    e404: "The property or contact does not exist or is not in your account.", e409: "That property is already assigned to this contact.",
    e422: "Check the data: the chosen property is not valid.", eNone: "Choose a property before assigning.",
  },
} as const;

const errorText = (t: (typeof COPY)[Lang], status: number): string =>
  status === 0 ? t.e0 : status === 401 ? t.e401 : status === 403 ? t.e403 : status === 404 ? t.e404 : status === 409 ? t.e409
    : status === 422 || status === 400 ? t.e422 : t.e5;

const FIELD: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };

/** Ficha del contacto: asignar una propiedad y ver las ya asignadas (lectura del servidor, persiste al recargar). */
export function AsignacionPanel({ contactId, lang }: { contactId: string; lang: Lang }) {
  const t = COPY[lang];
  const [options, setOptions] = useState<PropertyOption[]>([]);
  const [items, setItems] = useState<Assignment[] | null>([]);
  const [propertyId, setPropertyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPropertyOptions().then((o) => { if (alive) setOptions(o); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    let alive = true;
    setItems([]); setError(null); setDone(false); setPropertyId("");
    fetchAssignments(contactId).then((a) => { if (alive) setItems(a); });
    return () => { alive = false; };
  }, [contactId]);

  const labelOf = (id: string) => options.find((o) => o.id === id)?.label ?? id.slice(0, 8);

  async function submit() {
    setDone(false);
    if (!propertyId) { setError(t.eNone); return; }
    setBusy(true); setError(null);
    const r = await assignProperty(contactId, propertyId);
    if (r.ok === true) {
      setItems(await fetchAssignments(contactId));
      setPropertyId(""); setDone(true);
    } else setError(errorText(t, (r as { status: number }).status));
    setBusy(false);
  }

  return (
    <div data-testid="asignar-propiedad" style={{ marginTop: 22, borderTop: `1px solid ${RT.line}`, paddingTop: 16 }}>
      <h3 style={{ margin: "0 0 10px", fontFamily: FONT_DISPLAY, fontSize: 18 }}>{t.title}</h3>
      {items === null ? <p role="alert" data-testid="asignaciones-error" style={{ margin: "0 0 10px", fontSize: 14, color: RT.chipDownText }}>{t.loadErr}</p>
        : items.length === 0 ? <p data-testid="asignaciones-empty" style={{ margin: "0 0 10px", fontSize: 14, color: RT.muted }}>{t.none}</p>
        : (
          <ul style={{ margin: "0 0 12px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((a) => (<li key={a.id} data-testid="asignacion-row" style={{ fontSize: 14, fontWeight: 700 }}>{labelOf(a.propertyId)}</li>))}
          </ul>
        )}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select aria-label={t.pick} data-testid="asignar-select" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} style={FIELD}>
          <option value="">{t.choose}</option>
          {options.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
        </select>
        <button type="button" data-testid="asignar-submit" disabled={busy} onClick={submit} style={{ ...FIELD, minHeight: 44, padding: "0 18px", fontWeight: 700, cursor: "pointer" }}>
          {busy ? t.assigning : t.assign}
        </button>
      </div>
      {error ? <p role="alert" data-testid="asignar-error" style={{ margin: "10px 0 0", fontSize: 14, fontWeight: 700, color: RT.chipDownText }}>{error}</p> : null}
      {done ? <p role="status" data-testid="asignar-done" style={{ margin: "10px 0 0", fontSize: 14, fontWeight: 700, color: RT.chipUpText }}>{t.done}</p> : null}
    </div>
  );
}

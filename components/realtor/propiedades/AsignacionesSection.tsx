"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { assignContact, fetchPropertyAssignments, withdrawAssignment, type AssignResult, type Assignment } from "@/lib/realtor/propiedades/asignaciones";
import { fetchContactOptions } from "@/lib/realtor/propietarios/write";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";

type Option = { id: string; label: string };
type Reason = Extract<AssignResult, { ok: false }>["reason"];

const ERR: Record<Reason, string> = {
  validation: "Datos inválidos: revisa el contacto elegido.",
  forbidden: "No tienes permiso para gestionar asignaciones.",
  notfound: "No se encontró el contacto o la propiedad.",
  conflict: "Este contacto ya está asignado a la propiedad.",
  other: "No se pudo completar la operación. Inténtalo de nuevo.",
};
const BTN: CSSProperties = { minHeight: 44, padding: "0 18px", borderRadius: 8, border: `1px solid ${RT.teal}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontWeight: 700, cursor: "pointer" };
const SELECT: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };

/** Prospectos asignados a la propiedad (ROP-G4-ASIGNACION-API). El tenant sale del token; aquí solo viajan ids. */
export function AsignacionesSection({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<Assignment[]>([]);
  const [contacts, setContacts] = useState<Option[]>([]);
  const [pick, setPick] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => fetchPropertyAssignments(propertyId), [propertyId]);
  useEffect(() => {
    let alive = true;
    setError(null); setPick("");
    reload().then((r) => { if (alive) setRows(r); });
    fetchContactOptions().then((o) => { if (alive) setContacts(o); });
    return () => { alive = false; };
  }, [reload]);

  const label = (id: string) => contacts.find((c) => c.id === id)?.label ?? id;
  const run = async (action: () => Promise<AssignResult>) => {
    setBusy(true); setError(null);
    const r = await action();
    if ("reason" in r) setError(ERR[r.reason]); else { setRows(await reload()); setPick(""); }
    setBusy(false);
  };

  return (
    <div data-testid="asignaciones-section" style={{ marginTop: 18 }}>
      <h3 style={{ margin: "0 0 8px", fontFamily: FONT_DISPLAY, fontSize: 16 }}>Prospectos asignados</h3>
      {rows.length === 0 ? <p style={{ color: RT.muted, margin: 0, fontSize: 14 }}>Sin prospectos asignados todavía.</p> : (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", fontSize: 14, display: "grid", gap: 8 }}>
          {rows.map((a) => (
            <li key={a.id} data-testid="asignacion-row" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span>{label(a.contactId)}</span>
              <button type="button" data-testid="asignacion-retirar" disabled={busy} style={BTN} onClick={() => run(() => withdrawAssignment(a.contactId, a.id))}>Retirar</button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: RT.muted }}>
          Contacto
          <select aria-label="Contacto" value={pick} onChange={(e) => setPick(e.target.value)} style={SELECT}>
            <option value="">Elige un contacto</option>
            {contacts.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
          </select>
        </label>
        <button type="button" data-testid="asignar-submit" disabled={busy || !pick} style={BTN} onClick={() => run(() => assignContact(pick, propertyId))}>Asignar</button>
      </div>
      {error ? <p role="alert" data-testid="asignar-error" style={{ margin: "10px 0 0", fontWeight: 700, color: RT.demoText }}>{error}</p> : null}
    </div>
  );
}

"use client";

import { useState, type CSSProperties } from "react";
import type { Lang } from "@/lib/realtor/smart-calendar/copy";
import { createVisit, validVisit, type VisitForm as Fields } from "./visit";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";

const VISIT_COPY = {
  es: {
    title: "Programar visita", name: "Título", start: "Inicio", end: "Fin", property: "Propiedad", contact: "Contacto",
    submit: "Programar visita", ok: "Visita programada.", conflict: "Ya tienes un evento en ese horario.",
    overlap: "Programar de todos modos", invalid: "Revisa los datos: título, propiedad y contacto válidos, y un fin posterior al inicio.",
    denied: "No tienes permiso para programar visitas.", error: "No se pudo programar la visita. Inténtalo de nuevo.",
  },
  en: {
    title: "Schedule a showing", name: "Title", start: "Start", end: "End", property: "Property", contact: "Contact",
    submit: "Schedule showing", ok: "Showing scheduled.", conflict: "You already have an event at that time.",
    overlap: "Schedule anyway", invalid: "Check the data: valid title, property and contact, and an end after the start.",
    denied: "You are not allowed to schedule showings.", error: "The showing could not be scheduled. Try again.",
  },
} as const;

const EMPTY: Fields = { title: "", startsAt: "", endsAt: "", propertyId: "", contactId: "" };
const INPUT: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };
const LABEL: CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: RT.muted };
const BTN: CSSProperties = { minHeight: 40, padding: "0 16px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, border: `1px solid ${RT.ink}`, background: RT.ink, color: RT.white };

type Status = "idle" | "ok" | "conflict" | "invalid" | "denied" | "error";

/** Programar visita. Propiedad y contacto pueden venir de la ficha (`?property_id=&contact_id=`). */
export function VisitForm({ lang, onCreated }: { lang: Lang; onCreated: () => void }) {
  const t = VISIT_COPY[lang];
  // Solo se monta tras comprobar el acceso (ya en el cliente): leer la URL aquí no desajusta la hidratación.
  const [f, setF] = useState<Fields>(() => {
    const q = new URLSearchParams(window.location.search);
    return { ...EMPTY, propertyId: q.get("property_id") ?? "", contactId: q.get("contact_id") ?? "" };
  });
  const [status, setStatus] = useState<Status>("idle");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setStatus("idle");
    setF((p) => ({ ...p, [k]: e.target.value }));
  };

  const send = async (allowOverlap: boolean) => {
    if (!validVisit(f)) { setStatus("invalid"); return; }
    setBusy(true);
    const r = await createVisit(f, { allowOverlap });
    setBusy(false);
    if (r.ok === true) { setF((p) => ({ ...EMPTY, propertyId: p.propertyId, contactId: p.contactId })); setStatus("ok"); onCreated(); return; }
    setStatus(r.reason);
  };

  return (
    <form data-testid="visit-form" aria-label={t.title} onSubmit={(e) => { e.preventDefault(); void send(false); }}
      style={{ background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 20 }}>{t.title}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <label style={LABEL}>{t.name}<input style={INPUT} value={f.title} onChange={set("title")} /></label>
        <label style={LABEL}>{t.start}<input style={INPUT} type="datetime-local" value={f.startsAt} onChange={set("startsAt")} /></label>
        <label style={LABEL}>{t.end}<input style={INPUT} type="datetime-local" value={f.endsAt} onChange={set("endsAt")} /></label>
        <label style={LABEL}>{t.property}<input style={INPUT} value={f.propertyId} onChange={set("propertyId")} /></label>
        <label style={LABEL}>{t.contact}<input style={INPUT} value={f.contactId} onChange={set("contactId")} /></label>
        <button type="submit" data-testid="visit-submit" disabled={busy} style={BTN}>{t.submit}</button>
      </div>
      {status === "ok" ? <p role="status" data-testid="visit-ok" style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t.ok}</p> : null}
      {status === "conflict" ? (
        <p role="alert" data-testid="visit-conflict" style={{ margin: 0, fontSize: 13 }}>
          {t.conflict}{" "}
          <button type="button" data-testid="visit-confirm-overlap" disabled={busy} onClick={() => void send(true)} style={{ ...BTN, background: RT.white, color: RT.ink }}>{t.overlap}</button>
        </p>
      ) : null}
      {status === "invalid" || status === "denied" || status === "error" ? (
        <p role="alert" data-testid="visit-error" style={{ margin: 0, fontSize: 13 }}>{t[status]}</p>
      ) : null}
    </form>
  );
}

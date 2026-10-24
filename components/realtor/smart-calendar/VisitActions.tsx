"use client";

import { useState, type CSSProperties } from "react";
import type { Lang } from "@/lib/realtor/smart-calendar/copy";
import { RT } from "@/lib/realtor/tokens";
import { followUpVisit, moveVisit, type ActionResult, type Outcome, type VisitMeta } from "./visit-actions";

const COPY = {
  es: {
    move: "Mover", start: "Nuevo inicio", end: "Nuevo fin", save: "Guardar", cancel: "Cancelar",
    confirmed: "Confirmar", completed: "Realizada", no_show: "No asistió",
    conflict: "Ya tienes un evento en ese horario.", overlap: "Mover de todos modos",
    invalid: "Datos no válidos: el fin debe ser posterior al inicio y la visita debe seguir abierta.",
    denied: "No tienes permiso: solo el organizador puede cambiar esta visita.",
    notfound: "La visita ya no existe.", error: "No se pudo completar la acción. Inténtalo de nuevo.",
  },
  en: {
    move: "Move", start: "New start", end: "New end", save: "Save", cancel: "Cancel",
    confirmed: "Confirm", completed: "Held", no_show: "No-show",
    conflict: "You already have an event at that time.", overlap: "Move anyway",
    invalid: "Invalid data: the end must be after the start and the showing must still be open.",
    denied: "Not allowed: only the organizer can change this showing.",
    notfound: "The showing no longer exists.", error: "The action could not be completed. Try again.",
  },
} as const;

const OUTCOMES: readonly Outcome[] = ["confirmed", "completed", "no_show"];
const INPUT: CSSProperties = { minHeight: 32, borderRadius: 6, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 12, padding: "0 6px" };
const BTN: CSSProperties = { minHeight: 32, padding: "0 10px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 12, border: `1px solid ${RT.ink}`, background: RT.white, color: RT.ink };

/** ISO UTC → valor de `datetime-local` en la hora de pared del navegador. */
const toLocal = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

type Fail = Extract<ActionResult, { ok: false }>["reason"];

/** Acciones de una visita abierta: mover y registrar seguimiento. Tras un éxito se refresca desde el servidor. */
export function VisitActions({ id, meta, lang, onStart, onDone }: { id: string; meta: VisitMeta; lang: Lang; onStart: () => void; onDone: () => void }) {
  const t = COPY[lang];
  const [moving, setMoving] = useState(false);
  const [startsAt, setStartsAt] = useState(() => toLocal(meta.startsAt));
  const [endsAt, setEndsAt] = useState(() => toLocal(meta.endsAt));
  const [fail, setFail] = useState<Fail | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (p: Promise<ActionResult>) => {
    setBusy(true);
    onStart();
    const r = await p;
    setBusy(false);
    if (r.ok === true) { setFail(null); setMoving(false); onDone(); return; }
    setFail(r.reason);
  };
  const doMove = (overlap: boolean) => run(moveVisit(id, { startsAt, endsAt }, overlap));

  return (
    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        <button type="button" data-testid="visit-move" disabled={busy} style={BTN} onClick={() => { setFail(null); setMoving((m) => !m); }}>{t.move}</button>
        {OUTCOMES.map((o) => (
          <button key={o} type="button" data-testid={`followup-${o}`} disabled={busy} style={BTN} onClick={() => { void run(followUpVisit(id, o)); }}>{t[o]}</button>
        ))}
      </div>
      {moving ? (
        <form onSubmit={(e) => { e.preventDefault(); void doMove(false); }} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ display: "flex", flexDirection: "column", fontSize: 11 }}>{t.start}
            <input type="datetime-local" style={INPUT} value={startsAt} onChange={(e) => { setFail(null); setStartsAt(e.target.value); }} /></label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: 11 }}>{t.end}
            <input type="datetime-local" style={INPUT} value={endsAt} onChange={(e) => { setFail(null); setEndsAt(e.target.value); }} /></label>
          <div style={{ display: "flex", gap: 4 }}>
            <button type="submit" data-testid="visit-move-submit" disabled={busy} style={BTN}>{t.save}</button>
            <button type="button" disabled={busy} style={BTN} onClick={() => setMoving(false)}>{t.cancel}</button>
          </div>
        </form>
      ) : null}
      {fail === "conflict" && moving ? (
        <p role="alert" data-testid="visit-action-conflict" style={{ margin: 0, fontSize: 12 }}>
          {t.conflict}{" "}
          <button type="button" data-testid="visit-action-confirm-overlap" disabled={busy} style={BTN} onClick={() => { void doMove(true); }}>{t.overlap}</button>
        </p>
      ) : null}
      {fail && !(fail === "conflict" && moving) ? (
        <p role="alert" data-testid="visit-action-error" data-reason={fail} style={{ margin: 0, fontSize: 12 }}>{fail === "conflict" ? t.invalid : t[fail]}</p>
      ) : null}
    </div>
  );
}

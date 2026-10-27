"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { COPY as SC_COPY, type Lang } from "@/lib/realtor/smart-calendar/copy";
import { RT } from "@/lib/realtor/tokens";
import { Drawer } from "./Drawer";
import { CONTROL_BORDER } from "./styles";
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
const INPUT: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${CONTROL_BORDER}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };
const LABEL: CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600, color: RT.ink };
const BTN: CSSProperties = { minHeight: 40, padding: "0 16px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, border: `1px solid ${RT.ink}`, background: RT.white, color: RT.ink };
const PRIMARY: CSSProperties = { ...BTN, background: RT.ink, color: RT.white };
const ITEM: CSSProperties = { display: "block", width: "100%", minHeight: 36, padding: "0 14px", border: 0, background: "transparent", color: RT.ink, textAlign: "left", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };

/** ISO UTC → valor de `datetime-local` en la hora de pared del navegador. */
const toLocal = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

type Fail = Extract<ActionResult, { ok: false }>["reason"];

/** Posición fija del menú bajo el botón «…» (o encima si no cabe): no lo recorta el scroll de la semana. */
const menuPosition = (el: HTMLElement | null): CSSProperties => {
  const r = el?.getBoundingClientRect();
  if (!r) return { position: "fixed" };
  const right = Math.max(8, window.innerWidth - r.right);
  const below = r.bottom + 4;
  return window.innerHeight && below + 180 > window.innerHeight && r.top > 180
    ? { position: "fixed", right, bottom: window.innerHeight - r.top + 4 }
    : { position: "fixed", right, top: below };
};

/**
 * Acciones de una visita abierta en un menú «…» (Mover, Confirmar, Realizada, No asistió): teclado con flechas, Inicio/Fin,
 * Escape y clic fuera. Mover abre su formulario en un panel lateral para no romper la columna. Tras un éxito se refresca desde el servidor.
 */
export function VisitActions({ id, meta, lang, label, onStart, onDone }: { id: string; meta: VisitMeta; lang: Lang; label?: string; onStart: () => void; onDone: () => void }) {
  const t = COPY[lang];
  const ui = SC_COPY[lang];
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({ position: "fixed" });
  const [moving, setMoving] = useState(false);
  const [startsAt, setStartsAt] = useState(() => toLocal(meta.startsAt));
  const [endsAt, setEndsAt] = useState(() => toLocal(meta.endsAt));
  const [fail, setFail] = useState<Fail | null>(null);
  const [busy, setBusy] = useState(false);

  const items = () => Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
  const openMenu = () => { setPos(menuPosition(trigger.current)); setOpen(true); };
  const closeMenu = (focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) trigger.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    items()[0]?.focus({ preventScroll: true });
    const outside = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!menu.current?.contains(n) && !trigger.current?.contains(n)) setOpen(false);
    };
    const away = () => setOpen(false);
    document.addEventListener("mousedown", outside);
    window.addEventListener("resize", away);
    window.addEventListener("scroll", away, true);
    return () => {
      document.removeEventListener("mousedown", outside);
      window.removeEventListener("resize", away);
      window.removeEventListener("scroll", away, true);
    };
  }, [open]);

  const onMenuKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    const go = (n: number) => { e.preventDefault(); list[(n + list.length) % list.length]?.focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
    else if (e.key === "Tab") setOpen(false);
  };

  const run = async (p: Promise<ActionResult>) => {
    setBusy(true);
    onStart();
    const r = await p;
    setBusy(false);
    if (r.ok === true) { setFail(null); setMoving(false); onDone(); return; }
    setFail(r.reason);
  };
  const doMove = (overlap: boolean) => run(moveVisit(id, { startsAt, endsAt }, overlap));
  const choose = (k: "move" | Outcome) => {
    closeMenu(k !== "move");
    setFail(null);
    if (k === "move") { setStartsAt(toLocal(meta.startsAt)); setEndsAt(toLocal(meta.endsAt)); setMoving(true); return; }
    void run(followUpVisit(id, k));
  };

  const conflictUi = fail === "conflict" && moving ? (
    <p role="alert" data-testid="visit-action-conflict" style={{ margin: 0, fontSize: 13 }}>
      {t.conflict}{" "}
      <button type="button" data-testid="visit-action-confirm-overlap" disabled={busy} style={{ ...BTN, marginTop: 8 }} onClick={() => { void doMove(true); }}>{t.overlap}</button>
    </p>
  ) : null;
  const errorUi = fail && !(fail === "conflict" && moving) ? (
    <p role="alert" data-testid="visit-action-error" data-reason={fail} style={{ margin: 0, fontSize: 13, color: RT.chipDownText }}>{fail === "conflict" ? t.invalid : t[fail]}</p>
  ) : null;

  return (
    <>
      <button ref={trigger} type="button" data-testid="visit-menu" aria-label={ui.menu} aria-haspopup="menu" aria-expanded={open}
        aria-controls={open ? menuId : undefined} disabled={busy}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={(e) => { if (e.key === "ArrowDown" && !open) { e.preventDefault(); openMenu(); } }}
        style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 8, border: `1px solid ${CONTROL_BORDER}`,
          background: RT.white, color: RT.ink, cursor: "pointer", fontSize: 18, lineHeight: 1, fontFamily: "inherit", padding: 0 }}>
        <span aria-hidden="true">⋯</span>
      </button>
      {open ? (
        <ul ref={menu} id={menuId} role="menu" aria-label={ui.menu} onKeyDown={onMenuKey}
          style={{ ...pos, zIndex: 50, margin: 0, padding: "6px 0", listStyle: "none", minWidth: 168, background: RT.white,
            border: `1px solid ${CONTROL_BORDER}`, borderRadius: 10, boxShadow: "0 10px 24px rgba(19, 32, 43, 0.16)" }}>
          {(["move", ...OUTCOMES] as const).map((k) => (
            <li key={k} role="none">
              <button type="button" role="menuitem" tabIndex={-1} className="sc-menuitem" data-testid={k === "move" ? "visit-move" : `followup-${k}`}
                style={ITEM} onClick={() => choose(k)}>{t[k]}</button>
            </li>
          ))}
        </ul>
      ) : null}
      {!moving ? errorUi : null}
      {moving ? (
        <Drawer title={ui.moveTitle} subtitle={label} closeLabel={ui.close} onClose={() => { setMoving(false); setFail(null); }}
          returnFocus={() => trigger.current} testId="visit-move-drawer">
          <form onSubmit={(e) => { e.preventDefault(); void doMove(false); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={LABEL}>{t.start}
              <input type="datetime-local" style={INPUT} value={startsAt} onChange={(e) => { setFail(null); setStartsAt(e.target.value); }} /></label>
            <label style={LABEL}>{t.end}
              <input type="datetime-local" style={INPUT} value={endsAt} onChange={(e) => { setFail(null); setEndsAt(e.target.value); }} /></label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" data-testid="visit-move-submit" disabled={busy} style={PRIMARY}>{t.save}</button>
              <button type="button" disabled={busy} style={BTN} onClick={() => { setMoving(false); setFail(null); }}>{t.cancel}</button>
            </div>
            {conflictUi}
            {errorUi}
          </form>
        </Drawer>
      ) : null}
    </>
  );
}

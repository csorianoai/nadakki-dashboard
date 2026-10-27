"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { COPY, DAYS, DAYS_SHORT, KIND_LABEL, type Lang } from "@/lib/realtor/smart-calendar/copy";
import { fetchCalendarEvents } from "@/lib/realtor/smart-calendar/api";
import { DEMO_EVENTS } from "@/lib/realtor/smart-calendar/demo";
import { applyFilter, countByKind, eventsOfDay } from "@/lib/realtor/smart-calendar/logic";
import { KINDS, type CalEvent, type CalFilter } from "@/lib/realtor/smart-calendar/types";
import { formatWeekRange, hhmm, nowSlot, sameDay, weekDates, weekStart } from "@/lib/realtor/smart-calendar/week";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { Drawer } from "./Drawer";
import { EventCard } from "./EventCard";
import { CONTROL_BORDER, SC_CSS } from "./styles";
import { VisitActions } from "./VisitActions";
import { VisitForm } from "./VisitForm";
import { fetchOpenVisits, type VisitMeta } from "./visit-actions";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccessInfo } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const PRIMARY: CSSProperties = { minHeight: 40, padding: "0 18px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14,
  border: `1px solid ${RT.ink}`, background: RT.ink, color: RT.white, whiteSpace: "nowrap" };
const SECONDARY: CSSProperties = { minHeight: 36, padding: "0 14px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14,
  border: `1px solid ${CONTROL_BORDER}`, background: RT.white, color: RT.ink };
/** Línea de «ahora»: RT.chipDownText (#8A2418) destaca sobre el fondo de hoy y lleva texto blanco con contraste alto. */
const NOW_COLOR = RT.chipDownText;
const TICK_MS = 30_000;

/** `now` solo para pruebas y capturas deterministas; sin él la hora avanza sola. */
export function SmartCalendarPanel({ now }: { now?: Date } = {}) {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [lang, setLang] = useState<Lang>("es");
  const [filter, setFilter] = useState<CalFilter>("todos");
  const demo = demoActive;
  const t = COPY[lang];

  const [clock, setClock] = useState<Date>(() => now ?? new Date());
  useEffect(() => {
    if (now) { setClock(now); return; }
    const id = setInterval(() => setClock(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, [now]);

  const [offset, setOffset] = useState(0);
  const monday = weekStart(clock, offset);
  const weekKey = monday.getTime();
  const dates = weekDates(monday);

  // Cada lista recuerda de qué semana es: al cambiar de semana no se pintan los eventos de la anterior bajo otras fechas.
  const [real, setReal] = useState<{ week: number | null; list: readonly CalEvent[] }>({ week: null, list: [] });
  const [openVisits, setOpenVisits] = useState<Record<string, VisitMeta>>({});
  const [actionOk, setActionOk] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (access !== "ok" || demo) return;
    let alive = true;
    const from = new Date(weekKey);
    fetchCalendarEvents(from).then((list) => { if (alive) setReal({ week: weekKey, list }); });
    fetchOpenVisits(from).then((m) => { if (alive) setOpenVisits(m); });
    return () => { alive = false; };
  }, [access, demo, reload, weekKey]);

  // Panel lateral «Programar visita». Si llega con propiedad o contacto en la URL (desde una ficha), se abre solo.
  const [drawer, setDrawer] = useState(false);
  const headerBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (access !== "ok" || demo) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("property_id") || q.get("contact_id")) setDrawer(true);
  }, [access, demo]);
  const openDrawer = (from: HTMLElement) => { opener.current = from; setDrawer(true); };

  // Fuera de DEMO solo hay eventos del contrato; sin respuesta o lista vacía, «Sin datos todavía». DEMO solo en la semana actual.
  const loadingWeek = !demo && real.week !== weekKey;
  const events: readonly CalEvent[] = demo ? (offset === 0 ? DEMO_EVENTS : []) : loadingWeek ? [] : real.list;
  const visible = applyFilter(events, filter);
  const counts = countByKind(events);
  const nowText = hhmm(clock);

  if (access !== "ok") return <RealtorNotice reason={access} />;

  return (
    <>
    {/* Fuera de la sección: su texto CSS no cuenta como contenido del panel. */}
    <style data-sc="">{SC_CSS}</style>
    <section data-testid="smart-calendar-panel" className="sc" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="sc-head" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, lineHeight: 1.15 }}>{t.title}</h1>
          <p style={{ margin: "10px 0 0", maxWidth: 780, fontSize: 14, lineHeight: 1.45, color: RT.muted }}>{t.intro}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {demo ? null : (
            <button ref={headerBtn} type="button" data-testid="visit-open" aria-haspopup="dialog" onClick={(e) => openDrawer(e.currentTarget)} style={PRIMARY}>
              <span aria-hidden="true">+ </span>{t.schedule}
            </button>
          )}
          <div role="group" aria-label={t.lang} style={{ display: "flex", gap: 6 }}>
            {(["es", "en"] as const).map((l) => (
              <button key={l} type="button" data-testid={`lang-${l}`} aria-pressed={lang === l} onClick={() => setLang(l)}
                style={{ minHeight: 36, padding: "0 14px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                  border: `1px solid ${lang === l ? RT.ink : CONTROL_BORDER}`, background: lang === l ? RT.ink : RT.white, color: lang === l ? RT.white : RT.ink }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      {demo ? (
        <p role="note" data-testid="demo-banner" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{t.demo}</p>
      ) : null}

      <nav data-testid="week-nav" aria-label={t.weekNav} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <button type="button" aria-label={t.prevAria} onClick={() => setOffset((o) => o - 1)} style={SECONDARY}><span aria-hidden="true">‹ </span>{t.prev}</button>
        <button type="button" onClick={() => setOffset(0)} style={{ ...SECONDARY, ...(offset === 0 ? { borderColor: RT.teal, color: RT.teal } : null) }}>{t.today}</button>
        <button type="button" aria-label={t.nextAria} onClick={() => setOffset((o) => o + 1)} style={SECONDARY}>{t.next}<span aria-hidden="true"> ›</span></button>
        <p data-testid="week-range" aria-live="polite" style={{ margin: "0 0 0 6px", fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700 }}>
          {formatWeekRange(monday, lang)}
        </p>
      </nav>

      {actionOk ? (
        <p role="status" data-testid="visit-action-ok" style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{lang === "es" ? "Cambio guardado." : "Change saved."}</p>
      ) : null}

      {loadingWeek ? (
        <p role="status" aria-busy="true" data-testid="week-loading" style={{ margin: 0, fontSize: 14, color: RT.muted }}>{t.loadingWeek}</p>
      ) : events.length === 0 ? (
        <div data-testid="smart-calendar-empty" style={CARD}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.empty}</h2>
          <p style={{ margin: "10px 0 0", color: RT.muted, fontSize: 14 }}>{t.emptyHint}</p>
          {demo ? null : (
            <button type="button" aria-haspopup="dialog" onClick={(e) => openDrawer(e.currentTarget)} style={{ ...PRIMARY, marginTop: 16 }}>{t.schedule}</button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600, color: RT.ink }}>
              {t.fKind}
              <select aria-label={t.fKind} value={filter} onChange={(e) => setFilter(e.target.value as CalFilter)}
                style={{ minHeight: 40, borderRadius: 8, border: `1px solid ${CONTROL_BORDER}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" }}>
                <option value="todos">{t.all}</option>
                {KINDS.map((k) => (<option key={k} value={k}>{KIND_LABEL[lang][k]}</option>))}
              </select>
            </label>
            <div data-testid="kind-counts" aria-label={t.counts} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {KINDS.map((k) => (
                <span key={k} data-testid={`count-${k}`} style={{ background: RT.calloutBg, border: `1px solid ${RT.calloutLine}`, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>
                  {KIND_LABEL[lang][k]} · {counts[k]}
                </span>
              ))}
            </div>
          </div>
          <div data-testid="week-scroll" className="sc-scroll" role="region" aria-label={`${t.week}: ${formatWeekRange(monday, lang)}`} tabIndex={0}>
            <div data-testid="week-grid" className="sc-grid">
              {dates.map((date, day) => {
                const list = eventsOfDay(visible, day);
                const isToday = sameDay(date, clock);
                const slot = isToday ? nowSlot(list, nowText) : -1;
                const nowLine = (
                  <li key="now" data-testid="now-line" aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ background: NOW_COLOR, color: RT.white, borderRadius: 999, padding: "1px 8px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {t.now} {nowText}
                    </span>
                    <span style={{ flex: 1, height: 2, background: NOW_COLOR, borderRadius: 1 }} />
                  </li>
                );
                return (
                  <div key={day} data-testid="day-col" className="sc-day" aria-current={isToday ? "date" : undefined}
                    style={{ background: isToday ? RT.calloutBg : RT.white, border: `1px solid ${isToday ? RT.teal : RT.line}`, borderRadius: 12, padding: 10 }}>
                    <h2 aria-label={`${DAYS[lang][day]} ${date.getDate()}${isToday ? `, ${t.today}` : ""}`}
                      style={{ margin: "0 0 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, fontFamily: FONT_DISPLAY, fontSize: 16, color: isToday ? RT.teal : RT.ink }}>
                      <span>{DAYS_SHORT[lang][day]} {date.getDate()}</span>
                      {isToday ? (
                        <span data-testid="today-badge" style={{ background: RT.teal, color: RT.white, borderRadius: 999, padding: "2px 9px", fontSize: 12, fontFamily: "inherit" }}>{t.today}</span>
                      ) : null}
                    </h2>
                    {list.length === 0 ? <p data-testid="day-free" aria-hidden="true" style={{ margin: 0, fontSize: 14, color: RT.muted }}>—</p> : null}
                    {list.length > 0 || isToday ? (
                      <ul style={{ listStyle: "none", margin: list.length === 0 ? "8px 0 0" : 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                        {list.flatMap((e, i) => {
                          const card = (
                            <EventCard key={e.id} e={e} lang={lang} actions={!demo && e.kind === "visita" && openVisits[e.id] ? (
                              <VisitActions id={e.id} meta={openVisits[e.id]} lang={lang} label={e.title[lang]}
                                onStart={() => setActionOk(false)} onDone={() => { setActionOk(true); setReload((n) => n + 1); }} />
                            ) : undefined} />
                          );
                          return i === slot ? [nowLine, card] : [card];
                        })}
                        {slot === list.length ? nowLine : null}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>

      {drawer && !demo ? (
        <Drawer title={t.schedule} closeLabel={t.close} onClose={() => setDrawer(false)} testId="visit-drawer"
          returnFocus={() => (opener.current?.isConnected ? opener.current : headerBtn.current)}>
          <VisitForm lang={lang} onCreated={() => setReload((n) => n + 1)} />
        </Drawer>
      ) : null}
    </section>
    </>
  );
}

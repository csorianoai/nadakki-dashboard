"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { COPY, DAYS, KIND_LABEL, type Lang } from "@/lib/realtor/smart-calendar/copy";
import { fetchCalendarEvents } from "@/lib/realtor/smart-calendar/api";
import { DEMO_EVENTS } from "@/lib/realtor/smart-calendar/demo";
import { applyFilter, countByKind, eventsOfDay } from "@/lib/realtor/smart-calendar/logic";
import { KINDS, type CalEvent, type CalFilter } from "@/lib/realtor/smart-calendar/types";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccessInfo } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };

export function SmartCalendarPanel() {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [lang, setLang] = useState<Lang>("es");
  const [filter, setFilter] = useState<CalFilter>("todos");
  const demo = demoActive;
  const t = COPY[lang];

  const [real, setReal] = useState<readonly CalEvent[]>([]);
  useEffect(() => {
    if (access !== "ok" || demo) return;
    let alive = true;
    fetchCalendarEvents().then((list) => { if (alive) setReal(list); });
    return () => { alive = false; };
  }, [access, demo]);

  // Fuera de DEMO solo hay eventos del contrato; sin respuesta o lista vacía, «Sin datos todavía».
  const events: readonly CalEvent[] = demo ? DEMO_EVENTS : real;
  const visible = applyFilter(events, filter);
  const counts = countByKind(events);

  if (access !== "ok") return <RealtorNotice reason={access} />;

  return (
    <section data-testid="smart-calendar-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 28px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, lineHeight: 1.15 }}>{t.title}</h1>
          <p style={{ margin: "10px 0 0", maxWidth: 780, fontSize: 14, lineHeight: 1.45, color: RT.muted }}>{t.intro}</p>
        </div>
        <div role="group" aria-label={t.lang} style={{ display: "flex", gap: 6 }}>
          {(["es", "en"] as const).map((l) => (
            <button key={l} type="button" data-testid={`lang-${l}`} aria-pressed={lang === l} onClick={() => setLang(l)}
              style={{ minHeight: 36, padding: "0 14px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                border: `1px solid ${lang === l ? RT.ink : RT.lineStrong}`, background: lang === l ? RT.ink : RT.white, color: lang === l ? RT.white : RT.ink }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {demo ? (
        <p role="note" data-testid="demo-banner" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{t.demo}</p>
      ) : null}

      {events.length === 0 ? (
        <div data-testid="smart-calendar-empty" style={CARD}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.empty}</h2>
          <p style={{ margin: "10px 0 0", color: RT.muted }}>{t.emptyHint}</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: RT.muted }}>
              {t.fKind}
              <select aria-label={t.fKind} value={filter} onChange={(e) => setFilter(e.target.value as CalFilter)}
                style={{ minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" }}>
                <option value="todos">{t.all}</option>
                {KINDS.map((k) => (<option key={k} value={k}>{KIND_LABEL[lang][k]}</option>))}
              </select>
            </label>
            <div data-testid="kind-counts" aria-label={t.counts} style={{ display: "flex", gap: 10 }}>
              {KINDS.map((k) => (
                <span key={k} data-testid={`count-${k}`} style={{ background: RT.calloutBg, border: `1px solid ${RT.calloutLine}`, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>
                  {KIND_LABEL[lang][k]} · {counts[k]}
                </span>
              ))}
            </div>
          </div>
          <div aria-label={t.week} style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", alignItems: "start" }}>
            {DAYS[lang].map((name, day) => {
              const list = eventsOfDay(visible, day);
              return (
                <div key={name} data-testid="day-col" style={{ ...CARD, padding: 14, minHeight: 200 }}>
                  <h2 style={{ margin: "0 0 10px", fontFamily: FONT_DISPLAY, fontSize: 16 }}>{name}</h2>
                  {list.length === 0 ? <p style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.free}</p> : null}
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {list.map((e) => (
                      <li key={e.id} data-testid="cal-event" data-kind={e.kind}
                        style={{ border: `1px solid ${RT.line}`, borderLeft: `4px solid ${e.kind === "cita" ? RT.teal : RT.ink}`, borderRadius: 8, padding: 8, fontSize: 12 }}>
                        <strong style={{ display: "block", fontSize: 13 }}>{e.start}</strong>
                        <span style={{ display: "block", margin: "2px 0" }}>{e.title[lang]}</span>
                        <span style={{ color: RT.muted }}>{e.place ? `${KIND_LABEL[lang][e.kind]} · ${e.place}` : KIND_LABEL[lang][e.kind]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>
    </section>
  );
}

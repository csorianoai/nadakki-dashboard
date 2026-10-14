"use client";

import { useEffect, useState } from "react";
import { isDemoAllowed } from "@/lib/realtor/config";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { blockerText, miDiaCopy, type MiDiaCopy } from "@/lib/realtor/mi-dia/copy";
import { DEMO_DATE, DEMO_DESK, DEMO_LEADS, DEMO_LISTINGS } from "@/lib/realtor/mi-dia/demo";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccess } from "../useRealtorAccess";

const card = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 10, padding: 20 } as const;

/** La vista Agente/Broker es estado del armazón; se lee de su atributo, sin permisos nuevos. */
function useBrokerView(): boolean {
  const [broker, setBroker] = useState(false);
  useEffect(() => {
    const el = document.querySelector('[data-testid="realtor-shell"]');
    if (!el) return;
    const read = () => setBroker(el.getAttribute("data-view") === "broker");
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-view"] });
    return () => mo.disconnect();
  }, []);
  return broker;
}

function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: React.ReactNode }) {
  return (
    <section data-testid={`mi-dia-${id}`} aria-label={title} style={card}>
      <h2 style={{ margin: "0 0 12px", fontFamily: FONT_DISPLAY, fontSize: 20 }}>
        {title}{count === undefined ? null : <span data-testid={`mi-dia-${id}-count`} style={{ marginLeft: 10, color: RT.teal }}>{count}</span>}
      </h2>
      {children}
    </section>
  );
}

function NoDisponible({ t }: { t: MiDiaCopy }) {
  return (
    <p data-testid="mi-dia-no-disponible" style={{ margin: 0, fontSize: 14, color: RT.muted }}>
      <strong style={{ background: RT.page, border: `1px solid ${RT.lineStrong}`, borderRadius: 6, padding: "2px 8px", marginRight: 8, fontSize: 12 }}>{t.unavailable}</strong>
      {t.unavailableNote}
    </p>
  );
}

function Rows({ items }: { items: { id: string; main: string; sub: string }[] }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
      {items.map((r) => (
        <li key={r.id} data-testid="mi-dia-row" style={{ border: `1px solid ${RT.line}`, borderLeft: `4px solid ${RT.teal}`, borderRadius: 8, padding: "10px 14px" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{r.main}</div>
          <div style={{ fontSize: 13, color: RT.muted }}>{r.sub}</div>
        </li>
      ))}
    </ul>
  );
}

export function MiDiaPanel() {
  const access = useRealtorAccess();
  const [lang, setLang] = useState("es");
  const broker = useBrokerView();
  useEffect(() => { setLang(navigator.language || "es"); }, []);
  if (access !== "ok") return <RealtorNotice reason={access} />;

  const t = miDiaCopy(lang);
  const demo = isDemoAllowed();
  const date = new Date(`${DEMO_DATE}T12:00:00Z`).toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <section data-testid="mi-dia-panel" lang={lang.startsWith("en") ? "en" : "es"} style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
      <div>
        {demo ? <p style={{ margin: 0, fontSize: 14, color: RT.muted }}>{date} · {t.demoRef}</p> : null}
        <h1 style={{ margin: "10px 0 0", fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: 1.15 }}>{t.greeting}</h1>
        <p style={{ margin: "12px 0 0", maxWidth: 780, fontSize: 16, color: RT.muted }}>{t.intro}</p>
      </div>
      {demo ? (
        <p role="note" data-testid="mi-dia-demo" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{t.demoTag}</p>
      ) : (
        <div data-testid="mi-dia-empty" style={{ ...card, background: RT.calloutBg, borderColor: RT.calloutLine }}>
          <strong style={{ fontFamily: FONT_DISPLAY, fontSize: 20 }}>{t.empty}</strong>
          <p style={{ margin: "6px 0 0", color: RT.muted }}>{t.emptyNote}</p>
        </div>
      )}
      <Section id="leads" title={t.leads} count={demo ? DEMO_LEADS.length : undefined}>
        {demo ? <Rows items={DEMO_LEADS.map((l) => ({ id: l.id, main: l.name, sub: `${l.source} · ${l.phone} · ${l.email} · ${t.waiting} ${l.waitingHours}${t.hours}` }))} /> : <NoDisponible t={t} />}
      </Section>
      <Section id="listings" title={t.listings} count={demo ? DEMO_LISTINGS.length : undefined}>
        {demo ? <Rows items={DEMO_LISTINGS.map((l) => ({ id: l.id, main: l.title, sub: blockerText(t, l.blocker) }))} /> : <NoDisponible t={t} />}
      </Section>
      {broker ? (
        <Section id="desk" title={t.desk} count={demo ? DEMO_DESK.length : undefined}>
          {demo ? <Rows items={DEMO_DESK.map((d) => ({ id: d.id, main: d.title, sub: d.agent }))} /> : <NoDisponible t={t} />}
        </Section>
      ) : null}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fair}</p>
    </section>
  );
}

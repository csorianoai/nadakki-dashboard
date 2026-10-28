"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { fetchMiDia, type MiDia } from "@/lib/realtor/mi-dia/api";
import { blockerText, COPY, greetingFor, lookup, todayText, type Lang } from "@/lib/realtor/mi-dia/copy";
import { DEMO_DESK, DEMO_LEADS, DEMO_LISTINGS } from "@/lib/realtor/mi-dia/demo";
import { useTenantTimeZone } from "@/lib/realtor/tenant-tz";
import { RealtorNotice } from "../RealtorNotice";
import { TextoRecortado } from "../TextoRecortado";
import { useRealtorAccessInfo } from "../useRealtorAccess";

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

/** Sección sin fuente: texto humano y, si hay dónde, una acción dentro de Realtor. data-quality conserva el estado del contrato. */
function NoDisponible({ texto, cta, href }: { texto: string; cta?: string; href?: string }) {
  return (
    <p data-testid="mi-dia-no-disponible" data-quality="NO_DISPONIBLE" style={{ margin: 0, fontSize: 15, color: RT.muted, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 14px" }}>
      <span>{texto}</span>
      {cta && href ? (
        <Link href={href} style={{ display: "inline-flex", alignItems: "center", minHeight: 44, color: RT.teal, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>{cta}</Link>
      ) : null}
    </p>
  );
}

function Kpi({ id, label, value, note }: { id: string; label: string; value: string; note: string }) {
  return (
    <div data-testid={`mi-dia-kpi-${id}`} style={{ ...card, padding: "18px 18px 16px", minHeight: 134 }}>
      <div style={{ fontSize: 14, color: RT.muted }}>{label}</div>
      <div style={{ margin: "8px 0", fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: RT.muted }}>{note}</div>
    </div>
  );
}

function Rows({ items }: { items: { id: string; main: string; sub: string }[] }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
      {items.map((r) => (
        <li key={r.id} data-testid="mi-dia-row" style={{ border: `1px solid ${RT.line}`, borderLeft: `4px solid ${RT.teal}`, borderRadius: 8, padding: "10px 14px" }}>
          <TextoRecortado texto={r.main} style={{ fontWeight: 700, fontSize: 15 }} />
          <TextoRecortado texto={r.sub} style={{ fontSize: 13, color: RT.muted }} />
        </li>
      ))}
    </ul>
  );
}

export function MiDiaPanel() {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [lang, setLang] = useState<Lang>("es");
  const broker = useBrokerView();
  const demo = demoActive;
  const [real, setReal] = useState<MiDia | null>(null);
  // Fecha, saludo y horas en la zona del tenant (deducida del perfil); sin perfil, la del navegador.
  const tz = useTenantTimeZone(access === "ok");
  useEffect(() => {
    if (access !== "ok" || demo) return;
    let alive = true;
    fetchMiDia().then((d) => { if (alive) setReal(d); });
    return () => { alive = false; };
  }, [access, demo]);
  if (access !== "ok") return <RealtorNotice reason={access} />;

  const t = COPY[lang];
  const date = todayText(t, tz);
  return (
    <section data-testid="mi-dia-panel" lang={lang} style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <p data-testid="mi-dia-date" style={{ margin: 0, fontSize: 14, color: RT.muted }}>{date}{demo ? ` · ${t.demoRef}` : ""}</p>
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
      <div>
        <h1 style={{ margin: "10px 0 0", fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: 1.15 }}>{greetingFor(t, tz)}</h1>
        <p style={{ margin: "12px 0 0", maxWidth: 780, fontSize: 16, color: RT.muted }}>{t.intro}</p>
      </div>
      {demo ? (
        <p role="note" data-testid="mi-dia-demo" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{t.demoTag}</p>
      ) : real ? null : (
        <div data-testid="mi-dia-empty" style={{ ...card, background: RT.calloutBg, borderColor: RT.calloutLine }}>
          <strong style={{ fontFamily: FONT_DISPLAY, fontSize: 20 }}>{t.empty}</strong>
          <p style={{ margin: "6px 0 0", color: RT.muted }}>{t.emptyNote}</p>
        </div>
      )}
      {demo ? (
        <>
          <div data-testid="mi-dia-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <Kpi id="pending" label={t.kpiLeads} value={String(DEMO_LEADS.length)} note={t.kpiLeadsNote} />
            <Kpi id="progress" label={t.kpiListings} value={String(DEMO_LISTINGS.length)} note={t.kpiListingsNote} />
            <Kpi id="plan" label={t.kpiPlan} value={`0 / ${DEMO_LEADS.length + DEMO_LISTINGS.length}`} note={t.kpiPlanNote} />
            <Kpi id="desk" label={t.desk} value={String(DEMO_DESK.length)} note={t.deskNote} />
          </div>
          <div data-testid="mi-dia-next" style={{ background: RT.inkDeep, color: RT.navText, borderRadius: 10, padding: "22px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
            <div>
              <div style={{ fontSize: 14, color: RT.navMuted }}>{t.nextLabel}</div>
              <div style={{ margin: "6px 0", fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: RT.white }}>{t.nextAction}</div>
              <div style={{ fontSize: 15 }}>{t.nextDetail}</div>
            </div>
            <Link href="/realtor/propiedades" style={{ background: RT.cyan, color: RT.inkDarkest, borderRadius: 8, padding: "12px 18px", fontWeight: 700, fontSize: 15, textDecoration: "none", whiteSpace: "nowrap" }}>{t.nextCta}</Link>
          </div>
        </>
      ) : null}
      <Section id="leads" title={t.leads} count={demo ? DEMO_LEADS.length : real?.leads.count ?? undefined}>
        {!demo && real?.leads.quality === "OK" ? <Rows items={real.leads.items.map((l) => ({
          id: l.lead_id,
          main: `${lookup(t.channels, l.channel, t.leadFallback)} · ${lookup(t.intents, l.intent, l.intent)}`,
          sub: `${t.waiting} ${Math.round(l.waiting_hours * 10) / 10}${t.hours}`,
        }))} /> : demo ? <Rows items={DEMO_LEADS.map((l) => ({ id: l.id, main: l.name, sub: `${l.source} · ${l.phone} · ${l.email} · ${t.waiting} ${l.waitingHours}${t.hours}` }))} /> : <NoDisponible texto={t.noLeads} cta={t.noLeadsCta} href="/realtor/clientes" />}
      </Section>
      <Section id="listings" title={t.listings} count={demo ? DEMO_LISTINGS.length : real?.listings.count ?? undefined}>
        {!demo && real?.listings.quality === "OK" ? <Rows items={real.listings.items.map((l) => ({
          id: l.listing_id, main: `${t.stage} ${l.stage_key}`, sub: `${l.blocking_count} ${t.blockingReqs}`,
        }))} /> : demo ? <Rows items={DEMO_LISTINGS.map((l) => ({ id: l.id, main: l.title, sub: blockerText(t, l.blocker) }))} /> : <NoDisponible texto={t.noListings} cta={t.noListingsCta} href="/realtor/propiedades" />}
      </Section>
      <Section id="visitas" title={t.visits} count={demo ? undefined : real?.visitas.count ?? undefined}>
        {!demo && real?.visitas.quality === "OK" ? (real.visitas.items.length === 0 ? (
          <p data-testid="mi-dia-visitas-empty" style={{ margin: 0, fontSize: 14, color: RT.muted }}>{t.visitsEmpty}</p>
        ) : <Rows items={real.visitas.items.map((v) => ({
          id: v.event_id,
          main: new Date(v.starts_at).toLocaleTimeString(t.dateLocale, { hour: "2-digit", minute: "2-digit", timeZone: tz }),
          sub: v.title,
        }))} />) : <NoDisponible texto={t.noVisits} cta={t.noVisitsCta} href="/realtor/smart-calendar" />}
      </Section>
      {broker ? (
        <Section id="desk" title={t.desk} count={demo ? DEMO_DESK.length : real?.desk.count ?? undefined}>
          {!demo && real?.desk.quality === "OK" ? <Rows items={real.desk.items.map((d) => ({
            id: d.item_id, main: lookup(t.deskKinds, d.kind, t.deskFallback), sub: new Date(d.created_at).toLocaleDateString(t.dateLocale, { timeZone: tz }),
          }))} /> : demo ? <Rows items={DEMO_DESK.map((d) => ({ id: d.id, main: d.title, sub: d.agent }))} /> : <NoDisponible texto={t.noDesk} />}
        </Section>
      ) : null}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fair}</p>
    </section>
  );
}

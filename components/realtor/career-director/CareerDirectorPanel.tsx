"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COPY, type CareerCopy, type Lang } from "@/lib/realtor/career-director/copy";
import { fetchCareer, type CareerSummary } from "@/lib/realtor/career-director/api";
import { DEMO_GOALS, DEMO_LICENSE, DEMO_SUPERVISION, METRICS } from "@/lib/realtor/career-director/demo";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccessInfo } from "../useRealtorAccess";

const CARD: React.CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 10 };
const H2: React.CSSProperties = { margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700 };

function Row({ k, v, testid }: { k: string; v: string; testid?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
      <span style={{ color: RT.muted }}>{k}</span>
      <span data-testid={testid} style={{ fontWeight: 600, textAlign: "right" }}>{v}</span>
    </div>
  );
}

function NoDisponible({ t, id }: { t: CareerCopy; id: string }) {
  return (
    <p data-testid={`no-disponible-${id}`} data-quality="NO_DISPONIBLE" style={{ margin: 0, fontSize: 14, color: RT.muted }}>
      <strong>{t.unavailable}</strong> · {t.unavailableHint}{" "}
      <Link href="/realtor/operaciones" style={{ color: RT.teal, fontWeight: 700 }}>{t.unavailableCta}</Link>
    </p>
  );
}

function DemoCards({ t, lang }: { t: CareerCopy; lang: Lang }) {
  const metric = (id: string) => METRICS.find((m) => m.id === id)!;
  const l = DEMO_LICENSE;
  const s = DEMO_SUPERVISION;
  const sinFuente = METRICS.filter((m) => !m.source);
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
      <article data-testid="card-licencia" style={CARD}>
        <h2 style={H2}>{t.license}</h2>
        <Row k={t.number} v={l.number} />
        <Row k={t.jurisdiction} v={l.jurisdiction} />
        <Row k={t.state} v={t.states[l.state]} testid="license-state" />
        <Row k={t.expiry} v={l.expiresOn} />
        <p data-testid="license-days" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: RT.demoText }}>{t.daysLeft(l.daysLeft)}</p>
      </article>
      <article data-testid="card-supervision" style={CARD}>
        <h2 style={H2}>{t.supervision}</h2>
        <Row k={t.supervisor} v={s.supervisor} />
        <Row k={t.contact} v={`${s.phone} · ${s.email}`} />
        <Row k={t.lastReview} v={s.lastReview} />
      </article>
      <article data-testid="card-metas" style={{ ...CARD, background: RT.ink, color: RT.white, border: 0 }}>
        <h2 style={H2}>{t.goals}</h2>
        {DEMO_GOALS.map((g) => (
          <div key={g.id} data-testid="goal" style={{ fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: RT.navMuted }}>{g.label[lang]}</span>
              <strong>{g.done} {t.goalOf} {g.target}</strong>
            </div>
            <div aria-hidden="true" style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.15)", marginTop: 6 }}>
              <div style={{ width: `${Math.round((g.done / g.target) * 100)}%`, height: 6, borderRadius: 3, background: RT.cyan }} />
            </div>
          </div>
        ))}
        {sinFuente.map((m) => (
          <div key={m.id} style={{ fontSize: 14 }}>
            <div style={{ color: RT.navMuted }}>{metric(m.id).label[lang]}</div>
            <p data-testid={`no-disponible-${m.id}`} data-quality="NO_DISPONIBLE" style={{ margin: "2px 0 0", fontSize: 14 }}><strong>{t.unavailable}</strong> · {t.unavailableHint}{" "}<Link href="/realtor/operaciones" style={{ color: RT.cyan, fontWeight: 700 }}>{t.unavailableCta}</Link></p>
          </div>
        ))}
      </article>
    </div>
  );
}

function RealCards({ t, lang, c }: { t: CareerCopy; lang: Lang; c: CareerSummary }) {
  const known = c.metrics.filter((m) => m.key in t.metricLabels);
  return (
    <div data-testid="career-real" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
      <article data-testid="card-actividad" style={CARD}>
        <h2 style={H2}>{t.activity}</h2>
        <Row k={t.period} v={`${c.period.from} – ${c.period.to}`} />
        {known.map((m) => m.value === null
          ? <div key={m.key} style={{ fontSize: 14 }}><div style={{ color: RT.muted }}>{t.metricLabels[m.key]}</div><NoDisponible t={t} id={m.key} /></div>
          : <Row key={m.key} k={t.metricLabels[m.key]} v={String(m.value)} testid={`metric-${m.key}`} />)}
      </article>
      <article data-testid="card-volumen" style={CARD}>
        <h2 style={H2}>{t.volume}</h2>
        <p style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.volumeHint}</p>
        {c.volume.length === 0 ? <p style={{ margin: 0, fontSize: 14 }}>{t.noVolume}</p> : c.volume.map((v) => (
          <Row key={`${v.kind}-${v.currency}`} k={`${t.kinds[v.kind]} · ${v.count}`} v={`${v.total} ${v.currency}`} testid="volume-row" />
        ))}
      </article>
      <article data-testid="card-logros" style={CARD}>
        <h2 style={H2}>{t.achievements}</h2>
        {c.achievements.length === 0 ? <p style={{ margin: 0, fontSize: 14 }}>{t.noAchievements}</p> : c.achievements.map((a) => (
          <Row key={a.key} k={t.achievementLabels[a.key]} v={a.earnedAt.slice(0, 10)} testid="achievement" />
        ))}
      </article>
    </div>
  );
}

function EmptyState({ t }: { t: CareerCopy }) {
  return (
    <div data-testid="career-empty" style={{ ...CARD, border: `1px dashed ${RT.lineStrong}`, maxWidth: 560 }}>
      <h2 style={H2}>{t.empty}</h2>
      <p style={{ margin: 0, fontSize: 14, color: RT.muted }}>{t.emptyHint}</p>
      {METRICS.filter((m) => !m.source).map((m) => <NoDisponible key={m.id} t={t} id={m.id} />)}
    </div>
  );
}

/** Centro Career Director: licencia y vencimiento, supervisión y metas. Fail-closed; fuera de DEMO no inventa cifras. */
export function CareerDirectorPanel() {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [lang, setLang] = useState<Lang>("es");
  const demo = demoActive;
  // Fuera de DEMO se lee C-RE-CAREER; sin datos (404, 503, vacío) queda «Sin datos todavía», sin cifras inventadas.
  const [real, setReal] = useState<CareerSummary | null>(null);
  useEffect(() => {
    if (demo || access !== "ok") return;
    let alive = true;
    fetchCareer().then((r) => { if (alive) setReal(r); });
    return () => { alive = false; };
  }, [demo, access]);
  if (access !== "ok") return <RealtorNotice reason={access} />;

  const t = COPY[lang];
  return (
    <section data-testid="career-director-panel" lang={lang} style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: 1.15 }}>{t.title}</h1>
          <p style={{ margin: "14px 0 0", maxWidth: 780, fontSize: 16, lineHeight: 1.45, color: RT.muted }}>{t.intro}</p>
        </div>
        <button type="button" data-testid="lang-toggle" aria-label={t.langLabel} onClick={() => setLang(lang === "es" ? "en" : "es")}
          style={{ marginLeft: "auto", minHeight: 40, padding: "0 14px", borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>
          {t.lang}
        </button>
      </div>
      {demo ? (
        <p role="note" data-testid="demo-banner" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{t.demoBanner}</p>
      ) : null}
      {demo ? <DemoCards t={t} lang={lang} /> : real ? <RealCards t={t} lang={lang} c={real} /> : <EmptyState t={t} />}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.note}</p>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { COPY, type Lang } from "@/lib/realtor/marketing-ai/copy";
import { fetchMarketingSummary, type MarketingSummary } from "@/lib/realtor/marketing-ai/api";
import { DEMO_SUMMARIES } from "@/lib/realtor/marketing-ai/demo";
import { GATEWAYS } from "@/lib/realtor/marketing-ai/gateways";
import { isDemoAllowed } from "@/lib/realtor/config";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccess } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };

function RealSummary({ t, s }: { t: (typeof COPY)[Lang]; s: MarketingSummary }) {
  const known = s.metrics.filter((m) => m.key in t.metricLabels);
  const row = (k: string, v: string, id?: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}><span style={{ color: RT.muted }}>{k}</span><strong data-testid={id}>{v}</strong></div>
  );
  return (
    <div data-testid="marketing-ai-real" style={{ margin: "14px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
      {row(t.period, `${s.period.from} – ${s.period.to}`)}
      {known.map((m) => m.value === null
        ? <div key={m.key} style={{ fontSize: 14 }}><span style={{ color: RT.muted }}>{t.metricLabels[m.key]}</span> <strong data-testid={`no-disponible-${m.key}`}>{t.noDisponible}</strong></div>
        : <div key={m.key}>{row(t.metricLabels[m.key], String(m.value), `metric-${m.key}`)}</div>)}
      <h3 style={{ margin: "8px 0 0", fontFamily: FONT_DISPLAY, fontSize: 18 }}>{t.spendTitle}</h3>
      <p style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.spendHint}</p>
      {s.spend.map((x) => (
        <div key={`${x.kind}-${x.currency}`} data-testid="spend-row" style={{ border: `1px solid ${RT.line}`, borderRadius: 8, padding: "8px 12px" }}>
          <strong style={{ fontSize: 14 }}>{t.kinds[x.kind]} · {x.currency} · {x.campaigns} {t.campaignsLabel}</strong>
          {row(t.spendLabel, x.spend ?? t.noDisponible)}
          {row(t.budgetLabel, x.budget ?? t.noDisponible)}
          {row(t.leadsLabel, x.leads === null ? t.noDisponible : String(x.leads))}
          {row(t.cplLabel, x.costPerLead ?? t.noDisponible)}
        </div>
      ))}
    </div>
  );
}

export function MarketingAiPanel() {
  const access = useRealtorAccess();
  const [lang, setLang] = useState<Lang>("es");
  const demo = isDemoAllowed();
  const t = COPY[lang];
  // Fuera de DEMO se lee C-RE-MARKETING-AI; sin datos (404, 503, vacío) queda «Sin datos todavía», sin cifras inventadas.
  const [real, setReal] = useState<MarketingSummary | null>(null);
  useEffect(() => {
    if (demo || access !== "ok") return;
    let alive = true;
    fetchMarketingSummary().then((r) => { if (alive) setReal(r); });
    return () => { alive = false; };
  }, [demo, access]);

  if (access !== "ok") return <RealtorNotice reason={access} />;

  // Fuera de DEMO no hay resumen conectado: solo enlaces, sin cifras inventadas.
  const summaries = demo ? DEMO_SUMMARIES : [];
  return (
    <section data-testid="marketing-ai-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: 1.15 }}>{t.title}</h1>
          <p style={{ margin: "14px 0 0", maxWidth: 780, fontSize: 16, lineHeight: 1.45, color: RT.muted }}>{t.intro}</p>
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

      <div style={CARD}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.gatewaysTitle}</h2>
          <span style={{ fontSize: 13, color: RT.muted }}>{t.gatewaysNote}</span>
        </div>
        {!demo && real ? <RealSummary t={t} s={real} /> : null}
        {!demo && !real ? (
          <div data-testid="marketing-ai-empty" style={{ margin: "14px 0 0" }}>
            <strong style={{ fontSize: 16 }}>{t.empty}</strong>
            <p style={{ margin: "6px 0 0", color: RT.muted }}>{t.emptyHint}</p>
          </div>
        ) : null}
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 16 }}>
          {GATEWAYS.map((g) => {
            const s = summaries.find((x) => x.id === g.id);
            return (
              <div key={g.id} data-testid={`gateway-${g.id}`} style={{ border: `1px solid ${RT.line}`, borderRadius: 10, padding: 16, background: RT.white }}>
                <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 18 }}>{g.title[lang]}</h3>
                <p style={{ margin: "6px 0 10px", fontSize: 14, color: RT.muted }}>{g.desc[lang]}</p>
                {s ? (
                  <div data-testid={`summary-${g.id}`} style={{ background: RT.calloutBg, border: `1px solid ${RT.calloutLine}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                    <strong style={{ fontSize: 14 }}>{s.headline[lang]}</strong>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13, color: RT.muted }}>
                      {s.items.map((i) => (<li key={i.es}>{i[lang]}</li>))}
                    </ul>
                  </div>
                ) : null}
                <Link href={g.href} data-testid={`open-${g.id}`}
                  style={{ display: "inline-flex", alignItems: "center", minHeight: 40, padding: "0 16px", borderRadius: 8, background: RT.teal, color: RT.white, fontWeight: 700, textDecoration: "none" }}>
                  {t.open} · {g.title[lang]}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>
    </section>
  );
}

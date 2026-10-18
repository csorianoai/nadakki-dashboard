"use client";

import { useState, type CSSProperties } from "react";
import { COPY, ORIGIN_LABEL, STAGE_LABEL, type Lang } from "@/lib/realtor/resultados/copy";
import { DEMO_RESULTADOS, FUNNEL_STAGES, ORIGINS } from "@/lib/realtor/resultados/demo";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccessInfo } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };

function Bar({ label, value, max, text, testid }: { label: string; value: number; max: number; text: string; testid: string }) {
  return (
    <div data-testid={testid} style={{ display: "grid", gridTemplateColumns: "130px 1fr 70px", alignItems: "center", gap: 12, fontSize: 14 }}>
      <span>{label}</span>
      <span aria-hidden="true" style={{ background: RT.calloutBg, borderRadius: 6, height: 14, display: "block" }}>
        <span style={{ display: "block", height: 14, borderRadius: 6, background: RT.teal, width: `${max > 0 ? Math.round((value / max) * 100) : 0}%` }} />
      </span>
      <strong style={{ textAlign: "right" }}>{text}</strong>
    </div>
  );
}

/** Resultados: embudo, tiempos y orígenes. Sin API propia (solo /acceso): fuera de DEMO no hay cifras ni gráficos. */
export function ResultadosPanel() {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [lang, setLang] = useState<Lang>("es");
  const t = COPY[lang];
  const data = demoActive ? DEMO_RESULTADOS : null;

  if (access !== "ok") return <RealtorNotice reason={access} />;

  const { funnel, avgDays, origins } = data ?? { funnel: null, avgDays: null, origins: null };
  const stages = FUNNEL_STAGES;
  return (
    <section data-testid="resultados-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
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
      {data ? (
        <p role="note" data-testid="demo-banner" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{t.demo}</p>
      ) : null}

      {!funnel || !avgDays || !origins ? (
        <div data-testid="resultados-empty" style={CARD}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.empty}</h2>
          <p style={{ margin: "10px 0 0", color: RT.muted }}>{t.emptyHint}</p>
        </div>
      ) : (
        <>
          <section aria-label={t.funnel} style={{ ...CARD, display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 20 }}>{t.funnel}</h2>
            {stages.map((s) => (
              <Bar key={s} testid={`funnel-${s}`} label={STAGE_LABEL[lang][s]} value={funnel[s]} max={funnel.leads} text={String(funnel[s])} />
            ))}
            <p data-testid="conversion" style={{ margin: 0, color: RT.muted, fontSize: 13 }}>
              {t.conversion}: {((funnel.cierres / funnel.leads) * 100).toFixed(1)} %
            </p>
          </section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 18 }}>
            <section aria-label={t.days} style={{ ...CARD, display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 20 }}>{t.days}</h2>
              {stages.slice(0, -1).map((s) => {
                const k = s as keyof typeof avgDays;
                return <Bar key={s} testid={`days-${s}`} label={STAGE_LABEL[lang][s]} value={avgDays[k]} max={Math.max(...Object.values(avgDays))} text={`${avgDays[k]} ${t.daysUnit}`} />;
              })}
            </section>
            <section aria-label={t.origins} style={{ ...CARD, display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 20 }}>{t.origins}</h2>
              {ORIGINS.map((o) => (
                <Bar key={o} testid={`origin-${o}`} label={ORIGIN_LABEL[lang][o]} value={origins[o]} max={Math.max(...Object.values(origins))} text={String(origins[o])} />
              ))}
            </section>
          </div>
        </>
      )}
    </section>
  );
}

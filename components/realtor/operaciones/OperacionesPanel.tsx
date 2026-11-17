"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import { COPY, KIND_LABEL, STAGE_LABEL, type Lang } from "@/lib/realtor/operaciones/copy";
import { DEMO_FINANCE, DEMO_OPERATIONS } from "@/lib/realtor/operaciones/demo";
import { fetchOperations } from "@/lib/realtor/operaciones/api";
import { applyFilters, countByStage, inStage, opportunities, unstaged } from "@/lib/realtor/operaciones/logic";
import { KINDS, NO_FILTERS, STAGES, type OpFilters, type Operation, type StageId } from "@/lib/realtor/operaciones/types";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { RealtorNotice } from "../RealtorNotice";
import { OperacionGestion } from "./OperacionGestion";
import { useRealtorAccessInfo } from "../useRealtorAccess";
import { DosColumnas } from "@/components/realtor/layout/DosColumnas";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const SELECT: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };

function OpRow({ o, lang }: { o: Operation; lang: Lang }) {
  return (
    <li data-testid="op-row" style={{ border: `1px solid ${RT.line}`, borderRadius: 10, padding: 14 }}>
      <strong style={{ display: "block", fontSize: 14 }}>{o.code}</strong>
      <span style={{ display: "block", fontSize: 13, color: RT.muted, margin: "4px 0 8px" }}>{o.summary[lang]}</span>
      <span style={{ fontSize: 12, fontWeight: 700, background: RT.chipUpBg, color: RT.chipUpText, borderRadius: 999, padding: "3px 10px" }}>{KIND_LABEL[lang][o.kind]}</span>
    </li>
  );
}

function FinCard({ id, label, value, hint }: { id: string; label: string; value: string; hint?: string }) {
  return (
    <div data-testid={id} style={{ ...CARD, padding: 18, display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: RT.muted, letterSpacing: 0.4 }}>{label}</span>
      <strong style={{ fontFamily: FONT_DISPLAY, fontSize: 26 }}>{value}</strong>
      {hint ? <span style={{ fontSize: 13, color: RT.muted }}>{hint}</span> : null}
    </div>
  );
}

// useSearchParams exige Suspense en el App Router; vive aquí para que page.tsx no cambie.
export function OperacionesPanel() {
  return (
    <Suspense fallback={null}>
      <OperacionesContenido />
    </Suspense>
  );
}

function OperacionesContenido() {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [lang, setLang] = useState<Lang>("es");
  const [filters, setFilters] = useState<OpFilters>(NO_FILTERS);
  const [stage, setStage] = useState<StageId>("propiedad");
  const demo = demoActive;
  const query = useSearchParams();
  const t = COPY[lang];

  // Fuera de DEMO se lee C-RE-OLA3; sin datos (404, 503, lista vacía) queda «Sin datos todavía», sin cifras inventadas.
  const [real, setReal] = useState<readonly Operation[]>([]);
  useEffect(() => {
    if (demo || access !== "ok") return;
    let alive = true;
    fetchOperations().then((r) => { if (alive) setReal(r); });
    return () => { alive = false; };
  }, [demo, access]);
  const ops: readonly Operation[] = demo ? DEMO_OPERATIONS : real;
  const visible = useMemo(() => applyFilters(ops, filters), [ops, filters]);
  const counts = useMemo(() => countByStage(visible), [visible]);
  const inCurrent = useMemo(() => inStage(visible, stage), [visible, stage]);
  const opps = useMemo(() => opportunities(visible), [visible]);
  const loose = useMemo(() => unstaged(visible), [visible]);

  if (access !== "ok") return <RealtorNotice reason={access} />;

  return (
    <section data-testid="operaciones-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: 1.15 }}>{t.title}</h1>
          <p style={{ margin: "14px 0 0", maxWidth: 820, fontSize: 16, lineHeight: 1.45, color: RT.muted }}>{t.intro}</p>
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

      {!demo ? <OperacionGestion ops={real} initialPropertyId={query?.get("property_id") ?? ""} initialContactId={query?.get("contact_id") ?? ""} /> : null}

      {ops.length === 0 ? (
        <div data-testid="operaciones-empty" style={CARD}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.empty}</h2>
          <p style={{ margin: "10px 0 0", color: RT.muted }}>{t.emptyHint}</p>
        </div>
      ) : (
        <>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: RT.muted, width: "fit-content" }}>
            {t.fKind}
            <select aria-label={t.fKind} value={filters.kind} onChange={(e) => setFilters({ kind: e.target.value as OpFilters["kind"] })} style={SELECT}>
              <option value="todas">{t.all}</option>
              {KINDS.map((k) => (<option key={k} value={k}>{KIND_LABEL[lang][k]}</option>))}
            </select>
          </label>
          <ol aria-label={t.stagesLabel} data-testid="stage-list" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
            {STAGES.map((s, i) => (
              <li key={s}>
                <button type="button" data-testid={`stage-${s}`} aria-pressed={stage === s} aria-current={stage === s ? "step" : undefined} onClick={() => setStage(s)}
                  style={{ width: "100%", height: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: 4, cursor: "pointer", fontFamily: "inherit", color: RT.ink, borderRadius: 10, padding: "10px 12px",
                    background: stage === s ? RT.white : RT.page, border: `${stage === s ? 2 : 1}px solid ${stage === s ? RT.teal : RT.line}` }}>
                  <span style={{ fontSize: 12, color: RT.muted }}>{t.stage} {i + 1}</span>
                  <strong style={{ fontSize: 14 }}>{STAGE_LABEL[lang][s]}</strong>
                  <span data-testid={`count-${s}`} style={{ fontSize: 12, fontWeight: 700, color: RT.teal }}>{counts[s]} {t.exp}</span>
                </button>
              </li>
            ))}
          </ol>
          <DosColumnas testId="operaciones-columnas" columnas={[{ peso: 3, minimo: 320 }, { peso: 2, minimo: 280 }]}>
            <div data-testid="stage-panel" style={CARD}>
              <h2 style={{ margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 22 }}>{STAGE_LABEL[lang][stage]} · {t.listTitle}</h2>
              {inCurrent.length === 0 ? <p data-testid="stage-empty" style={{ margin: 0, color: RT.muted }}>{t.noneInStage}</p> : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {inCurrent.map((o) => (<OpRow key={o.id} o={o} lang={lang} />))}
                </ul>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {loose.length > 0 ? (
              <div data-testid="unstaged-panel" style={CARD}>
                <h2 style={{ margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 22 }}>{t.unstagedTitle}</h2>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {loose.map((o) => (<OpRow key={o.id} o={o} lang={lang} />))}
                </ul>
              </div>
            ) : null}
            <div data-testid="opp-panel" style={CARD}>
              <h2 style={{ margin: "0 0 10px", fontFamily: FONT_DISPLAY, fontSize: 22 }}>{t.oppTitle}</h2>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: RT.muted }}>{t.oppNote}</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {opps.map((o) => (<OpRow key={o.id} o={o} lang={lang} />))}
              </ul>
            </div>
            </div>
          </DosColumnas>
          {demo ? (
          <section data-testid="fin-section" aria-label={t.finTitle} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.finTitle}</h2>
            <p style={{ margin: 0, fontSize: 13, color: RT.muted }}>{t.finNote}</p>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <FinCard id="fin-gross" label={t.finGross} value={`USD ${DEMO_FINANCE.gross.toLocaleString("en-US")}`} />
              <FinCard id="fin-fee" label={t.finFee} value={`${DEMO_FINANCE.feePct} %`} />
              <FinCard id="fin-split" label={t.finSplit} value={`${DEMO_FINANCE.agentPct} / ${DEMO_FINANCE.brokerPct}`} hint={`${t.finAgent} / ${t.finBroker}`} />
              <FinCard id="fin-closed" label={t.finClosed} value={String(DEMO_FINANCE.closed)} hint={t.finClosedUnit} />
            </div>
          </section>
          ) : null}
        </>
      )}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>
    </section>
  );
}

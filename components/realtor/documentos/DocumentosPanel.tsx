"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { COPY, DOC_STATUS_LABEL, type Lang } from "@/lib/realtor/documentos/copy";
import { downloadDocument, type DownloadFailure } from "@/lib/realtor/documentos/download";
import { fetchDocuments } from "@/lib/realtor/documentos/api";
import { DEMO_DOCS, DEMO_TEMPLATES } from "@/lib/realtor/documentos/demo";
import { countByDocStatus, templateState } from "@/lib/realtor/documentos/logic";
import { API_DOC_STATUSES, DOC_STATUSES, type OperationDoc, type Template } from "@/lib/realtor/documentos/types";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { GenerateControls } from "./GenerateControls";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccessInfo } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const H2: CSSProperties = { margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 24 };
const ROW: CSSProperties = { border: `1px solid ${RT.line}`, borderRadius: 10, padding: 14 };
const PILL: CSSProperties = { fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 10px" };

const DL_ERROR_KEY = { forbidden: "forbidden", not_found: "dlNotFound", gone: "dlGone", error: "dlError" } as const;

function DownloadButton({ doc, demo, lang }: { doc: OperationDoc; demo: boolean; lang: Lang }) {
  const t = COPY[lang];
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<DownloadFailure | null>(null);
  const run = async () => {
    if (demo || loading) return;
    setLoading(true);
    setFailure(null);
    const r = await downloadDocument(doc.id, doc.name);
    setLoading(false);
    if ("reason" in r) setFailure(r.reason);
  };
  return (
    <span style={{ display: "block", marginTop: 10 }}>
      <button type="button" data-testid="doc-download" disabled={demo || loading} onClick={run}
        style={{ minHeight: 36, padding: "0 14px", borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, fontFamily: "inherit", fontWeight: 700, cursor: demo || loading ? "not-allowed" : "pointer" }}>
        {demo ? t.dlDemo : loading ? t.dlLoading : t.dlButton}
      </button>
      {failure ? (
        <span role="alert" data-testid="doc-download-error" style={{ display: "block", marginTop: 6, fontSize: 13, color: RT.demoText }}>
          {t[DL_ERROR_KEY[failure]]}{" "}
          {failure === "error" ? <button type="button" data-testid="doc-download-retry" onClick={run} style={{ fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>{t.dlRetry}</button> : null}
        </span>
      ) : null}
    </span>
  );
}

export function DocumentosPanel() {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [lang, setLang] = useState<Lang>("es");
  const demo = demoActive;
  const t = COPY[lang];

  // Fuera de DEMO se lee C-RE-DOCUMENTOS; sin datos (404, 503, lista vacía) queda «Sin datos todavía», sin cifras inventadas.
  const [real, setReal] = useState<readonly OperationDoc[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);
  useEffect(() => {
    if (demo || access !== "ok") return;
    let alive = true;
    fetchDocuments().then((r) => { if (alive) setReal(r); });
    return () => { alive = false; };
  }, [demo, access, reloadKey]);
  const docs: readonly OperationDoc[] = demo ? DEMO_DOCS : real;
  const templates: readonly Template[] = demo ? DEMO_TEMPLATES : [];
  const counts = countByDocStatus(docs);
  const isEmpty = docs.length === 0 && templates.length === 0;

  if (access !== "ok") return <RealtorNotice reason={access} />;

  return (
    <section data-testid="documentos-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
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

      {isEmpty ? (
        <div data-testid="documentos-empty" style={CARD}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.empty}</h2>
          <p style={{ margin: "10px 0 0", color: RT.muted }}>{t.emptyHint}</p>
        </div>
      ) : (
        <div data-testid="status-counts" aria-label={t.statusCounts} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {(demo ? DOC_STATUSES : API_DOC_STATUSES).map((s) => (
              <span key={s} data-testid={`count-${s}`} style={{ background: RT.calloutBg, border: `1px solid ${RT.calloutLine}`, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>
                {DOC_STATUS_LABEL[lang][s]} · {counts[s]}
              </span>
            ))}
          </div>
      )}
          <div data-testid="generator-row" style={{ display: "grid", gap: 20, gridTemplateColumns: isEmpty ? "minmax(300px, 1fr)" : "minmax(300px, 1fr) minmax(300px, 1fr)", alignItems: "start" }}>
            <div style={CARD}>
              <h2 style={H2}>{t.genTitle}</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
                {t.readiness.map((r, i) => (
                  <li key={r} data-testid="doc-readiness" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{r}</span>
                    <strong style={{ textTransform: "uppercase", color: i === 1 ? RT.teal : RT.demoText }}>{i === 1 ? t.fromCrm : t.missing}</strong>
                  </li>
                ))}
              </ul>
              <GenerateControls demo={demo} lang={lang} onGenerated={reload} />
              <p style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.aiNote}</p>
            </div>
            {!isEmpty ? (
            <div style={CARD}>
              <h2 style={H2}>{t.draftTitle} <span style={{ ...PILL, background: RT.calloutBg, color: RT.muted, fontSize: 11, textTransform: "uppercase" }}>{t.notGenerated}</span></h2>
              <p data-testid="doc-note" style={{ margin: "0 0 18px", padding: "14px 18px", border: `1px dashed ${RT.lineStrong}`, borderRadius: 8, color: RT.muted, fontSize: 14 }}>{t.noDraft}</p>
              <strong style={{ display: "block", fontSize: 14 }}>{t.signState}</strong>
              <p style={{ margin: "10px 0", fontSize: 14 }}>{t.brokerApproval} <span style={{ ...PILL, background: RT.calloutBg, color: RT.muted }}>{t.notRequested}</span></p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: RT.demoText }}>{t.notLegal}</p>
            </div>
            ) : null}
          </div>
      {!isEmpty ? (
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(300px, 3fr) minmax(300px, 2fr)", alignItems: "start" }}>
            <div style={CARD}>
              <h2 style={H2}>{t.docsTitle}</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {docs.map((d) => (
                  <li key={d.id} data-testid="doc-row" style={ROW}>
                    <strong style={{ display: "block", fontSize: 14 }}>{d.name}</strong>
                    <span style={{ display: "block", fontSize: 13, color: RT.muted, margin: "4px 0 8px" }}>{d.operation[lang]}</span>
                    <span style={{ ...PILL, background: RT.chipUpBg, color: RT.chipUpText }}>{DOC_STATUS_LABEL[lang][d.status]}</span>
                    <DownloadButton doc={d} demo={demo} lang={lang} />
                  </li>
                ))}
              </ul>
            </div>
            <div style={CARD}>
              <h2 style={H2}>{t.tplTitle}</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {templates.map((p) => {
                  const state = templateState(p);
                  return (
                    <li key={p.id} data-testid="template-row" data-state={state} style={ROW}>
                      <strong style={{ display: "block", fontSize: 14 }}>{p.name}</strong>
                      <span style={{ display: "block", fontSize: 13, color: RT.muted, margin: "4px 0 8px" }}>{p.kind[lang]}</span>
                      <span data-testid="template-state" style={{ ...PILL, background: state === "aprobada" ? RT.chipUpBg : RT.demoBg, color: state === "aprobada" ? RT.chipUpText : RT.demoText }}>
                        {state === "aprobada" && p.lawyerApproval ? `${t.approved} · ${t.reviewedBy} ${p.lawyerApproval.reviewer}` : t.pending}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p style={{ margin: "16px 0 0", fontSize: 12, color: RT.muted }}>{t.tplNote}</p>
            </div>
          </div>
      ) : null}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>
    </section>
  );
}

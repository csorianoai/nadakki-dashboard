"use client";

import { useState, type CSSProperties } from "react";
import { COPY, DOC_STATUS_LABEL, type Lang } from "@/lib/realtor/documentos/copy";
import { DEMO_DOCS, DEMO_TEMPLATES } from "@/lib/realtor/documentos/demo";
import { countByDocStatus, templateState } from "@/lib/realtor/documentos/logic";
import { DOC_STATUSES, type OperationDoc, type Template } from "@/lib/realtor/documentos/types";
import { isDemoAllowed } from "@/lib/realtor/config";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccess } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const H2: CSSProperties = { margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 24 };
const ROW: CSSProperties = { border: `1px solid ${RT.line}`, borderRadius: 10, padding: 14 };
const PILL: CSSProperties = { fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 10px" };

export function DocumentosPanel() {
  const access = useRealtorAccess();
  const [lang, setLang] = useState<Lang>("es");
  const demo = isDemoAllowed();
  const t = COPY[lang];

  // Fuera de DEMO no hay fuente conectada: listas vacías, sin cifras inventadas.
  const docs: readonly OperationDoc[] = demo ? DEMO_DOCS : [];
  const templates: readonly Template[] = demo ? DEMO_TEMPLATES : [];
  const counts = countByDocStatus(docs);

  if (access !== "ok") return <RealtorNotice reason={access} />;

  return (
    <section data-testid="documentos-panel" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "28px 40px 40px" }}>
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

      {docs.length === 0 && templates.length === 0 ? (
        <div data-testid="documentos-empty" style={CARD}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.empty}</h2>
          <p style={{ margin: "10px 0 0", color: RT.muted }}>{t.emptyHint}</p>
        </div>
      ) : (
        <>
          <div data-testid="status-counts" aria-label={t.statusCounts} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {DOC_STATUSES.map((s) => (
              <span key={s} data-testid={`count-${s}`} style={{ background: RT.calloutBg, border: `1px solid ${RT.calloutLine}`, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>
                {DOC_STATUS_LABEL[lang][s]} · {counts[s]}
              </span>
            ))}
          </div>
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(300px, 1fr) minmax(300px, 1fr)", alignItems: "start" }}>
            <div style={CARD}>
              <h2 style={H2}>{t.docsTitle}</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {docs.map((d) => (
                  <li key={d.id} data-testid="doc-row" style={ROW}>
                    <strong style={{ display: "block", fontSize: 14 }}>{d.name}</strong>
                    <span style={{ display: "block", fontSize: 13, color: RT.muted, margin: "4px 0 8px" }}>{d.operation[lang]}</span>
                    <span style={{ ...PILL, background: RT.chipUpBg, color: RT.chipUpText }}>{DOC_STATUS_LABEL[lang][d.status]}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={CARD}>
              <h2 style={H2}>{t.statusCounts}</h2>
              <p style={{ margin: 0, fontSize: 14, color: RT.muted }}>{t.tplNote}</p>
            </div>
          </div>
          <div style={{ ...CARD, padding: "22px 22px 14px" }}>
            <h2 style={H2}>{t.tplTitle}</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {templates.map((p) => {
                const state = templateState(p);
                return (
                  <li key={p.id} data-testid="template-row" data-state={state}
                    style={{ display: "grid", gridTemplateColumns: "minmax(200px, 2fr) 1fr 2fr", gap: 16, alignItems: "center", padding: "12px 8px", borderTop: `1px solid ${RT.line}`, fontSize: 14 }}>
                    <strong>{p.name}</strong>
                    <span style={{ color: RT.muted }}>{p.kind[lang]}</span>
                    <span data-testid="template-state" style={{ ...PILL, justifySelf: "start", background: state === "aprobada" ? RT.chipUpBg : RT.demoBg, color: state === "aprobada" ? RT.chipUpText : RT.demoText }}>
                      {state === "aprobada" && p.lawyerApproval ? `${t.approved} · ${t.reviewedBy} ${p.lawyerApproval.reviewer}` : t.pending}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>
    </section>
  );
}

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { COPY, type Lang } from "@/lib/realtor/documentos/copy";
import { GEN_DOC_TYPES, generateDocument, type GenDocType, type GenerateFailure } from "@/lib/realtor/documentos/generate";
import { fetchOperations } from "@/lib/realtor/operaciones/api";
import type { Operation } from "@/lib/realtor/operaciones/types";
import { RT } from "@/lib/realtor/tokens";

const FIELD: CSSProperties = { minHeight: 36, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, fontFamily: "inherit", padding: "0 8px" };
const FAIL_KEY = { forbidden: "forbidden", not_found: "genNotFound", conflict: "genConflict", invalid: "genInvalid", storage: "genStorage", error: "genError" } as const;

/** Elegir operación y tipo y pedir el borrador. En DEMO no hay backend: queda bloqueado. El tenant lo pone el servidor desde el JWT. */
export function GenerateControls({ demo, lang, onGenerated }: { demo: boolean; lang: Lang; onGenerated: () => void }) {
  const t = COPY[lang];
  const [ops, setOps] = useState<readonly Operation[]>([]);
  const [opId, setOpId] = useState("");
  const [docType, setDocType] = useState<GenDocType>(GEN_DOC_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<GenerateFailure | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (demo) return;
    let alive = true;
    fetchOperations().then((r) => { if (alive) setOps(r); });
    return () => { alive = false; };
  }, [demo]);

  const run = async () => {
    if (demo || !opId || loading) return;
    setLoading(true);
    setFailure(null);
    setDone(false);
    const r = await generateDocument(opId, docType);
    setLoading(false);
    if (!("reason" in r)) {
      setDone(true);
      onGenerated();
    } else {
      setFailure(r.reason);
    }
  };

  const blocked = demo || !opId || loading;
  return (
    <div style={{ margin: "16px 0 12px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        <select data-testid="gen-operation" aria-label={t.genOperation} value={opId} disabled={demo} onChange={(e) => setOpId(e.target.value)} style={FIELD}>
          <option value="">{t.genPick}</option>
          {ops.map((o) => <option key={o.id} value={o.id}>{o.code}</option>)}
        </select>
        <select data-testid="gen-doctype" aria-label={t.genDocType} value={docType} disabled={demo} onChange={(e) => setDocType(e.target.value as GenDocType)} style={FIELD}>
          {GEN_DOC_TYPES.map((d) => <option key={d} value={d}>{t.genDocTypes[d]}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" data-testid="generate-doc" disabled={blocked} onClick={run}
          style={{ minHeight: 44, padding: "0 16px", borderRadius: 8, border: `1px ${blocked ? "dashed" : "solid"} ${RT.lineStrong}`, background: blocked ? RT.calloutBg : RT.white, fontFamily: "inherit", fontWeight: 700, cursor: blocked ? "not-allowed" : "pointer" }}>
          {demo ? t.genBlocked : loading ? t.genLoading : t.genButton}
        </button>
        <span style={{ minHeight: 44, padding: "0 16px", borderRadius: 8, border: `1px solid ${RT.lineStrong}`, display: "inline-flex", alignItems: "center", fontWeight: 700 }}>{t.toOps}</span>
      </div>
      {failure ? <p role="alert" data-testid="generate-error" style={{ margin: "8px 0 0", fontSize: 13, color: RT.demoText }}>{t[FAIL_KEY[failure]]}</p> : null}
      {done ? <p role="status" data-testid="generate-ok" style={{ margin: "8px 0 0", fontSize: 13, color: RT.teal }}>{t.genOk}</p> : null}
    </div>
  );
}

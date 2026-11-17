"use client";

import React, { useRef, useState } from "react";
import { createOverride, newIdempotencyKey } from "@/lib/sites/client";
import { pick, type Lang } from "@/lib/sites/copy-util";
import { checkOverride, parseField, violationKey } from "@/lib/sites/publicar/logic";
import { ERR, PUB, SEV } from "@/lib/sites/publicar/copy";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { Violation } from "@/lib/sites/types";

const ctl = { minHeight: SIZE.target, border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, background: ST.white, color: ST.ink, fontSize: SIZE.fontBase, padding: "0 12px" };

function Aceptar({ siteId, v, k, lang, demo }: { siteId: string; v: Violation; k: string; lang: Lang; demo: boolean }) {
  const t = (x: string) => pick(PUB[x], lang);
  const [abierto, setAbierto] = useState(false);
  const [just, setJust] = useState("");
  const [fecha, setFecha] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [hasta, setHasta] = useState<string | null>(null);
  const [envio, setEnvio] = useState(false);
  const clave = useRef<string | null>(null);
  const eid = `err-${k}`;

  if (hasta) return <p data-testid="aviso-aceptado" role="status" style={{ margin: "8px 0 0" }}>✓ {t("accepted")} {hasta.slice(0, 10)}</p>;
  if (!abierto) {
    return <button type="button" className="sx-focus" data-testid="aceptar-aviso" onClick={() => setAbierto(true)} style={{ ...ctl, marginTop: 8, cursor: "pointer" }}>{t("accept")}</button>;
  }
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = checkOverride(just, fecha);
    if (c.ok === false) return setErr(c.error === "justification" ? t("needJustification") : t("needFuture"));
    setErr(null);
    if (demo) return setHasta(c.expires_at); // simulacro: no hay llamada
    setEnvio(true);
    clave.current ??= newIdempotencyKey();
    try {
      const r = await createOverride(siteId, { rule_id: v.rule_id, justification: c.justification, expires_at: c.expires_at }, { idempotencyKey: clave.current });
      setHasta(r.expires_at ?? c.expires_at);
    } catch (x) {
      const code = (x as { code?: string })?.code ?? "DEFAULT";
      if (code !== "NETWORK") clave.current = null;
      setErr(pick(ERR[code] ?? ERR.DEFAULT, lang));
    } finally {
      setEnvio(false);
    }
  };
  return (
    <form onSubmit={enviar} noValidate data-testid="form-override" style={{ display: "grid", gap: 8, marginTop: 8 }}>
      <label htmlFor={`j-${k}`}>{t("justification")}</label>
      <textarea id={`j-${k}`} className="sx-focus" value={just} onChange={(e) => setJust(e.target.value)} aria-required="true" aria-describedby={err ? eid : undefined} aria-invalid={err ? true : undefined} rows={3} style={{ ...ctl, padding: 12 }} />
      <label htmlFor={`f-${k}`}>{t("expires")}</label>
      <input id={`f-${k}`} type="date" className="sx-focus" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-required="true" aria-describedby={err ? eid : undefined} aria-invalid={err ? true : undefined} style={ctl} />
      {err && <p id={eid} role="alert" data-testid="error-override" style={{ margin: 0, color: ST.badText, fontWeight: 700 }}>▲ {err}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="submit" className="sx-focus" disabled={envio} style={{ ...ctl, background: ST.teal, color: ST.white, fontWeight: 700, cursor: "pointer" }}>{t("confirmAccept")}</button>
        <button type="button" className="sx-focus" onClick={() => { setAbierto(false); setErr(null); }} style={{ ...ctl, cursor: "pointer" }}>{t("cancel")}</button>
      </div>
    </form>
  );
}

/** Lista COMPLETA de violaciones (sin recortar). Solo las `warn` ofrecen aceptar; `block` e `info` no tienen ruta alternativa. */
export function Violaciones({ items, siteId, lang, demo, paginas, testid }: {
  items: Violation[]; siteId: string; lang: Lang; demo: boolean; paginas: Record<string, string>; testid: string;
}) {
  const t = (x: string) => pick(PUB[x], lang);
  return (
    <ul data-testid={testid} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
      {items.map((v, i) => {
        const k = violationKey(v, i);
        const sev = SEV[v.severity] ?? SEV.info;
        const ref = parseField(v.field);
        const id = ref ? paginas[ref.page] : undefined;
        return (
          <li key={k} data-testid="violacion" data-severity={v.severity} style={{ background: ST.white, border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: SIZE.gap }}>
            <p style={{ margin: 0, fontWeight: 700 }}><span aria-hidden="true">{sev.icon} </span><span data-testid="v-severidad">{pick(sev, lang)}</span></p>
            <p data-testid="v-mensaje" style={{ margin: "6px 0 0" }}>{v.message}</p>
            <p style={{ margin: "6px 0 0", color: ST.muted, fontSize: SIZE.fontSmall }}>
              {t("rule")}: <span data-testid="v-regla">{v.rule_id}</span> · {t("field")}:{" "}
              {id ? (
                <a data-testid="v-enlace" className="sx-focus" href={`/mi-web/paginas?sitio=${encodeURIComponent(siteId)}&pagina=${encodeURIComponent(id)}`}
                  style={{ display: "inline-flex", alignItems: "center", minHeight: SIZE.target, color: ST.teal }}>
                  {v.field}{ref && ref.block !== null ? ` (${t("block")} ${ref.block + 1})` : ""}
                </a>
              ) : <span data-testid="v-campo">{v.field}</span>}
            </p>
            {v.severity === "warn" && <Aceptar siteId={siteId} v={v} k={k} lang={lang} demo={demo} />}
          </li>
        );
      })}
    </ul>
  );
}

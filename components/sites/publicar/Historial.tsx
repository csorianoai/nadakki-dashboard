"use client";

import React, { useEffect, useState } from "react";
import { listEvaluations } from "@/lib/sites/client";
import { pick, type Lang } from "@/lib/sites/copy-util";
import { PUB, RESULT } from "@/lib/sites/publicar/copy";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { ComplianceEvaluation } from "@/lib/sites/types";

/** Historial de evaluaciones (append-only): solo lectura. `version` fuerza recarga tras publicar. */
export function Historial({ siteId, lang, demo, version }: { siteId: string; lang: Lang; demo: boolean; version: number }) {
  const t = (x: string) => pick(PUB[x], lang);
  const [items, setItems] = useState<ComplianceEvaluation[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (demo) return;
    let vivo = true;
    setError(false);
    listEvaluations(siteId).then(
      (r) => { if (vivo) { setItems(r.items); setCursor(r.next_cursor); } },
      () => { if (vivo) setError(true); },
    );
    return () => { vivo = false; };
  }, [siteId, demo, version]);

  const mas = async () => {
    if (!cursor) return;
    try {
      const r = await listEvaluations(siteId, { cursor });
      setItems((p) => [...(p ?? []), ...r.items]);
      setCursor(r.next_cursor);
    } catch { setError(true); }
  };

  return (
    <section aria-labelledby="h-historial" data-testid="historial" style={{ display: "grid", gap: 12 }}>
      <h2 id="h-historial" style={{ margin: 0, fontSize: SIZE.fontSub }}>{t("history")}</h2>
      {demo && <p>{t("historyDemo")}</p>}
      {!demo && error && <p role="alert" style={{ color: ST.badText }}>{t("historyError")}</p>}
      {!demo && !error && items === null && <p role="status">{t("loading")}</p>}
      {!demo && items && items.length === 0 && <p>{t("historyEmpty")}</p>}
      {items && items.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {items.map((e) => {
            const r = RESULT[e.result] ?? RESULT.pass;
            return (
              <li key={e.id} data-testid="evaluacion" data-result={e.result} style={{ background: ST.white, border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: 12 }}>
                <strong><span aria-hidden="true">{r.icon} </span>{pick(r, lang)}</strong>
                {" · "}{new Date(e.created_at).toLocaleString(lang === "en" ? "en-US" : "es-ES", { timeZone: "UTC" })}
                {" · "}{e.findings.length} {t("findings")}
              </li>
            );
          })}
        </ul>
      )}
      {cursor && <button type="button" className="sx-focus" onClick={mas} style={{ minHeight: SIZE.target, border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, background: ST.white, padding: "0 16px", cursor: "pointer", justifySelf: "start" }}>{t("more")}</button>}
    </section>
  );
}

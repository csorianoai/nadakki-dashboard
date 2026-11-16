"use client";

import React, { useEffect, useRef, useState } from "react";
import { getLead, newIdempotencyKey, revokeLeadConsent } from "@/lib/sites/client";
import { CT } from "@/lib/sites/contactos/copy";
import { CD } from "@/lib/sites/contactos/detalle-copy";
import { getDemoLead, revokeDemoConsent } from "@/lib/sites/contactos/mock";
import type { ConsentChannel, ConsentRecord, Lead } from "@/lib/sites/contactos/types";
import { pick, type Lang } from "@/lib/sites/copy-util";
import { SitesApiError } from "@/lib/sites/errors";
import { ERR } from "@/lib/sites/medios/copy";
import { SIZE, ST } from "@/lib/sites/tokens";
import { Aviso } from "../shell/Aviso";

type Carga = { k: "cargando" } | { k: "ok"; lead: Lead } | { k: "error"; code: string };
const ctl = { minHeight: SIZE.target, padding: "0 12px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", background: ST.white, color: ST.ink, marginRight: 8 };
const CLICK_IDS = ["gclid", "gbraid", "wbraid", "fbclid"] as const;

/** Consentimiento vigente (el ultimo registro) de cada canal. */
function ultimoPorCanal(cs: ConsentRecord[]): ConsentRecord[] {
  const m = new Map<string, ConsentRecord>();
  for (const c of cs) { const p = m.get(c.channel); if (!p || c.recorded_at >= p.recorded_at) m.set(c.channel, c); }
  return [...m.values()];
}

/** Detalle privado de un contacto y revocacion de consentimiento por canal. Ids de clic solo si click_consent=granted. */
export function DetalleContacto({ siteId, leadId, demo, lang, onClose, onUpdated }: {
  siteId: string | null; leadId: string; demo: boolean; lang: Lang; onClose: () => void; onUpdated: (l: Lead) => void;
}) {
  const [c, setC] = useState<Carga>({ k: "cargando" });
  const [conf, setConf] = useState<ConsentChannel | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<"" | "error" | "ya" | "ok">("");
  const claves = useRef(new Map<string, string>()); // una clave por (contacto, canal) hasta que la operacion termine
  const t = (k: string) => pick(CT[k] ?? CD[k], lang);

  useEffect(() => {
    let vivo = true;
    if (demo) {
      const l = getDemoLead(leadId);
      setC(l ? { k: "ok", lead: l } : { k: "error", code: "NOT_FOUND" });
    } else if (!siteId) setC({ k: "error", code: "UNKNOWN" });
    else {
      setC({ k: "cargando" });
      getLead(siteId, leadId).then(
        (lead) => vivo && setC({ k: "ok", lead }),
        (e) => vivo && setC({ k: "error", code: e instanceof SitesApiError ? e.code : "UNKNOWN" }),
      );
    }
    return () => { vivo = false; };
  }, [demo, siteId, leadId]);

  async function revocar(ch: ConsentChannel) {
    if (busy) return;
    const k = `${leadId}:${ch}`;
    if (!claves.current.has(k)) claves.current.set(k, newIdempotencyKey());
    setBusy(true); setMsg("");
    try {
      const lead = demo ? revokeDemoConsent(leadId, ch) : await revokeLeadConsent(siteId as string, leadId, ch, { idempotencyKey: claves.current.get(k) });
      claves.current.delete(k);
      setC({ k: "ok", lead }); onUpdated(lead); setConf(null); setMsg("ok");
    } catch (e) {
      const ya = (e instanceof SitesApiError && e.status === 409) || (e instanceof Error && e.message === "CONFLICT");
      if (ya) { claves.current.delete(k); setConf(null); setMsg("ya"); } else setMsg("error");
    } finally { setBusy(false); }
  }

  if (c.k === "cargando") return <p role="status">{t("loadingDetail")}</p>;
  if (c.k === "error") return <Aviso testid="estado-error-detalle" alert title={t("errDetail")} body={c.code === "NOT_FOUND" ? t("notFound") : pick(ERR[c.code] ?? ERR.UNKNOWN, lang)} />;
  const l = c.lead;
  const clic = l.ad_click;
  const ids = clic?.click_consent === "granted" ? CLICK_IDS.filter((x) => clic[x]) : [];
  let estadoClic: React.ReactNode;
  if (clic?.click_consent === "denied" || clic?.click_consent === "unknown") estadoClic = t("clickNone");
  else if (!clic || clic.click_consent === "not_required") estadoClic = t("clickAbsent");
  else if (!ids.length) estadoClic = t("clickEmpty");
  else estadoClic = <ul>{ids.map((x) => <li key={x}>{x}: <span>{clic[x]}</span></li>)}</ul>;

  return (
    <section data-testid="detalle-contacto" aria-labelledby="t-detalle" style={{ border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: SIZE.pad, margin: "16px 0", background: ST.white }}>
      <h2 id="t-detalle" style={{ margin: "0 0 8px", fontSize: SIZE.fontSub }}>{t("detailTitle")}: {l.name}</h2>
      <h3>{t("message")}</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{l.message}</p>
      <h3>{t("consents")}</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {ultimoPorCanal(l.consents).map((k) => {
          const vigente = k.status === "granted" && l.contactable_channels.includes(k.channel);
          return (
            <li key={k.channel} data-testid={`consent-${k.channel}`} style={{ marginBottom: 8 }}>
              <strong>{t(k.channel)}</strong>: {t(k.status)} · {t("textVersion")}: {k.text_version} · {k.recorded_at.slice(0, 10)}
              {vigente && conf !== k.channel && (
                <button type="button" className="sx-focus" style={{ ...ctl, marginLeft: 8 }} aria-label={`${t("revoke")}: ${t(k.channel)}`} onClick={() => { setMsg(""); setConf(k.channel); }}>{t("revoke")}</button>
              )}
            </li>
          );
        })}
      </ul>
      {conf && (
        <div role="group" aria-label={t("confirmTitle")} data-testid="confirmacion-revocar">
          <p>{t("confirmTitle")} ({t(conf)})</p>
          <button type="button" data-testid="confirmar-revocar" className="sx-focus" style={ctl} disabled={busy} onClick={() => revocar(conf)}>{busy ? t("revoking") : t("confirm")}</button>
          <button type="button" className="sx-focus" style={ctl} disabled={busy} onClick={() => { setConf(null); setMsg(""); }}>{t("cancel")}</button>
        </div>
      )}
      {msg === "error" && <p role="alert" data-testid="error-revocar" style={{ color: ST.badText }}>⚠ {t("errRevoke")}</p>}
      {msg === "ya" && <p role="status" data-testid="aviso-ya-revocado">{t("alreadyRevoked")}</p>}
      {msg === "ok" && <p role="status">{t("revokedOk")}</p>}
      <h3>{t("clicks")}</h3>
      <div data-testid="estado-clic">{estadoClic}</div>
      <button type="button" className="sx-focus" style={{ ...ctl, marginTop: 8 }} onClick={onClose}>{t("close")}</button>
    </section>
  );
}

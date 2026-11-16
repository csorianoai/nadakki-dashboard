"use client";

import React, { useEffect, useState } from "react";
import { listLeads } from "@/lib/sites/client";
import { CT } from "@/lib/sites/contactos/copy";
import { listDemoLeads } from "@/lib/sites/contactos/mock";
import { CHANNELS, LEAD_STATUSES, type ConsentChannel, type Lead, type LeadStatus } from "@/lib/sites/contactos/types";
import { pick } from "@/lib/sites/copy-util";
import { SitesApiError } from "@/lib/sites/errors";
import { ERR } from "@/lib/sites/medios/copy";
import { SIZE, ST } from "@/lib/sites/tokens";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";

type Carga = { k: "cargando" } | { k: "ok"; items: Lead[]; next: string | null } | { k: "error"; code: string };
const ctl = { minHeight: SIZE.target, padding: "0 10px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", background: ST.white, color: ST.ink };

/** Bandeja de contactos (PARTE 1/2: lista y filtros; el detalle y la revocacion van en la PARTE 2/2). Sin ids de clic en la lista ni datos personales en la URL. */
export function Contactos() {
  const { sites, demo, selectedId, lang } = useSites();
  const siteId = selectedId ?? sites[0]?.id ?? null;
  const [c, setC] = useState<Carga>({ k: "cargando" });
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [channel, setChannel] = useState<ConsentChannel | "">("");
  const [errMas, setErrMas] = useState(false);
  const t = (k: string) => pick(CT[k], lang);
  const q = { status: status || undefined, channel: channel || undefined };

  useEffect(() => {
    let vivo = true;
    if (demo) {
      setC({ k: "ok", next: null, items: listDemoLeads().filter((l) => (!status || l.status === status) && (!channel || l.contactable_channels.includes(channel))) });
    } else if (!siteId) setC({ k: "error", code: "UNKNOWN" });
    else {
      setC({ k: "cargando" });
      listLeads(siteId, q).then(
        (r) => vivo && setC({ k: "ok", items: r.items, next: r.next_cursor }),
        (e) => vivo && setC({ k: "error", code: e instanceof SitesApiError ? e.code : "UNKNOWN" }),
      );
    }
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, siteId, status, channel]);

  async function mas() {
    if (c.k !== "ok" || !c.next || !siteId) return;
    setErrMas(false);
    try {
      const r = await listLeads(siteId, { ...q, cursor: c.next });
      const ids = new Set(c.items.map((x) => x.id));
      setC({ k: "ok", items: [...c.items, ...r.items.filter((x) => !ids.has(x.id))], next: r.next_cursor });
    } catch { setErrMas(true); }
  }

  const cell = { textAlign: "left" as const, padding: "8px 12px", borderBottom: `1px solid ${ST.line}` };
  const filtro = (id: string, label: string, value: string, set: (v: string) => void, opts: readonly string[]) => (
    <div style={{ display: "inline-block", marginRight: 16 }}>
      <label htmlFor={id} style={{ display: "block" }}>{label}</label>
      <select id={id} className="sx-focus" style={ctl} value={value} onChange={(e) => set(e.target.value)}>
        <option value="">{t("all")}</option>
        {opts.map((o) => <option key={o} value={o}>{t(o)}</option>)}
      </select>
    </div>
  );
  let lista: React.ReactNode;
  if (c.k === "cargando") lista = <p role="status">{t("loading")}</p>;
  else if (c.k === "error") lista = <Aviso testid="estado-error-contactos" alert title={t("errTitle")} body={c.code === "NOT_FOUND" ? t("notFound") : pick(ERR[c.code] ?? ERR.UNKNOWN, lang)} />;
  else if (!c.items.length) lista = <Aviso testid="estado-vacio-contactos" title={t("emptyTitle")} body={t("emptyBody")} />;
  else {
    lista = (
      <table data-testid="lista-contactos" style={{ width: "100%", borderCollapse: "collapse", background: ST.white }}>
        <thead><tr>{["colName", "colChannels", "colState", "colDate", "colPage"].map((k) => <th key={k} scope="col" style={cell}>{t(k)}</th>)}</tr></thead>
        <tbody>
          {c.items.map((l) => (
            <tr key={l.id} data-testid={`contacto-${l.id}`}>
              <th scope="row" style={cell}>{l.name}</th>
              <td style={cell} data-testid={`canales-${l.id}`}>{l.contactable_channels.map((x) => t(x)).join(", ") || t("none")}</td>
              <td style={cell} data-testid={`estado-${l.id}`}>{t(l.status)}</td>
              <td style={cell}>{l.created_at.slice(0, 10)}</td>
              <td style={cell}>{l.source_page}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <section aria-labelledby="t-contactos">
      <h1 id="t-contactos" style={{ fontSize: SIZE.fontSub, margin: "0 0 12px" }}>{t("title")}</h1>
      {demo && <p>{t("demoNote")}</p>}
      <div style={{ marginBottom: 12 }}>
        {filtro("f-estado", t("fStatus"), status, (v) => setStatus(v as LeadStatus | ""), LEAD_STATUSES)}
        {filtro("f-canal", t("fChannel"), channel, (v) => setChannel(v as ConsentChannel | ""), CHANNELS)}
      </div>
      {lista}
      {errMas && <p role="alert" data-testid="error-mas" style={{ color: ST.badText }}>⚠ {t("errMore")}</p>}
      {c.k === "ok" && c.next && <button type="button" data-testid="cargar-mas" className="sx-focus" style={{ ...ctl, marginTop: 12 }} onClick={mas}>{t("more")}</button>}
    </section>
  );
}

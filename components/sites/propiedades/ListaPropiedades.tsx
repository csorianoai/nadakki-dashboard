"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listListings } from "@/lib/sites/client";
import { pick } from "@/lib/sites/copy-util";
import { demoListings } from "@/lib/sites/mocks/listings";
import { PRO } from "@/lib/sites/propiedades/copy";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { Listing } from "@/lib/sites/types";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";

type Carga = { k: "cargando" } | { k: "ok"; items: Listing[]; next: string | null } | { k: "error" };
const ctl = { minHeight: SIZE.target, padding: "0 10px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", boxSizing: "border-box" as const };

export function ListaPropiedades() {
  const { sites, demo, selectedId, lang } = useSites();
  const siteId = selectedId ?? sites[0]?.id ?? null;
  const [c, setC] = useState<Carga>({ k: "cargando" });
  const [estado, setEstado] = useState("");
  const [q, setQ] = useState("");
  const [errMas, setErrMas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const t = (k: string) => pick(PRO[k], lang);

  useEffect(() => {
    let vivo = true;
    if (demo) setC({ k: "ok", items: demoListings(), next: null });
    else if (!siteId) setC({ k: "error" });
    else {
      setC({ k: "cargando" });
      listListings(siteId).then(
        (r) => vivo && setC({ k: "ok", items: r.items, next: r.next_cursor }),
        () => vivo && setC({ k: "error" }),
      );
    }
    return () => { vivo = false; };
  }, [demo, siteId]);

  const items = useMemo(() => (c.k === "ok" ? c.items : []), [c]);
  const vistos = useMemo(() => {
    const n = q.trim().toLowerCase();
    return items.filter((l) => (!estado || l.publish_state === estado) && (!n || [l.title?.es, l.title?.en].some((s) => s?.toLowerCase().includes(n))));
  }, [items, estado, q]);

  async function mas() {
    if (c.k !== "ok" || !c.next || !siteId) return;
    setErrMas(false);
    setCargando(true);
    try {
      const r = await listListings(siteId, { cursor: c.next });
      const ids = new Set(c.items.map((x) => x.id));
      setC({ k: "ok", items: [...c.items, ...r.items.filter((x) => !ids.has(x.id))], next: r.next_cursor });
    } catch {
      setErrMas(true);
    }
    setCargando(false);
  }

  const href = (extra: string) => `/mi-web/propiedades?sitio=${encodeURIComponent(siteId ?? "")}&${extra}`;
  const link = { display: "inline-flex", alignItems: "center", minHeight: SIZE.target, padding: "0 14px", color: ST.ink };
  if (c.k === "cargando") return <p role="status">{t("loading")}</p>;
  if (c.k === "error") return <Aviso testid="estado-error-propiedades" alert title={t("errListTitle")} body={t("errListBody")} />;
  const cell = { textAlign: "left" as const, padding: "8px 12px", borderBottom: `1px solid ${ST.line}` };
  return (
    <section data-testid="lista-propiedades">
      <h1 style={{ fontSize: SIZE.fontSub, margin: "0 0 12px" }}>{t("listTitle")}</h1>
      <p><a className="sx-focus" data-testid="nueva-propiedad" href={href("nueva=1")} style={link}>{t("newListing")}</a></p>
      {!items.length ? <Aviso testid="estado-vacio-propiedades" title={t("emptyTitle")} body={t("emptyBody")} /> : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: SIZE.gap, margin: "0 0 12px" }}>
            <div><label htmlFor="f-buscar" style={{ display: "block" }}>{t("search")}</label>
              <input id="f-buscar" data-testid="buscar" className="sx-focus" style={ctl} value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div><label htmlFor="f-estado" style={{ display: "block" }}>{t("filterState")}</label>
              <select id="f-estado" data-testid="filtro-estado" className="sx-focus" style={ctl} value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">{t("all")}</option><option value="draft">{t("draft")}</option><option value="published">{t("published")}</option><option value="withdrawn">{t("withdrawn")}</option>
              </select></div>
          </div>
          {!vistos.length && <p role="status" data-testid="sin-coincidencias">{t("noMatch")}</p>}
          <table style={{ width: "100%", borderCollapse: "collapse", background: ST.white }}>
            <thead><tr><th scope="col" style={cell}>{t("colTitle")}</th><th scope="col" style={cell}>{t("colState")}</th><th scope="col" style={cell}><span style={{ position: "absolute", left: -9999 }}>{t("edit")}</span></th></tr></thead>
            <tbody>
              {vistos.map((l) => (
                <tr key={l.id} data-testid={`propiedad-${l.slug}`}>
                  <th scope="row" style={cell}>{l.title ? pick(l.title, lang) : t("noTitle")}</th>
                  <td style={cell} data-testid={`estado-propiedad-${l.slug}`}>{t(l.publish_state)}</td>
                  <td style={cell}><a className="sx-focus" data-testid={`editar-${l.slug}`} href={href(`propiedad=${encodeURIComponent(l.id)}`)} style={link}>{t("edit")}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
          {errMas && <p role="alert" data-testid="error-mas" style={{ color: ST.badText }}>⚠ {t("errMore")}</p>}
          {c.next && <button type="button" data-testid="cargar-mas" className="sx-focus" disabled={cargando} onClick={mas} style={{ ...ctl, marginTop: 12, padding: "0 20px" }}>{t("more")}</button>}
        </>
      )}
    </section>
  );
}

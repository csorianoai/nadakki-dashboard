"use client";

import React, { useEffect, useRef, useState } from "react";
import { listBuildings, listDevelopments, listZones } from "@/lib/sites/client";
import { CAT } from "@/lib/sites/catalogo/copy";
import { ENTS, nombreDe, verificado, type Ent, type Rec } from "@/lib/sites/catalogo/form";
import { demoItems } from "@/lib/sites/catalogo/mock";
import { pick } from "@/lib/sites/copy-util";
import { SIZE, ST } from "@/lib/sites/tokens";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";
import { FormCatalogo } from "./FormCatalogo";

const LIST = { desarrollos: listDevelopments, zonas: listZones, edificios: listBuildings };
type Carga = { k: "cargando" } | { k: "ok"; items: Rec[]; next: string | null } | { k: "error" };
type Vista = { k: "lista" } | { k: "form"; id: string | null };

/** Tres pestanas (desarrollos, zonas, edificios), cada una con lista y formulario. Sin borrar: se retira por Publicar. */
export function Catalogo() {
  const { sites, demo, selectedId, lang } = useSites();
  const siteId = selectedId ?? sites[0]?.id ?? null;
  const t = (k: string) => pick(CAT[k], lang);
  const [tab, setTab] = useState<Ent>("desarrollos");
  const [vista, setVista] = useState<Vista>({ k: "lista" });
  const [c, setC] = useState<Carga>({ k: "cargando" });
  const [errMas, setErrMas] = useState(false);
  const [rev, setRev] = useState(0);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    let vivo = true;
    if (vista.k !== "lista") return;
    if (demo) setC({ k: "ok", items: demoItems(tab), next: null });
    else if (!siteId) setC({ k: "error" });
    else {
      setC({ k: "cargando" });
      LIST[tab](siteId).then((r) => vivo && setC({ k: "ok", items: r.items as unknown as Rec[], next: r.next_cursor }), () => vivo && setC({ k: "error" }));
    }
    return () => { vivo = false; };
  }, [demo, siteId, tab, vista.k, rev]);

  function teclas(e: React.KeyboardEvent, i: number) {
    const n = ENTS.length;
    const j = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    setTab(ENTS[j]); setVista({ k: "lista" });
    refs.current[ENTS[j]]?.focus();
  }
  async function mas() {
    if (c.k !== "ok" || !c.next || !siteId) return;
    setErrMas(false);
    try {
      const r = await LIST[tab](siteId, { cursor: c.next });
      const ids = new Set(c.items.map((x) => x.id));
      setC({ k: "ok", items: [...c.items, ...(r.items as unknown as Rec[]).filter((x) => !ids.has(x.id))], next: r.next_cursor });
    } catch { setErrMas(true); }
  }

  const btn = { display: "inline-flex", alignItems: "center", minHeight: SIZE.target, padding: "0 14px", font: "inherit", cursor: "pointer" };
  const cell = { textAlign: "left" as const, padding: "8px 12px", borderBottom: `1px solid ${ST.line}` };
  const estadoDe = (it: Rec) => t(String(it.publish_state ?? "draft"));

  let cuerpo: React.ReactNode;
  if (vista.k === "form") {
    cuerpo = <FormCatalogo key={`${tab}-${vista.id ?? "nuevo"}`} ent={tab} siteId={siteId} itemId={vista.id} onBack={() => { setVista({ k: "lista" }); setRev((r) => r + 1); }} />;
  } else if (c.k === "cargando") cuerpo = <p role="status">{t("loading")}</p>;
  else if (c.k === "error") cuerpo = <Aviso testid="estado-error-catalogo" alert title={t("errTitle")} body={t("unavailable")} />;
  else {
    cuerpo = (
      <div data-testid={`lista-${tab}`}>
        <p><button type="button" className="sx-focus" data-testid={`nuevo-${tab}`} style={{ ...btn, border: `1px solid ${ST.control}`, background: ST.white, color: ST.ink }} onClick={() => setVista({ k: "form", id: null })}>{t("nuevo")}</button></p>
        <p><small>{t("retire")}</small></p>
        {!c.items.length ? <Aviso testid="estado-vacio-catalogo" title={t("emptyTitle")} body={t("emptyBody")} /> : (
          <table style={{ width: "100%", borderCollapse: "collapse", background: ST.white }}>
            <thead><tr><th scope="col" style={cell}>{t("colName")}</th><th scope="col" style={cell}>{t("colState")}</th>{tab === "desarrollos" && <th scope="col" style={cell}>{t("colVerif")}</th>}<th scope="col" style={cell}><span style={{ position: "absolute", left: -9999 }}>{t("editar")}</span></th></tr></thead>
            <tbody>
              {c.items.map((it) => (
                <tr key={String(it.id)} data-testid={`fila-${String(it.slug)}`}>
                  <th scope="row" style={cell}>{nombreDe(it.name, lang) || t("noName")}</th>
                  <td style={cell} data-testid={`estado-${String(it.slug)}`}>{estadoDe(it)}</td>
                  {tab === "desarrollos" && <td style={cell} data-testid={`verificacion-${String(it.slug)}`}>{verificado(it) === "pendiente" ? t("pendiente") : t(verificado(it) === "si" ? "vSi" : "vNo")}</td>}
                  <td style={cell}><button type="button" className="sx-focus" data-testid={`editar-${String(it.slug)}`} style={{ ...btn, border: `1px solid ${ST.control}`, background: ST.white, color: ST.ink }} onClick={() => setVista({ k: "form", id: String(it.id) })}>{t("editar")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {errMas && <p role="alert" data-testid="error-mas" style={{ color: ST.badText }}>⚠ {t("errTitle")}</p>}
        {c.next && <button type="button" data-testid="cargar-mas" className="sx-focus" style={{ ...btn, border: `1px solid ${ST.control}`, marginTop: 12 }} onClick={mas}>{t("more")}</button>}
      </div>
    );
  }

  return (
    <section data-testid="catalogo">
      <h1 style={{ fontSize: SIZE.fontSub, margin: "0 0 12px" }}>{t("title")}</h1>
      <div role="tablist" aria-label={t("tabs")} style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {ENTS.map((e, i) => (
          <button key={e} ref={(el) => { refs.current[e] = el; }} type="button" role="tab" id={`tab-${e}`} data-testid={`tab-${e}`} className="sx-focus"
            aria-selected={tab === e} aria-controls="panel-catalogo" tabIndex={tab === e ? 0 : -1} onKeyDown={(ev) => teclas(ev, i)}
            onClick={() => { setTab(e); setVista({ k: "lista" }); }}
            style={{ ...btn, border: `1px solid ${ST.control}`, borderBottom: tab === e ? `4px solid ${ST.teal}` : `1px solid ${ST.control}`, fontWeight: tab === e ? 700 : 400, background: ST.white, color: ST.ink }}>
            {t(e)}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panel-catalogo" aria-labelledby={`tab-${tab}`}>{cuerpo}</div>
    </section>
  );
}

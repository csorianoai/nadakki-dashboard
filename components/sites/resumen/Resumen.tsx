"use client";

import React, { useEffect, useState } from "react";
import { getReadiness, getSite } from "@/lib/sites/client";
import { pick, type Lang } from "@/lib/sites/copy-util";
import { SYNTH_READINESS } from "@/lib/sites/mocks/site";
import { ESTADO, GATE, RESUMEN } from "@/lib/sites/resumen/copy";
import { FONT, SIZE, ST } from "@/lib/sites/tokens";
import type { Site, SiteStatus } from "@/lib/sites/types";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";

type Carga = { k: "cargando" } | { k: "ok"; site: Site } | { k: "no-encontrado" } | { k: "error" };
type Bloqueos = { k: "cargando" } | { k: "ok"; n: number } | { k: "error" };

const COLOR: Record<SiteStatus, [string, string, string]> = {
  draft: [ST.neutralBg, ST.neutralText, "○"],
  in_review: [ST.warnBg, ST.warnText, "◐"],
  published: [ST.okBg, ST.okText, "●"],
  suspended: [ST.badBg, ST.badText, "■"],
};

function fecha(v: unknown, lang: Lang): string | null {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { dateStyle: "medium", timeZone: "UTC" });
}

function leerGate(site: Site): string {
  const c = site.compliance;
  const r = c && typeof c === "object" ? (c as { last_result?: unknown }).last_result : undefined;
  return r === "pass" || r === "warn" || r === "block" ? r : "none";
}

/** Resuelve el sitio elegido: con ?sitio= pregunta al servidor (404 = no encontrado); sin el, usa el primero de la lista. */
function useSitio(): Carga {
  const { sites, demo, selectedId } = useSites();
  const [c, setC] = useState<Carga>({ k: "cargando" });
  useEffect(() => {
    let vivo = true;
    const dato = (x: Carga) => vivo && setC(x);
    if (!selectedId) dato(sites[0] ? { k: "ok", site: sites[0] } : { k: "no-encontrado" });
    else if (demo) { const m = sites.find((s) => s.id === selectedId); dato(m ? { k: "ok", site: m } : { k: "no-encontrado" }); }
    else {
      dato({ k: "cargando" });
      getSite(selectedId).then(
        (site) => dato({ k: "ok", site }),
        (e) => dato((e as { status?: number })?.status === 404 ? { k: "no-encontrado" } : { k: "error" }),
      );
    }
    return () => { vivo = false; };
  }, [sites, demo, selectedId]);
  return c;
}

function useBloqueos(siteId: string | null, demo: boolean): Bloqueos {
  const [b, setB] = useState<Bloqueos>({ k: "cargando" });
  useEffect(() => {
    if (!siteId) return;
    if (demo) return setB({ k: "ok", n: SYNTH_READINESS.blocking.length });
    let vivo = true;
    setB({ k: "cargando" });
    getReadiness(siteId).then(
      (r) => vivo && setB({ k: "ok", n: r.blocking.filter((v) => v.severity === "block").length }),
      () => vivo && setB({ k: "error" }),
    );
    return () => { vivo = false; };
  }, [siteId, demo]);
  return b;
}

export function Resumen() {
  const { lang, demo, sites, selectedId, setSelectedId } = useSites();
  const t = (k: string) => pick(RESUMEN[k], lang);
  const carga = useSitio();
  const site = carga.k === "ok" ? carga.site : null;
  const bloqueos = useBloqueos(site?.id ?? null, demo);

  const fila = (testid: string, label: string, valor: React.ReactNode) => (
    <div data-testid={testid} style={{ background: ST.white, border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: SIZE.gap }}>
      <div style={{ color: ST.muted, fontSize: SIZE.fontSmall }}>{label}</div>
      <div style={{ fontSize: SIZE.fontSub, fontWeight: 600 }}>{valor}</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: SIZE.gap, fontFamily: FONT }}>
      <h1 style={{ margin: 0, fontSize: SIZE.fontTitle }}>{t("title")}</h1>
      {sites.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor="sx-sitio">{t("siteSelect")}</label>
          <select
            id="sx-sitio"
            className="sx-focus"
            style={{ minHeight: SIZE.target, border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, background: ST.white, color: ST.ink, fontSize: SIZE.fontBase, padding: "0 12px" }}
            value={selectedId ?? sites[0].id}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {sites.map((s) => <option key={s.id} value={s.id}>{pick(s.name, lang)}</option>)}
          </select>
        </div>
      )}
      {carga.k === "cargando" && <p role="status">{t("loading")}</p>}
      {carga.k === "no-encontrado" && <Aviso testid="estado-no-encontrado" alert title={t("notFoundTitle")} body={t("notFoundBody")} />}
      {carga.k === "error" && <Aviso testid="estado-error" alert title={t("notFoundTitle")} body={t("loadError")} />}
      {site && (() => {
        const [bg, fg, icono] = COLOR[site.status] ?? COLOR.draft;
        const pub = fecha(site.published_at ?? site.last_published_at, lang);
        const gate = leerGate(site);
        return (
          <>
            <h2 style={{ margin: 0, fontSize: SIZE.fontSub }}>{pick(site.name, lang)}</h2>
            <div style={{ display: "grid", gap: SIZE.gap, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {fila("estado-sitio", t("status"), (
                <span style={{ background: bg, color: fg, border: `1px solid ${fg}`, borderRadius: SIZE.radius, padding: "2px 10px" }}>
                  <span aria-hidden="true">{icono} </span>{ESTADO[site.status] ? pick(ESTADO[site.status], lang) : site.status}
                </span>
              ))}
              {fila("version", t("version"), site.content_version)}
              {fila("ultima-publicacion", t("lastPublished"), pub ?? t("neverPublished"))}
              {fila("gate", t("gate"), pick(GATE[gate], lang))}
            </div>
            {bloqueos.k === "ok" && bloqueos.n > 0 && (
              <p data-testid="bloqueos" role="status" style={{ margin: 0, color: ST.badText, fontWeight: 700 }}>
                <span aria-hidden="true">■ </span>{bloqueos.n} {t(bloqueos.n === 1 ? "blocksOne" : "blocksMany")}
              </p>
            )}
            {bloqueos.k === "error" && <p data-testid="bloqueos-error" style={{ margin: 0, color: ST.muted }}>{t("blocksUnknown")}</p>}
            <div>
              <a
                data-testid="ir-publicar"
                className="sx-focus"
                href={`/mi-web/publicar?sitio=${encodeURIComponent(site.id)}`}
                style={{ display: "inline-flex", alignItems: "center", minHeight: SIZE.target, padding: "0 20px", background: ST.teal, color: ST.white, borderRadius: SIZE.radius, fontWeight: 700 }}
              >
                {t("goPublish")}
              </a>
            </div>
          </>
        );
      })()}
    </div>
  );
}

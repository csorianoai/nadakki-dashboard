"use client";

import React, { useEffect, useState } from "react";
import { getPage, listListings, listMedia, listPages } from "@/lib/sites/client";
import { pick, type Lang } from "@/lib/sites/copy-util";
import { demoListings } from "@/lib/sites/mocks/listings";
import { demoPages } from "@/lib/sites/mocks/pages";
import { listDemoMedia } from "@/lib/sites/medios/mock";
import { VP, VP_ERR } from "@/lib/sites/vistaprevia/copy";
import { approvedAlts, buildListing, buildPage, type PreviewListing, type PreviewPage, type PreviewText } from "@/lib/sites/vistaprevia/logic";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { Listing, MediaAsset, Page } from "@/lib/sites/types";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";

type Load = { s: "loading" } | { s: "notfound" } | { s: "error"; code: string } | { s: "ok"; pages: Page[]; listings: Listing[]; media: MediaAsset[] };

const ctl = { minHeight: SIZE.target, border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, background: ST.white, color: ST.ink, fontSize: SIZE.fontBase, padding: "0 12px" } as const;

/** Vista previa APROXIMADA del borrador (el contrato no tiene endpoint de vista previa): todo se pinta como texto escapado. */
export function VistaPrevia() {
  const { sites, demo, selectedId, lang: shellLang } = useSites();
  const siteId = selectedId ?? sites[0]?.id ?? null;
  const [lang, setLang] = useState<Lang>(shellLang);
  const [movil, setMovil] = useState(false);
  const [load, setLoad] = useState<Load>({ s: "loading" });
  const [pageId, setPageId] = useState<string | null>(null);
  const [full, setFull] = useState<Page | null>(null);
  const t = (k: string) => pick(VP[k], lang);

  useEffect(() => setLang(shellLang), [shellLang]);

  useEffect(() => {
    if (!siteId) return;
    let vivo = true;
    setLoad({ s: "loading" });
    setFull(null);
    (async () => {
      try {
        if (demo) {
          if (vivo) setLoad({ s: "ok", pages: demoPages(), listings: demoListings(), media: listDemoMedia() });
          return;
        }
        const [p, l, m] = await Promise.all([listPages(siteId), listListings(siteId), listMedia(siteId)]);
        if (vivo) setLoad({ s: "ok", pages: p.items, listings: l.items, media: m.items });
      } catch (e) {
        if (!vivo) return;
        const x = e as { status?: number; code?: string };
        if (x.status === 404 || x.code === "NOT_FOUND") setLoad({ s: "notfound" });
        else setLoad({ s: "error", code: x.code ?? "DEFAULT" });
      }
    })();
    return () => { vivo = false; };
  }, [siteId, demo]);

  const pages = load.s === "ok" ? load.pages : [];
  const actualId = pageId && pages.some((p) => p.id === pageId) ? pageId : pages[0]?.id ?? null;
  useEffect(() => {
    if (!siteId || !actualId || demo) return setFull(null);
    let vivo = true;
    getPage(siteId, actualId).then((p) => { if (vivo) setFull(p); }, () => { if (vivo) setFull(null); });
    return () => { vivo = false; };
  }, [siteId, actualId, demo]);

  if (!siteId) return <p role="status">{t("noSite")}</p>;

  const alts = load.s === "ok" ? approvedAlts(load.media, lang) : new Map<string, string>();
  const baseP = pages.find((p) => p.id === actualId);
  const vistaP: PreviewPage | null = baseP ? buildPage(full && full.id === baseP.id ? full : baseP, lang, alts) : null;
  const vistaL: PreviewListing[] = load.s === "ok" ? load.listings.map((l) => buildListing(l, lang, alts)) : [];
  const txt = (x: PreviewText) => (
    <>
      {x.text}
      {x.fallback && <small style={{ display: "block", color: ST.muted }}>{t("fallbackEs")}</small>}
    </>
  );

  return (
    <div style={{ display: "grid", gap: SIZE.gap }}>
      <h1 style={{ fontSize: SIZE.fontSub, margin: 0 }}>{t("title")}</h1>
      <p data-testid="aviso-aproximada" style={{ margin: 0, background: ST.calloutBg, border: `1px solid ${ST.calloutLine}`, borderRadius: SIZE.radius, padding: 12 }}>{t("notice")}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: SIZE.gap, alignItems: "center" }}>
        <label htmlFor="vp-lang">{t("language")}</label>
        <select id="vp-lang" className="sx-focus" style={ctl} value={lang} onChange={(e) => setLang(e.target.value === "en" ? "en" : "es")}>
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
        <label htmlFor="vp-device">{t("device")}</label>
        <select id="vp-device" className="sx-focus" style={ctl} value={movil ? "m" : "d"} onChange={(e) => setMovil(e.target.value === "m")}>
          <option value="m">{t("mobile")}</option>
          <option value="d">{t("desktop")}</option>
        </select>
        {pages.length > 0 && (
          <>
            <label htmlFor="vp-page">{t("page")}</label>
            <select id="vp-page" className="sx-focus" style={ctl} value={actualId ?? ""} onChange={(e) => setPageId(e.target.value)}>
              {pages.map((p) => <option key={p.id} value={p.id}>{pick(p.title ?? { es: p.page_key }, lang) || p.page_key}</option>)}
            </select>
          </>
        )}
      </div>
      {load.s === "loading" && <p role="status" data-testid="vp-cargando">{t("loading")}</p>}
      {load.s === "notfound" && <Aviso testid="vp-no-encontrado" alert title={t("notFoundTitle")} body={t("notFoundBody")} />}
      {load.s === "error" && <Aviso testid="vp-error" alert title={t("errTitle")} body={pick(VP_ERR[load.code] ?? VP_ERR.DEFAULT, lang)} />}
      {load.s === "ok" && (
        <section aria-label={t("frame")} data-testid="vp-marco" data-device={movil ? "mobile" : "desktop"} style={{ width: movil ? 360 : "100%", maxWidth: "100%", background: ST.white, border: `2px solid ${ST.control}`, borderRadius: SIZE.radius, padding: SIZE.pad, display: "grid", gap: SIZE.gap }}>
          {!vistaP && <p>{t("noPages")}</p>}
          {vistaP && (
            <article style={{ display: "grid", gap: 12 }}>
              <h2 data-testid="vp-titulo" style={{ margin: 0, fontSize: SIZE.fontSub }}>{vistaP.title.text ? txt(vistaP.title) : t("untitled")}</h2>
              {vistaP.blocks.map((b) => b.kind === "legal"
                ? <p key={b.id} data-testid="vp-legal" style={{ margin: 0, border: `1px dashed ${ST.control}`, borderRadius: SIZE.radius, padding: 12 }}>{t("legalSlot")}</p>
                : (
                  <div key={b.id} data-testid="vp-bloque" style={{ display: "grid", gap: 8 }}>
                    {b.texts.map((x, i) => <p key={i} style={{ margin: 0 }}>{txt(x)}</p>)}
                    {b.images.map((alt, i) => <figure key={i} data-testid="vp-imagen" style={{ margin: 0 }}><figcaption>{t("imageOk")}: {alt}</figcaption></figure>)}
                  </div>
                ))}
            </article>
          )}
          <h2 style={{ margin: 0, fontSize: SIZE.fontSub }}>{t("listings")}</h2>
          {vistaL.length === 0 && <p>{t("noListings")}</p>}
          {vistaL.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
              {vistaL.map((l) => (
                <li key={l.id} data-testid="vp-propiedad">
                  <strong>{txt(l.title)}</strong>
                  {l.description && <span style={{ display: "block" }}>{txt(l.description)}</span>}
                  {l.images.map((alt, i) => <span key={i} data-testid="vp-imagen" style={{ display: "block" }}>{t("imageOk")}: {alt}</span>)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

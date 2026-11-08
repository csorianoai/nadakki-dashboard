"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { listSites } from "@/lib/sites/client";
import { pick, type Lang } from "@/lib/sites/copy-util";
import { demoPermitido } from "@/lib/sites/mode";
import { SYNTH_SITE } from "@/lib/sites/mocks/site";
import { SECCIONES, SHELL } from "@/lib/sites/shell/copy";
import { FONT, SIZE, ST } from "@/lib/sites/tokens";
import type { Site } from "@/lib/sites/types";
import { Aviso } from "./Aviso";
import { DemoBadge } from "./DemoBadge";
import { SitesContext, type ShellState, type SitesCtx } from "./SitesContext";

const CSS = `
.sx-focus:focus-visible{outline:${SIZE.focusWidth}px solid ${ST.teal};outline-offset:2px}
.sx-skip{position:absolute;left:8px;top:-100px;background:${ST.white};color:${ST.ink};padding:12px 16px;border:2px solid ${ST.teal};z-index:10}
.sx-skip:focus{top:8px}
`;

/** Armazon de Mi web: carga la lista (fail-closed), muestra el estado con su motivo y reparte idioma y sitio elegido. */
export function SitesShell({ children }: { children: React.ReactNode }) {
  const query = useSearchParams()?.get("sitio") ?? null;
  const pathname = usePathname() ?? "/mi-web";
  const [state, setState] = useState<ShellState>("checking");
  const [demo, setDemo] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [lang, setLang] = useState<Lang>("es");
  const [selectedId, setSel] = useState<string | null>(query);

  useEffect(() => setSel(query), [query]);

  // Estilos de foco en <head> (no dentro del arbol): el arbol solo contiene texto de la pantalla.
  useEffect(() => {
    if (document.getElementById("sx-css")) return;
    const el = document.createElement("style");
    el.id = "sx-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await listSites();
        if (!vivo) return;
        setSites(r.items);
        setState(r.items.length ? "ready" : "empty");
      } catch (e) {
        if (!vivo) return;
        const status = (e as { status?: number })?.status;
        if (status === 401 || status === 403) return setState("forbidden");
        if (demoPermitido()) {
          setDemo(true);
          setSites([SYNTH_SITE]);
          return setState("ready");
        }
        setState("unavailable");
      }
    })();
    return () => { vivo = false; };
  }, []);

  const setSelectedId = useCallback((id: string) => {
    setSel(id);
    if (typeof window !== "undefined") window.history.replaceState(null, "", `${window.location.pathname}?sitio=${encodeURIComponent(id)}`);
  }, []);

  const ctx = useMemo<SitesCtx>(() => ({ state, demo, sites, lang, selectedId, setSelectedId }), [state, demo, sites, lang, selectedId, setSelectedId]);
  const t = (k: string) => pick(SHELL[k], lang);
  const navId = selectedId ?? sites[0]?.id ?? null;
  const ctl = { minHeight: SIZE.target, border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, background: ST.white, color: ST.ink, fontSize: SIZE.fontBase, padding: "0 12px" };

  return (
    <SitesContext.Provider value={ctx}>
      <div style={{ background: ST.page, color: ST.ink, fontFamily: FONT, fontSize: SIZE.fontBase, minHeight: "100%" }}>
        <a href="#contenido" className="sx-skip sx-focus">{t("skip")}</a>
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: SIZE.gap, padding: `${SIZE.gap}px ${SIZE.pad}px`, background: ST.white, borderBottom: `1px solid ${ST.line}` }}>
          <strong style={{ fontSize: SIZE.fontSub }}>{t("brand")}</strong>
          {demo && <DemoBadge />}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <label htmlFor="sx-lang">{t("language")}</label>
            <select id="sx-lang" className="sx-focus" style={ctl} value={lang} onChange={(e) => setLang(e.target.value === "en" ? "en" : "es")}>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          {state === "ready" && (
            <nav aria-label={t("navLabel")} style={{ flexBasis: "100%" }}>
              <ul style={{ display: "flex", flexWrap: "wrap", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
                {SECCIONES.map((s) => {
                  const actual = pathname === s.path;
                  return (
                    <li key={s.key}>
                      <a
                        href={navId ? `${s.path}?sitio=${encodeURIComponent(navId)}` : s.path}
                        className="sx-focus"
                        aria-current={actual ? "page" : undefined}
                        style={{ display: "inline-flex", alignItems: "center", minHeight: SIZE.target, padding: "0 14px", borderRadius: SIZE.radius, textDecoration: actual ? "none" : "underline", fontWeight: actual ? 700 : 400, background: actual ? ST.calloutBg : "transparent", border: `1px solid ${actual ? ST.teal : "transparent"}`, color: ST.ink }}
                      >
                        {t(s.key)}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </header>
        <main id="contenido" tabIndex={-1} style={{ maxWidth: SIZE.maxWidth, margin: "0 auto", padding: SIZE.pad, display: "grid", gap: SIZE.gap }}>
          {demo && state === "ready" && <p style={{ margin: 0, color: ST.demoText }}>{t("demoNote")}</p>}
          {state === "checking" && <p role="status" data-testid="estado-comprobando">{t("checking")}</p>}
          {state === "forbidden" && <Aviso testid="estado-sin-acceso" alert title={t("noAccessTitle")} body={t("noAccessBody")} />}
          {state === "unavailable" && <Aviso testid="estado-unavailable" alert title={t("unavailableTitle")} body={t("unavailableBody")} />}
          {state === "empty" && <Aviso testid="estado-vacio" title={t("emptyTitle")} body={t("emptyBody")} />}
          {state === "ready" && children}
        </main>
      </div>
    </SitesContext.Provider>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { getReadiness, listPages, newIdempotencyKey, publishSite, unpublishSite } from "@/lib/sites/client";
import { pick } from "@/lib/sites/copy-util";
import { SYNTH_READINESS } from "@/lib/sites/mocks/site";
import { ERR, ESTADOS, PUB } from "@/lib/sites/publicar/copy";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { PublishResult, Violation } from "@/lib/sites/types";
import { useSites } from "../shell/SitesContext";
import { Historial } from "./Historial";
import { Violaciones } from "./Violaciones";

type Res =
  | { kind: "published"; warnings: Violation[] }
  | { kind: "review"; rules: string[] }
  | { kind: "blocked"; items: Violation[] }
  | { kind: "ready"; ready: boolean; items: Violation[] }
  | { kind: "unpublished" }
  | { kind: "demo" }
  | { kind: "error"; code: string }
  | null;

const btn = { minHeight: SIZE.target, border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, background: ST.white, color: ST.ink, fontSize: SIZE.fontBase, padding: "0 16px", cursor: "pointer" } as const;
const primary = { ...btn, background: ST.teal, color: ST.white, fontWeight: 700 } as const;

/** Publicar: todo lo que se pinta sale de la respuesta del servidor; solo un 200 marca el sitio como publicado. */
export function Publicar() {
  const { sites, demo, selectedId, lang } = useSites();
  const siteId = selectedId ?? sites[0]?.id ?? null;
  const site = sites.find((s) => s.id === siteId) ?? null;
  const t = (k: string) => pick(PUB[k], lang);
  const [estado, setEstado] = useState<string>(site?.status ?? "draft");
  const [res, setRes] = useState<Res>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [paginas, setPaginas] = useState<Record<string, string>>({});
  const [version, setVersion] = useState(0);
  const claves = useRef<{ publish?: string; unpublish?: string }>({});

  useEffect(() => { setEstado(site?.status ?? "draft"); setRes(null); }, [siteId, site?.status]);
  useEffect(() => {
    if (demo || !siteId) return;
    let vivo = true;
    listPages(siteId).then((r) => { if (vivo) setPaginas(Object.fromEntries(r.items.map((p) => [p.page_key, p.id]))); }, () => {});
    return () => { vivo = false; };
  }, [siteId, demo]);

  if (!siteId) return <p role="status">{t("noSite")}</p>;

  const fallo = (e: unknown): Res => ({ kind: "error", code: (e as { code?: string })?.code ?? "DEFAULT" });

  const revisar = async () => {
    setOcupado(true);
    try {
      if (demo) {
        const r = SYNTH_READINESS;
        setRes({ kind: "ready", ready: r.ready, items: [...r.blocking, ...r.warnings, ...r.info] });
      } else {
        const r = await getReadiness(siteId);
        setRes({ kind: "ready", ready: r.ready, items: [...r.blocking, ...r.warnings, ...r.info] });
      }
    } catch (e) { setRes(fallo(e)); } finally { setOcupado(false); }
  };

  const publicar = async () => {
    if (demo) return setRes({ kind: "demo" }); // simulacro: ni llamada ni cambio de estado
    setOcupado(true);
    claves.current.publish ??= newIdempotencyKey(); // un fallo de red conserva la clave para reintentar
    try {
      const r: PublishResult = await publishSite(siteId, {}, { idempotencyKey: claves.current.publish });
      claves.current.publish = undefined;
      setVersion((n) => n + 1);
      if (r.status === "published") {
        setEstado("published");
        setRes({ kind: "published", warnings: r.warnings ?? [] });
      } else if (r.pending_manual_rules?.length) {
        setRes({ kind: "review", rules: r.pending_manual_rules });
      } else {
        setRes({ kind: "error", code: "UNKNOWN_RESULT" });
      }
    } catch (e) {
      const x = e as { code?: string; violations?: Violation[] };
      if (x.code !== "NETWORK") claves.current.publish = undefined;
      if (x.code === "PUBLISH_BLOCKED" && x.violations?.length) { setVersion((n) => n + 1); setRes({ kind: "blocked", items: x.violations }); }
      else setRes(fallo(e));
    } finally { setOcupado(false); }
  };

  const despublicar = async () => {
    setConfirmar(false);
    if (demo) return setRes({ kind: "demo" });
    setOcupado(true);
    claves.current.unpublish ??= newIdempotencyKey();
    try {
      const r = await unpublishSite(siteId, {}, { idempotencyKey: claves.current.unpublish });
      claves.current.unpublish = undefined;
      setEstado(r.status === "published" ? "published" : r.status);
      setVersion((n) => n + 1);
      setRes({ kind: "unpublished" });
    } catch (e) {
      if ((e as { code?: string })?.code !== "NETWORK") claves.current.unpublish = undefined;
      setRes(fallo(e));
    } finally { setOcupado(false); }
  };

  const caja = (testid: string, children: React.ReactNode, alerta = false) => (
    <section data-testid={testid} role={alerta ? "alert" : "status"} style={{ background: alerta ? ST.badBg : ST.calloutBg, color: alerta ? ST.badText : ST.ink, border: `1px solid ${alerta ? ST.badText : ST.calloutLine}`, borderRadius: SIZE.radius, padding: SIZE.pad, display: "grid", gap: 8 }}>{children}</section>
  );
  const lista = (items: Violation[], testid: string) => <Violaciones items={items} siteId={siteId} lang={lang} demo={demo} paginas={paginas} testid={testid} />;

  return (
    <div style={{ display: "grid", gap: SIZE.gap }}>
      <h1 style={{ fontSize: SIZE.fontSub, margin: 0 }}>{t("title")}</h1>
      <p style={{ margin: 0 }}>{t("status")}: <strong data-testid="estado-sitio">{pick(ESTADOS[estado] ?? ESTADOS.draft, lang)}</strong></p>
      <p style={{ margin: 0 }}>{t("scope")}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="sx-focus" style={btn} disabled={ocupado} onClick={revisar}>{t("check")}</button>
        <button type="button" className="sx-focus" style={primary} disabled={ocupado} onClick={publicar}>{t("publish")}</button>
        {estado === "published" && <button type="button" className="sx-focus" style={btn} disabled={ocupado} onClick={() => setConfirmar(true)}>{t("unpublish")}</button>}
      </div>
      {ocupado && <p role="status">{t("working")}</p>}
      {confirmar && (
        <div role="dialog" aria-modal="true" aria-labelledby="dlg-t" data-testid="confirmar-despublicar" style={{ background: ST.white, border: `2px solid ${ST.teal}`, borderRadius: SIZE.radius, padding: SIZE.pad, display: "grid", gap: 8 }}>
          <h2 id="dlg-t" style={{ margin: 0, fontSize: SIZE.fontSub }}>{t("confirmTitle")}</h2>
          <p style={{ margin: 0 }}>{t("confirmBody")}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="sx-focus" style={primary} onClick={despublicar}>{t("confirmYes")}</button>
            <button type="button" className="sx-focus" style={btn} onClick={() => setConfirmar(false)}>{t("confirmNo")}</button>
          </div>
        </div>
      )}
      {res?.kind === "published" && caja("resultado-publicado", <>
        <strong>✓ {t("published")}</strong>
        {res.warnings.length > 0 && <div data-testid="resultado-avisos"><p style={{ margin: "0 0 8px" }}>{t("publishedWarn")}</p>{lista(res.warnings, "lista-avisos")}</div>}
      </>)}
      {res?.kind === "review" && caja("resultado-revision", <>
        <strong>{t("review")}</strong>
        <p style={{ margin: 0 }}>{t("reviewBody")}</p>
        <ul style={{ margin: 0 }}>{res.rules.map((r) => <li key={r}>{t("manualRule")} · {t("rule")}: {r}</li>)}</ul>
      </>)}
      {res?.kind === "blocked" && caja("resultado-bloqueado", <>
        <strong role="alert">■ {t("blockedTitle")}</strong>
        {lista(res.items, "lista-violaciones")}
      </>)}
      {res?.kind === "ready" && caja("resultado-revisado", <>
        <strong>{t("readyTitle")}: {res.ready ? t("readyYes") : t("readyNo")}</strong>
        {res.items.length > 0 && lista(res.items, "lista-readiness")}
      </>)}
      {res?.kind === "unpublished" && caja("resultado-despublicado", <strong>✓ {t("unpublished")}</strong>)}
      {res?.kind === "demo" && caja("resultado-demo", <strong>{t("demoSim")}</strong>)}
      {res?.kind === "error" && caja("resultado-error", <>
        <strong>{t("errTitle")}</strong>
        <p style={{ margin: 0 }}>{res.code === "UNKNOWN_RESULT" ? t("unknownResult") : pick(ERR[res.code] ?? ERR.DEFAULT, lang)}</p>
      </>, true)}
      <Historial siteId={siteId} lang={lang} demo={demo} version={version} />
    </div>
  );
}

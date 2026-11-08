"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getPage, updatePage } from "@/lib/sites/client";
import { pick } from "@/lib/sites/copy-util";
import { SitesApiError } from "@/lib/sites/errors";
import { demoPage, saveDemoPage } from "@/lib/sites/mocks/pages";
import { PAG, ERR } from "@/lib/sites/paginas/copy";
import { aForm, aplicar, esLegal, parche, sinIngles, textosBloque, validar, type Bi2, type Errores, type Form } from "@/lib/sites/paginas/form";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { Page } from "@/lib/sites/types";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";

type Carga = { k: "cargando" } | { k: "ok"; page: Page } | { k: "noenc" } | { k: "error" };
type Guardado = { k: "ninguno" } | { k: "guardando" } | { k: "ok"; demo: boolean; sinEn: boolean } | { k: "error"; code: string };

const ctl = { minHeight: SIZE.target, padding: "0 10px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", width: "100%", boxSizing: "border-box" as const };

export function EditorPagina({ siteId, pageId }: { siteId: string | null; pageId: string }) {
  const { demo, lang } = useSites();
  const t = (k: string) => pick(PAG[k], lang);
  const [c, setC] = useState<Carga>({ k: "cargando" });
  const [form, setForm] = useState<Form | null>(null);
  const [errs, setErrs] = useState<Errores>({});
  const [g, setG] = useState<Guardado>({ k: "ninguno" });
  const base = useRef<Page | null>(null);

  useEffect(() => {
    let vivo = true;
    const abrir = (p: Page) => { base.current = p; setForm(aForm(p)); setC({ k: "ok", page: p }); };
    setC({ k: "cargando" });
    if (demo) {
      const p = demoPage(pageId);
      if (p) abrir(p); else setC({ k: "noenc" });
    } else if (!siteId) setC({ k: "error" });
    else {
      getPage(siteId, pageId).then(
        (p) => vivo && abrir(p),
        (e) => vivo && setC(e instanceof SitesApiError && e.status === 404 ? { k: "noenc" } : { k: "error" }),
      );
    }
    return () => { vivo = false; };
  }, [demo, siteId, pageId]);

  const page = c.k === "ok" ? c.page : null;
  const sucio = useMemo(() => !!page && !!form && Object.keys(parche(form, page)).length > 0, [page, form]);

  useEffect(() => {
    if (!sucio) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [sucio]);

  if (c.k === "cargando") return <p role="status">{t("loading")}</p>;
  if (c.k === "noenc") return <Aviso testid="estado-no-encontrada" title={t("notFoundTitle")} body={t("notFoundBody")} />;
  if (c.k === "error" || !page || !form) return <Aviso testid="estado-error-pagina" alert title={t("errPageTitle")} body={t("errPageBody")} />;

  const set = (fn: (f: Form) => void) => {
    const n: Form = { ...form, title: { ...form.title }, meta: { ...form.meta }, slug: { ...form.slug }, blocks: { ...form.blocks } };
    fn(n);
    setForm(n);
    setG({ k: "ninguno" });
  };

  async function guardar() {
    if (!form || !page) return;
    const e = validar(form, page);
    setErrs(e);
    if (Object.keys(e).length) { setG({ k: "ninguno" }); return; }
    const p = parche(form, page);
    if (!Object.keys(p).length) return;
    setG({ k: "guardando" });
    const sinEn = sinIngles(form) > 0;
    try {
      let nueva: Page;
      if (demo) { nueva = aplicar(page, p); saveDemoPage(nueva); }
      else nueva = { ...aplicar(page, p), ...(await updatePage(siteId as string, page.id, p)) };
      setC({ k: "ok", page: nueva });
      setG({ k: "ok", demo, sinEn });
    } catch (err) {
      setG({ k: "error", code: err instanceof SitesApiError ? err.code : "UNKNOWN" });
    }
  }

  const par = (id: string, label: string, v: Bi2, onChange: (l: "es" | "en", s: string) => void, opts: { help?: string; esReq?: boolean } = {}) => (
    <fieldset key={id} style={{ border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: 12, margin: "0 0 12px" }}>
      <legend>{label}</legend>
      {(["es", "en"] as const).map((l) => {
        const key = `${id}-${l}`;
        const err = errs[key];
        const eid = `err-${key}`;
        const hid = `help-${key}`;
        return (
          <div key={l} style={{ marginBottom: 8 }}>
            <label htmlFor={`f-${key}`} style={{ display: "block" }}>
              {label} ({t(l === "es" ? "langEs" : "langEn")}, {t(l === "es" ? "required" : "optional")})
            </label>
            <input
              id={`f-${key}`} data-testid={key} className="sx-focus" style={ctl} value={v[l]} lang={l}
              aria-invalid={err ? true : undefined} aria-required={l === "es" ? true : undefined}
              aria-describedby={[err ? eid : "", opts.help ? hid : ""].filter(Boolean).join(" ") || undefined}
              onChange={(e) => onChange(l, e.target.value)}
            />
            {opts.help && <small id={hid}>{opts.help}</small>}
            {err && <p id={eid} role="alert" data-testid={`error-${key}`} style={{ color: ST.badText, margin: "4px 0 0" }}>⚠ {t(err === "patron" ? "errSlug" : "errRequired")}</p>}
          </div>
        );
      })}
    </fieldset>
  );

  const textos = textosBloque(page);
  const nErr = Object.keys(errs).length;
  return (
    <section data-testid="editor-pagina">
      <p><a className="sx-focus" href={`/mi-web/paginas?sitio=${encodeURIComponent(siteId ?? "")}`} style={{ display: "inline-flex", alignItems: "center", minHeight: SIZE.target, color: ST.ink }}
        onClick={(e) => { if (sucio && !window.confirm(t("leave"))) e.preventDefault(); }}>{t("back")}</a></p>
      <h1 style={{ fontSize: SIZE.fontSub, margin: "0 0 12px" }}>{page.page_key}</h1>
      {sucio && <p role="status" data-testid="sin-guardar">{t("unsaved")}</p>}
      {par("titulo", t("fTitle"), form.title, (l, s) => set((f) => { f.title[l] = s; }))}
      {par("meta", t("fMeta"), form.meta, (l, s) => set((f) => { f.meta[l] = s; }))}
      {par("slug", t("fSlug"), form.slug, (l, s) => set((f) => { f.slug[l] = s; }), { help: t("slugHelp") })}
      <h2 style={{ fontSize: SIZE.fontSub }}>{t("blocks")}</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {(page.body ?? []).map((b) => {
          if (esLegal(b)) {
            return <li key={b.block_id} data-testid={`bloque-legal-${b.block_id}`} style={{ padding: 12, background: ST.neutralBg, margin: "0 0 12px", borderRadius: SIZE.radius }}><strong>{t("legalName")}</strong>: {t("legalNote")}</li>;
          }
          const mios = textos.filter((x) => x.blockId === b.block_id);
          if (!mios.length) {
            return <li key={b.block_id} data-testid={`bloque-otro-${b.block_id}`} style={{ padding: 12, background: ST.neutralBg, margin: "0 0 12px", borderRadius: SIZE.radius }}><strong>{t("otherBlock")} {b.type}</strong>: {t("otherNote")}</li>;
          }
          return <li key={b.block_id}>{mios.map((x) => par(x.id, `${t("textOf")}: ${x.key}`, form.blocks[x.id], (l, s) => set((f) => { f.blocks[x.id] = { ...f.blocks[x.id], [l]: s }; })))}</li>;
        })}
      </ul>
      {nErr > 0 && <p role="alert" data-testid="error-campos" style={{ color: ST.badText }}>⚠ {t("fixFields")}</p>}
      {g.k === "error" && <div role="alert" data-testid="error-guardar" style={{ background: ST.badBg, color: ST.badText, padding: SIZE.pad, borderRadius: SIZE.radius, margin: "0 0 12px" }}><strong>{t("errSaveTitle")}</strong><p style={{ margin: "8px 0 0" }}>{pick(ERR[g.code] ?? ERR.UNKNOWN, lang)}</p></div>}
      {g.k === "ok" && <p role="status" data-testid="guardado">{t(g.demo ? "savedDemo" : "saved")}</p>}
      {(g.k === "ok" ? g.sinEn : sinIngles(form) > 0) && <p role="status" data-testid="aviso-ingles">{t("enWarn")}</p>}
      <button type="button" data-testid="guardar" className="sx-focus" disabled={g.k === "guardando"} onClick={guardar}
        style={{ minHeight: SIZE.target, padding: "0 20px", background: ST.teal, color: ST.white, border: 0, borderRadius: SIZE.radius, font: "inherit" }}>
        {t(g.k === "guardando" ? "saving" : "save")}
      </button>
    </section>
  );
}

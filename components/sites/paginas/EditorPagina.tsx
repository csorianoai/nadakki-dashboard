"use client";

import React, { useEffect, useState } from "react";
import { getPage, updatePage } from "@/lib/sites/client";
import { pick } from "@/lib/sites/copy-util";
import { demoPage, saveDemoPage } from "@/lib/sites/mocks/pages";
import { ERR, PAG } from "@/lib/sites/paginas/copy";
import { aForm, aplicar, esLegal, parche, sinIngles, textosBloque, validar, type Bi2, type Errores, type Form } from "@/lib/sites/paginas/form";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { Page } from "@/lib/sites/types";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";

type Carga = { k: "cargando" } | { k: "ok"; page: Page } | { k: "no-encontrada" } | { k: "error" };

function usePagina(siteId: string | null, pageId: string, demo: boolean): [Carga, (p: Page) => void] {
  const [c, setC] = useState<Carga>({ k: "cargando" });
  useEffect(() => {
    let vivo = true;
    const dato = (x: Carga) => vivo && setC(x);
    if (demo) { const p = demoPage(pageId); dato(p ? { k: "ok", page: p } : { k: "no-encontrada" }); }
    else if (!siteId) dato({ k: "error" });
    else {
      dato({ k: "cargando" });
      getPage(siteId, pageId).then(
        (page) => dato({ k: "ok", page }),
        (e) => dato((e as { status?: number })?.status === 404 ? { k: "no-encontrada" } : { k: "error" }),
      );
    }
    return () => { vivo = false; };
  }, [siteId, pageId, demo]);
  return [c, (page) => setC({ k: "ok", page })];
}

export function EditorPagina({ pageId }: { pageId: string }) {
  const { sites, demo, selectedId, lang } = useSites();
  const siteId = selectedId ?? sites[0]?.id ?? null;
  const [c, setPage] = usePagina(siteId, pageId, demo);
  const t = (k: string) => pick(PAG[k], lang);
  if (c.k === "cargando") return <p role="status">{t("loading")}</p>;
  if (c.k === "no-encontrada") return <Aviso testid="estado-no-encontrada" title={t("notFoundTitle")} body={t("notFoundBody")} />;
  if (c.k === "error") return <Aviso testid="estado-error-pagina" alert title={t("errPageTitle")} body={t("errPageBody")} />;
  return <Formulario key={c.page.id} page={c.page} siteId={siteId} demo={demo} onSaved={setPage} />;
}

function Campo(p: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; help?: string; area?: boolean;
}) {
  const fid = `f-${p.id}`;
  const desc = [p.error ? `${fid}-err` : "", p.help ? `${fid}-help` : ""].filter(Boolean).join(" ") || undefined;
  const style = { minHeight: SIZE.target, border: `1px solid ${p.error ? ST.badText : ST.control}`, borderRadius: SIZE.radius, background: ST.white, color: ST.ink, fontSize: SIZE.fontBase, padding: "8px 12px", width: "100%", boxSizing: "border-box" as const };
  const common = { id: fid, className: "sx-focus", "data-testid": `campo-${p.id}`, value: p.value, "aria-invalid": p.error ? true : undefined, "aria-describedby": desc, style };
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <label htmlFor={fid} style={{ fontWeight: 600 }}>{p.label}</label>
      {p.area ? <textarea rows={3} {...common} onChange={(e) => p.onChange(e.target.value)} /> : <input type="text" {...common} onChange={(e) => p.onChange(e.target.value)} />}
      {p.help && <span id={`${fid}-help`} style={{ color: ST.muted, fontSize: SIZE.fontSmall }}>{p.help}</span>}
      {p.error && <span id={`${fid}-err`} role="alert" style={{ color: ST.badText, fontWeight: 600 }}>⚠ {p.error}</span>}
    </div>
  );
}

function Formulario({ page, siteId, demo, onSaved }: { page: Page; siteId: string | null; demo: boolean; onSaved: (p: Page) => void }) {
  const { lang } = useSites();
  const t = (k: string) => pick(PAG[k], lang);
  const [form, setForm] = useState<Form>(() => aForm(page));
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const cambios = parche(form, page);
  const sucio = Object.keys(cambios).length > 0;
  const faltaEn = sinIngles(form);

  useEffect(() => {
    if (!sucio) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [sucio]);

  const set = (k: "title" | "meta" | "slug", l: keyof Bi2) => (v: string) => { setOk(null); setForm((f) => ({ ...f, [k]: { ...f[k], [l]: v } })); };
  const setBloque = (id: string, l: keyof Bi2) => (v: string) => { setOk(null); setForm((f) => ({ ...f, blocks: { ...f.blocks, [id]: { ...f.blocks[id], [l]: v } } })); };
  const err = (id: string) => (errores[id] ? t(errores[id] === "patron" ? "errSlug" : "errRequired") : undefined);
  const lbl = (base: string, l: "langEs" | "langEn") => `${base} (${t(l)}) — ${t(l === "langEs" ? "required" : "optional")}`;

  async function guardar() {
    setOk(null); setFallo(null);
    const e = validar(form, page);
    setErrores(e);
    if (Object.keys(e).length) { setFallo(t("fixFields")); return; }
    setGuardando(true);
    try {
      let nueva: Page;
      if (demo) { nueva = aplicar(page, cambios); saveDemoPage(nueva); }
      else {
        if (!siteId) throw new Error("sin sitio");
        nueva = await updatePage(siteId, page.id, cambios);
      }
      setOk(`${t(demo ? "savedDemo" : "saved")}${faltaEn ? ` ${t("savedEn")}` : ""}`);
      onSaved(nueva);
    } catch (x) {
      const code = (x as { code?: string })?.code ?? "UNKNOWN";
      setFallo(pick(ERR[code] ?? ERR.UNKNOWN, lang));
      setGuardando(false);
    }
  }

  const volver = (ev: React.MouseEvent) => { if (sucio && !window.confirm(t("leave"))) ev.preventDefault(); };
  const textos = textosBloque(page);
  const box = { background: ST.white, border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: SIZE.pad, display: "grid", gap: SIZE.gap };

  return (
    <form data-testid="editor-pagina" noValidate onSubmit={(ev) => { ev.preventDefault(); void guardar(); }} style={{ display: "grid", gap: SIZE.gap }}>
      <a className="sx-focus" href={`/mi-web/paginas${siteId ? `?sitio=${encodeURIComponent(siteId)}` : ""}`} onClick={volver} style={{ display: "inline-flex", alignItems: "center", minHeight: SIZE.target, color: ST.ink }}>{t("back")}</a>
      <h1 style={{ fontSize: SIZE.fontSub, margin: 0 }}>{page.page_key}</h1>
      {sucio && <p role="status" style={{ margin: 0, fontWeight: 600 }}>{t("unsaved")}</p>}
      {faltaEn > 0 && <p role="status" data-testid="aviso-en" style={{ margin: 0, color: ST.warnText, background: ST.warnBg, padding: 8, borderRadius: SIZE.radius }}>⚠ {t("enWarn")}</p>}

      <fieldset style={box}>
        <legend>{t("fTitle")}</legend>
        <Campo id="titulo-es" label={lbl(t("fTitle"), "langEs")} value={form.title.es} onChange={set("title", "es")} error={err("titulo-es")} />
        <Campo id="titulo-en" label={lbl(t("fTitle"), "langEn")} value={form.title.en} onChange={set("title", "en")} />
      </fieldset>
      <fieldset style={box}>
        <legend>{t("fMeta")}</legend>
        <Campo area id="meta-es" label={lbl(t("fMeta"), "langEs")} value={form.meta.es} onChange={set("meta", "es")} error={err("meta-es")} />
        <Campo area id="meta-en" label={lbl(t("fMeta"), "langEn")} value={form.meta.en} onChange={set("meta", "en")} />
      </fieldset>
      <fieldset style={box}>
        <legend>{t("fSlug")}</legend>
        <Campo id="slug-es" label={lbl(t("fSlug"), "langEs")} value={form.slug.es} onChange={set("slug", "es")} error={err("slug-es")} help={t("slugHelp")} />
        <Campo id="slug-en" label={lbl(t("fSlug"), "langEn")} value={form.slug.en} onChange={set("slug", "en")} error={err("slug-en")} help={t("slugHelp")} />
      </fieldset>

      <section aria-labelledby="blq-h" style={{ display: "grid", gap: SIZE.gap }}>
        <h2 id="blq-h" style={{ fontSize: SIZE.fontSub, margin: 0 }}>{t("blocks")}</h2>
        {(page.body ?? []).map((b) => {
          if (esLegal(b)) {
            return (
              <div key={b.block_id} data-testid={`bloque-legal-${b.block_id}`} style={{ ...box, background: ST.neutralBg }}>
                <strong>{t("legalName")}</strong>
                <span>{t("legalNote")}</span>
              </div>
            );
          }
          const mios = textos.filter((x) => x.blockId === b.block_id);
          if (!mios.length) {
            return (
              <div key={b.block_id} data-testid={`bloque-otro-${b.block_id}`} style={{ ...box, background: ST.neutralBg }}>
                <strong>{t("otherBlock")} {b.type}</strong>
                <span>{t("otherNote")}</span>
              </div>
            );
          }
          return (
            <fieldset key={b.block_id} data-testid={`bloque-texto-${b.block_id}`} style={box}>
              <legend>{t("otherBlock")} {b.type}</legend>
              {mios.map((x) => (
                <React.Fragment key={x.id}>
                  <Campo id={`${x.id}-es`} label={lbl(`${t("textOf")} ${x.key}`, "langEs")} value={form.blocks[x.id].es} onChange={setBloque(x.id, "es")} error={err(`${x.id}-es`)} area />
                  <Campo id={`${x.id}-en`} label={lbl(`${t("textOf")} ${x.key}`, "langEn")} value={form.blocks[x.id].en} onChange={setBloque(x.id, "en")} area />
                </React.Fragment>
              ))}
            </fieldset>
          );
        })}
      </section>

      {fallo && <div data-testid="error-guardar" role="alert" style={{ color: ST.badText, background: ST.badBg, border: `1px solid ${ST.badText}`, borderRadius: SIZE.radius, padding: SIZE.pad }}><strong>{t("errSaveTitle")}.</strong> {fallo}</div>}
      {ok && <p data-testid="guardado" role="status" style={{ margin: 0, color: ST.okText, background: ST.okBg, padding: SIZE.pad, borderRadius: SIZE.radius }}>✓ {ok}</p>}
      <div>
        <button type="submit" data-testid="guardar" className="sx-focus" disabled={guardando || !sucio} style={{ minHeight: SIZE.target, minWidth: SIZE.target, padding: "0 20px", background: ST.teal, color: ST.white, border: "none", borderRadius: SIZE.radius, fontSize: SIZE.fontBase, fontWeight: 700, opacity: guardando || !sucio ? 0.6 : 1 }}>
          {t(guardando ? "saving" : "save")}
        </button>
      </div>
    </form>
  );
}

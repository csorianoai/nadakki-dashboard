"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createListing, getListing, listBuildings, listDevelopments, listMedia, listZones, newIdempotencyKey, updateListing } from "@/lib/sites/client";
import { pick } from "@/lib/sites/copy-util";
import { SitesApiError } from "@/lib/sites/errors";
import { demoListing, demoListings, saveDemoListing } from "@/lib/sites/mocks/listings";
import { ERR, PRO } from "@/lib/sites/propiedades/copy";
import { MAX_FEATURES, aForm, aplicar, nuevoForm, paraCrear, parche, sinIngles, validar, type Bi2, type PForm } from "@/lib/sites/propiedades/form";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { I18nText, Listing, MediaAsset } from "@/lib/sites/types";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";

type Carga = { k: "cargando" } | { k: "ok"; base: Listing | null } | { k: "noenc" } | { k: "error" };
type Guardado = { k: "ninguno" } | { k: "guardando" } | { k: "ok"; demo: boolean } | { k: "error"; code: string };
type Opciones = { k: "cargando" } | { k: "no" } | { k: "ok"; items: { id: string; label: string }[] };
type Item = { id: string; slug: string; name?: unknown };

const ctl = { minHeight: SIZE.target, padding: "0 10px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", width: "100%", boxSizing: "border-box" as const };
const btn = { minHeight: SIZE.target, padding: "0 16px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", background: ST.white, color: ST.ink };
const box = { border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: 12, margin: "0 0 12px" };

export function FormPropiedad({ siteId, listingId }: { siteId: string | null; listingId: string | null }) {
  const { demo, lang } = useSites();
  const t = (k: string) => pick(PRO[k], lang);
  const [c, setC] = useState<Carga>({ k: "cargando" });
  const [form, setForm] = useState<PForm>(nuevoForm());
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [g, setG] = useState<Guardado>({ k: "ninguno" });
  const [zonas, setZonas] = useState<Opciones>({ k: "cargando" });
  const [edifs, setEdifs] = useState<Opciones>({ k: "cargando" });
  const [devs, setDevs] = useState<Opciones>({ k: "cargando" });
  const [medios, setMedios] = useState<MediaAsset[] | null>(null);
  const clave = useRef<{ body: string; key: string } | null>(null);
  const base = c.k === "ok" ? c.base : null;

  useEffect(() => {
    let vivo = true;
    const abrir = (l: Listing | null) => { setForm(l ? aForm(l) : nuevoForm()); setC({ k: "ok", base: l }); };
    if (!listingId) abrir(null);
    else if (demo) { const l = demoListing(listingId); if (l) abrir(l); else setC({ k: "noenc" }); }
    else if (!siteId) setC({ k: "error" });
    else getListing(siteId, listingId).then((l) => vivo && abrir(l), (e) => vivo && setC(e instanceof SitesApiError && e.status === 404 ? { k: "noenc" } : { k: "error" }));
    return () => { vivo = false; };
  }, [demo, siteId, listingId]);

  useEffect(() => {
    let vivo = true;
    if (demo || !siteId) { setZonas({ k: "no" }); setEdifs({ k: "no" }); setDevs({ k: "no" }); setMedios(null); return; }
    const cargar = (fn: (s: string) => Promise<{ items: Item[] }>, set: (o: Opciones) => void, nombre: (i: Item) => string) =>
      fn(siteId).then((r) => vivo && set({ k: "ok", items: r.items.map((i) => ({ id: i.id, label: nombre(i) || i.slug })) }), () => vivo && set({ k: "no" }));
    const txt = (v: unknown) => (typeof v === "string" ? v : v && typeof (v as I18nText).es === "string" ? pick(v as I18nText, lang) : "");
    cargar(listZones, setZonas, (i) => txt(i.name));
    cargar(listBuildings, setEdifs, (i) => txt(i.name));
    cargar(listDevelopments, setDevs, (i) => txt(i.name));
    listMedia(siteId).then((r) => vivo && setMedios(r.items.filter((m) => m.status === "approved")), () => vivo && setMedios([]));
    return () => { vivo = false; };
  }, [demo, siteId, lang]);

  const sucio = useMemo(() => c.k === "ok" && JSON.stringify(form) !== JSON.stringify(base ? aForm(base) : nuevoForm()), [c, form, base]);
  useEffect(() => {
    if (!sucio) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [sucio]);

  if (c.k === "cargando") return <p role="status">{t("loading")}</p>;
  if (c.k === "noenc") return <Aviso testid="estado-no-encontrada" title={t("notFoundTitle")} body={t("notFoundBody")} />;
  if (c.k === "error") return <Aviso testid="estado-error-propiedad" alert title={t("errOpenTitle")} body={t("errOpenBody")} />;

  const set = (fn: (f: PForm) => void) => {
    const n: PForm = { ...form, title: { ...form.title }, desc: { ...form.desc }, features: form.features.map((x) => ({ ...x })), attrs: form.attrs.map((x) => ({ ...x })), media: [...form.media] };
    fn(n);
    setForm(n);
    setG({ k: "ninguno" });
  };
  const msg = (e: string) => t(e === "patron" ? "errSlug" : e === "geo" ? "errGeo" : e === "max" ? "errMax" : e === "taken" ? "errSlugTaken" : "errRequired");

  async function guardar() {
    const e: Record<string, string> = validar(form, base ? aForm(base) : undefined);
    if (!base && !e.slug && demoListings().some((x) => x.slug === form.slug)) e.slug = "taken";
    setErrs(e);
    if (Object.keys(e).length) { setG({ k: "ninguno" }); return; }
    const p = base ? parche(form, base) : null;
    if (p && !Object.keys(p).length) return;
    setG({ k: "guardando" });
    try {
      let nueva: Listing;
      if (demo) {
        nueva = base ? aplicar(base, p!) : ({ ...(paraCrear(form) as object), id: globalThis.crypto.randomUUID(), tenant_id: "demo", vertical: "realestate", site_id: "demo", publish_state: "draft" } as Listing);
        saveDemoListing(nueva);
      } else if (base) nueva = { ...aplicar(base, p!), ...(await updateListing(siteId as string, base.id, p!)) };
      else {
        const body = paraCrear(form);
        const s = JSON.stringify(body);
        if (clave.current?.body !== s) clave.current = { body: s, key: newIdempotencyKey() }; // reintento = misma clave
        nueva = await createListing(siteId as string, body, { idempotencyKey: clave.current.key });
        clave.current = null;
      }
      setC({ k: "ok", base: nueva });
      setG({ k: "ok", demo });
    } catch (err) {
      const code = err instanceof SitesApiError ? err.code : "UNKNOWN";
      if (code === "CONFLICT" && (!base || p?.slug !== undefined)) { setErrs({ slug: "taken" }); setG({ k: "ninguno" }); }
      else setG({ k: "error", code });
    }
  }

  const campo = (id: string, label: string, value: string, onChange: (s: string) => void, o: { lang?: "es" | "en"; req?: boolean; help?: string; ph?: string } = {}) => {
    const err = errs[id];
    const ids = [err ? `err-${id}` : "", o.help ? `help-${id}` : ""].filter(Boolean).join(" ") || undefined;
    return (
      <div key={id} style={{ marginBottom: 8 }}>
        <label htmlFor={`f-${id}`} style={{ display: "block" }}>{label}</label>
        <input id={`f-${id}`} data-testid={id} className="sx-focus" style={ctl} value={value} lang={o.lang} aria-required={o.req || undefined}
          aria-invalid={err ? true : undefined} aria-describedby={ids} onChange={(e) => onChange(e.target.value)} />
        {o.help && <small id={`help-${id}`}>{o.help}</small>}
        {err && <p id={`err-${id}`} role="alert" data-testid={`error-${id}`} style={{ color: ST.badText, margin: "4px 0 0" }}>⚠ {msg(err)}</p>}
      </div>
    );
  };
  const par = (id: string, label: string, v: Bi2, on: (l: "es" | "en", s: string) => void, req: boolean) => (
    <fieldset key={id} style={box}>
      <legend>{label}</legend>
      {(["es", "en"] as const).map((l) =>
        campo(`${id}-${l}`, `${label} (${t(l === "es" ? "langEs" : "langEn")}, ${t(l === "es" && req ? "required" : l === "es" ? "optional" : "optional")})`, v[l], (s) => on(l, s), { lang: l, req: l === "es" && req }))}
    </fieldset>
  );
  const sel = (id: string, label: string, value: string, o: Opciones, on: (s: string) => void) => (
    <div style={{ marginBottom: 8 }}>
      <label htmlFor={`f-${id}`} style={{ display: "block" }}>{label}</label>
      <select id={`f-${id}`} data-testid={id} className="sx-focus" style={ctl} value={value} disabled={o.k !== "ok"} onChange={(e) => on(e.target.value)}>
        {o.k === "ok" ? <><option value="">{t("none")}</option>{o.items.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}</>
          : <option value="">{t(o.k === "no" ? "unavailable" : "loading")}</option>}
      </select>
    </div>
  );

  const nErr = Object.keys(errs).length;
  const estado = base?.publish_state ?? "draft";
  return (
    <section data-testid="form-propiedad">
      <p><a className="sx-focus" href={`/mi-web/propiedades?sitio=${encodeURIComponent(siteId ?? "")}`} style={{ display: "inline-flex", alignItems: "center", minHeight: SIZE.target, color: ST.ink }}
        onClick={(e) => { if (sucio && !window.confirm(t("leave"))) e.preventDefault(); }}>{t("back")}</a></p>
      <h1 style={{ fontSize: SIZE.fontSub, margin: "0 0 12px" }}>{t(base ? "formEdit" : "formNew")}</h1>
      <p data-testid="estado-publicacion"><strong>{t("pubState")}:</strong> {t(estado)}<br /><small>{t("pubNote")}</small></p>
      {par("titulo", t("fTitle"), form.title, (l, s) => set((f) => { f.title[l] = s; }), true)}
      {par("descripcion", t("fDesc"), form.desc, (l, s) => set((f) => { f.desc[l] = s; }), false)}
      {campo("slug", t("fSlug"), form.slug, (s) => set((f) => { f.slug = s; }), { req: true, help: t("slugHelp") })}
      <div style={{ marginBottom: 8 }}>
        <label htmlFor="f-tipo" style={{ display: "block" }}>{t("fKind")}</label>
        <select id="f-tipo" data-testid="tipo" className="sx-focus" style={ctl} value={form.kind} onChange={(e) => set((f) => { f.kind = e.target.value as PForm["kind"]; })}>
          <option value="property">{t("kindProperty")}</option><option value="generic">{t("kindGeneric")}</option>
        </select>
      </div>
      {sel("zona", t("fZone"), form.zone, zonas, (s) => set((f) => { f.zone = s; }))}
      {sel("edificio", t("fBuilding"), form.building, edifs, (s) => set((f) => { f.building = s; }))}
      {sel("desarrollo", t("fDev"), form.dev, devs, (s) => set((f) => { f.dev = s; }))}
      <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: SIZE.target }}>
        <input type="checkbox" data-testid="destacada" className="sx-focus" checked={form.featured} onChange={(e) => set((f) => { f.featured = e.target.checked; })} style={{ width: 24, height: 24 }} />{t("fFeatured")}
      </label>
      <fieldset style={box}>
        <legend>{t("fGeo")}</legend>
        {campo("lat", t("fLat"), form.lat, (s) => set((f) => { f.lat = s; }))}
        {campo("lng", t("fLng"), form.lng, (s) => set((f) => { f.lng = s; }))}
      </fieldset>
      <fieldset style={box}>
        <legend>{t("fFeatures")}</legend>
        {errs.caracteristicas && <p role="alert" style={{ color: ST.badText }}>⚠ {msg(errs.caracteristicas)}</p>}
        {form.features.map((x, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            {par(`caracteristica-${i}`, `${t("fFeature")} ${i + 1}`, x, (l, s) => set((f) => { f.features[i][l] = s; }), true)}
            <button type="button" className="sx-focus" data-testid={`quitar-caracteristica-${i}`} style={btn} onClick={() => set((f) => { f.features.splice(i, 1); })}>{t("removeFeature")} {i + 1}</button>
          </div>
        ))}
        <button type="button" className="sx-focus" data-testid="agregar-caracteristica" style={btn} disabled={form.features.length >= MAX_FEATURES} onClick={() => set((f) => { f.features.push({ es: "", en: "" }); })}>{t("addFeature")}</button>
      </fieldset>
      {form.kind === "property" && (
        <fieldset style={box}>
          <legend>{t("fAttrs")}</legend>
          {form.attrs.map((p, i) => (
            <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
              {campo(`dato-clave-${i}`, t("fKey"), p.k, (s) => set((f) => { f.attrs[i].k = s; }))}
              {campo(`dato-valor-${i}`, t("fVal"), p.v, (s) => set((f) => { f.attrs[i].v = s; }))}
              <button type="button" className="sx-focus" data-testid={`quitar-dato-${i}`} style={btn} onClick={() => set((f) => { f.attrs.splice(i, 1); })}>{t("removeAttr")} {i + 1}</button>
            </div>
          ))}
          <button type="button" className="sx-focus" data-testid="agregar-dato" style={btn} onClick={() => set((f) => { f.attrs.push({ k: "", v: "" }); })}>{t("addAttr")}</button>
        </fieldset>
      )}
      <fieldset style={box}>
        <legend>{t("fMedia")}</legend>
        <p style={{ margin: "0 0 8px" }}><small>{t("mediaNote")}</small></p>
        {errs.medios && <p role="alert" style={{ color: ST.badText }}>⚠ {msg(errs.medios)}</p>}
        {demo ? <p>{t("mediaDemo")}</p> : medios && !medios.length ? <p>{t("mediaNone")}</p> : (medios ?? []).map((m) => (
          <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: SIZE.target }}>
            <input type="checkbox" data-testid={`medio-${m.id}`} className="sx-focus" style={{ width: 24, height: 24 }} checked={form.media.includes(m.id)}
              onChange={(e) => set((f) => { f.media = e.target.checked ? [...f.media, m.id] : f.media.filter((x) => x !== m.id); })} />{pick(m.alt, lang)}
          </label>
        ))}
      </fieldset>
      {nErr > 0 && <p role="alert" data-testid="error-campos" style={{ color: ST.badText }}>⚠ {t("fixFields")}</p>}
      {g.k === "error" && <div role="alert" data-testid="error-guardar" style={{ background: ST.badBg, color: ST.badText, padding: SIZE.pad, borderRadius: SIZE.radius, margin: "0 0 12px" }}><strong>{t("errSaveTitle")}</strong><p style={{ margin: "8px 0 0" }}>{pick(ERR[g.code] ?? ERR.UNKNOWN, lang)}</p></div>}
      {g.k === "ok" && <p role="status" data-testid="guardado">{t(g.demo ? "savedDemo" : "saved")}</p>}
      {sinIngles(form) > 0 && <p role="status" data-testid="aviso-ingles">{t("enWarn")}</p>}
      <button type="button" data-testid="guardar" className="sx-focus" disabled={g.k === "guardando"} onClick={guardar}
        style={{ minHeight: SIZE.target, padding: "0 20px", background: ST.teal, color: ST.white, border: 0, borderRadius: SIZE.radius, font: "inherit" }}>
        {t(g.k === "guardando" ? "saving" : "save")}
      </button>
    </section>
  );
}

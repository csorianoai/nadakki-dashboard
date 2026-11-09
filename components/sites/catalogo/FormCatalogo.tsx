"use client";

import React, { useEffect, useRef, useState } from "react";
import { createBuilding, createDevelopment, createZone, getBuilding, getDevelopment, getZone, listZones, newIdempotencyKey, updateBuilding, updateDevelopment, updateZone } from "@/lib/sites/client";
import { CAT, ERR } from "@/lib/sites/catalogo/copy";
import { aForm, cuerpo, nombreDe, parche, SPEC, validar, verificado, vacio, sinIngles, type Ent, type F, type Rec } from "@/lib/sites/catalogo/form";
import { demoItems, saveDemoItem } from "@/lib/sites/catalogo/mock";
import { pick } from "@/lib/sites/copy-util";
import { SitesApiError } from "@/lib/sites/errors";
import { SIZE, ST } from "@/lib/sites/tokens";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";

type Carga = { k: "cargando" } | { k: "ok"; base: Rec | null } | { k: "noenc" } | { k: "error" };
type Guardado = { k: "ninguno" } | { k: "guardando" } | { k: "ok"; demo: boolean } | { k: "error"; code: string };
type Zonas = { k: "cargando" } | { k: "no" } | { k: "ok"; items: { id: string; label: string }[] };

const GET = { desarrollos: getDevelopment, zonas: getZone, edificios: getBuilding };
const CREATE = { desarrollos: createDevelopment, zonas: createZone, edificios: createBuilding };
const UPDATE = { desarrollos: updateDevelopment, zonas: updateZone, edificios: updateBuilding };
const ctl = { minHeight: SIZE.target, padding: "0 10px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", width: "100%", boxSizing: "border-box" as const };
const ERRKEY: Record<string, string> = { required: "eRequired", pattern: "ePattern", date: "eDate", long: "eLong" };

export function FormCatalogo({ ent, siteId, itemId, onBack }: { ent: Ent; siteId: string | null; itemId: string | null; onBack: () => void }) {
  const { demo, lang } = useSites();
  const t = (k: string) => pick(CAT[k], lang);
  const [c, setC] = useState<Carga>({ k: "cargando" });
  const [form, setForm] = useState<F>(vacio(ent));
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [g, setG] = useState<Guardado>({ k: "ninguno" });
  const [zonas, setZonas] = useState<Zonas>({ k: "cargando" });
  const clave = useRef<{ body: string; key: string } | null>(null);
  const base = c.k === "ok" ? c.base : null;
  const conZona = SPEC[ent].some((s) => s.kind === "zona");

  useEffect(() => {
    let vivo = true;
    const abrir = (it: Rec | null) => { setForm(it ? aForm(ent, it) : vacio(ent)); setC({ k: "ok", base: it }); };
    if (!itemId) abrir(null);
    else if (demo) { const it = demoItems(ent).find((x) => x.id === itemId); if (it) abrir(it); else setC({ k: "noenc" }); }
    else if (!siteId) setC({ k: "error" });
    else GET[ent](siteId, itemId).then((it) => vivo && abrir(it as unknown as Rec), (e) => vivo && setC(e instanceof SitesApiError && e.status === 404 ? { k: "noenc" } : { k: "error" }));
    return () => { vivo = false; };
  }, [demo, siteId, itemId, ent]);

  useEffect(() => {
    let vivo = true;
    const op = (l: Rec[]) => ({ k: "ok" as const, items: l.map((z) => ({ id: String(z.id), label: nombreDe(z.name, lang) || String(z.slug) })) });
    if (!conZona) return;
    if (demo) setZonas(op(demoItems("zonas")));
    else if (!siteId) setZonas({ k: "no" });
    else listZones(siteId).then((r) => vivo && setZonas(op(r.items as unknown as Rec[])), () => vivo && setZonas({ k: "no" }));
    return () => { vivo = false; };
  }, [demo, siteId, conZona, lang]);

  if (c.k === "cargando") return <p role="status">{t("loading")}</p>;
  if (c.k === "noenc") return <Aviso testid="estado-no-encontrado" title={t("notFoundTitle")} body={t("notFoundBody")} />;
  if (c.k === "error") return <Aviso testid="estado-error-elemento" alert title={t("errTitle")} body={t("unavailable")} />;

  const set = (id: string, v: string) => { setForm({ ...form, [id]: v }); setG({ k: "ninguno" }); };
  const baseF = base ? aForm(ent, base) : vacio(ent);

  async function guardar() {
    const e = validar(ent, form);
    setErrs(e);
    if (Object.keys(e).length) { setG({ k: "ninguno" }); return; }
    const p = base ? parche(ent, form, baseF) : null;
    if (p && !Object.keys(p).length) return;
    setG({ k: "guardando" });
    try {
      let nueva: Rec;
      if (demo) {
        nueva = base ? { ...base, ...p } : { ...cuerpo(ent, form), id: globalThis.crypto.randomUUID(), publish_state: "draft", ...(ent === "desarrollos" ? { authorized: false } : {}) };
        saveDemoItem(ent, nueva);
      } else if (base) {
        nueva = { ...base, ...((await (UPDATE[ent] as (s: string, i: string, b: object) => Promise<object>)(siteId as string, String(base.id), p!)) as Rec) };
      } else {
        const body = cuerpo(ent, form);
        const s = JSON.stringify(body);
        if (clave.current?.body !== s) clave.current = { body: s, key: newIdempotencyKey() }; // reintento = misma clave
        nueva = (await (CREATE[ent] as (s: string, b: object, o: object) => Promise<object>)(siteId as string, body, { idempotencyKey: clave.current.key })) as Rec;
        clave.current = null;
      }
      setC({ k: "ok", base: nueva });
      setG({ k: "ok", demo });
    } catch (err) {
      setG({ k: "error", code: err instanceof SitesApiError ? err.code : "UNKNOWN" });
    }
  }

  const campos = SPEC[ent].map((s) => {
    const err = errs[s.id];
    const en = s.id.endsWith("-en");
    const label = `${t(`l_${s.id}`)}${s.req ? ` (${t("required")})` : en ? ` (${t("optional")})` : ""}`;
    const common = { id: `f-${s.id}`, "data-testid": s.id, className: "sx-focus", style: ctl, value: form[s.id], "aria-required": s.req || undefined, "aria-invalid": err ? true : undefined, "aria-describedby": err ? `err-${s.id}` : undefined, lang: en ? "en" : undefined };
    return (
      <div key={s.id} style={{ marginBottom: 8 }}>
        <label htmlFor={`f-${s.id}`} style={{ display: "block" }}>{label}</label>
        {s.kind === "zona" ? (
          <select {...common} disabled={zonas.k !== "ok"} onChange={(e) => set(s.id, e.target.value)}>
            {zonas.k === "ok" ? <><option value="">{t("none")}</option>{zonas.items.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}</>
              : <option value="">{t(zonas.k === "no" ? "unavailable" : "loading")}</option>}
          </select>
        ) : s.kind === "area" ? (
          <textarea {...common} rows={3} style={{ ...ctl, padding: 10 }} onChange={(e) => set(s.id, e.target.value)} />
        ) : (
          <input {...common} type={s.kind === "date" ? "date" : "text"} onChange={(e) => set(s.id, e.target.value)} />
        )}
        {err && <p id={`err-${s.id}`} role="alert" data-testid={`error-${s.id}`} style={{ color: ST.badText, margin: "4px 0 0" }}>⚠ {t(ERRKEY[err] ?? "eRequired")}</p>}
      </div>
    );
  });

  const v = verificado(base);
  return (
    <section data-testid={`form-${ent}`}>
      <p><button type="button" className="sx-focus" data-testid="volver" onClick={onBack} style={{ minHeight: SIZE.target, padding: "0 14px", font: "inherit", border: `1px solid ${ST.control}`, background: ST.white, color: ST.ink }}>{t("back")}</button></p>
      <h2 style={{ fontSize: SIZE.fontSub, margin: "0 0 12px" }}>{t(base ? "editar" : "nuevo")} — {t(ent)}</h2>
      <p data-testid="estado-publicacion"><strong>{t("colState")}:</strong> {t(String(base?.publish_state ?? "draft"))}<br /><small>{t("retire")}</small></p>
      {ent === "desarrollos" && base && (
        <p data-testid="verificacion"><strong>{t(v === "si" ? "vSi" : v === "no" ? "vNo" : "vPend")}</strong>{v === "pendiente" && <><br />{t("pendiente")}</>}<br /><small>{t("vNote")}</small></p>
      )}
      {campos}
      {Object.keys(errs).length > 0 && <p role="alert" data-testid="error-campos" style={{ color: ST.badText }}>⚠ {t("fixFields")}</p>}
      {g.k === "error" && <div role="alert" data-testid="error-guardar" style={{ background: ST.badBg, color: ST.badText, padding: SIZE.pad, borderRadius: SIZE.radius, margin: "0 0 12px" }}><strong>{t("errSave")}</strong><p style={{ margin: "8px 0 0" }}>{pick(ERR[g.code] ?? ERR.UNKNOWN, lang)}</p></div>}
      {g.k === "ok" && <p role="status" data-testid="guardado">{t(g.demo ? "savedDemo" : "saved")}</p>}
      {sinIngles(ent, form) > 0 && <p role="status" data-testid="aviso-ingles">{t("enWarn")}</p>}
      <button type="button" data-testid="guardar" className="sx-focus" disabled={g.k === "guardando"} onClick={guardar}
        style={{ minHeight: SIZE.target, padding: "0 20px", background: ST.teal, color: ST.white, border: 0, borderRadius: SIZE.radius, font: "inherit" }}>
        {t(g.k === "guardando" ? "saving" : "save")}
      </button>
    </section>
  );
}

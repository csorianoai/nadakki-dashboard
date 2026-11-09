"use client";

import React, { useState } from "react";
import { updateMedia } from "@/lib/sites/client";
import { pick, type Lang } from "@/lib/sites/copy-util";
import { SitesApiError } from "@/lib/sites/errors";
import { TIPOS, desdeMedio, hoy, paraActualizar, validar, type MForm } from "@/lib/sites/medios/form";
import { ERR, MED } from "@/lib/sites/medios/copy";
import { LST } from "@/lib/sites/medios/lista-copy";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { MediaAsset } from "@/lib/sites/types";

interface Props { siteId: string; media: MediaAsset; demo: boolean; lang: Lang; onSaved: (m: MediaAsset) => void; onClose: () => void }
const ctl = { minHeight: SIZE.target, padding: "0 10px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", width: "100%", boxSizing: "border-box" as const };
const btn = { minHeight: SIZE.target, padding: "0 20px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", background: ST.white, color: ST.ink, marginRight: 8 };
const CAMPOS: [string, string, keyof MForm, string?][] = [
  ["alt-es", "fAltEs", "altEs"], ["alt-en", "fAltEn", "altEn"], ["fuente", "fSource", "source"], ["licencia", "fLicense", "license"],
  ["otorgado-por", "fBy", "grantedBy"], ["alcance", "fScope", "scope"], ["fecha-permiso", "fPDate", "pdate", "date"], ["fecha-adquisicion", "fAcq", "acquired", "date"],
];

/** Edicion de metadatos (updateMedia). Mismas reglas obligatorias que el alta; sin tenant en el cuerpo. */
export function EditarMedio({ siteId, media, demo, lang, onSaved, onClose }: Props) {
  const [form, setForm] = useState<MForm>(desdeMedio(media));
  const [intentado, setIntentado] = useState(false);
  const [estado, setEstado] = useState<"libre" | "guardando" | "ok" | string>("libre");
  const t = (k: string) => pick(MED[k], lang);
  const errs = validar(form, null, false);
  const evid = form.ptype === "developer" || form.ptype === "owner";
  const orden = [...CAMPOS.slice(0, 4).map((c) => c[0]), "tipo-permiso", ...CAMPOS.slice(4).map((c) => c[0]), ...(evid ? ["evidencia"] : [])];
  const set = (k: keyof MForm, v: string) => { setForm({ ...form, [k]: v }); setEstado("libre"); };

  async function guardar() {
    const primero = orden.find((id) => errs[id]);
    if (primero) { setIntentado(true); document.getElementById(`edit-${primero}`)?.focus(); return; }
    setEstado("guardando");
    try {
      const body = paraActualizar(form);
      if (demo) onSaved({ ...media, ...body } as unknown as MediaAsset);
      else onSaved(await updateMedia(siteId, media.id, body));
      setEstado("ok");
    } catch (e) {
      setEstado(e instanceof SitesApiError ? e.code : "UNKNOWN");
    }
  }
  const campo = (id: string, key: string, k: keyof MForm, type = "text", area = false) => {
    const err = intentado ? errs[id] : undefined;
    const p = { id: `edit-${id}`, "data-testid": `edit-${id}`, className: "sx-focus", style: ctl, value: form[k], "aria-invalid": err ? true : undefined, "aria-describedby": err ? `edit-err-${id}` : undefined };
    return (
      <div key={id} style={{ marginBottom: 8 }}>
        <label htmlFor={`edit-${id}`} style={{ display: "block" }}>{t(key)}</label>
        {area ? <textarea {...p} rows={3} style={{ ...ctl, padding: 10 }} onChange={(e) => set(k, e.target.value)} />
          : <input {...p} type={type} max={type === "date" && id === "fecha-permiso" ? hoy() : undefined} onChange={(e) => set(k, e.target.value)} />}
        {err && <p id={`edit-err-${id}`} role="alert" data-testid={`edit-error-${id}`} style={{ color: ST.badText, margin: "4px 0 0" }}>⚠ {t(err)}</p>}
      </div>
    );
  };
  const tipoErr = intentado ? errs["tipo-permiso"] : undefined;
  return (
    <section data-testid="editar-medio" aria-labelledby="t-editar-medio" style={{ background: ST.white, border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: SIZE.gap, margin: `${SIZE.gap}px 0` }}>
      <h2 id="t-editar-medio" style={{ fontSize: SIZE.fontSub, margin: "0 0 8px" }}>{pick(LST.editTitle, lang)}</h2>
      {CAMPOS.slice(0, 4).map((c) => campo(c[0], c[1], c[2], c[3]))}
      <div style={{ marginBottom: 8 }}>
        <label htmlFor="edit-tipo-permiso" style={{ display: "block" }}>{t("fType")}</label>
        <select id="edit-tipo-permiso" data-testid="edit-tipo-permiso" className="sx-focus" style={ctl} value={form.ptype} aria-invalid={tipoErr ? true : undefined} onChange={(e) => set("ptype", e.target.value)}>
          <option value="">{t("pick")}</option>{TIPOS.map((x) => <option key={x} value={x}>{t(x)}</option>)}
        </select>
      </div>
      {CAMPOS.slice(4).map((c) => campo(c[0], c[1], c[2], c[3]))}
      {evid && campo("evidencia", "fEvidence", "evidence", "text", true)}
      {estado !== "libre" && estado !== "guardando" && estado !== "ok" && <p role="alert" data-testid="edit-error-envio" style={{ color: ST.badText }}>⚠ {pick(ERR[estado] ?? ERR.UNKNOWN, lang)}</p>}
      {estado === "ok" && <p role="status" data-testid="edit-guardado">{pick(LST.saved, lang)}</p>}
      <button type="button" data-testid="guardar-edicion" className="sx-focus" disabled={estado === "guardando"} onClick={guardar} style={btn}>{pick(LST[estado === "guardando" ? "working" : "save"], lang)}</button>
      <button type="button" data-testid="cerrar-edicion" className="sx-focus" onClick={onClose} style={btn}>{pick(LST.cancel, lang)}</button>
    </section>
  );
}

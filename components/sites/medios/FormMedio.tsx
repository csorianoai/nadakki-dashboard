"use client";

import React, { useRef, useState } from "react";
import { createMedia, newIdempotencyKey, presignMedia, updateMedia } from "@/lib/sites/client";
import { pick, type Lang } from "@/lib/sites/copy-util";
import { SitesApiError } from "@/lib/sites/errors";
import { IDS, TIPOS, aForm, paraCrear, paraEditar, hoy, sha256Hex, validar, vacio, type MForm } from "@/lib/sites/medios/form";
import { ERR, MED } from "@/lib/sites/medios/copy";
import { saveDemoMedia } from "@/lib/sites/medios/mock";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { MediaAsset } from "@/lib/sites/types";

interface Props { siteId: string | null; demo: boolean; lang: Lang; asset: MediaAsset | null; onDone: (m: MediaAsset, edited: boolean) => void; onCancel: () => void }
const ctl = { minHeight: SIZE.target, padding: "0 10px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", width: "100%", boxSizing: "border-box" as const };
const btn = { minHeight: SIZE.target, padding: "0 20px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", background: ST.white, color: ST.ink };
/** Alta (presign -> subida -> createMedia) o edicion de metadatos (updateMedia) con registro de permiso obligatorio. */
export function FormMedio({ siteId, demo, lang, asset, onDone, onCancel }: Props) {
  const [form, setForm] = useState<MForm>(asset ? aForm(asset) : vacio());
  const [file, setFile] = useState<File | null>(null);
  const [intentado, setIntentado] = useState(false);
  const [estado, setEstado] = useState<{ k: "libre" } | { k: "enviando" } | { k: "enviado"; demo: boolean } | { k: "subida" } | { k: "error"; code: string }>({ k: "libre" });
  const subido = useRef<{ file: File; uploadId: string } | null>(null);
  const clave = useRef<{ body: string; key: string } | null>(null);
  const t = (k: string) => pick(MED[k], lang);
  const errs = validar(form, file, !asset);
  const primero = Object.keys(IDS).find((id) => errs[id]);
  const set = (k: keyof MForm, v: string) => { setForm({ ...form, [k]: v }); setEstado({ k: "libre" }); };
  async function enviar() {
    if (primero) {
      setIntentado(true);
      document.getElementById(`f-${primero}`)?.focus();
      return;
    }
    setEstado({ k: "enviando" });
    try {
      if (demo) { // el ejemplo no toca la red
        const m = { ...(asset ?? { id: globalThis.crypto.randomUUID(), tenant_id: "demo", vertical: "realestate", status: "pending" }), ...paraEditar(form) } as unknown as MediaAsset;
        saveDemoMedia(m);
        return finalizar(m, !!asset, true);
      }
      if (asset) return finalizar({ ...asset, ...(await updateMedia(siteId as string, asset.id, paraEditar(form))) }, true, false);
      const f = file as File;
      if (subido.current?.file !== f) {
        const p = await presignMedia(siteId as string, { mime_type: f.type, size_bytes: f.size, sha256: await sha256Hex(f) });
        try {
          const r = await fetch(p.upload_url, { method: p.method, headers: p.headers, body: f });
          if (!r.ok) throw new Error("subida");
        } catch {
          return setEstado({ k: "subida" }); // recuperable: no se crea el registro de permiso
        }
        subido.current = { file: f, uploadId: p.upload_id };
      }
      const body = paraCrear(form, subido.current.uploadId);
      const s = JSON.stringify(body);
      if (clave.current?.body !== s) clave.current = { body: s, key: newIdempotencyKey() };
      const m = await createMedia(siteId as string, body, { idempotencyKey: clave.current.key });
      subido.current = null;
      clave.current = null;
      finalizar(m, false, false);
    } catch (e) {
      setEstado({ k: "error", code: e instanceof SitesApiError ? e.code : "UNKNOWN" });
    }
  }
  function finalizar(m: MediaAsset, edited: boolean, d: boolean) {
    if (!edited) { setForm(vacio()); setFile(null); setIntentado(false); }
    setEstado({ k: "enviado", demo: d });
    onDone(m, edited);
  }
  const campo = (id: string, label: string, k: keyof MForm, o: { type?: string; req?: boolean; max?: string; help?: string; area?: boolean } = {}) => {
    const err = intentado ? errs[id] : undefined;
    const ids = [err ? `err-${id}` : "", o.help ? `help-${id}` : ""].filter(Boolean).join(" ") || undefined;
    const p = { id: `f-${id}`, "data-testid": id, className: "sx-focus", style: ctl, value: form[k], "aria-required": o.req || undefined, "aria-invalid": err ? true : undefined, "aria-describedby": ids };
    return (
      <div key={id} style={{ marginBottom: 8 }}>
        <label htmlFor={`f-${id}`} style={{ display: "block" }}>{label}</label>
        {o.area ? <textarea {...p} rows={3} onChange={(e) => set(k, e.target.value)} style={{ ...ctl, padding: 10 }} />
          : <input {...p} type={o.type ?? "text"} max={o.max} onChange={(e) => set(k, e.target.value)} />}
        {o.help && <small id={`help-${id}`}>{o.help}</small>}
        {err && <p id={`err-${id}`} role="alert" data-testid={`error-${id}`} style={{ color: ST.badText, margin: "4px 0 0" }}>⚠ {t(err)}</p>}
      </div>
    );
  };
  const eFile = intentado ? errs.archivo : undefined;
  const requiereEvid = form.ptype === "developer" || form.ptype === "owner";
  const tipoErr = intentado ? errs["tipo-permiso"] : undefined;
  return (
    <section data-testid="form-medio" aria-labelledby="t-form-medio" style={{ background: ST.white, border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: SIZE.gap, marginBottom: SIZE.gap }}>
      <h2 id="t-form-medio" style={{ fontSize: SIZE.fontSub, margin: "0 0 8px" }}>{t(asset ? "formEdit" : "formNew")}</h2>
      {!asset && <p data-testid="aviso-24h">{t("note24")}</p>}
      {!asset && (
        <div style={{ marginBottom: 8 }}>
          <label htmlFor="f-archivo" style={{ display: "block" }}>{t("fFile")}</label>
          <input id="f-archivo" data-testid="archivo" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sx-focus" style={ctl} aria-required
            aria-invalid={eFile ? true : undefined} aria-describedby={eFile ? "err-archivo" : undefined}
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setEstado({ k: "libre" }); }} />
          {eFile && <p id="err-archivo" role="alert" data-testid="error-archivo" style={{ color: ST.badText, margin: "4px 0 0" }}>⚠ {t(eFile)}</p>}
        </div>
      )}
      {campo("alt-es", t("fAltEs"), "altEs", { req: true })}
      {campo("alt-en", t("fAltEn"), "altEn", { help: t("enWarn") })}
      {campo("fuente", t("fSource"), "source", { req: true })}
      {campo("licencia", t("fLicense"), "license", { req: true })}
      <div style={{ marginBottom: 8 }}>
        <label htmlFor="f-tipo-permiso" style={{ display: "block" }}>{t("fType")}</label>
        <select id="f-tipo-permiso" data-testid="tipo-permiso" className="sx-focus" style={ctl} value={form.ptype} aria-required aria-invalid={tipoErr ? true : undefined}
          aria-describedby={tipoErr ? "err-tipo-permiso" : undefined} onChange={(e) => set("ptype", e.target.value)}>
          <option value="">{t("pick")}</option>{TIPOS.map((x) => <option key={x} value={x}>{t(x)}</option>)}
        </select>
        {tipoErr && <p id="err-tipo-permiso" role="alert" data-testid="error-tipo-permiso" style={{ color: ST.badText, margin: "4px 0 0" }}>⚠ {t(tipoErr)}</p>}
      </div>
      {campo("otorgado-por", t("fBy"), "grantedBy", { req: true })}
      {campo("alcance", t("fScope"), "scope", { req: true })}
      {campo("fecha-permiso", t("fPDate"), "pdate", { type: "date", req: true, max: hoy() })}
      {campo("fecha-adquisicion", t("fAcq"), "acquired", { type: "date", req: true })}
      {requiereEvid && campo("evidencia", t("fEvidence"), "evidence", { req: true, area: true })}
      {intentado && primero && <p role="alert" data-testid="error-campos" style={{ color: ST.badText }}>⚠ {t("fixFields")}</p>}
      {estado.k === "subida" && <p role="alert" data-testid="error-subida" style={{ color: ST.badText }}>⚠ {t("errUpload")}</p>}
      {estado.k === "error" && <p role="alert" data-testid="error-envio" style={{ color: ST.badText }}>⚠ {pick(ERR[estado.code] ?? ERR.UNKNOWN, lang)}</p>}
      {estado.k === "enviado" && <p role="status" data-testid="medio-enviado">{estado.demo ? t("sentDemo") : t(asset ? "saved" : "sent")}</p>}
      <p id="motivo-envio" data-testid="motivo-envio" style={{ margin: "8px 0" }}>{primero ? t("reason") : t("readyReason")}</p>
      <button type="button" data-testid="enviar" className="sx-focus" aria-describedby="motivo-envio" aria-disabled={primero ? "true" : undefined}
        disabled={estado.k === "enviando"} onClick={enviar} style={{ ...btn, opacity: primero ? 0.6 : 1 }}>{t(estado.k === "enviando" ? "sending" : asset ? "saveEdit" : "send")}</button>{" "}
      {asset && <button type="button" data-testid="cancelar" className="sx-focus" style={btn} onClick={onCancel}>{t("cancel")}</button>}
    </section>
  );
}
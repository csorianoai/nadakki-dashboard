"use client";

import React, { useEffect, useRef, useState } from "react";
import { listMedia, newIdempotencyKey, revokeMedia } from "@/lib/sites/client";
import { pick } from "@/lib/sites/copy-util";
import { SitesApiError } from "@/lib/sites/errors";
import { ERR } from "@/lib/sites/medios/copy";
import { LST } from "@/lib/sites/medios/lista-copy";
import { listDemoMedia, saveDemoMedia } from "@/lib/sites/medios/mock";
import { SIZE, ST } from "@/lib/sites/tokens";
import type { MediaAsset, MediaRevoke } from "@/lib/sites/types";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";
import { EditarMedio } from "./EditarMedio";

type Carga = { k: "cargando" } | { k: "ok"; items: MediaAsset[]; next: string | null } | { k: "error"; code: string };
const MOTIVOS: MediaRevoke["reason"][] = ["permission_withdrawn", "dmca", "staff_review", "owner_request"];
const btn = { minHeight: SIZE.target, padding: "0 14px", border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, font: "inherit", background: ST.white, color: ST.ink, marginRight: 8 };
const str = (m: MediaAsset, k: string) => (typeof m[k] === "string" ? (m[k] as string) : "");

/** Lista con estado, quien dio el permiso y fecha. La aprobacion es de Nadakki: aqui no hay boton de aprobar. */
export function ListaMedios({ recarga }: { recarga: number }) {
  const { sites, demo, selectedId, lang } = useSites();
  const siteId = selectedId ?? sites[0]?.id ?? null;
  const [c, setC] = useState<Carga>({ k: "cargando" });
  const [revocar, setRevocar] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<MediaRevoke["reason"]>("permission_withdrawn");
  const [editar, setEditar] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [errAccion, setErrAccion] = useState<string | null>(null);
  const [errMas, setErrMas] = useState(false);
  const clave = useRef<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const t = (k: string) => pick(LST[k], lang);

  useEffect(() => {
    let vivo = true;
    if (demo) setC({ k: "ok", items: listDemoMedia(), next: null });
    else if (!siteId) setC({ k: "error", code: "UNKNOWN" });
    else {
      setC({ k: "cargando" });
      listMedia(siteId).then(
        (r) => vivo && setC({ k: "ok", items: r.items, next: r.next_cursor }),
        (e) => vivo && setC({ k: "error", code: e instanceof SitesApiError ? e.code : "UNKNOWN" }),
      );
    }
    return () => { vivo = false; };
  }, [demo, siteId, recarga]);
  useEffect(() => { if (revocar) cancelRef.current?.focus(); }, [revocar]);

  const reemplazar = (m: MediaAsset) => setC((p) => (p.k === "ok" ? { ...p, items: p.items.map((x) => (x.id === m.id ? m : x)) } : p));
  async function confirmar() {
    const id = revocar;
    if (!id || trabajando) return;
    setErrAccion(null);
    setTrabajando(true);
    try {
      let m: MediaAsset;
      if (demo) {
        m = { ...(listDemoMedia().find((x) => x.id === id) as MediaAsset), status: "revoked" };
        saveDemoMedia(m);
      } else {
        clave.current ??= newIdempotencyKey();
        m = await revokeMedia(siteId as string, id, motivo, { idempotencyKey: clave.current });
      }
      clave.current = null;
      reemplazar(m);
      setRevocar(null);
    } catch (e) {
      setErrAccion(e instanceof SitesApiError ? e.code : "UNKNOWN");
      setRevocar(null);
    }
    setTrabajando(false);
  }
  async function mas() {
    if (c.k !== "ok" || !c.next || !siteId) return;
    setErrMas(false);
    try {
      const r = await listMedia(siteId, { cursor: c.next });
      const ids = new Set(c.items.map((x) => x.id));
      setC({ k: "ok", items: [...c.items, ...r.items.filter((x) => !ids.has(x.id))], next: r.next_cursor });
    } catch { setErrMas(true); }
  }

  if (c.k === "cargando") return <p role="status">{t("loading")}</p>;
  if (c.k === "error") {
    const body = c.code === "NOT_FOUND" ? t("notFoundList") : pick(ERR[c.code] ?? ERR.UNKNOWN, lang);
    return <Aviso testid="estado-error-medios" alert title={t("errTitle")} body={body} />;
  }
  const cell = { textAlign: "left" as const, padding: "8px 12px", borderBottom: `1px solid ${ST.line}` };
  const editando = c.items.find((x) => x.id === editar);
  return (
    <section data-testid="lista-medios" aria-labelledby="t-lista-medios">
      <h2 id="t-lista-medios" style={{ fontSize: SIZE.fontSub, margin: "0 0 12px" }}>{t("listTitle")}</h2>
      {demo && <p>{t("demoNote")}</p>}
      {errAccion && <p role="alert" data-testid="error-accion" style={{ color: ST.badText }}>⚠ {pick(ERR[errAccion] ?? ERR.UNKNOWN, lang)}</p>}
      {!c.items.length ? <Aviso testid="estado-vacio-medios" title={t("emptyTitle")} body={t("emptyBody")} /> : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: ST.white }}>
          <thead><tr>{["colImage", "colState", "colBy", "colDate", "colPub", "colActions"].map((k) => <th key={k} scope="col" style={cell}>{t(k)}</th>)}</tr></thead>
          <tbody>
            {c.items.map((m) => {
              const ok = m.status === "approved";
              return (
                <tr key={m.id} data-testid={`medio-${m.id}`}>
                  <th scope="row" style={cell}>{pick(m.alt, lang)}</th>
                  <td style={cell} data-testid={`estado-${m.id}`}>{t(m.status)}</td>
                  <td style={cell}>{str(m, "permission_granted_by")}</td>
                  <td style={cell}>{m.permission_date}</td>
                  <td style={cell} data-testid={`publicable-${m.id}`}>{ok ? `${t("pubYes")} ✓` : `${t("pubNo")} ✗`}</td>
                  <td style={cell}>
                    <button type="button" className="sx-focus" data-testid={`editar-${m.id}`} style={btn} onClick={() => setEditar(m.id)}>{t("edit")}</button>
                    {m.status !== "revoked" && <button type="button" className="sx-focus" data-testid={`revocar-${m.id}`} style={btn} onClick={() => { setErrAccion(null); setRevocar(m.id); }}>{t("revoke")}</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {errMas && <p role="alert" data-testid="error-mas" style={{ color: ST.badText }}>⚠ {t("errMore")}</p>}
      {c.next && <button type="button" data-testid="cargar-mas" className="sx-focus" style={{ ...btn, marginTop: 12 }} onClick={mas}>{t("more")}</button>}
      {editando && siteId !== undefined && <EditarMedio key={editando.id} siteId={siteId ?? ""} media={editando} demo={demo} lang={lang} onSaved={(m) => { if (demo) saveDemoMedia(m); reemplazar(m); }} onClose={() => setEditar(null)} />}
      {revocar && (
        <div role="dialog" aria-modal="true" aria-labelledby="t-revocar" data-testid="dialogo-revocar" onKeyDown={(e) => { if (e.key === "Escape") setRevocar(null); }}
          style={{ background: ST.white, border: `2px solid ${ST.ink}`, borderRadius: SIZE.radius, padding: SIZE.gap, marginTop: SIZE.gap }}>
          <h3 id="t-revocar" style={{ margin: 0, fontSize: SIZE.fontSub }}>{t("revTitle")}</h3>
          <p>{t("revBody")}</p>
          <label htmlFor="f-motivo" style={{ display: "block" }}>{t("reason")}</label>
          <select id="f-motivo" data-testid="motivo-revocar" className="sx-focus" value={motivo} onChange={(e) => setMotivo(e.target.value as MediaRevoke["reason"])}
            style={{ minHeight: SIZE.target, padding: "0 10px", font: "inherit", marginBottom: 12 }}>
            {MOTIVOS.map((x) => <option key={x} value={x}>{t(x)}</option>)}
          </select>
          <div>
            <button type="button" ref={cancelRef} data-testid="cancelar-revocar" className="sx-focus" style={btn} onClick={() => setRevocar(null)}>{t("cancel")}</button>
            <button type="button" data-testid="confirmar-revocar" className="sx-focus" style={btn} disabled={trabajando} onClick={confirmar}>{t(trabajando ? "working" : "confirm")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

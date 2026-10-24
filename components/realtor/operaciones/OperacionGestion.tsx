"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import type { Operation } from "@/lib/realtor/operaciones/types";
import { fetchDetail, fetchTemplates, openOperation, sendToReview, setMilestone, uploadDocument, type Detail, type Result } from "./escritura";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const FIELD: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };
const BTN: CSSProperties = { minHeight: 36, padding: "0 14px", borderRadius: 8, border: `1px solid ${RT.ink}`, background: RT.ink, color: RT.white, fontFamily: "inherit", fontWeight: 700, cursor: "pointer" };
const LABEL: CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: RT.muted };
const DOC_TYPES = ["lease_agreement", "disclosure", "inspection_report", "appraisal", "title_deed", "receipt", "other"] as const;
const DOC_LABEL: Record<(typeof DOC_TYPES)[number], string> = { lease_agreement: "Contrato de alquiler", disclosure: "Declaración", inspection_report: "Inspección", appraisal: "Tasación", title_deed: "Título", receipt: "Recibo", other: "Otro" };
const STATUS_ES: Record<string, string> = { pending: "pendiente", in_progress: "en curso", done: "hecha", skipped: "omitida", blocked: "bloqueada" };

const errorText = (r: { ok: boolean; status?: number }, conflict: string) =>
  r.status === 409 ? conflict : r.status === 422 ? "Datos inválidos: revisa los campos." : r.status === 401 || r.status === 403 ? "No tienes permiso para esta acción." : "No se pudo completar la acción. Inténtalo de nuevo.";

/** Abrir la operación (desde propiedad/prospecto), avanzar etapas, subir documentos y enviarla a revisión. */
export function OperacionGestion({ ops, initialPropertyId = "", initialContactId = "" }: { ops: readonly Operation[]; initialPropertyId?: string; initialContactId?: string }) {
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [contactId, setContactId] = useState(initialContactId);
  const [templateId, setTemplateId] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchTemplates().then((t) => { if (alive) { setTemplates(t); setTemplateId((c) => c || t[0]?.id || ""); } });
    return () => { alive = false; };
  }, []);

  const load = async (id: string) => {
    const d = await fetchDetail(id);
    if (d) setDetail(d); else setMsg({ kind: "error", text: "No se pudo leer la operación." });
  };
  const run = async (fn: () => Promise<Result>, okText: string, conflict: string, reload?: string) => {
    setBusy(true);
    const r = await fn();
    setMsg(r.ok ? { kind: "ok", text: okText } : { kind: "error", text: errorText(r, conflict) });
    if (r.ok && reload) await load(reload);
    setBusy(false);
  };

  const open = async () => {
    if (!propertyId.trim() || !templateId) { setMsg({ kind: "error", text: "Indica la propiedad y la plantilla para abrir la operación." }); return; }
    setBusy(true);
    const r = await openOperation({ propertyId: propertyId.trim(), templateId, contactId: contactId.trim() || undefined, price: price.trim() || undefined, currency });
    if (r.ok) { setMsg({ kind: "ok", text: "Operación abierta en borrador." }); await load(r.id); } else setMsg({ kind: "error", text: errorText(r, "Ya existe una operación en conflicto.") });
    setBusy(false);
  };

  return (
    <section data-testid="operacion-gestion" style={{ ...CARD, display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>Abrir y gestionar operación</h2>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <label style={LABEL}>Propiedad (id)<input style={FIELD} value={propertyId} onChange={(e) => setPropertyId(e.target.value)} /></label>
        <label style={LABEL}>Prospecto / contacto (id, opcional)<input style={FIELD} value={contactId} onChange={(e) => setContactId(e.target.value)} /></label>
        <label style={LABEL}>Plantilla
          <select style={FIELD} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </label>
        <label style={LABEL}>Precio pactado (opcional)<input style={FIELD} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
        <label style={LABEL}>Moneda<input style={FIELD} maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} /></label>
      </div>
      <div><button type="button" style={BTN} disabled={busy} onClick={open}>Abrir operación</button></div>
      {msg ? <p role={msg.kind === "error" ? "alert" : "status"} style={{ margin: 0, fontSize: 13, color: msg.kind === "error" ? RT.demoText : RT.teal }}>{msg.text}</p> : null}

      {ops.length > 0 ? (
        <ul aria-label="Operaciones" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ops.map((o) => (<li key={o.id}><button type="button" style={{ ...BTN, background: RT.white, color: RT.ink }} onClick={() => { setMsg(null); load(o.id); }}>Gestionar {o.code}</button></li>))}
        </ul>
      ) : null}

      {detail ? (
        <div data-testid="operacion-detalle" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Etapas · estado {STATUS_ES[detail.status] ?? detail.status}</h3>
          <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {detail.milestones.map((m) => (
              <li key={m.id} style={{ fontSize: 14 }}>
                <span>{m.label}</span> · <em>{STATUS_ES[m.status] ?? m.status}</em>{m.required ? " · obligatoria" : ""}{" "}
                {m.status !== "done" ? (
                  <button type="button" style={{ ...BTN, minHeight: 30 }} disabled={busy} onClick={() => run(() => setMilestone(detail.id, m.id, "done"), "Etapa actualizada.", "La operación ya está cerrada.", detail.id)}>Marcar hecha</button>
                ) : null}
              </li>
            ))}
          </ol>
          <div data-testid="historial-etapas" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Historial de etapas</h3>
            {detail.events.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: RT.muted }}>Sin cambios registrados.</p> : (
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                {detail.events.map((e, i) => (
                  <li key={`${e.milestoneId}-${e.at}-${i}`}>
                    {detail.milestones.find((m) => m.id === e.milestoneId)?.label}: {STATUS_ES[e.from] ?? e.from} → {STATUS_ES[e.to] ?? e.to} · por {e.actor.slice(0, 8)} · <time dateTime={e.at}>{new Date(e.at).toLocaleString("es")}</time>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={LABEL}>Archivo<input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
            <label style={LABEL}>Tipo de documento
              <select style={FIELD} value={docType} onChange={(e) => setDocType(e.target.value)}>
                {DOC_TYPES.map((d) => (<option key={d} value={d}>{DOC_LABEL[d]}</option>))}
              </select>
            </label>
            <button type="button" style={BTN} disabled={busy || !file} onClick={() => file && run(() => uploadDocument(detail.id, file, docType, file.name.slice(0, 200)), "Documento subido.", "No se pudo registrar el documento.")}>Subir documento</button>
          </div>
          <div><button type="button" style={BTN} disabled={busy} onClick={() => run(() => sendToReview(detail.id), "Enviada a revisión del broker.", "Ya hay una revisión pendiente para esta operación.")}>Enviar a revisión</button></div>
        </div>
      ) : null}
    </section>
  );
}

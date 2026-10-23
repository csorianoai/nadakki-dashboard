"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Lang } from "@/lib/realtor/propietarios/copy";
import { MANDATE_COPY } from "./mandate-copy";
import {
  EMPTY_MANDATE, MANDATE_KINDS, MANDATE_ROLES, createMandate, fetchContactOptions, fetchPropertyOptions, missingMandateFields,
  type MandateForm as Form, type Option,
} from "@/lib/realtor/propietarios/write";
import { RT } from "@/lib/realtor/tokens";

const FIELD: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };
const LABEL: CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: RT.muted };
const ERR: CSSProperties = { margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 };

type Status = "idle" | "saving" | "ok" | "validation" | "forbidden" | "notfound" | "conflict" | "other" | "fields";

export function MandateForm({ lang, onSaved, onClose }: { lang: Lang; onSaved: () => void; onClose: () => void }) {
  const t = MANDATE_COPY[lang];
  const [form, setForm] = useState<Form>(EMPTY_MANDATE);
  const [contacts, setContacts] = useState<Option[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [bad, setBad] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    fetchContactOptions().then((o) => { if (alive) setContacts(o); });
    fetchPropertyOptions().then((o) => { if (alive) setProperties(o); });
    return () => { alive = false; };
  }, []);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const invalid = (k: string) => (bad.includes(k) ? ({ "aria-invalid": true } as const) : {});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = missingMandateFields(form);
    setBad(missing);
    if (missing.length) { setStatus("fields"); return; }
    setStatus("saving");
    const r = await createMandate(form);
    if (r.ok === false) { setStatus(r.reason); return; }
    setStatus("ok"); setForm(EMPTY_MANDATE); onSaved();
  };

  const select = (label: string, key: keyof Form, opts: readonly Option[]) => (
    <label style={LABEL}>{label}
      <select aria-label={label} value={form[key]} onChange={(e) => set({ [key]: e.target.value })} style={FIELD} {...invalid(key)}>
        <option value="">{opts.length ? t.choose : t.noOptions}</option>
        {opts.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
      </select>
    </label>
  );
  const input = (label: string, key: keyof Form, type: string, extra: object = {}) => (
    <label style={LABEL}>{label}
      <input aria-label={label} type={type} value={form[key]} onChange={(e) => set({ [key]: e.target.value })} style={FIELD} {...invalid(key)} {...extra} />
    </label>
  );
  const errId: Partial<Record<Status, string>> = { fields: t.errFields, validation: t.errValidation, forbidden: t.errForbidden, notfound: t.errNotFound, conflict: t.errConflict, other: t.errOther };

  return (
    <form data-testid="mandate-form" onSubmit={submit} noValidate aria-label={t.title}
      style={{ display: "flex", flexDirection: "column", gap: 14, background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>{t.title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {select(t.contact, "contactId", contacts)}
        {select(t.role, "role", MANDATE_ROLES.map((id) => ({ id, label: t.roles[id] })))}
        {select(t.property, "propertyId", properties)}
        {select(t.kind, "kind", MANDATE_KINDS.map((id) => ({ id, label: t.kinds[id] })))}
        {input(t.share, "sharePct", "text", { inputMode: "decimal" })}
        {input(t.commission, "commissionPct", "text", { inputMode: "decimal" })}
        {input(t.starts, "startsOn", "date")}
        {input(t.ends, "endsOn", "date")}
      </div>
      {errId[status] ? <p role="alert" data-testid={`mandate-error-${status}`} style={ERR}>{errId[status]}</p> : null}
      {status === "ok" ? <p role="status" data-testid="mandate-success" style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t.ok}</p> : null}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" data-testid="mandate-submit" disabled={status === "saving"} style={{ ...FIELD, cursor: "pointer", fontWeight: 700, background: RT.ink, color: RT.white, padding: "0 18px" }}>
          {status === "saving" ? t.saving : t.submit}
        </button>
        <button type="button" onClick={onClose} style={{ ...FIELD, cursor: "pointer", padding: "0 18px" }}>{t.cancel}</button>
      </div>
    </form>
  );
}

"use client";

import { useState, type CSSProperties } from "react";
import type { Lang } from "@/lib/realtor/clientes/copy";
import { API_ROLE_LABEL, FORM_COPY, KIND_OPTIONS } from "@/lib/realtor/clientes/copy-form";
import type { Contact } from "@/lib/realtor/clientes/types";
import { CONTACT_KINDS, CONTACT_ROLES, EMPTY_DRAFT, apiRoleOf, saveContact, type ContactDraft } from "@/lib/realtor/clientes/write";
import { RT } from "@/lib/realtor/tokens";

const INPUT: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };
const FIELD: CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: RT.muted };
const ERR: CSSProperties = { margin: 0, fontSize: 13, fontWeight: 600, color: RT.chipDownText };

/** Alta (sin `contact`) y edición de un contacto contra el API real. Los errores 422/403/409/404 quedan visibles; nunca éxito falso. */
export function ContactForm({ contact, lang, onSaved, onCancel }: { contact?: Contact; lang: Lang; onSaved: () => void; onCancel: () => void }) {
  const t = FORM_COPY[lang];
  const [draft, setDraft] = useState<ContactDraft>(contact ? { ...EMPTY_DRAFT, displayLabel: contact.name, role: apiRoleOf(contact) } : EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; field: string | null } | null>(null);
  const set = (patch: Partial<ContactDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const labels: Record<string, string> = { display_name: t.displayName, display_label: t.displayLabel, legal_name: t.legalName, preferred_language: t.language, kind: t.kind, role: t.role };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const r = await saveContact(draft, contact);
    setBusy(false);
    if (!("message" in r)) { onSaved(); return; }
    const s = r.status;
    const message = r.message === "nochanges" ? t.nochanges : s === 403 ? t.e403 : s === 401 ? t.e401 : s === 404 ? t.e404 : s === 0 ? t.e0 : s >= 500 ? t.e5 : r.message;
    setError({ message, field: s === 422 ? r.field : null });
  }

  const fieldError = (f: string) => (error?.field === f ? <p role="alert" data-testid={`field-error-${f}`} style={ERR}>{t.fieldErr(labels[f], error.message)}</p> : null);
  const edit = Boolean(contact);
  return (
    <form data-testid="contact-form" onSubmit={submit} noValidate style={{ display: "grid", gap: 14, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22, background: RT.white }}>
      <h2 style={{ margin: 0, fontSize: 22 }}>{edit ? t.editTitle : t.newTitle}</h2>
      {!edit ? (
        <label style={FIELD}>{t.kind}
          <select value={draft.kind} onChange={(e) => set({ kind: e.target.value as ContactDraft["kind"] })} style={INPUT}>
            {CONTACT_KINDS.map((k) => (<option key={k} value={k}>{KIND_OPTIONS[lang][k]}</option>))}
          </select>
        </label>
      ) : null}
      <label style={FIELD}>{t.displayName}
        <input value={draft.displayName} onChange={(e) => set({ displayName: e.target.value })} maxLength={256} placeholder={edit ? t.keep : undefined} style={INPUT} />
      </label>
      {fieldError("display_name")}
      <label style={FIELD}>{t.displayLabel}
        <input value={draft.displayLabel} onChange={(e) => set({ displayLabel: e.target.value })} maxLength={64} style={INPUT} />
      </label>
      {fieldError("display_label")}
      <label style={FIELD}>{t.legalName}
        <input value={draft.legalName} onChange={(e) => set({ legalName: e.target.value })} maxLength={256} placeholder={edit ? t.keep : undefined} style={INPUT} />
      </label>
      {fieldError("legal_name")}
      <label style={FIELD}>{t.language}
        <input value={draft.preferredLanguage} onChange={(e) => set({ preferredLanguage: e.target.value })} placeholder={edit ? t.keep : "es"} style={INPUT} />
      </label>
      {fieldError("preferred_language")}
      <label style={FIELD}>{t.role}
        <select value={draft.role} onChange={(e) => set({ role: e.target.value as ContactDraft["role"] })} style={INPUT}>
          <option value="">{t.noRole}</option>
          {CONTACT_ROLES.map((r) => (<option key={r} value={r}>{API_ROLE_LABEL[lang][r]}</option>))}
        </select>
      </label>
      {fieldError("role")}{fieldError("kind")}
      {error && !error.field ? <p role="alert" data-testid="contact-form-error" style={ERR}><span>{error.message}</span></p> : null}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" data-testid="contact-save" disabled={busy} style={{ ...INPUT, minHeight: 44, padding: "0 18px", fontWeight: 700, cursor: "pointer", background: RT.teal, color: RT.white, border: `1px solid ${RT.teal}` }}>{busy ? t.saving : t.save}</button>
        <button type="button" onClick={onCancel} style={{ ...INPUT, minHeight: 44, padding: "0 18px", fontWeight: 700, cursor: "pointer" }}>{t.cancel}</button>
      </div>
    </form>
  );
}

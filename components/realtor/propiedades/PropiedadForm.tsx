"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { COPY, CONTRACT_TYPE_LABEL, type Lang } from "@/lib/realtor/propiedades/copy";
import {
  CONTRACT_TYPES, EMPTY_FORM, createProperty, fetchOwnerOptions, fetchPropertyForm, missingFields, updateProperty,
  type OwnerOption, type PropertyForm,
} from "@/lib/realtor/propiedades/write";
import { RT } from "@/lib/realtor/tokens";

const INPUT: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };
const FIELD: CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: RT.muted };
const ERR: CSSProperties = { margin: 0, fontSize: 13, fontWeight: 600, color: RT.chipDownText };
const BOX: CSSProperties = { display: "grid", gap: 14, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22, background: RT.white };

/** Alta (sin `propertyId`) y edición de una propiedad contra el API real. Los errores quedan visibles; nunca éxito falso. */
export function PropiedadForm({ propertyId, lang, onSaved, onCancel }: { propertyId?: string; lang: Lang; onSaved: () => void; onCancel: () => void }) {
  const t = COPY[lang];
  const [form, setForm] = useState<PropertyForm | null>(propertyId ? null : EMPTY_FORM);
  const [loadFailed, setLoadFailed] = useState(false);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchOwnerOptions().then((o) => { if (alive) setOwners(o); });
    if (propertyId) {
      fetchPropertyForm(propertyId).then((f) => { if (!alive) return; if (f) setForm(f); else setLoadFailed(true); });
    }
    return () => { alive = false; };
  }, [propertyId]);

  if (loadFailed) {
    return (
      <div style={BOX}>
        <p role="alert" data-testid="propiedad-load-error" style={ERR}>{t.errLoad}</p>
        <div><button type="button" onClick={onCancel} style={{ ...INPUT, minHeight: 44, padding: "0 18px", fontWeight: 700, cursor: "pointer" }}>{t.cancel}</button></div>
      </div>
    );
  }
  if (!form) return <p data-testid="propiedad-loading" style={{ margin: 0, color: RT.muted }}>{t.loading}</p>;

  const set = (patch: Partial<PropertyForm>) => setForm((f) => (f ? { ...f, ...patch } : f));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (missingFields(form).length) { setError(t.errValidation); return; }
    setBusy(true); setError(null);
    const r = propertyId ? await updateProperty(propertyId, form) : await createProperty(form);
    setBusy(false);
    if (r.ok === true) { onSaved(); return; }
    setError(r.reason === "validation" ? t.errValidation : r.reason === "forbidden" ? t.errForbidden : r.reason === "notfound" ? t.errNotFound : t.errOther);
  }
  const text = (label: string, key: keyof PropertyForm, max?: number) => (
    <label style={FIELD}>{label}
      <input value={form[key]} onChange={(e) => set({ [key]: e.target.value })} maxLength={max} style={INPUT} />
    </label>
  );
  return (
    <form data-testid="propiedad-form" onSubmit={submit} noValidate style={BOX}>
      <h2 style={{ margin: 0, fontSize: 22 }}>{propertyId ? t.editProperty : t.newProperty}</h2>
      {text(t.fCountry, "country", 2)}
      {text(t.fRegion, "region")}
      {text(t.fCity, "city")}
      {text(t.fZone, "zone")}
      {text(t.fPostal, "postalCode")}
      {text(t.fStreet, "street")}
      {text(t.fJurisdiction, "jurisdiction")}
      {text(t.fParcel, "parcelId")}
      <label style={FIELD}>{t.fPropType}
        <select value={form.propertyType} onChange={(e) => set({ propertyType: e.target.value })} style={INPUT}>
          <option value="">{t.pickType}</option>
          {CONTRACT_TYPES.map((c) => (<option key={c} value={c}>{CONTRACT_TYPE_LABEL[lang][c]}</option>))}
        </select>
      </label>
      {text(t.fYear, "yearBuilt", 4)}
      <label style={FIELD}>{t.fOwner}
        <select value={form.ownerId} onChange={(e) => set({ ownerId: e.target.value })} style={INPUT}>
          <option value="">{t.noOwner}</option>
          {owners.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
        </select>
      </label>
      <fieldset style={{ display: "grid", gap: 10, border: `1px solid ${RT.line}`, borderRadius: 8, padding: 12 }}>
        <legend style={{ fontSize: 12, color: RT.muted }}>{t.unitHint}</legend>
        {text(t.fUnitLabel, "unitLabel")}
        {text(t.fBeds, "bedrooms", 2)}
        {text(t.fBaths, "bathrooms")}
      </fieldset>
      {error ? <p role="alert" data-testid="propiedad-form-error" style={ERR}>{error}</p> : null}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" data-testid="propiedad-save" disabled={busy} style={{ ...INPUT, minHeight: 44, padding: "0 18px", fontWeight: 700, cursor: "pointer", background: RT.teal, color: RT.white, border: `1px solid ${RT.teal}` }}>{busy ? t.saving : t.save}</button>
        <button type="button" onClick={onCancel} style={{ ...INPUT, minHeight: 44, padding: "0 18px", fontWeight: 700, cursor: "pointer" }}>{t.cancel}</button>
      </div>
    </form>
  );
}

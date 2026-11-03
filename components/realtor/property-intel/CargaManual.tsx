"use client";

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import {
  OBS_KINDS, fetchCompetitors, fetchObservations, importCsv, saveCompetitor, saveObservation,
  type Competitor, type ObsKind, type Observation, type SaveResult,
} from "@/lib/realtor/property-intel/carga";
import type { Section } from "@/lib/realtor/property-intel/types";
import { RT } from "@/lib/realtor/tokens";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const FORM: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginTop: 12 };
const MSG: Record<string, string> = {
  session_expired: "Tu sesión terminó. Vuelve a entrar.", service_unavailable: "Servicio no disponible por ahora.", error: "No se pudo leer esta sección.",
};
const KIND_LABEL: Record<ObsKind, string> = {
  price: "Precio", availability: "Disponibilidad", incentive: "Incentivo", advertising: "Publicidad", construction: "Obra", other: "Otro",
};
const COMP_FIELDS = [
  ["name", "Nombre"], ["address", "Dirección"], ["developer", "Desarrollador"], ["price", "Precio desde"], ["units", "Unidades"],
  ["floors", "Pisos"], ["delivery", "Entrega"], ["source_url", "URL de la fuente"], ["observed", "Fecha de observación"],
] as const;
const CSV_HELP = {
  "competitor-projects": "name,address,developer,price_from,currency,units,floors,delivery,source_url,observed_at",
  observations: "competitor_name,kind,description,value,currency,source_ref,source_url,observed_at",
} as const;

const day = (iso: string) => iso.slice(0, 10);
const origen = (r: { observed_at: string; source_method: string }) => `Observado · ${day(r.observed_at)} · ${r.source_method === "csv" ? "CSV" : "manual"}`;
const money = (a: string | null, c: string | null) => (a && c ? `${Number(a).toLocaleString("en-US")} ${c}` : null);
/** Fecha del calendario (sin hora) → mediodía UTC, para que no cambie de día por la zona horaria. */
const atNoon = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00Z` : "");
const opt = (v: string) => (v.trim() ? v.trim() : undefined);
const int = (v: string) => (v.trim() ? Number.parseInt(v, 10) : undefined);

function campo(state: Record<string, string>, set: (s: Record<string, string>) => void, [k, label]: readonly [string, string]) {
  return (
    <label key={k} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
      {label}
      <input aria-label={label} type={k === "observed" ? "date" : "text"} value={state[k] ?? ""} onChange={(e) => set({ ...state, [k]: e.target.value })} />
    </label>
  );
}

function Errors({ id, r }: { id: string; r: SaveResult | null }) {
  if (!r || r.ok) return null;
  const errors = (r as Extract<SaveResult, { ok: false }>).errors; // sin strictNullChecks, `r.ok` no estrecha la unión
  return <ul role="alert" data-testid={id} style={{ margin: "8px 0 0", paddingLeft: 18 }}>{errors.map((e, i) => <li key={i}>{e.row ? `Fila ${e.row}: ` : ""}{e.msg}</li>)}</ul>;
}

function CsvImport({ what, label, onDone }: { what: keyof typeof CSV_HELP; label: string; onDone: (pid: string, w: typeof what, t: string) => Promise<SaveResult> }) {
  const [text, setText] = useState("");
  const [r, setR] = useState<SaveResult | null>(null);
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
        CSV de {label}
        <textarea aria-label={`CSV de ${label}`} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={CSV_HELP[what]} />
      </label>
      <input type="file" accept=".csv,text/csv" aria-label={`Archivo CSV de ${label}`} onChange={(e) => void e.target.files?.[0]?.text().then(setText)} />
      <button type="button" disabled={!text.trim()} onClick={async () => { const x = await onDone("", what, text); setR(x); if (x.ok) setText(""); }}>
        Importar {label}
      </button>
      <Errors id="pi-csv-errors" r={r} />
    </div>
  );
}

/** Carga manual de PI-2: competidores y señales observadas de una propiedad, con su procedencia. 404 → la sección no se pinta. */
export function CargaManual({ propertyId }: { propertyId: string }) {
  const [comps, setComps] = useState<Section<Competitor[]>>({ state: "loading" });
  const [obs, setObs] = useState<Section<Observation[]>>({ state: "loading" });
  const [c, setC] = useState<Record<string, string>>({});
  const [o, setO] = useState<Record<string, string>>({ kind: "price" });
  const [cr, setCr] = useState<SaveResult | null>(null);
  const [or, setOr] = useState<SaveResult | null>(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([fetchCompetitors(propertyId), fetchObservations(propertyId)]);
    setComps(a); setObs(b);
  }, [propertyId]);
  useEffect(() => { void load(); }, [load]);

  if (comps.state === "hidden" && obs.state === "hidden") return null;
  const names = new Map(comps.state === "ok" ? comps.data.map((x) => [x.id, x.name]) : []);

  const addComp = async (e: FormEvent) => {
    e.preventDefault();
    const falta = COMP_FIELDS.filter(([k]) => ["name", "address", "source_url", "observed"].includes(k) && !c[k]?.trim()).map(([, l]) => l);
    if (falta.length) { setCr({ ok: false, errors: [{ msg: `Falta: ${falta.join(", ")}` }] }); return; }
    const r = await saveCompetitor({
      property_id: propertyId, name: c.name.trim(), address: c.address.trim(), developer: opt(c.developer ?? ""),
      price_from_amount: opt(c.price ?? ""), price_currency: opt(c.price ?? "") ? "USD" : undefined, units: int(c.units ?? ""),
      floors: int(c.floors ?? ""), delivery: opt(c.delivery ?? ""), source_url: c.source_url.trim(), observed_at: atNoon(c.observed),
    });
    setCr(r);
    if (r.ok) { setC({}); await load(); }
  };
  const addObs = async (e: FormEvent) => {
    e.preventDefault();
    const falta = [["description", "Descripción"], ["source_ref", "Referencia de la fuente"], ["observed", "Fecha de la observación"]].filter(([k]) => !o[k]?.trim()).map(([, l]) => l);
    if (falta.length) { setOr({ ok: false, errors: [{ msg: `Falta: ${falta.join(", ")}` }] }); return; }
    const r = await saveObservation({
      property_id: propertyId, kind: o.kind, description: o.description.trim(), competitor_project_id: opt(o.competitor ?? ""),
      value_amount: opt(o.value ?? ""), value_currency: opt(o.value ?? "") ? "USD" : undefined, source_ref: o.source_ref.trim(),
      source_url: opt(o.source_url ?? ""), observed_at: atNoon(o.observed),
    });
    setOr(r);
    if (r.ok) { setO({ kind: "price" }); await load(); }
  };
  const csv = async (_: string, what: "competitor-projects" | "observations", text: string) => {
    const r = await importCsv(propertyId, what, text);
    if (r.ok) await load();
    return r;
  };
  return (
    <section data-testid="pi-carga" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section data-testid="pi-comps" data-state={comps.state} style={CARD}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Proyectos competidores</h2>
        {comps.state === "loading" ? <p role="status">Cargando…</p>
          : comps.state !== "ok" ? <p role="status" data-testid="pi-comp-msg" data-state={comps.state}>{MSG[comps.state] ?? MSG.error}</p>
          : comps.data.length === 0 ? <p data-testid="pi-comp-empty" style={{ color: RT.muted }}>Sin competidores cargados todavía</p>
          : <ul style={{ margin: 0, paddingLeft: 18 }}>{comps.data.map((x) => (
            <li key={x.id} data-testid="pi-comp-row">
              <strong>{x.name}</strong> · {x.address}{x.developer ? ` · ${x.developer}` : ""}
              {money(x.price_from_amount, x.price_currency) ? ` · desde ${money(x.price_from_amount, x.price_currency)}` : ""}
              {" · "}{[x.units !== null ? `${x.units} unidades` : null, x.floors !== null ? `${x.floors} pisos` : null, x.delivery ? `entrega ${x.delivery}` : null].filter(Boolean).join(" · ")}
              {" · "}<a href={x.source_url} target="_blank" rel="noopener noreferrer" aria-label={`Fuente de ${x.name}`}>fuente</a>
              <span style={{ color: RT.muted }}> · {origen(x)}</span>
            </li>))}</ul>}
        <form onSubmit={addComp} style={FORM}>
          {COMP_FIELDS.map((f) => campo(c, setC, f))}
          <button type="submit">Guardar competidor</button>
        </form>
        <Errors id="pi-comp-form-error" r={cr} />
        <CsvImport what="competitor-projects" label="competidores" onDone={csv} />
      </section>
      <section data-testid="pi-obs" data-state={obs.state} style={CARD}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Señales observadas</h2>
        {obs.state === "loading" ? <p role="status">Cargando…</p>
          : obs.state !== "ok" ? <p role="status" data-testid="pi-obs-msg" data-state={obs.state}>{MSG[obs.state] ?? MSG.error}</p>
          : obs.data.length === 0 ? <p data-testid="pi-obs-empty" style={{ color: RT.muted }}>Sin señales observadas todavía</p>
          : <ul style={{ margin: 0, paddingLeft: 18 }}>{obs.data.map((x) => (
            <li key={x.id} data-testid="pi-obs-row">
              <strong>{KIND_LABEL[x.kind]}{x.competitor_project_id ? ` · ${names.get(x.competitor_project_id) ?? "competidor"}` : ""}</strong>
              {" · "}{x.description}{money(x.value_amount, x.value_currency) ? ` · ${money(x.value_amount, x.value_currency)}` : ""}
              {" · "}{x.source_url ? <a href={x.source_url} target="_blank" rel="noopener noreferrer">{x.source_ref}</a> : x.source_ref}
              <span style={{ color: RT.muted }}> · {origen(x)}</span>
            </li>))}</ul>}
        <form onSubmit={addObs} style={FORM}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>Tipo
            <select aria-label="Tipo" value={o.kind} onChange={(e) => setO({ ...o, kind: e.target.value })}>{OBS_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>Competidor
            <select aria-label="Competidor" value={o.competitor ?? ""} onChange={(e) => setO({ ...o, competitor: e.target.value })}>
              <option value="">— ninguno —</option>{[...names].map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select>
          </label>
          {([["description", "Descripción"], ["value", "Valor (USD)"], ["source_ref", "Referencia de la fuente"], ["source_url", "URL (opcional)"], ["observed", "Fecha de la observación"]] as const).map((f) => campo(o, setO, f))}
          <button type="submit">Guardar observación</button>
        </form>
        <Errors id="pi-obs-form-error" r={or} />
        <CsvImport what="observations" label="observaciones" onDone={csv} />
      </section>
    </section>
  );
}

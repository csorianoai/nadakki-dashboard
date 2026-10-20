"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { SOURCES, fetchSource, type SourceEnvelope, type SourceKey } from "@/lib/realtor/property-intel/fuentes";
import type { Section } from "@/lib/realtor/property-intel/types";
import { RT } from "@/lib/realtor/tokens";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const TITLE: Record<SourceKey, string> = { acs: "Perfil demográfico (US Census ACS)", "miami-permits": "Oferta futura: permisos de construcción (Ciudad de Miami)", dor: "Rol fiscal y ventas (Florida DOR)" };
const MSG: Record<string, string> = { session_expired: "Tu sesión terminó. Vuelve a entrar.", service_unavailable: "Servicio no disponible por ahora.", error: "No se pudo leer esta fuente." };
const REASON: Record<string, string> = { provider_not_configured: "No configurado", provider_error: "La fuente no respondió", no_data: "Sin datos", budget_exhausted: "Presupuesto agotado" };
/** Etiqueta y si la cifra es dinero. Solo se pintan las claves conocidas: nada que no venga del sobre. */
const LABELS: Record<string, [string, boolean]> = {
  population: ["Población", false], median_age: ["Edad mediana", false], median_household_income: ["Ingreso mediano del hogar", true],
  median_home_value: ["Valor mediano de vivienda", true], housing_units: ["Viviendas", false], occupied_units: ["Viviendas ocupadas", false],
  owner_occupied_units: ["En propiedad", false], renter_occupied_units: ["En alquiler", false], median_gross_rent: ["Renta bruta mediana", true],
  permits_issued: ["Permisos emitidos en 800 m", false], parcels: ["Parcelas", false], residential_units: ["Unidades residenciales", false],
  median_just_value: ["Mediana del valor justo", true], sales_24m: ["Ventas (24 meses)", false], median_sale_price_24m: ["Mediana de venta (24 meses)", true],
};
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v.toLocaleString("en-US", { maximumFractionDigits: 1 }) : null);

function cifra(v: unknown, money: boolean): string {
  if (typeof v === "object" && v !== null && "estimate" in v) {
    const { estimate, moe } = v as { estimate: unknown; moe: unknown };
    const e = n(estimate);
    return e === null ? "—" : `${e}${n(moe) !== null ? ` ± ${n(moe)}` : ""}${money ? " USD" : ""}`;
  }
  const x = n(v);
  return x === null ? "—" : `${x}${money ? " USD" : ""}`;
}

function procedencia(s: SourceEnvelope): string {
  const p = s.provenance;
  const quien = [p.provider, p.year ?? p.roll_year].filter((x) => x !== undefined && x !== null).join(" ");
  const donde = s.geo.zcta ? `ZCTA ${s.geo.zcta}` : s.geo.zip5 ? `CP ${s.geo.zip5}` : null;
  const cuando = s.window.start && s.window.end ? `${s.window.start} → ${s.window.end}` : (s.window.label as string | undefined) ?? null;
  return [s.evidence_tier === "estimado" ? "Estimado" : "Observado", quien || null, donde, cuando].filter(Boolean).join(" · ");
}

function Fuente({ k, s }: { k: SourceKey; s: Section<SourceEnvelope> }) {
  if (s.state === "hidden") return null;
  if (s.state !== "ok") {
    return <section style={CARD}><h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{TITLE[k]}</h3>
      <p role="status" data-testid={s.state === "loading" ? undefined : `pi-src-msg-${k}`} style={{ margin: 0, color: RT.muted }}>{s.state === "loading" ? "Cargando…" : MSG[s.state] ?? MSG.error}</p></section>;
  }
  const e = s.data;
  const filas = Object.entries(e.values).filter(([key]) => key in LABELS);
  return (
    <section data-testid={`pi-src-${e.source}`} data-status={e.data_status} style={CARD}>
      <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{TITLE[k]} <small style={{ color: RT.muted }}>{e.data_status}</small></h3>
      {e.data_status === "UNAVAILABLE" ? (
        <p role="status" data-testid="pi-src-reason" style={{ margin: 0 }}>{REASON[e.unavailable_reason ?? ""] ?? "No disponible"}{e.detail ? ` · ${e.detail}` : ""}</p>
      ) : (
        <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "4px 16px", margin: 0 }}>
          {filas.map(([key, v]) => [<dt key={`${key}-k`} style={{ color: RT.muted }}>{LABELS[key][0]}</dt>, <dd key={`${key}-v`} style={{ margin: 0, fontWeight: 600 }}>{cifra(v, LABELS[key][1])}</dd>])}
        </dl>
      )}
      <p style={{ margin: "8px 0 0", fontSize: 12, color: RT.muted }}>{procedencia(e)}{e.uncertainty ? ` · ${e.uncertainty}` : ""}</p>
    </section>
  );
}

/** PI-2 fuentes públicas de coste cero de la zona de una propiedad. Cada fuente con su estado real; nunca DEMO. */
export function FuentesZona({ propertyId }: { propertyId: string }) {
  const [s, setS] = useState<Record<SourceKey, Section<SourceEnvelope>>>({ acs: { state: "loading" }, "miami-permits": { state: "loading" }, dor: { state: "loading" } });
  useEffect(() => {
    let vivo = true;
    for (const k of SOURCES) void fetchSource(propertyId, k).then((r) => { if (vivo) setS((prev) => ({ ...prev, [k]: r })); });
    return () => { vivo = false; };
  }, [propertyId]);
  return (
    <section data-testid="pi-fuentes" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Fuentes públicas de la zona</h2>
      {SOURCES.map((k) => <Fuente key={k} k={k} s={s[k]} />)}
    </section>
  );
}

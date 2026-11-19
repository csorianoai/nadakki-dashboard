"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { decideLink, fetchAll, registrationGate } from "@/lib/realtor/property-intel/client";
import { HQ_DEMO, HQ_PROPERTY_ID } from "@/lib/realtor/property-intel/demo";
import type { PiData, Section, Target } from "@/lib/realtor/property-intel/types";
import { getAuthHeaders } from "@/lib/api/fetch-client";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { RealtorNotice } from "../RealtorNotice";
import { CargaManual } from "./CargaManual";
import { useRealtorAccessInfo } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const BTN: CSSProperties = { minHeight: 36, padding: "0 14px", borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontWeight: 700, cursor: "pointer" };
const MSG: Record<string, string> = {
  loading: "Cargando…", session_expired: "Tu sesión terminó. Vuelve a entrar.", service_unavailable: "Servicio no disponible por ahora.",
  error: "No se pudo leer esta sección.",
};
const LINK_LABEL = { proposed: "Propuesto", confirmed: "Confirmado", rejected: "Rechazado" } as const;
const DOC_LABEL = { pending: "Pendiente (aún no almacenado)", stored: "Almacenado", failed: "Falló" } as const;

/** Sección «hidden» (404: sin capacidad o recurso ajeno) no se pinta. Vacío → «Sin datos todavía», nunca cifras inventadas. */
function Block<T>({ id, title, s, children }: { id: string; title: string; s: Section<T[]>; children: (rows: T[]) => ReactNode }) {
  if (s.state === "hidden") return null;
  return (
    <section data-testid={`pi-${id}`} data-state={s.state} style={CARD}>
      <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>{title}</h2>
      {s.state !== "ok" ? <p role="status" data-testid={`pi-${id}-msg`} style={{ margin: 0, color: RT.muted }}>{MSG[s.state]}</p>
        : s.data.length === 0 ? <p data-testid={`pi-${id}-empty`} style={{ margin: 0, color: RT.muted }}>Sin datos todavía</p>
        : children(s.data)}
    </section>
  );
}

export function PropertyIntelScreen({ target }: { target: Target }) {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [data, setData] = useState<PiData | null>(null);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    // DEMO nunca sustituye una respuesta del backend (ni un 401 real): solo si no hay Bearer (no se llama) y es el HQ sintético.
    if (!getAuthHeaders().Authorization && demoActive && target.id === HQ_PROPERTY_ID) { setDemo(true); setData(HQ_DEMO); return; }
    setData(await fetchAll(target));
  }, [target, demoActive]);
  useEffect(() => { if (access === "ok") void load(); }, [access, load]);

  if (access !== "ok") return <RealtorNotice reason={access} />;

  const decide = async (id: string, decision: "confirmed" | "rejected") => {
    const reason = window.prompt(decision === "confirmed" ? "Motivo de la confirmación" : "Motivo del rechazo") ?? "";
    if (!reason.trim()) return;
    setBusy(id); setFailed(false);
    const ok = demo ? false : await decideLink(id, decision, reason);
    setBusy(null);
    if (ok) await load(); else setFailed(true);
  };

  const policy = data?.policy;
  const gate = policy?.state === "ok" ? registrationGate(policy.data) : null;
  const count = (s: Section<{ status?: string }[]> | undefined, st?: string) =>
    s?.state === "ok" ? String(s.data.filter((r) => !st || r.status === st).length) : "—";

  return (
    <section data-testid="pi-screen" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
      <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700 }}>Inteligencia de {target.kind === "property_id" ? "propiedad" : "unidad"}</h1>
      {demo ? <p role="note" data-testid="demo-banner" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>DEMO · datos sintéticos</p> : null}
      {!data ? <p role="status" data-testid="pi-loading">{MSG.loading}</p> : (
        <>
          <dl data-testid="pi-facts" style={{ ...CARD, display: "flex", gap: 32, margin: 0 }}>
            {[["Señales", count(data.signals as Section<{ status?: string }[]>), "facts-signals"], ["Competidores confirmados", count(data.links, "confirmed"), "facts-confirmed"], ["Competidores por revisar", count(data.links, "proposed"), "facts-proposed"], ["Documentos almacenados", count(data.documents, "stored"), "facts-stored"]].map(([k, v, id]) => (
              <div key={id}><dt style={{ fontSize: 12, color: RT.muted }}>{k}</dt><dd data-testid={id} style={{ margin: 0, fontWeight: 700 }}>{v}</dd></div>
            ))}
          </dl>
          <Block id="signals" title="Señales de mercado" s={data.signals}>
            {(rows) => <ul style={{ margin: 0, paddingLeft: 18 }}>{rows.map((r) => <li key={r.id} data-testid="signal-row">{r.signal_type} · {r.observed_at.slice(0, 10)}</li>)}</ul>}
          </Block>
          <Block id="links" title="Competidores" s={data.links}>
            {(rows) => (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {rows.map((l) => (
                  <li key={l.id} data-testid="link-row" data-status={l.status} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <strong>{l.advertiser_ref}</strong>
                    <span data-testid="link-status">{LINK_LABEL[l.status]}</span>
                    <span>confianza {Math.round(l.confidence * 100)}%</span>
                    <span style={{ color: RT.muted }}>{l.evidence.map((e) => e.kind).join(", ")}</span>
                    {l.status === "proposed" ? <button type="button" style={BTN} disabled={busy === l.id} onClick={() => decide(l.id, "confirmed")}>Confirmar</button> : null}
                    {l.status !== "rejected" ? <button type="button" style={BTN} disabled={busy === l.id} onClick={() => decide(l.id, "rejected")}>Rechazar</button> : null}
                  </li>
                ))}
              </ul>
            )}
          </Block>
          {failed ? <p role="alert" data-testid="pi-decision-error" style={{ margin: 0 }}>No se pudo guardar la decisión.</p> : null}
          <Block id="documents" title="Documentos" s={data.documents}>
            {(rows) => <ul style={{ margin: 0, paddingLeft: 18 }}>{rows.map((d) => <li key={d.id} data-testid="doc-row" data-status={d.status}>{d.mime_type} · {DOC_LABEL[d.status]}</li>)}</ul>}
          </Block>
          {policy && policy.state !== "hidden" ? (
            <section data-testid="pi-gate" data-gate={gate ?? policy.state} style={CARD}>
              <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Registro con el desarrollador</h2>
              {gate === null ? <p role="status" style={{ margin: 0, color: RT.muted }}>{MSG[policy.state]}</p>
                : gate === "open" ? <p style={{ margin: 0 }}>Registro confirmado: el envío de prospectos está abierto.</p>
                : gate === "blocked" ? <p style={{ margin: 0 }}>Registro no confirmado: no se pueden enviar prospectos todavía.</p>
                : <p style={{ margin: 0 }}>Este proyecto no exige registro.</p>}
            </section>
          ) : null}
          {target.kind === "property_id" && !demo ? <CargaManual propertyId={target.id} /> : null}
        </>
      )}
    </section>
  );
}

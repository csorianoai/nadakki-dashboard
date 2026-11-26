"use client";
import { useState } from "react";
import { useColaRevisionesNadakki } from "@/hooks/legal/useEstudioGenio";
import { errorRevisionNadakki, informeEstudio, soloNadakki, type Correccion, type DecisionNadakki,
  type PendienteNadakki } from "@/lib/legal/cases/estudio-genio-api";
import m from "@/messages/es/legal-estudio-genio.json";
import { genioButton, genioCard, genioField, genioLabel, genioPrimary, genioTitulo } from "./estilo";

const c = m.nadakki.cola;
const DECISIONES: DecisionNadakki[] = ["aprobado", "con_correcciones", "rechazado"];
const fecha = (v?: string) => (v && Number.isFinite(Date.parse(v)) ? new Date(v).toLocaleString("es") : "");

/** Cola del abogado de Nadakki: lee la solicitud, abre el informe del despacho y firma su revisión.
 * Va en la página del Estudio Genio y no pinta nada para quien no es del equipo de Nadakki: el backend
 * responde 403 a cualquier otro, y esa es la protección real. */
export function ColaRevisionesNadakki({ tenantId }: { tenantId: string }) {
  const q = useColaRevisionesNadakki(tenantId);
  if (q.isPending || soloNadakki(q.error)) return null;
  if (q.error) return <section className={genioCard}><p role="alert" className="text-[#8E2C3A]">{errorRevisionNadakki(q.error)}</p></section>;
  const lista = q.data ?? [];
  return (
    <section aria-labelledby="cola-nadakki" className="space-y-4">
      <div>
        <h2 id="cola-nadakki" className={genioTitulo}>{c.titulo}</h2>
        <p className="mt-1 text-sm text-[#3B4558]">{c.ayuda}</p>
      </div>
      {lista.length === 0 ? (
        <p className={`${genioCard} text-sm text-[#3B4558]`}>{c.vacia}</p>
      ) : (
        lista.map((p) => (
          <Solicitud key={p.solicitud_id} p={p} tenantId={tenantId} busy={q.responder.isPending}
            onResponder={(body) => q.responder.mutateAsync({ p, body })} />
        ))
      )}
    </section>
  );
}

function Solicitud({ p, tenantId, busy, onResponder }: {
  p: PendienteNadakki;
  tenantId: string;
  busy: boolean;
  onResponder: (body: { decision: DecisionNadakki; firmante: string; colegiatura?: string; correcciones: Correccion[]; notas?: string }) => Promise<unknown>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [informe, setInforme] = useState<string | null>(null);
  const [decision, setDecision] = useState<DecisionNadakki>("aprobado");
  const [firmante, setFirmante] = useState("");
  const [colegiatura, setColegiatura] = useState("");
  const [notas, setNotas] = useState("");
  const [correcciones, setCorrecciones] = useState<Correccion[]>([]);
  const [error, setError] = useState("");
  const verInforme = async () => {
    setError("");
    try {
      // El informe vive en el despacho que pidió la revisión: se lee con su tenant.
      setInforme(await (await informeEstudio(p.tenant_id, p.case_id, p.estudio_id, "html")).text());
    } catch (e) {
      setError(errorRevisionNadakki(e));
    }
  };
  const enviar = async () => {
    setError("");
    const limpias = correcciones.map((x) => ({ tema: x.tema, texto: x.texto.trim() })).filter((x) => x.texto);
    if (!firmante.trim()) return setError(m.required);
    if (decision === "con_correcciones" && limpias.length === 0) return setError(c.faltaCorreccion);
    try {
      await onResponder({ decision, firmante: firmante.trim(), colegiatura: colegiatura.trim() || undefined,
        notas: notas.trim() || undefined, correcciones: limpias });
    } catch (e) {
      setError(errorRevisionNadakki(e));
    }
  };
  return (
    <article className={`${genioCard} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{c.despacho}: {p.despacho_nombre || p.despacho}</p>
          <p className="text-xs text-[#6B7385]">{c.pedida}: {fecha(p.solicitada)}</p>
          {p.nota && <p className="mt-2 text-sm text-[#3B4558]">{m.nadakki.pedido}: {p.nota}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={genioButton} onClick={() => void verInforme()}>{c.abrirInforme}</button>
          <button type="button" className={genioPrimary} onClick={() => setAbierto((v) => !v)}>{c.responder}</button>
        </div>
      </div>
      {informe !== null && (
        <iframe title={m.report} sandbox="" referrerPolicy="no-referrer" srcDoc={informe}
          className="min-h-[560px] w-full rounded-xl border border-[#E3E7EE] bg-white" />
      )}
      {abierto && (
        <form noValidate onSubmit={(e) => { e.preventDefault(); void enviar(); }} className="space-y-3 border-t border-[#E3E7EE] pt-4">
          <fieldset disabled={busy} className="space-y-3">
            <label className={genioLabel}>{c.decision}
              <select className={genioField} value={decision} onChange={(e) => setDecision(e.target.value as DecisionNadakki)}>
                {DECISIONES.map((d) => <option key={d} value={d}>{m.nadakki.decisiones[d]}</option>)}
              </select>
            </label>
            <label className={genioLabel}>{c.firmante}<input className={genioField} value={firmante} required onChange={(e) => setFirmante(e.target.value)} /></label>
            <label className={genioLabel}>{m.license}<input className={genioField} value={colegiatura} onChange={(e) => setColegiatura(e.target.value)} /></label>
            <label className={genioLabel}>{m.notes}<textarea className={genioField} value={notas} onChange={(e) => setNotas(e.target.value)} /></label>
            {correcciones.map((x, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-[#E3E7EE] bg-[#F5F7FA] p-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                <label className={genioLabel}>{m.topic}
                  <select className={genioField} value={x.tema} onChange={(e) => setCorrecciones((r) => r.map((y, n) => (n === i ? { ...y, tema: e.target.value } : y)))}>
                    {Object.entries(m.topics).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className={genioLabel}>{m.correction}
                  <textarea className={genioField} value={x.texto} onChange={(e) => setCorrecciones((r) => r.map((y, n) => (n === i ? { ...y, texto: e.target.value } : y)))} />
                </label>
                <button type="button" className={genioButton} onClick={() => setCorrecciones((r) => r.filter((_, n) => n !== i))}>{m.removeCorrection}</button>
              </div>
            ))}
            <button type="button" className={genioButton} onClick={() => setCorrecciones((r) => [...r, { tema: "otro", texto: "" }])}>{m.addCorrection}</button>
            <div><button type="submit" className={genioPrimary}>{busy ? m.busy : c.enviar}</button></div>
          </fieldset>
        </form>
      )}
      {error && <p role="alert" className="text-sm font-medium text-[#8E2C3A]">{error}</p>}
    </article>
  );
}

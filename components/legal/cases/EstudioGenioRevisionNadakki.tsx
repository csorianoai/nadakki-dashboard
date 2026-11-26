"use client";
import { useState } from "react";
import { errorRevisionNadakki, type RevisionesNadakki } from "@/lib/legal/cases/estudio-genio-api";
import m from "@/messages/es/legal-estudio-genio.json";
import { genioButton, genioCard, genioField, genioLabel, genioPrimary, genioTitulo } from "./estudio-genio/estilo";

const n = m.nadakki;
const fecha = (v?: string) => (v && Number.isFinite(Date.parse(v)) ? new Date(v).toLocaleDateString("es") : "");
const fill = (t: string, vars: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
const borde = { aprobado: "border-[#2F6B4F]", con_correcciones: "border-[#B58A3C]", rechazado: "border-[#8E2C3A]" } as const;

/** El despacho pide la revisión de un abogado de Nadakki (Esencial 1, Completo 3) y ve sus respuestas. */
export function EstudioGenioRevisionNadakki({ revisiones, busy, onPedir }: {
  revisiones?: RevisionesNadakki;
  busy: boolean;
  onPedir: (nota?: string) => Promise<unknown>;
}) {
  const [nota, setNota] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");
  const [enviada, setEnviada] = useState(false);
  if (!revisiones || revisiones.incluidas <= 0) return null;
  const { incluidas, disponibles, pendiente, solicitudes } = revisiones;
  const abierta = solicitudes.find((s) => s.estado === "pendiente");
  const hechas = solicitudes.filter((s) => s.estado === "respondida").reverse();
  const pedir = async () => {
    setError("");
    try {
      await onPedir(nota.trim() || undefined);
      setNota("");
      setEnviada(true);
    } catch (e) {
      setError(errorRevisionNadakki(e));
    } finally {
      setConfirmando(false);
    }
  };
  return (
    <section aria-labelledby="genio-nadakki" className={`${genioCard} space-y-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="genio-nadakki" className={genioTitulo}>{n.titulo}</h3>
        <p className="text-sm font-semibold text-[#8A6A2C]">
          {disponibles > 0 ? fill(n.quedan, { n: disponibles, total: incluidas }) : fill(n.agotadas, { total: incluidas })}
        </p>
      </div>
      <p className="text-sm text-[#3B4558]">{n.ayuda}</p>
      {pendiente && abierta ? (
        <p role="status" className="rounded-lg border-l-2 border-[#B58A3C] bg-[#FBF7EE] px-4 py-3 text-sm text-[#3B4558]">
          {fill(n.enCurso, { fecha: fecha(abierta.solicitada) })}
          {abierta.nota && <span className="mt-1 block">{n.pedido}: {abierta.nota}</span>}
        </p>
      ) : disponibles > 0 ? (
        <div className="space-y-3">
          <label className={genioLabel}>{n.nota}
            <textarea rows={3} className={genioField} value={nota} disabled={busy || confirmando} placeholder={n.notaAyuda} onChange={(e) => setNota(e.target.value)} />
          </label>
          {!confirmando ? (
            <button type="button" className={genioPrimary} disabled={busy} onClick={() => { setError(""); setEnviada(false); setConfirmando(true); }}>{n.pedir}</button>
          ) : (
            <div role="group" aria-label={n.confirmar} className="space-y-3 rounded-xl border border-[#B58A3C] bg-[#FBF7EE] p-4">
              <p className="text-sm text-[#3B4558]">{n.confirmar}</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" className={genioPrimary} disabled={busy} onClick={() => void pedir()}>{busy ? m.busy : m.confirm}</button>
                <button type="button" className={genioButton} disabled={busy} onClick={() => setConfirmando(false)}>{m.cancel}</button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {enviada && <p role="status" className="text-sm font-medium text-[#2F6B4F]">{n.enviada}</p>}
      {error && <p role="alert" className="text-sm font-medium text-[#8E2C3A]">{error}</p>}
      {hechas.length > 0 && (
        <div className="space-y-3 border-t border-[#E3E7EE] pt-4">
          <h4 className="font-semibold">{n.respuestas}</h4>
          {hechas.map((s) => (
            <div key={s.solicitud_id} className={`space-y-1 border-l-2 pl-4 text-sm ${borde[s.decision ?? "aprobado"]}`}>
              <p className="font-semibold">
                {n.decisiones[s.decision ?? "aprobado"]} · {s.firmante}
                {s.colegiatura ? ` · ${m.license} ${s.colegiatura}` : ""} · {fecha(s.respondida)}
              </p>
              {s.nota && <p className="text-[#6B7385]">{n.pedido}: {s.nota}</p>}
              {s.notas && <p>{s.notas}</p>}
              {(s.correcciones?.length ?? 0) > 0 && (
                <ul className="list-disc pl-5">
                  {s.correcciones!.map((c, i) => <li key={i}>{m.topics[c.tema as keyof typeof m.topics] ?? c.tema}: {c.texto}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

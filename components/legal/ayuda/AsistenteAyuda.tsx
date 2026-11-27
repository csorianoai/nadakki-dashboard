"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, Send, X } from "lucide-react";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import {
  PANTALLAS, leerEstado, leerPrimerosPasos, preguntar,
  type EstadoAyuda, type PrimerosPasos, type RespuestaAyuda,
} from "@/lib/legal/ayuda-api";
import m from "@/messages/es/legal-ayuda.json";
import { TextoAyuda } from "@/components/legal/ayuda/TextoAyuda";

type Mensaje = { de: "usuario" | "asistente"; texto: string; r?: RespuestaAyuda; error?: boolean };

const fmt = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/**
 * Asistente de ayuda de Legal (27-nov-2026). Responde CÓMO SE USA el core con el nivel de la membresía: guía con IA
 * (Esencial, Profesional) o agente con la guía completa y el avance del despacho (Premium, Ilimitado). Cuando la IA
 * del mes se agota responde la base de conocimiento; para el usuario es el mismo asistente.
 */
export function AsistenteAyuda({ tenantId: tenantProp }: { tenantId?: string | null }) {
  const { effectiveTenantId } = useLegalEffectiveTenantId();
  const tenantId = (tenantProp ?? effectiveTenantId) || "";
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<EstadoAyuda | null>(null);
  const [pasos, setPasos] = useState<PrimerosPasos | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const fin = useRef<HTMLDivElement>(null);
  const caja = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!abierto || !tenantId) return;
    let vivo = true;
    leerEstado(tenantId).then((e) => vivo && setEstado(e)).catch(() => undefined);
    leerPrimerosPasos().then((p) => vivo && setPasos(p));
    caja.current?.focus();
    return () => { vivo = false; };
  }, [abierto, tenantId]);

  useEffect(() => { fin.current?.scrollIntoView?.({ block: "end" }); }, [mensajes, ocupado]);

  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [abierto]);

  async function enviar(pregunta: string) {
    const q = pregunta.trim();
    if (!q || ocupado || !tenantId) return;
    setTexto("");
    setMensajes((ms) => [...ms, { de: "usuario", texto: q }]);
    setOcupado(true);
    try {
      const r = await preguntar(tenantId, q);
      setMensajes((ms) => [...ms, { de: "asistente", texto: r.respuesta, r }]);
    } catch {
      setMensajes((ms) => [...ms, { de: "asistente", texto: m.error, error: true }]);
    } finally {
      setOcupado(false);
    }
  }

  if (!tenantId) return null;
  const agente = estado?.nivel === "agente";
  const siguiente = pasos?.siguiente;

  return (
    <>
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label={m.abrirAria}
          data-testid="legal-ayuda-abrir"
          className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-indigo-700 px-5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
        >
          <CircleHelp className="h-5 w-5" aria-hidden />
          {m.abrir}
        </button>
      )}
      {abierto && (
        <section
          role="dialog"
          aria-label={m.titulo}
          data-testid="legal-ayuda"
          className="fixed bottom-5 right-5 z-40 flex h-[min(640px,calc(100vh-6rem))] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
        >
          <header className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">{m.titulo}</h2>
              <p className="text-xs text-slate-600">{agente ? m.subtituloAgente : m.subtituloGuia}</p>
            </div>
            <button type="button" onClick={() => setAbierto(false)} aria-label={m.cerrar}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          {pasos && (
            <div className="border-b border-slate-200 px-4 py-2 text-xs" data-testid="legal-ayuda-pasos">
              {pasos.completados >= pasos.total ? (
                <span className="font-medium text-emerald-700">{m.pasosListos}</span>
              ) : (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium">{fmt(m.pasos, { hechos: pasos.completados, total: pasos.total })}</span>
                  <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200" aria-hidden>
                    <span className="block h-full bg-indigo-600" style={{ width: `${(100 * pasos.completados) / Math.max(1, pasos.total)}%` }} />
                  </span>
                  {siguiente && (
                    <span className="w-full text-slate-700">
                      {m.siguiente}:{" "}
                      {siguiente.enlace && siguiente.enlace in PANTALLAS && siguiente.enlace !== pathname ? (
                        <Link href={siguiente.enlace} className="font-medium text-indigo-700 underline">{siguiente.paso}</Link>
                      ) : siguiente.paso}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm" aria-live="polite">
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-slate-800">{m.bienvenida}</p>
            {mensajes.length === 0 && estado?.sugerencias?.length ? (
              <div className="flex flex-wrap gap-2">
                {estado.sugerencias.map((s) => (
                  <button key={s} type="button" onClick={() => enviar(s)}
                    className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-left text-xs text-indigo-800 hover:bg-indigo-50">
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            {mensajes.map((x, i) => (
              <div key={i} className={x.de === "usuario" ? "flex justify-end" : ""}>
                <div className={x.de === "usuario"
                  ? "max-w-[85%] rounded-xl bg-indigo-700 px-3 py-2 text-white"
                  : `max-w-[95%] whitespace-pre-line rounded-xl px-3 py-2 ${x.error ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-800"}`}>
                  {x.de === "asistente" ? <TextoAyuda texto={x.texto} /> : x.texto}
                  {x.r?.enlaces?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {x.r.enlaces.map((e) => (
                        <Link key={e} href={e} onClick={() => setAbierto(e === pathname)}
                          className="rounded-md bg-white px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">
                          {fmt(m.ir, { pantalla: PANTALLAS[e] })}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {x.r?.relacionadas?.length ? (
                    <div className="mt-2">
                      <p className="text-xs text-slate-500">{m.relacionadas}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {x.r.relacionadas.map((q) => (
                          <button key={q} type="button" onClick={() => enviar(q)}
                            className="rounded-full bg-white px-2 py-0.5 text-left text-xs text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {ocupado && <p className="text-xs text-slate-500">{m.pensando}</p>}
            <div ref={fin} />
          </div>

          <form className="border-t border-slate-200 p-3" onSubmit={(e) => { e.preventDefault(); void enviar(texto); }}>
            <div className="flex items-end gap-2">
              <label className="sr-only" htmlFor="legal-ayuda-pregunta">{m.placeholder}</label>
              <textarea
                id="legal-ayuda-pregunta"
                ref={caja}
                rows={2}
                maxLength={1000}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(texto); }
                }}
                placeholder={m.placeholder}
                className="min-h-[2.5rem] flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button type="submit" disabled={ocupado || !texto.trim()} aria-label={m.enviar}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-700 text-white hover:bg-indigo-800 disabled:opacity-40">
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{m.aviso}</p>
          </form>
        </section>
      )}
    </>
  );
}

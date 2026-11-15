"use client";

import Link from "next/link";
import { useState, type KeyboardEvent, type ReactNode } from "react";

import { enlaceSeguro, enviarMensaje } from "@/lib/agents/contable/asistente-client";

const SUGERIDAS = ["Como cargo una reparacion?", "Donde registro una compra?", "Como doy de alta un contacto?"];
const NO_DISPONIBLE = "El asistente todavia no esta disponible";

type Turno = { rol: "yo" | "asistente"; texto: string; links?: string[] };

/** Texto como texto; solo los tokens de la lista blanca local se pintan como enlace interno. */
function pintar(texto: string, links: string[] = []): ReactNode[] {
  const nodos: ReactNode[] = [];
  const usados = new Set<string>();
  texto.split(/(\s+)/).forEach((tok, i) => {
    const m = /^([\s\S]*?)([.,;:!?)]*)$/.exec(tok);
    const nucleo = m ? m[1] : tok;
    const cola = m ? m[2] : "";
    const href = nucleo ? enlaceSeguro(nucleo) : null;
    if (href) {
      usados.add(href);
      nodos.push(<Link key={i} href={href} className="underline text-blue-700 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-700">{href}</Link>, cola);
    } else nodos.push(tok);
  });
  for (const l of links) {
    const href = enlaceSeguro(l);
    if (href && !usados.has(href)) {
      usados.add(href);
      nodos.push(<div key={`l-${href}`}><Link href={href} className="underline text-blue-700 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-700">{href}</Link></div>);
    }
  }
  return nodos;
}

export function AsistenteContable() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [ultima, setUltima] = useState("");

  async function enviar(mensaje: string, repetir = false) {
    const m = mensaje.trim();
    if (!m || cargando) return;
    setCargando(true);
    setFallo(false);
    setUltima(m);
    if (!repetir) setTurnos((t) => [...t, { rol: "yo", texto: m }]);
    setTexto("");
    const r = await enviarMensaje(m);
    setCargando(false);
    if (r.ok) setTurnos((t) => [...t, { rol: "asistente", texto: r.data.response, links: r.data.links }]);
    else setFallo(true);
  }

  const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void enviar(texto);
    }
  };

  return (
    <section aria-label="Asistente contable" className="flex flex-col gap-3 rounded border border-gray-300 bg-white p-4 text-gray-900">
      <h2 className="text-lg font-semibold">Asistente contable</h2>
      <p className="text-sm text-gray-700">Solo te guio a la pantalla correcta: no creo, edito ni borro nada.</p>
      <div className="flex flex-wrap gap-2">
        {SUGERIDAS.map((q) => (
          <button key={q} type="button" onClick={() => void enviar(q)} disabled={cargando}
            className="rounded border border-gray-500 px-2 py-1 text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-700">{q}</button>
        ))}
      </div>
      <div aria-live="polite" role="log" className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {turnos.map((t, i) => (
          <p key={i} className={t.rol === "yo" ? "self-end rounded bg-blue-50 px-2 py-1" : "self-start rounded bg-gray-100 px-2 py-1"}>
            {t.rol === "yo" ? t.texto : pintar(t.texto, t.links)}
          </p>
        ))}
        {cargando && <p className="text-sm text-gray-700">Escribiendo...</p>}
        {fallo && (
          <p role="alert" className="text-sm text-red-800">
            {NO_DISPONIBLE}.{" "}
            <button type="button" onClick={() => void enviar(ultima, true)}
              className="underline focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-700">Reintentar</button>
          </p>
        )}
      </div>
      <textarea aria-label="Escribe tu pregunta" value={texto} maxLength={1000} rows={2}
        onChange={(e) => setTexto(e.target.value)} onKeyDown={alTeclear}
        className="rounded border border-gray-500 p-2 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-700" />
      <button type="button" onClick={() => void enviar(texto)} disabled={cargando || !texto.trim()}
        className="self-end rounded bg-blue-800 px-3 py-1 text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-700">Preguntar</button>
    </section>
  );
}

export default AsistenteContable;

"use client";

import { useEffect, useState } from "react";
import { DccCard } from "@/components/dcc/DccCard";
import { DccThemeRoot } from "@/components/dcc/DccThemeRoot";
import { consultarAcceso, modoDemo, panelEncendido } from "@/lib/realtor/acceso";
import {
  DATOS_VACIOS, altaDemo, enviarAlta, leerPerfil, validar,
  type Datos, type Enviar, type Errores, type Perfil, type Resultado,
} from "@/lib/realtor/alta";
import { textos, type Idioma } from "@/lib/realtor/textos";

const CAMPO = "mt-1 block min-h-[44px] w-full rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-3 text-[var(--dcc-fg)]";
const BOTON = "min-h-[44px] rounded-lg px-4 font-medium disabled:opacity-50";

export type AltaProps = {
  /** Inyectables para pruebas. */
  enviar?: Enviar;
  demo?: boolean;
  encendido?: boolean;
};

export function AltaAsistente({ enviar, demo = modoDemo(), encendido = panelEncendido() }: AltaProps) {
  const [acceso, setAcceso] = useState(false);
  const [idioma, setIdioma] = useState<Idioma>("es");
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState<Datos>(DATOS_VACIOS);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [falla, setFalla] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [intento] = useState(() => `alta-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
  const t = textos(idioma);

  useEffect(() => {
    if (!encendido) return;
    let vivo = true;
    (async () => {
      const ok = await consultarAcceso(enviar);
      if (!vivo || !ok) return;
      setAcceso(true);
      if (demo) return;
      try {
        const p = await leerPerfil(enviar);
        if (vivo) setPerfil(p);
      } catch {
        if (vivo) setFalla(true);
      }
    })();
    return () => { vivo = false; };
  }, [encendido, enviar, demo]);

  // Fail-closed: sin interruptor o sin 200 de acceso no se pinta nada.
  if (!encendido || !acceso) return null;

  const cambiar = (parche: Partial<Datos>) => setDatos((d) => ({ ...d, ...parche }));
  const pasos = t.pasos.length;

  async function terminar() {
    const e = validar(datos);
    setErrores(e);
    if (Object.keys(e).length > 0) {
      setPaso(e.licencia || e.nombre ? 0 : e.razonSocial ? 1 : 2);
      return;
    }
    setFalla(false);
    if (demo) { setResultado(altaDemo()); setPaso(3); return; }
    if (!perfil) { setFalla(true); return; }
    setOcupado(true);
    try {
      setResultado(await enviarAlta({ ...datos, idioma }, perfil, intento, enviar));
      setPaso(3);
    } catch {
      setFalla(true);
    } finally {
      setOcupado(false);
    }
  }

  const campo = (id: string, etiqueta: string, valor: string, set: (v: string) => void, malo?: boolean) => (
    <div className="mb-3">
      <label htmlFor={id} className="text-sm font-medium text-[var(--dcc-fg)]">{etiqueta}</label>
      <input id={id} className={CAMPO} value={valor} onChange={(ev) => set(ev.target.value)} aria-invalid={malo || undefined} aria-describedby={malo ? `${id}-e` : undefined} />
      {malo ? <p id={`${id}-e`} role="alert" className="mt-1 text-sm text-red-700">{t.requerido}</p> : null}
    </div>
  );

  return (
    <DccThemeRoot theme="light">
      <main data-testid="realtor-alta" lang={idioma} className="mx-auto max-w-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-[var(--dcc-fg)]">{t.titulo}</h1>
          <div className="flex items-center gap-2">
            {demo ? <span data-testid="badge-demo" className="rounded-full border border-[var(--dcc-border-strong)] px-3 py-1 text-xs font-semibold">{t.demo}</span> : null}
            <button type="button" className={`${BOTON} border border-[var(--dcc-border-strong)]`} aria-label="Idioma / Language" onClick={() => setIdioma(idioma === "es" ? "en" : "es")}>
              {idioma === "es" ? "EN" : "ES"}
            </button>
          </div>
        </div>
        {demo ? <p className="mt-2 text-sm text-[var(--dcc-fg-muted)]">{t.demoNota}</p> : null}
        <p className="mt-3 text-sm text-[var(--dcc-fg-muted)]" aria-live="polite">
          {t.paso} {paso + 1} {t.de} {pasos}: {t.pasos[paso]}
        </p>
        {falla ? <p role="alert" data-testid="alta-error" className="mt-3 rounded-lg border border-red-300 p-3 text-sm text-red-800">{t.errorGeneral}</p> : null}

        <div className="mt-4">
          {paso === 0 && (
            <DccCard titulo={t.pasos[0]}>
              {campo("licencia", t.licencia, datos.licencia, (v) => cambiar({ licencia: v }), errores.licencia)}
              {campo("nombre", t.nombre, datos.nombre, (v) => cambiar({ nombre: v }), errores.nombre)}
            </DccCard>
          )}
          {paso === 1 && (
            <DccCard titulo={t.pasos[1]}>
              <label className="mb-3 flex min-h-[44px] items-center gap-2 text-sm">
                <input type="checkbox" checked={datos.broker.usar} onChange={(ev) => cambiar({ broker: { ...datos.broker, usar: ev.target.checked } })} />
                {t.usarBroker}
              </label>
              {datos.broker.usar && (
                <>
                  {campo("razon", t.razonSocial, datos.broker.razonSocial, (v) => cambiar({ broker: { ...datos.broker, razonSocial: v } }), errores.razonSocial)}
                  {campo("broker", t.nombreBroker, datos.broker.nombre, (v) => cambiar({ broker: { ...datos.broker, nombre: v } }), errores.razonSocial)}
                </>
              )}
            </DccCard>
          )}
          {paso === 2 && (
            <DccCard titulo={t.pasos[2]}>
              {campo("marca", t.marcaNombre, datos.marca.nombre, (v) => cambiar({ marca: { ...datos.marca, nombre: v } }), errores.marcaNombre)}
              {campo("slug", t.slug, datos.marca.slug, (v) => cambiar({ marca: { ...datos.marca, slug: v } }), errores.slug)}
              {campo("frase", t.frase, datos.marca.frase, (v) => cambiar({ marca: { ...datos.marca, frase: v } }))}
            </DccCard>
          )}
          {paso === 3 && (
            <DccCard titulo={t.agendaTitulo}>
              <p data-testid="agenda-unavailable" className="text-sm"><strong>{t.unavailable}</strong>. {t.agendaNota}</p>
              {resultado ? (
                <ul className="mt-3 text-sm" aria-label={t.pendientes}>
                  {resultado.revisiones.map((r) => (
                    <li key={r.check}>{t.revisiones[r.check] ?? t.otraRevision}: {r.passed ? t.listo : t.pendiente}</li>
                  ))}
                </ul>
              ) : null}
            </DccCard>
          )}
        </div>

        {paso < 3 && (
          <div className="mt-4 flex gap-2">
            {paso > 0 && <button type="button" className={`${BOTON} border border-[var(--dcc-border-strong)]`} onClick={() => setPaso(paso - 1)}>{t.atras}</button>}
            {paso < 2 ? (
              <button type="button" className={`${BOTON} bg-[var(--dcc-navy)] text-[var(--dcc-on-navy)]`} onClick={() => setPaso(paso + 1)}>{t.siguiente}</button>
            ) : (
              <button type="button" disabled={ocupado} className={`${BOTON} bg-[var(--dcc-navy)] text-[var(--dcc-on-navy)]`} onClick={terminar}>{ocupado ? t.enviando : t.enviar}</button>
            )}
          </div>
        )}
      </main>
    </DccThemeRoot>
  );
}

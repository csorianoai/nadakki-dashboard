"use client";

import { useEffect, useState } from "react";
import { LicenciaVerificar } from "@/components/realtor/LicenciaVerificar";
import { apiFetch } from "@/lib/api/fetch-client";
import { consultarAcceso } from "@/lib/realtor/acceso";
import { isDemoAllowed, isPanelFlagOn } from "@/lib/realtor/config";
import {
  BASE_ALTA, DATOS_VACIOS, ErrorAlta, altaDemo, enviarAlta, leerPerfil, mensajeError, validar,
  type Datos, type Enviar, type Errores, type Perfil, type Resultado,
} from "@/lib/realtor/alta";
import { textos, type Idioma } from "@/lib/realtor/textos";
import { FONT_BODY, FONT_DISPLAY, RT } from "@/lib/realtor/tokens";

const SIN_ACCESO = {
  es: "No tienes acceso al alta de agentes en esta cuenta. Pide acceso al propietario o al broker supervisor.",
  en: "You do not have access to agent onboarding on this account. Ask the owner or the supervising broker for access.",
};

const CAMPO: React.CSSProperties = {
  display: "block", width: "100%", minHeight: 44, marginTop: 4, padding: "0 12px", borderRadius: 8,
  border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: FONT_BODY, fontSize: 15,
};
const BOTON: React.CSSProperties = { minHeight: 44, padding: "0 20px", borderRadius: 8, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700 };
const BOTON_LINEA: React.CSSProperties = { ...BOTON, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink };
const BOTON_PRIMARIO: React.CSSProperties = { ...BOTON, border: `1px solid ${RT.ink}`, background: RT.ink, color: RT.white };

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 20 }}>
      <h2 style={{ margin: "0 0 12px", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: RT.ink }}>{titulo}</h2>
      {children}
    </section>
  );
}

export type AltaProps = {
  /** Inyectables para pruebas. */
  enviar?: Enviar;
  demo?: boolean;
  encendido?: boolean;
};

export function AltaAsistente({ enviar, demo = isDemoAllowed(), encendido = isPanelFlagOn() }: AltaProps) {
  const [acceso, setAcceso] = useState<boolean | null>(null);
  const [idioma, setIdioma] = useState<Idioma>("es");
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState<Datos>(DATOS_VACIOS);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [intento] = useState(() => `alta-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
  const t = textos(idioma);

  useEffect(() => {
    if (!encendido) return;
    let vivo = true;
    (async () => {
      const ok = await consultarAcceso(enviar);
      if (!vivo) return;
      setAcceso(ok);
      if (!ok) return;
      if (demo) return;
      try {
        const p = await leerPerfil(enviar);
        if (vivo) setPerfil(p);
      } catch (e) {
        if (vivo) setFalla(mensajeError(e instanceof ErrorAlta ? e.estado : 0, idioma));
      }
    })();
    return () => { vivo = false; };
  }, [encendido, enviar, demo]);

  // Fail-closed: sin interruptor o sin 200 de acceso no se pinta nada.
  if (!encendido || acceso === null) return null;
  if (!acceso) {
    // Sin acceso: aviso visible, nunca pagina en blanco y sin ningun dato.
    return <p role="status" data-testid="alta-sin-acceso" style={{ margin: 24, fontSize: 14, color: RT.muted }}>{idioma === "es" ? SIN_ACCESO.es : SIN_ACCESO.en}</p>;
  }

  const cambiar = (parche: Partial<Datos>) => setDatos((d) => ({ ...d, ...parche }));
  const pasos = t.pasos.length;

  async function terminar() {
    const e = validar(datos, perfil?.kind);   // C-RE-ALTA: la firma solo se exige (y se crea) en kind=brokerage
    setErrores(e);
    if (Object.keys(e).length > 0) {
      setPaso(e.licencia || e.nombre ? 0 : e.razonSocial ? 1 : 2);
      return;
    }
    setFalla(null);
    if (demo) { setResultado(altaDemo()); setPaso(3); return; }
    if (!perfil) { setFalla(t.errorGeneral); return; }
    setOcupado(true);
    try {
      setResultado(await enviarAlta({ ...datos, idioma }, perfil, intento, enviar));
      setPaso(3);
    } catch (e) {
      setFalla(mensajeError(e instanceof ErrorAlta ? e.estado : 0, idioma));
    } finally {
      setOcupado(false);
    }
  }

  /** Tras verificar, se vuelve a pedir el readiness real (nada se marca "listo" en el cliente). */
  async function refrescar() {
    if (!resultado || resultado.demo) return;
    try {
      const res = await (enviar ?? apiFetch)(`${BASE_ALTA}/agents/${encodeURIComponent(resultado.agente_id)}/readiness`, { method: "GET" });
      if (!res.ok) return;
      const r = (await res.json()) as { checks: Resultado["revisiones"] };
      setResultado((x) => (x ? { ...x, revisiones: r.checks } : x));
    } catch { /* se queda el ultimo readiness conocido */ }
  }

  const campo = (id: string, etiqueta: string, valor: string, set: (v: string) => void, malo?: boolean) => (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={id} style={{ fontSize: 14, fontWeight: 600, color: RT.ink }}>{etiqueta}</label>
      <input id={id} style={CAMPO} value={valor} onChange={(ev) => set(ev.target.value)} aria-invalid={malo || undefined} aria-describedby={malo ? `${id}-e` : undefined} />
      {malo ? <p id={`${id}-e`} role="alert" style={{ margin: "4px 0 0", fontSize: 14, color: RT.chipDownText }}>{t.requerido}</p> : null}
    </div>
  );

  return (
      <main data-testid="realtor-alta" lang={idioma} style={{ maxWidth: 760, padding: "28px 40px 40px", color: RT.ink, fontFamily: FONT_BODY }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: 1.15 }}>{t.titulo}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {demo ? <span data-testid="badge-demo" style={{ background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>{t.demo}</span> : null}
            <button type="button" style={BOTON_LINEA} aria-label="Idioma / Language" onClick={() => setIdioma(idioma === "es" ? "en" : "es")}>
              {idioma === "es" ? "EN" : "ES"}
            </button>
          </div>
        </div>
        {demo ? <p style={{ margin: "8px 0 0", fontSize: 14, color: RT.muted }}>{t.demoNota}</p> : null}
        <p style={{ margin: "12px 0 0", fontSize: 14, color: RT.muted }} aria-live="polite">
          {t.paso} {paso + 1} {t.de} {pasos}: {t.pasos[paso]}
        </p>
        {falla ? <p role="alert" data-testid="alta-error" style={{ margin: "12px 0 0", borderRadius: 8, border: `1px solid ${RT.chipDownText}`, background: RT.chipDownBg, color: RT.chipDownText, padding: 12, fontSize: 14 }}>{falla}</p> : null}

        <div style={{ marginTop: 16 }}>
          {paso === 0 && (
            <Tarjeta titulo={t.pasos[0]}>
              {campo("licencia", t.licencia, datos.licencia, (v) => cambiar({ licencia: v }), errores.licencia)}
              {campo("nombre", t.nombre, datos.nombre, (v) => cambiar({ nombre: v }), errores.nombre)}
            </Tarjeta>
          )}
          {paso === 1 && (
            <Tarjeta titulo={t.pasos[1]}>
              {perfil?.kind !== "brokerage" && (
                <p style={{ margin: 0, fontSize: 14, color: RT.muted }} data-testid="alta-sin-firma">{t.sinFirma}</p>
              )}
              {perfil?.kind === "brokerage" && (
                <>
                  {campo("razon", t.razonSocial, datos.broker.razonSocial, (v) => cambiar({ broker: { ...datos.broker, razonSocial: v } }), errores.razonSocial)}
                  {campo("broker", t.nombreBroker, datos.broker.nombre, (v) => cambiar({ broker: { ...datos.broker, nombre: v } }))}
                </>
              )}
            </Tarjeta>
          )}
          {paso === 2 && (
            <Tarjeta titulo={t.pasos[2]}>
              {campo("marca", t.marcaNombre, datos.marca.nombre, (v) => cambiar({ marca: { ...datos.marca, nombre: v } }), errores.marcaNombre)}
              {campo("slug", t.slug, datos.marca.slug, (v) => cambiar({ marca: { ...datos.marca, slug: v } }), errores.slug)}
              {campo("frase", t.frase, datos.marca.frase, (v) => cambiar({ marca: { ...datos.marca, frase: v } }))}
            </Tarjeta>
          )}
          {paso === 3 && (
            <Tarjeta titulo={t.agendaTitulo}>
              <p data-testid="agenda-unavailable" data-quality="UNAVAILABLE" style={{ margin: 0, fontSize: 14 }}><strong>{t.unavailable}</strong>. {t.agendaNota}</p>
              {resultado ? (
                <ul style={{ marginTop: 12, fontSize: 14 }} aria-label={t.pendientes}>
                  {resultado.revisiones.map((r) => (
                    <li key={r.check}>{t.revisiones[r.check] ?? t.otraRevision}: {r.passed ? t.listo : t.pendiente}</li>
                  ))}
                </ul>
              ) : null}
              {resultado && !resultado.demo && resultado.licencia_id && resultado.licencia_estado ? (
                <LicenciaVerificar
                  licenciaId={resultado.licencia_id}
                  estado={resultado.licencia_estado}
                  idioma={idioma}
                  enviar={enviar}
                  alVerificar={refrescar}
                />
              ) : null}
            </Tarjeta>
          )}
        </div>

        {paso < 3 && (
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            {paso > 0 && <button type="button" style={BOTON_LINEA} onClick={() => setPaso(paso - 1)}>{t.atras}</button>}
            {paso < 2 ? (
              <button type="button" style={BOTON_PRIMARIO} onClick={() => setPaso(paso + 1)}>{t.siguiente}</button>
            ) : (
              <button type="button" disabled={ocupado} style={BOTON_PRIMARIO} onClick={terminar}>{ocupado ? t.enviando : t.enviar}</button>
            )}
          </div>
        )}
      </main>
  );
}

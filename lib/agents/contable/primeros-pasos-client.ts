import { apiFetch } from "@/lib/api/fetch-client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { enlaceSeguro, RUTA_CHAT } from "@/lib/agents/contable/asistente-client";
import { EVENTO_PROGRESO } from "@/lib/dealer/pasos-tarea";

/**
 * Bienvenida de onboarding: avance de "primeros pasos" del concesionario.
 * Mismo endpoint del asistente (POST {message}); lee solo `datos` de la herramienta primeros_pasos.
 * Se pide UNA vez por sesion de navegador: el resultado bueno queda en sessionStorage y la
 * peticion en curso (o fallida) en memoria, para no repetirla en cada pantalla.
 *
 * Al instante: cuando una pantalla guarda algo (`avisarProgreso()` emite EVENTO_PROGRESO) se olvida
 * el cache y se vuelve a pedir, con antirrebote para que varias senales seguidas hagan una sola
 * peticion. Tambien se refresca al volver a la pestana si la ultima lectura tiene mas de 60 s.
 */

export type PasoInicial = { paso: string; hecho: boolean; cantidad: number; enlace: string | null };
export type PrimerosPasos = { completados: number; total: number; siguiente: PasoInicial | null; pasos: PasoInicial[] };

export const CLAVE_DATOS = "nadakki.bienvenida.primeros-pasos.v1";
export const CLAVE_CERRADA = "nadakki.bienvenida.cerrada.v1";

export const ANTIRREBOTE_MS = 1000;
export const REFRESCO_AL_VOLVER_MS = 60_000;

let enCurso: Promise<PrimerosPasos | null> | null = null;
/** Cada peticion nueva sube la generacion: una respuesta vieja que llega tarde no pisa a la nueva. */
let generacion = 0;
let ultimaLectura = 0;
let ultimoDato: PrimerosPasos | null = null;

function leerSesion(clave: string): string | null {
  try { return typeof window === "undefined" ? null : window.sessionStorage.getItem(clave); } catch { return null; }
}

function escribirSesion(clave: string, valor: string): void {
  try { if (typeof window !== "undefined") window.sessionStorage.setItem(clave, valor); } catch { /* modo privado o cuota: queda en memoria */ }
}

function paso(x: unknown): PasoInicial | null {
  if (!x || typeof x !== "object") return null;
  const p = x as Record<string, unknown>;
  if (typeof p.paso !== "string" || typeof p.hecho !== "boolean") return null;
  // El enlace solo sale si es interno y de la lista blanca del asistente; si no, se trata como null.
  const enlace = typeof p.enlace === "string" ? enlaceSeguro(p.enlace) : null;
  return { paso: p.paso, hecho: p.hecho, cantidad: typeof p.cantidad === "number" ? p.cantidad : 0, enlace };
}

/** Valida `datos` de la respuesta; cualquier forma inesperada devuelve null (no se muestra nada). */
export function validarDatos(d: unknown): PrimerosPasos | null {
  if (!d || typeof d !== "object") return null;
  const o = d as Record<string, unknown>;
  if (typeof o.completados !== "number" || typeof o.total !== "number" || !Array.isArray(o.pasos)) return null;
  const pasos = o.pasos.map(paso);
  if (pasos.some((p) => p === null)) return null;
  const siguiente = o.siguiente === null || o.siguiente === undefined ? null : paso(o.siguiente);
  if (o.siguiente && !siguiente) return null;
  return { completados: o.completados, total: o.total, siguiente, pasos: pasos as PasoInicial[] };
}

function haySesion(): boolean {
  try { return Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken()); } catch { return false; }
}

function borrarSesion(clave: string): void {
  try { if (typeof window !== "undefined") window.sessionStorage.removeItem(clave); } catch { /* bloqueado: no hay nada guardado */ }
}

async function pedir(gen: number): Promise<PrimerosPasos | null> {
  try {
    const r = await apiFetch(RUTA_CHAT, { method: "POST", body: JSON.stringify({ message: "primeros pasos" }) });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || j.herramienta !== "primeros_pasos") return null;
    const datos = validarDatos(j.datos);
    if (datos && gen === generacion) {
      escribirSesion(CLAVE_DATOS, JSON.stringify(datos));
      ultimoDato = datos;
    }
    return datos;
  } catch {
    return null;
  } finally {
    if (gen === generacion) ultimaLectura = Date.now();
  }
}

function lanzar(): Promise<PrimerosPasos | null> {
  generacion += 1;
  enCurso = pedir(generacion);
  return enCurso;
}

/** Avance de primeros pasos; null si no hay sesion, si el backend falla o si responde sin datos. */
export function obtenerPrimerosPasos(): Promise<PrimerosPasos | null> {
  const guardado = leerSesion(CLAVE_DATOS);
  if (guardado) {
    try {
      const d = validarDatos(JSON.parse(guardado));
      if (d) {
        ultimoDato = ultimoDato ?? d;
        return Promise.resolve(d);
      }
    } catch { /* dato corrupto: se vuelve a pedir */ }
  }
  if (enCurso) return enCurso;
  if (!haySesion()) return Promise.resolve(null);
  return lanzar();
}

/*
 * "Ahora no": se guarda CUANTOS pasos estaban hechos al cerrar. Si un refresco trae mas pasos hechos,
 * la bienvenida se reabre (el usuario avanzo y vale la pena mostrarselo); si el numero es igual o menor,
 * sigue cerrada. Al terminar (6 de 6) se cierra con el total: ya no puede subir, no vuelve a aparecer.
 */
let cerradaEnMemoria: number | null = null;

/** Pasos hechos cuando se cerro, o null si no esta cerrada. Una marca vieja ("1") cuenta como 1. */
export function cerradaCon(): number | null {
  if (cerradaEnMemoria !== null) return cerradaEnMemoria;
  const v = leerSesion(CLAVE_CERRADA);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function bienvenidaCerrada(): boolean {
  return cerradaCon() !== null;
}

export function cerrarBienvenida(completados = 0): void {
  cerradaEnMemoria = completados;
  escribirSesion(CLAVE_CERRADA, String(completados));
}

function reabrirBienvenida(): void {
  cerradaEnMemoria = null;
  borrarSesion(CLAVE_CERRADA);
}

/** Lo que recibe quien escucha: los datos nuevos y cuantos pasos se conocian hechos antes (null: nada). */
export type OyenteProgreso = (datos: PrimerosPasos, antes: number | null) => void;

const oyentes = new Set<OyenteProgreso>();
let temporizador: ReturnType<typeof setTimeout> | null = null;

/** Olvida el cache (sessionStorage y memoria), vuelve a pedir y avisa a quienes escuchan. */
export async function refrescarPrimerosPasos(): Promise<PrimerosPasos | null> {
  if (temporizador) { clearTimeout(temporizador); temporizador = null; }
  borrarSesion(CLAVE_DATOS);
  enCurso = null;
  if (!haySesion()) return null;
  const antes = ultimoDato?.completados ?? cerradaCon();
  const gen = generacion + 1;
  const d = await lanzar();
  // Error o respuesta vieja: no se avisa; quien tenga datos sigue mostrando los ultimos buenos.
  if (!d || gen !== generacion) return d;
  const cerrada = cerradaCon();
  if (cerrada !== null && d.completados > cerrada) reabrirBienvenida();
  oyentes.forEach((o) => { try { o(d, antes); } catch { /* un oyente roto no frena a los demas */ } });
  return d;
}

/** Antirrebote: varias senales dentro de ANTIRREBOTE_MS hacen una sola peticion. */
export function programarRefresco(): void {
  if (temporizador) clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    temporizador = null;
    void refrescarPrimerosPasos();
  }, ANTIRREBOTE_MS);
}

function alProgreso(): void {
  programarRefresco();
}

function alCambiarVisibilidad(): void {
  if (typeof document === "undefined" || document.visibilityState !== "visible") return;
  if (Date.now() - ultimaLectura > REFRESCO_AL_VOLVER_MS) programarRefresco();
}

/** Escucha avances; un solo par de listeners en window/document aunque haya varias bienvenidas montadas. */
export function suscribirPrimerosPasos(oyente: OyenteProgreso): () => void {
  if (typeof window === "undefined") return () => {};
  if (oyentes.size === 0) {
    window.addEventListener(EVENTO_PROGRESO, alProgreso);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
  }
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0) {
      window.removeEventListener(EVENTO_PROGRESO, alProgreso);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    }
  };
}

/** Solo para pruebas: olvida la sesion en memoria. */
export function __reiniciarBienvenida(): void {
  enCurso = null;
  cerradaEnMemoria = null;
  generacion += 1;
  ultimaLectura = 0;
  ultimoDato = null;
  if (temporizador) { clearTimeout(temporizador); temporizador = null; }
}

import { apiFetch } from "@/lib/api/fetch-client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { enlaceSeguro, RUTA_CHAT } from "@/lib/agents/contable/asistente-client";

/**
 * Bienvenida de onboarding: avance de "primeros pasos" del concesionario.
 * Mismo endpoint del asistente (POST {message}); lee solo `datos` de la herramienta primeros_pasos.
 * Se pide UNA vez por sesion de navegador: el resultado bueno queda en sessionStorage y la
 * peticion en curso (o fallida) en memoria, para no repetirla en cada pantalla.
 */

export type PasoInicial = { paso: string; hecho: boolean; cantidad: number; enlace: string | null };
export type PrimerosPasos = { completados: number; total: number; siguiente: PasoInicial | null; pasos: PasoInicial[] };

export const CLAVE_DATOS = "nadakki.bienvenida.primeros-pasos.v1";
export const CLAVE_CERRADA = "nadakki.bienvenida.cerrada.v1";

let enCurso: Promise<PrimerosPasos | null> | null = null;

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

async function pedir(): Promise<PrimerosPasos | null> {
  try {
    const r = await apiFetch(RUTA_CHAT, { method: "POST", body: JSON.stringify({ message: "primeros pasos" }) });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || j.herramienta !== "primeros_pasos") return null;
    const datos = validarDatos(j.datos);
    if (datos) escribirSesion(CLAVE_DATOS, JSON.stringify(datos));
    return datos;
  } catch {
    return null;
  }
}

/** Avance de primeros pasos; null si no hay sesion, si el backend falla o si responde sin datos. */
export function obtenerPrimerosPasos(): Promise<PrimerosPasos | null> {
  const guardado = leerSesion(CLAVE_DATOS);
  if (guardado) {
    try {
      const d = validarDatos(JSON.parse(guardado));
      if (d) return Promise.resolve(d);
    } catch { /* dato corrupto: se vuelve a pedir */ }
  }
  if (enCurso) return enCurso;
  if (!haySesion()) return Promise.resolve(null);
  enCurso = pedir();
  return enCurso;
}

let cerradaEnMemoria = false;

export function bienvenidaCerrada(): boolean {
  return cerradaEnMemoria || leerSesion(CLAVE_CERRADA) === "1";
}

export function cerrarBienvenida(): void {
  cerradaEnMemoria = true;
  escribirSesion(CLAVE_CERRADA, "1");
}

/** Solo para pruebas: olvida la sesion en memoria. */
export function __reiniciarBienvenida(): void {
  enCurso = null;
  cerradaEnMemoria = false;
}

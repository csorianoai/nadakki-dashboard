import { apiFetch } from "@/lib/api/fetch-client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { RUTA_CHAT } from "@/lib/agents/contable/asistente-client";
import { CONFIG_CORES, type ConfigCore } from "@/lib/agents/onboarding/cores";
import { coreDelEvento, EVENTO_PROGRESO, type CoreOnboarding } from "@/lib/agents/onboarding/progreso";

/**
 * Cliente generico de "primeros pasos", uno por core (motor de onboarding, spec B.8).
 * Se pide UNA vez por sesion de navegador: el resultado bueno queda en sessionStorage (con el tenant adentro: otro
 * tenant en la misma pestana no ve el avance del anterior) y la peticion en curso en memoria.
 *
 * Al instante: cuando una pantalla guarda algo (`avisarProgreso()` emite EVENTO_PROGRESO) se olvida el cache y se
 * vuelve a pedir, con antirrebote para que varias senales seguidas hagan una sola peticion. Tambien se refresca al
 * volver a la pestana si la ultima lectura tiene mas de 60 s.
 */

export type PasoInicial = {
  paso: string; hecho: boolean; cantidad: number; enlace: string | null; clave?: string; opcional?: boolean;
};
export type PrimerosPasos = {
  completados: number; total: number; siguiente: PasoInicial | null; pasos: PasoInicial[]; core?: string; titulo?: string;
};
/** Lo que recibe quien escucha: los datos nuevos y cuantos pasos se conocian hechos antes (null: nada). */
export type OyenteProgreso = (datos: PrimerosPasos, antes: number | null) => void;

export const ANTIRREBOTE_MS = 1000;
export const REFRESCO_AL_VOLVER_MS = 60_000;

export const rutaPrimerosPasos = (core: string) => `/api/v1/onboarding/${encodeURIComponent(core)}/primeros-pasos`;

function leerSesion(clave: string): string | null {
  try { return typeof window === "undefined" ? null : window.sessionStorage.getItem(clave); } catch { return null; }
}
function escribirSesion(clave: string, valor: string): void {
  try { if (typeof window !== "undefined") window.sessionStorage.setItem(clave, valor); } catch { /* modo privado o cuota: queda en memoria */ }
}
function borrarSesion(clave: string): void {
  try { if (typeof window !== "undefined") window.sessionStorage.removeItem(clave); } catch { /* bloqueado: no hay nada guardado */ }
}
function haySesion(): boolean {
  try { return Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken()); } catch { return false; }
}

/** Tenant del JWT (claim tenant_id o tid), sin verificar firma: solo separa el cache. "?" si no se puede leer. */
export function tenantActual(): string {
  try {
    const t = tokenStorage.getAccessToken();
    const parte = t?.split(".")[1];
    if (!parte) return "?";
    const p = JSON.parse(atob(parte.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
    const tid = p.tenant_id ?? p.tid;
    return typeof tid === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(tid) ? tid : "?";
  } catch { return "?"; }
}

/** Valida los datos; cualquier forma inesperada devuelve null (no se muestra nada). Enlaces fuera de lista: null. */
export function validarDatos(d: unknown, enlace: (r: string) => string | null = CONFIG_CORES.autos.enlace): PrimerosPasos | null {
  if (!d || typeof d !== "object") return null;
  const o = d as Record<string, unknown>;
  if (typeof o.completados !== "number" || typeof o.total !== "number" || !Array.isArray(o.pasos)) return null;
  const paso = (x: unknown): PasoInicial | null => {
    if (!x || typeof x !== "object") return null;
    const p = x as Record<string, unknown>;
    if (typeof p.paso !== "string" || typeof p.hecho !== "boolean") return null;
    const r: PasoInicial = {
      paso: p.paso, hecho: p.hecho, cantidad: typeof p.cantidad === "number" ? p.cantidad : 0,
      enlace: typeof p.enlace === "string" ? enlace(p.enlace) : null,
    };
    if (typeof p.clave === "string") r.clave = p.clave;
    if (p.opcional === true) r.opcional = true;
    return r;
  };
  const pasos = o.pasos.map(paso);
  if (pasos.some((p) => p === null)) return null;
  const siguiente = o.siguiente === null || o.siguiente === undefined ? null : paso(o.siguiente);
  if (o.siguiente && !siguiente) return null;
  const r: PrimerosPasos = { completados: o.completados, total: o.total, siguiente, pasos: pasos as PasoInicial[] };
  if (typeof o.core === "string") r.core = o.core;
  if (typeof o.titulo === "string" && o.titulo.trim()) r.titulo = o.titulo.trim();
  return r;
}

/** 404 del motor por core no activo (la tarjeta no se muestra), a diferencia de una ruta que no existe. */
export function esCoreNoActivo(cuerpo: unknown): boolean {
  const codigos = (x: unknown): unknown[] =>
    x && typeof x === "object" ? [(x as Record<string, unknown>).error, (x as Record<string, unknown>).code] : [x];
  const o = (cuerpo && typeof cuerpo === "object" ? cuerpo : {}) as Record<string, unknown>;
  return [...codigos(o), ...codigos(o.detail)].includes("CORE_NO_ACTIVO");
}

type Lectura = { datos: PrimerosPasos | null; respaldo: boolean };

export function crearClientePrimerosPasos(cfg: ConfigCore) {
  let enCurso: Promise<PrimerosPasos | null> | null = null;
  let generacion = 0; // cada peticion sube la generacion: una respuesta vieja que llega tarde no pisa a la nueva
  let ultimaLectura = 0;
  let ultimoDato: PrimerosPasos | null = null;
  let tenantDato = "";
  let cerradaEnMemoria: { tenant: string; n: number } | null = null;
  const oyentes = new Set<OyenteProgreso>();
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  async function porChat(): Promise<PrimerosPasos | null> {
    const r = await apiFetch(RUTA_CHAT, { method: "POST", body: JSON.stringify({ message: "primeros pasos" }) });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.herramienta === "primeros_pasos" ? validarDatos(j.datos, cfg.enlace) : null;
  }

  async function porGet(): Promise<Lectura> {
    const r = await apiFetch(rutaPrimerosPasos(cfg.core), { method: "GET" });
    if (r.status === 404) {
      const cuerpo = await r.json().catch(() => null);
      return { datos: null, respaldo: !esCoreNoActivo(cuerpo) };
    }
    if (!r.ok) return { datos: null, respaldo: false };
    const j = await r.json();
    if (j && typeof j.core === "string" && j.core !== cfg.core) return { datos: null, respaldo: false };
    return { datos: validarDatos(j, cfg.enlace), respaldo: false };
  }

  async function leer(): Promise<PrimerosPasos | null> {
    if (cfg.transporte === "chat") return porChat();
    const g = await porGet();
    return g.respaldo && cfg.transporte === "get-con-respaldo" ? porChat() : g.datos;
  }

  async function pedir(gen: number, tenant: string): Promise<PrimerosPasos | null> {
    try {
      const datos = await leer();
      if (datos && gen === generacion) {
        escribirSesion(cfg.claveDatos(tenant), JSON.stringify({ ...datos, _t: tenant }));
        ultimoDato = datos;
        tenantDato = tenant;
      }
      return datos;
    } catch {
      return null;
    } finally {
      if (gen === generacion) ultimaLectura = Date.now();
    }
  }

  function lanzar(tenant: string): Promise<PrimerosPasos | null> {
    generacion += 1;
    enCurso = pedir(generacion, tenant);
    return enCurso;
  }

  /** Si cambio el tenant de la pestana, se olvida lo que habia en memoria. */
  function alinearTenant(tenant: string): void {
    if (tenantDato && tenantDato !== tenant) {
      ultimoDato = null; enCurso = null; generacion += 1;
    }
    tenantDato = tenant;
  }

  /** Avance de primeros pasos; null si no hay sesion, si el backend falla o si responde sin datos. */
  function obtener(): Promise<PrimerosPasos | null> {
    const tenant = tenantActual();
    alinearTenant(tenant);
    const guardado = leerSesion(cfg.claveDatos(tenant));
    if (guardado) {
      try {
        const crudo = JSON.parse(guardado) as Record<string, unknown>;
        const d = crudo && crudo._t === tenant ? validarDatos(crudo, cfg.enlace) : null;
        if (d) {
          ultimoDato = ultimoDato ?? d;
          return Promise.resolve(d);
        }
      } catch { /* dato corrupto: se vuelve a pedir */ }
    }
    if (enCurso) return enCurso;
    if (!haySesion()) return Promise.resolve(null);
    return lanzar(tenant);
  }

  /*
   * "Ahora no": se guarda CUANTOS pasos estaban hechos al cerrar. Si un refresco trae mas pasos hechos, la tarjeta
   * se reabre; si el numero es igual o menor, sigue cerrada. Al terminar se cierra con el total y no vuelve.
   */
  function cerradaCon(): number | null {
    const tenant = tenantActual();
    if (cerradaEnMemoria && cerradaEnMemoria.tenant === tenant) return cerradaEnMemoria.n;
    const v = leerSesion(cfg.claveCerrada(tenant));
    if (v === null) return null;
    const n = Number(v); // una marca vieja ("1") cuenta como 1
    return Number.isFinite(n) ? n : 0;
  }
  const cerrada = (): boolean => cerradaCon() !== null;
  function cerrar(completados = 0): void {
    const tenant = tenantActual();
    cerradaEnMemoria = { tenant, n: completados };
    escribirSesion(cfg.claveCerrada(tenant), String(completados));
  }
  function reabrir(): void {
    cerradaEnMemoria = null;
    borrarSesion(cfg.claveCerrada(tenantActual()));
  }

  /** Olvida el cache (sessionStorage y memoria), vuelve a pedir y avisa a quienes escuchan. */
  async function refrescar(): Promise<PrimerosPasos | null> {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    const tenant = tenantActual();
    alinearTenant(tenant);
    borrarSesion(cfg.claveDatos(tenant));
    enCurso = null;
    if (!haySesion()) return null;
    const antes = ultimoDato?.completados ?? cerradaCon();
    const gen = generacion + 1;
    const d = await lanzar(tenant);
    // Error o respuesta vieja: no se avisa; quien tenga datos sigue mostrando los ultimos buenos.
    if (!d || gen !== generacion) return d;
    const c = cerradaCon();
    if (c !== null && d.completados > c) reabrir();
    oyentes.forEach((o) => { try { o(d, antes); } catch { /* un oyente roto no frena a los demas */ } });
    return d;
  }

  /** Antirrebote: varias senales dentro de ANTIRREBOTE_MS hacen una sola peticion. */
  function programarRefresco(): void {
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(() => { temporizador = null; void refrescar(); }, ANTIRREBOTE_MS);
  }
  function alProgreso(e: Event): void {
    const destino = coreDelEvento((e as CustomEvent).detail);
    if (destino === null || destino === cfg.core) programarRefresco();
  }
  function alCambiarVisibilidad(): void {
    if (typeof document === "undefined" || document.visibilityState !== "visible") return;
    if (Date.now() - ultimaLectura > REFRESCO_AL_VOLVER_MS) programarRefresco();
  }

  /** Escucha avances; un solo par de listeners en window/document aunque haya varias tarjetas montadas. */
  function suscribir(oyente: OyenteProgreso): () => void {
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
  function __reiniciar(): void {
    enCurso = null;
    cerradaEnMemoria = null;
    generacion += 1;
    ultimaLectura = 0;
    ultimoDato = null;
    tenantDato = "";
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
  }

  return { config: cfg, obtener, refrescar, programarRefresco, suscribir, cerradaCon, cerrada, cerrar, __reiniciar };
}

export type ClientePrimerosPasos = ReturnType<typeof crearClientePrimerosPasos>;

const clientes = new Map<CoreOnboarding, ClientePrimerosPasos>();

/** Cliente unico por core en la pestana (mismo cache y mismos oyentes para todas las tarjetas de ese core). */
export function clientePrimerosPasos(core: CoreOnboarding): ClientePrimerosPasos {
  let c = clientes.get(core);
  if (!c) { c = crearClientePrimerosPasos(CONFIG_CORES[core]); clientes.set(core, c); }
  return c;
}

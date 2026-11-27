import { enlaceSeguro as enlaceSeguroAutos } from "@/lib/agents/contable/asistente-client";
import type { CoreOnboarding } from "@/lib/agents/onboarding/progreso";

/**
 * Como se lee el avance de cada core:
 * - "chat": por el chat del asistente contable (POST {message:"primeros pasos"}), el camino de Autos de hoy.
 * - "get": GET /api/v1/onboarding/{core}/primeros-pasos del motor generico.
 * - "get-con-respaldo": intenta el GET; si la RUTA no existe (404 que no es CORE_NO_ACTIVO: backend sin desplegar)
 *   cae al chat. Un 404 CORE_NO_ACTIVO no cae: el core no esta activo y la tarjeta no se muestra.
 */
export type Transporte = "chat" | "get" | "get-con-respaldo";

export type ConfigCore = {
  core: CoreOnboarding;
  transporte: Transporte;
  /** Claves de sessionStorage; el tenant se guarda tambien dentro del dato y se comprueba al leer. */
  claveDatos: (tenant: string) => string;
  claveCerrada: (tenant: string) => string;
  /** Enlace interno permitido para este core, o null. */
  enlace: (ruta: string) => string | null;
  /** Usar el `titulo` que manda el backend en el encabezado (Autos no: su texto queda igual que hoy). */
  tituloDelBackend: boolean;
  subtitulo: string;
  /** Texto tras un siguiente paso sin enlace. */
  pedir: string;
};

const RE_RUTA = /^(\/[A-Za-z0-9_/-]*)(\?[A-Za-z0-9_=&-]*)?$/;

/** Ruta interna con query simple bajo alguno de los prefijos; si no, null. */
export function enlaceBajo(prefijos: readonly string[], ruta: string): string | null {
  const m = RE_RUTA.exec(ruta);
  if (!m) return null;
  return prefijos.some((p) => m[1] === p || m[1].startsWith(`${p}/`)) ? ruta : null;
}

export const CONFIG_CORES: Readonly<Record<CoreOnboarding, ConfigCore>> = {
  autos: {
    core: "autos",
    // Hasta que el GET del motor este desplegado, Autos sigue leyendo por el chat (cero cambio visible).
    // Al desplegarlo, pasar a "get-con-respaldo" (y adaptar los tests que hoy fijan la llamada al chat).
    transporte: "chat",
    // Claves de siempre (los tests y las sesiones abiertas las conocen); el tenant va dentro del dato.
    claveDatos: () => "nadakki.bienvenida.primeros-pasos.v1",
    claveCerrada: () => "nadakki.bienvenida.cerrada.v1",
    enlace: enlaceSeguroAutos,
    tituloDelBackend: false,
    subtitulo: "Te mostramos qué te falta para arrancar con tu concesionario.",
    pedir: "Pedíselo a Nadakki.",
  },
  legal: {
    core: "legal",
    transporte: "get",
    claveDatos: (t) => `nadakki.onboarding.legal.${t}.v2`,
    claveCerrada: (t) => `nadakki.onboarding.legal.${t}.cerrada.v2`,
    enlace: (r) => enlaceBajo(["/legal"], r),
    tituloDelBackend: true,
    subtitulo: "Te mostramos qué te falta para arrancar con tu despacho.",
    pedir: "Pídeselo a Nadakki.",
  },
};

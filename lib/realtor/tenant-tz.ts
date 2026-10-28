import { useEffect, useState } from "react";
import { leerPerfil, type Enviar } from "@/lib/realtor/alta";

/**
 * Zona horaria del tenant (ROP-UX-HORA-TENANT).
 *
 * El backend no expone la zona del tenant: GET /alta/tenant/profile solo trae `jurisdiction_code`. La zona se
 * DEDUCE de ese código con un mapa fijo:
 *   - "US-FL"       → America/New_York. Es la zona de Miami (Eastern). El Panhandle (Florida occidental, al oeste
 *                     del río Apalachicola) está en Central (America/Chicago); el mapa usa la de Miami a propósito.
 *   - "DO", "DO-*"  → America/Santo_Domingo (UTC-4 todo el año, sin horario de verano).
 * Si el perfil trae `timezone` (string IANA válido), gana sobre el mapa: es el hueco para cuando el backend la exponga.
 * Jurisdicción desconocida, perfil ausente (404/503/otro estado), cuerpo ilegible o fallo de red → zona del navegador.
 * Nunca se inventa una zona.
 */
export const ZONA_FL = "America/New_York";
export const ZONA_DO = "America/Santo_Domingo";

export const zonaNavegador = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** ¿Es una zona IANA que Intl acepta? */
export function zonaValida(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Zona de una jurisdicción del contrato; desconocida → null (quien llama cae a la del navegador). */
export function zonaDeJurisdiccion(code: unknown): string | null {
  if (typeof code !== "string") return null;
  const c = code.trim().toUpperCase();
  if (c === "US-FL") return ZONA_FL;
  if (c === "DO" || /^DO-[A-Z0-9]+$/.test(c)) return ZONA_DO;
  return null;
}

/** Zona según el perfil: `timezone` válido primero, luego la jurisdicción; si nada sirve, null. */
export function zonaDelPerfil(perfil: unknown): string | null {
  if (typeof perfil !== "object" || perfil === null) return null;
  const p = perfil as { timezone?: unknown; jurisdiction_code?: unknown };
  return zonaValida(p.timezone) ? p.timezone : zonaDeJurisdiccion(p.jurisdiction_code);
}

/** Lee el perfil (reutiliza leerPerfil de alta.ts) y devuelve la zona; cualquier fallo → zona del navegador. */
export async function leerZonaTenant(enviar?: Enviar): Promise<string> {
  try {
    return zonaDelPerfil(await leerPerfil(enviar)) ?? zonaNavegador();
  } catch {
    return zonaNavegador();
  }
}

/**
 * Zona del tenant para la pantalla. Lee el perfil una vez por montaje y solo con `enabled` (tras un /acceso 200);
 * mientras carga, o si no está habilitado, devuelve la del navegador.
 */
export function useTenantTimeZone(enabled = true): string {
  const [tz, setTz] = useState<string>(zonaNavegador);
  useEffect(() => {
    if (!enabled) return;
    let vivo = true;
    leerZonaTenant().then((z) => { if (vivo) setTz(z); });
    return () => { vivo = false; };
  }, [enabled]);
  return tz;
}

type Partes = { year: number; month: number; day: number; hour: number; minute: number; second: number };

/** Fecha y hora de pared de `d` en la zona `tz` (mes 1–12, hora 0–23). */
export function partesEn(d: Date, tz: string): Partes {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(d).map((x) => [x.type, x.value]));
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour % 24, minute: +p.minute, second: +p.second };
}

/** Hora (0–23) de `d` en la zona `tz`. */
export const horaEn = (d: Date, tz: string): number => partesEn(d, tz).hour;

/**
 * La hora de pared de `tz` como Date local del navegador (mismos año, mes, día, hora y minuto). Sirve para reutilizar
 * los cálculos de semana de smart-calendar/week.ts, que leen getters locales. Límite: si esa hora de pared no existe
 * en la zona del navegador (su salto de horario de verano), JavaScript la corre una hora.
 */
export function relojEn(d: Date, tz: string): Date {
  const p = partesEn(d, tz);
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, d.getMilliseconds());
}

/** "HH:MM" de `d` en la zona `tz` (directo de Intl, sin pasar por la zona del navegador). */
export function hhmmEn(d: Date, tz: string): string {
  const p = partesEn(d, tz);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

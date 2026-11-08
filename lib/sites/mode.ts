/** Interruptores de Sites. Fail-closed: solo el valor exacto "1" enciende. */
export type DataMode = "live" | "demo" | "unavailable";

type Env = Record<string, string | undefined>;

/** Next solo sustituye en el cliente los accesos literales process.env.NEXT_PUBLIC_X; no usar alias. */
function buildEnv(): Env {
  return {
    NEXT_PUBLIC_SITES_PANEL: process.env.NEXT_PUBLIC_SITES_PANEL,
    NEXT_PUBLIC_SITES_ALLOW_DEMO: process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO,
  };
}

/** Panel "Mi web" encendido (un solo interruptor para todas las pantallas). */
export function panelEncendido(env: Env = buildEnv()): boolean {
  return env.NEXT_PUBLIC_SITES_PANEL === "1";
}

/** Datos DEMO permitidos (siempre con badge-demo visible). */
export function demoPermitido(env: Env = buildEnv()): boolean {
  return env.NEXT_PUBLIC_SITES_ALLOW_DEMO === "1";
}

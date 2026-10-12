/** Ruta del interruptor del backend. Sin 200, el panel no se muestra. */
export const ACCESS_PATH = "/api/v1/realestate/acceso";

type Env = Record<string, string | undefined>;

/** Next solo sustituye en el cliente las referencias literales process.env.NEXT_PUBLIC_X; no usar alias. */
function buildEnv(): Env {
  return {
    NEXT_PUBLIC_REALTOR_PANEL: process.env.NEXT_PUBLIC_REALTOR_PANEL,
    NEXT_PUBLIC_REALTOR_ALLOW_DEMO: process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO,
  };
}

/** Interruptor único de las pantallas Realtor: apagado salvo el valor exacto "1". */
export function isPanelFlagOn(env: Env = buildEnv()): boolean {
  return env.NEXT_PUBLIC_REALTOR_PANEL === "1";
}

/**
 * DEMO solo con opt-in explícito ("1" exacto). Modo construcción (MC2 de REALTOR_DECISION_LOG): se permite
 * fuera de preview porque el panel entero solo se pinta tras un 200 de /acceso, que exige el core real_estate.
 */
export function isDemoAllowed(env: Env = buildEnv()): boolean {
  return env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO === "1";
}

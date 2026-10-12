/** Ruta del interruptor del backend. Sin 200, el panel no se muestra. */
export const ACCESS_PATH = "/api/v1/realestate/acceso";

type Env = Record<string, string | undefined>;

/** Next solo sustituye en el cliente las referencias literales process.env.NEXT_PUBLIC_X; no usar alias. */
function buildEnv(): Env {
  return {
    NEXT_PUBLIC_REALTOR_PANEL: process.env.NEXT_PUBLIC_REALTOR_PANEL,
    NEXT_PUBLIC_REALTOR_ALLOW_DEMO: process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  };
}

/** Interruptor único de todas las pantallas Realtor. Apagado por defecto: solo el valor exacto "1" lo enciende. */
export function isPanelFlagOn(env: Env = buildEnv()): boolean {
  return env.NEXT_PUBLIC_REALTOR_PANEL === "1";
}

const NON_PROD_ENVS = ["local", "development", "preview"];

/** Fail-closed: no productivo solo si NEXT_PUBLIC_APP_ENV lo dice; otro valor o ausencia = producción. */
export function isProductionEnv(env: Env = buildEnv()): boolean {
  return !NON_PROD_ENVS.includes(env.NEXT_PUBLIC_APP_ENV ?? "");
}

/** DEMO solo con opt-in explícito y entorno positivamente no productivo. */
export function isDemoAllowed(env: Env = buildEnv()): boolean {
  return env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO === "1" && !isProductionEnv(env);
}

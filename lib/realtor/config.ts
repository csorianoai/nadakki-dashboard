/** Ruta del interruptor del backend. Sin 200, el panel no se muestra. */
export const ACCESS_PATH = "/api/v1/realestate/acceso";

/** Apagado por defecto: solo el valor exacto "on" lo enciende. */
export function isPanelFlagOn(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR === "on";
}

const NON_PROD_ENVS = ["local", "development", "preview"];

/** Fail-closed: no productivo solo si NEXT_PUBLIC_APP_ENV lo dice; otro valor o ausencia = producción. */
export function isProductionEnv(env: Record<string, string | undefined> = process.env): boolean {
  return !NON_PROD_ENVS.includes(env.NEXT_PUBLIC_APP_ENV ?? "");
}

/** DEMO solo con opt-in explícito y entorno positivamente no productivo. */
export function isDemoAllowed(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO === "1" && !isProductionEnv(env);
}

/** Ruta del interruptor del backend. Sin 200, el panel no se muestra. */
export const ACCESS_PATH = "/api/v1/realestate/acceso";

/** Apagado por defecto: solo el valor exacto "on" lo enciende. */
export function isPanelFlagOn(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR === "on";
}

/** Producción: cualquier señal de producción bloquea los datos DEMO. */
export function isProductionEnv(env: Record<string, string | undefined> = process.env): boolean {
  const vercel = env.NEXT_PUBLIC_VERCEL_ENV;
  const app = env.NEXT_PUBLIC_APP_ENV;
  return vercel === "production" || app === "production";
}

/** DEMO solo con opt-in explícito y nunca en producción. */
export function isDemoAllowed(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO === "1" && !isProductionEnv(env);
}

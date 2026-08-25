/**
 * Resolución ÚNICA del backend. Falla si no hay destino declarado.
 *
 * Por qué existe, medido y no supuesto:
 *
 *   16 ficheros del dashboard traian el host de produccion como valor por
 *   defecto, cada uno con su propia lista de variables de entorno. Medidas, las
 *   listas no coinciden entre sí:
 *
 *     lib/api/auth-v2.ts            NADAKKI_API_URL · API_URL · API_BASE_URL
 *     lib/credit-api.ts             + BACKEND_URL
 *     app/api/v2/[[...path]]        + NEXT_PUBLIC_BACKEND_URL
 *     app/api/health/route.ts       solo BACKEND_URL · API_URL
 *
 *   Consecuencia observada en runtime, no hipotética: se levantó el servidor de
 *   desarrollo con `BACKEND_URL` apuntando a staging, el catch-all no lee esa
 *   variable, y el login del navegador salio al host de produccion. Lo
 *   único que impidió escribir en producción fue que ese login fallaba por otro
 *   motivo. La CSP de next.config.js:143 permite ese origen, así que el
 *   navegador no lo bloqueaba.
 *
 * La regla: un destino sin declarar es un error de configuración, no una
 * invitación a usar producción. `resolveBackendUrl()` lanza. Un fallo ruidoso
 * al arrancar cuesta un minuto; un default silencioso costó tres intentos de
 * apuntar a staging creyendo haberlo hecho.
 */

/** Orden de precedencia. Una sola lista para todas las superficies. */
export const BACKEND_URL_ENV_VARS = [
  "BACKEND_URL",
  "NEXT_PUBLIC_BACKEND_URL",
  "NEXT_PUBLIC_NADAKKI_API_URL",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_API_BASE_URL",
] as const;

export class BackendUrlNotConfiguredError extends Error {
  constructor() {
    super(
      "No hay backend declarado. Definí una de: " +
        BACKEND_URL_ENV_VARS.join(", ") +
        ". No se elige un destino por defecto: apuntar a producción sin " +
        "declararlo es cómo se escriben datos reales desde un entorno de prueba."
    );
    this.name = "BackendUrlNotConfiguredError";
  }
}

/**
 * El backend declarado, sin barra final.
 * @throws BackendUrlNotConfiguredError si ninguna variable está definida.
 */
export function resolveBackendUrl(env: NodeJS.ProcessEnv = process.env): string {
  for (const nombre of BACKEND_URL_ENV_VARS) {
    const valor = (env[nombre] || "").trim();
    if (valor) return valor.replace(/\/+$/, "");
  }
  throw new BackendUrlNotConfiguredError();
}

/**
 * Variante que no lanza, para superficies que deben degradar en vez de romper
 * (por ejemplo un health check). Devuelve null, NUNCA producción.
 */
export function resolveBackendUrlOrNull(env: NodeJS.ProcessEnv = process.env): string | null {
  try {
    return resolveBackendUrl(env);
  } catch {
    return null;
  }
}

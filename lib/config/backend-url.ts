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
/**
 * Los candidatos se leen con acceso LITERAL, no con `env[nombre]`.
 *
 * Next solo sustituye `process.env.NEXT_PUBLIC_X` en el bundle del cliente
 * cuando aparece como expresion literal. Un indice calculado no se puede
 * reemplazar en build, asi que en el navegador `process.env` llega vacio y el
 * resolutor lanzaba: la pagina de login dejo de renderizar por completo.
 *
 * El build no lo detecto -EXIT=0, 298 paginas- porque server-side el acceso
 * dinamico funciona. El fallo solo aparece al hidratar en el cliente.
 */
/**
 * Los candidatos se leen con acceso LITERAL. No hay parametro `env` ni indice
 * calculado en NINGUNA rama, a proposito.
 *
 * Next solo sustituye `process.env.NEXT_PUBLIC_X` en el bundle del cliente
 * cuando aparece como expresion literal. Un indice calculado no se puede
 * reemplazar en build, asi que en el navegador `process.env` llegaba vacio y
 * el resolutor lanzaba: la pagina de login dejo de renderizar por completo.
 *
 * El build no lo detecto -EXIT=0, 298 paginas- porque server-side el acceso
 * dinamico funciona. El fallo solo aparece al hidratar en el cliente.
 *
 * Y el test tampoco: le pasaba un `env` explicito, que es justo el caso que
 * nunca falla. Por eso el parametro se elimino en vez de conservarse para
 * comodidad de los tests: los tests ahora ejercitan el mismo camino que el
 * navegador.
 */
function candidatos(): (string | undefined)[] {
  return [
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.NEXT_PUBLIC_NADAKKI_API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ];
}

export function resolveBackendUrl(): string {
  for (const bruto of candidatos()) {
    const valor = (bruto || "").trim();
    if (valor) return valor.replace(/\/+$/, "");
  }
  throw new BackendUrlNotConfiguredError();
}

export function resolveBackendUrlOrNull(): string | null {
  try {
    return resolveBackendUrl();
  } catch {
    return null;
  }
}

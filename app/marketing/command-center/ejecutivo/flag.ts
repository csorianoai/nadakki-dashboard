/**
 * Flag de la pantalla patron "Executive Command Center" (Nadakki Analytics, Fase C).
 *
 * Regla EXACTA (se resuelve en codigo, sin variables de Vercel):
 *   1. VERCEL_ENV === "production"  -> APAGADO, pase lo que pase (incluso con NEXT_PUBLIC_ANALYTICS_DEMO=1).
 *   2. VERCEL_ENV === "preview"     -> ENCENDIDO (vista previa de Vercel para la revision de Cesar).
 *   3. En cualquier otro caso       -> ENCENDIDO solo si NEXT_PUBLIC_ANALYTICS_DEMO === "1" Y NODE_ENV !== "production"
 *                                      (desarrollo local y tests). Un build de produccion fuera de Vercel queda APAGADO.
 *
 * Con el flag APAGADO la ruta responde 404 y no se carga ni se renderiza ningun dato DEMO.
 * Esta funcion solo se evalua en el servidor (page.tsx); el cliente no decide nada.
 */
export interface EntornoFlag {
  VERCEL_ENV?: string;
  NEXT_PUBLIC_ANALYTICS_DEMO?: string;
  NODE_ENV?: string;
}

export function analyticsDemoActivo(env: EntornoFlag = process.env as EntornoFlag): boolean {
  if (env.VERCEL_ENV === "production") return false;
  if (env.VERCEL_ENV === "preview") return true;
  return env.NEXT_PUBLIC_ANALYTICS_DEMO === "1" && env.NODE_ENV !== "production";
}

/**
 * Que pantalla sirve la ruta. La DEMO solo existe donde el flag la permite (vista previa / local); en produccion (y en cualquier
 * build donde el flag este apagado) la ruta sirve SIEMPRE la pantalla real. En vista previa, `?fuente=real` permite revisar la real.
 */
export type FuentePantalla = "demo" | "real";

export function fuenteDePantalla(pedida: string | null | undefined, env: EntornoFlag = process.env as EntornoFlag): FuentePantalla {
  if (!analyticsDemoActivo(env)) return "real";
  return pedida === "real" ? "real" : "demo";
}

import { apiFetch } from "@/lib/api/fetch-client";

export const RUTA_ACCESO = "/api/v1/realestate/acceso";

type Env = Record<string, string | undefined>;

/** Next solo sustituye accesos literales a process.env.NEXT_PUBLIC_*: no pasar process.env entero. */
/** Interruptor del panel: apagado salvo que valga exactamente "1" (fail-closed). */
export function panelEncendido(
  env: Env = { NEXT_PUBLIC_REALTOR_PANEL: process.env.NEXT_PUBLIC_REALTOR_PANEL },
): boolean {
  return env.NEXT_PUBLIC_REALTOR_PANEL === "1";
}

/** DEMO solo fuera de produccion y con su propio interruptor; jamas en produccion. */
export function modoDemo(
  env: Env = { NODE_ENV: process.env.NODE_ENV, NEXT_PUBLIC_REALTOR_DEMO: process.env.NEXT_PUBLIC_REALTOR_DEMO },
): boolean {
  return env.NODE_ENV !== "production" && env.NEXT_PUBLIC_REALTOR_DEMO === "1";
}

/**
 * El panel solo se muestra con un 200 de GET /api/v1/realestate/acceso.
 * Cualquier otra respuesta o error de red es "no". El tenant lo resuelve el
 * backend desde el token: aqui no se envia ninguno.
 */
export async function consultarAcceso(
  fetcher: (ruta: string, init?: RequestInit) => Promise<Response> = apiFetch,
): Promise<boolean> {
  try {
    const res = await fetcher(RUTA_ACCESO, { method: "GET", cache: "no-store" });
    return res.status === 200;
  } catch {
    return false;
  }
}

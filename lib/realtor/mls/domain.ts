/** Dominios autorizados para mostrar listados MLS IDX (contrato MIAMI). */
const ALLOWED_HOSTS = new Set(["baylara.com", "www.baylara.com"]);

/**
 * Devuelve true solo para baylara.com y www.baylara.com.
 * Elimina el puerto antes de comparar (para pruebas locales que añadan :port).
 */
export function isBaylaraHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return ALLOWED_HOSTS.has(host.toLowerCase().replace(/:\d+$/, ""));
}

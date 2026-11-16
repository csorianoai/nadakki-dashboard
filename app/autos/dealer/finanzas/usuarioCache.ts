import { decodeJWT } from "@/lib/auth/jwt-decode";
import { tokenStorage } from "@/lib/auth/token-storage";

/** Identidad para claves de cache de datos con permisos por rol: sin identidad, un marcador que no coincide con nadie. */
export function useUsuarioCache(): string {
  const p = decodeJWT(tokenStorage.getAccessToken() ?? "") as { sub?: string; user_id?: string } | null;
  return p?.sub ?? p?.user_id ?? "sin-identidad";
}

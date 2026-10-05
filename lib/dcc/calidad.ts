/**
 * Sello de calidad del DCC. Escala firmada en N6.0 (VERIFICADA / PARCIAL /
 * NO_DISPONIBLE) mas BLOQUEADO cuando el backend deniega la capability. El
 * frontend no decide la calidad: traduce la respuesta o el entitlement.
 */

export type Calidad =
  | { estado: "verificado" }
  | { estado: "parcial"; cubiertos: number | null; total: number | null; motivo: string | null }
  | { estado: "bloqueado"; reasonCode: string | null }
  | { estado: "no_disponible"; motivo: string | null };

export const NO_DISPONIBLE: Calidad = { estado: "no_disponible", motivo: null };

function entero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 0 ? valor : null;
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

/** Calidad tal como la mande el backend (plana o objeto); forma desconocida = NO_DISPONIBLE. */
export function calidadDesdeBackend(raw: unknown): Calidad {
  const rec = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const estado = (texto(rec ? rec.estado ?? rec.status : raw) ?? "").toUpperCase();
  const motivo = rec ? texto(rec.motivo ?? rec.reason) : null;
  switch (estado) {
    case "VERIFICADA":
    case "VERIFICADO":
    case "VERIFIED":
      return { estado: "verificado" };
    case "PARCIAL":
    case "PARTIAL": {
      const cubiertos = rec ? entero(rec.cubiertos ?? rec.covered) : null;
      const total = rec ? entero(rec.total) : null;
      const coherente = cubiertos !== null && total !== null && cubiertos <= total;
      return {
        estado: "parcial",
        cubiertos: coherente ? cubiertos : null,
        total: coherente ? total : null,
        motivo,
      };
    }
    default:
      return { estado: "no_disponible", motivo };
  }
}

/** Decision de acceso del backend para una capability. null = aun sin decision. */
export type DecisionAcceso = { allowed: boolean; reason_code: string | null } | null | undefined;

/** Un entitlement denegado manda sobre cualquier dato: la cifra no se pinta. */
export function calidadDesdeEntitlement(decision: DecisionAcceso): Calidad | null {
  if (!decision) return null;
  if (decision.allowed === true) return null;
  return { estado: "bloqueado", reasonCode: decision.reason_code ?? null };
}

/** Texto corto del sello, como en la referencia v3, sin rotulos tecnicos. */
export function rotuloCalidad(calidad: Calidad): string {
  switch (calidad.estado) {
    case "verificado":
      return "verificado";
    case "parcial":
      return calidad.cubiertos !== null && calidad.total !== null
        ? `parcial ${calidad.cubiertos}/${calidad.total}`
        : "parcial";
    case "bloqueado":
      return "bloqueado · requiere entitlement";
    case "no_disponible":
      return "aún no disponible";
  }
}

/** Si la cifra puede mostrarse con este sello. */
export function permiteCifra(calidad: Calidad): boolean {
  return calidad.estado === "verificado" || calidad.estado === "parcial";
}

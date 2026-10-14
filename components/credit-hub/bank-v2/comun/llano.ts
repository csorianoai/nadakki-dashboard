import type { Calidad } from "@/lib/dcc/calidad";

/**
 * Textos del banco v2 para lo que aun no tiene dato. Lo que lee el banco (sello,
 * tooltip y lector de pantalla) es una frase llana; el detalle tecnico
 * (endpoint, campo, flag) va aparte, al bloque plegado "Detalle técnico".
 */
export const PROXIMAMENTE = "Esta cifra estará disponible próximamente.";

/** Una nota para el bloque "Detalle técnico": que cifra y por que falta. */
export type NotaTecnica = { que: string; detalle: string };

/** Sello "Próximamente" con motivo llano (nunca el tecnico). */
export function proximamente(motivo: string = PROXIMAMENTE): Calidad {
  return { estado: "no_disponible", motivo };
}

/**
 * Limite de solicitudes que lee analytics/dashboard. Solo cuando el total
 * informado lo alcanza el ranking y la prediccion son de verdad parciales.
 */
export const LIMITE_ANALITICA = 500;

/** "parcial" solo si el total informado alcanza el limite de lectura; si no, sin sello. */
export function parcialSiLimite(total: number | null | undefined): Calidad | null {
  return typeof total === "number" && total >= LIMITE_ANALITICA
    ? { estado: "parcial", cubiertos: null, total: null, motivo: `Calculado sobre las ${LIMITE_ANALITICA} solicitudes más recientes.` }
    : null;
}

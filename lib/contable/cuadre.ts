/**
 * Veredicto unico de cuadre de un balance (debe vs haber).
 *
 * Se compara en centavos enteros para no depender de la igualdad de floats
 * (0.1 + 0.2 !== 0.3) ni de valores "truthy": un balance sin movimientos
 * (debe = haber = 0) cuadra. Se admite como maximo 1 centavo de diferencia
 * por redondeo, igual que `CONTABLE_TOLERANCE` (0.01).
 *
 * Lo usan /contable/balance-comprobacion y el Centro de Reportes v2 para que
 * ambas pantallas den el mismo veredicto con las mismas cifras.
 */
export const TOLERANCIA_CUADRE_CENTAVOS = 1;

export function aCentavos(valor: number): number {
  return Math.round(valor * 100);
}

/** `null` si alguno de los totales no es un numero finito (no se puede evaluar). */
export function evaluaCuadre(
  totalDebe: number | null | undefined,
  totalHaber: number | null | undefined,
): boolean | null {
  if (typeof totalDebe !== "number" || !Number.isFinite(totalDebe)) return null;
  if (typeof totalHaber !== "number" || !Number.isFinite(totalHaber)) return null;
  return Math.abs(aCentavos(totalDebe) - aCentavos(totalHaber)) <= TOLERANCIA_CUADRE_CENTAVOS;
}

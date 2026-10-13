/**
 * Bank v2 es «el banco» (César, una sola interfaz, PR 1). Las pantallas del
 * panel anterior redirigen a estas en next.config.js (307, temporales) y el
 * login manda aquí a los roles de banco. Ya no hay interruptor.
 */

/** Raiz del panel del banco. */
export const PANEL_BANCO_V2 = "/credit-hub/bank-v2";

/**
 * Pantalla del panel anterior → su pantalla en bank-v2. Solo pares que existen
 * en los dos lados. tests/nav/redirecciones-una-version.test.ts comprueba que
 * next.config.js redirige cada una a este mismo destino.
 */
export const RUTA_V2_POR_RUTA_BANCO: Readonly<Record<string, string>> = {
  "/credit-hub/bank": PANEL_BANCO_V2,
  "/credit-hub/bank/applications": `${PANEL_BANCO_V2}/solicitudes`,
  "/credit-hub/bank/escalations": `${PANEL_BANCO_V2}/escalaciones`,
  "/credit-hub/bank/analytics": `${PANEL_BANCO_V2}/analitica`,
  "/credit-hub/bank/compliance": `${PANEL_BANCO_V2}/cumplimiento`,
  "/credit-hub/bank/audit": `${PANEL_BANCO_V2}/auditoria`,
  "/credit-hub/bank/vehicles": `${PANEL_BANCO_V2}/vehiculos`,
  "/credit/bank/kpis": `${PANEL_BANCO_V2}/kpis`,
  "/credit/pool-filters": `${PANEL_BANCO_V2}/filtros`,
};

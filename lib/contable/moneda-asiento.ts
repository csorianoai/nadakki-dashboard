/**
 * Moneda de un asiento contable. Contrato medido sobre `origin/main` del
 * backend, no inventado.
 *
 *   routers/contable/asientos_router.py:200       currency = payload.get("currency") or ""
 *   routers/contable/asientos_router.py:253-259   resolver_moneda_funcional();
 *                                                 si no hay currency, usa la funcional
 *   routers/contable/asientos_router.py:261-262   resolver_cotizacion(origen=currency,
 *                                                 destino=functional_currency)
 *   services/contable/fx.py:35-39                 _iso3 -> MonedaInvalidaError D4_MONEDA
 *   services/contable/functional_currency.py:29   resolver_moneda_funcional
 *
 * Tres hechos que deciden este modulo:
 *
 *  1. No hay lista cerrada de monedas. El backend solo exige tres letras. El
 *     `"DOP" | "USD"` del frontend era una invencion nuestra, y dejaba a un
 *     tenant argentino sin poder registrar un asiento en ARS.
 *  2. `currency` es OPCIONAL. Omitida, el backend usa la moneda funcional del
 *     tenant. Esa es la via correcta por defecto: el frontend no tiene por que
 *     saber cual es para registrar en ella.
 *  3. La moneda funcional la resuelve `legal_entities.functional_currency` SIN
 *     fallback, y falla cerrado con `FUNCTIONAL_CURRENCY_NOT_CONFIGURED`. Aqui
 *     tampoco se fabrica ninguna.
 */

/** Codigos de error del backend que hablan de moneda, para no reescribirlos. */
export const MONEDA_ERROR_CODES = {
  /** `services/contable/excepciones.py:44` — el tenant no tiene moneda funcional. */
  FUNCTIONAL_CURRENCY_NOT_CONFIGURED: "FUNCTIONAL_CURRENCY_NOT_CONFIGURED",
  /** `services/contable/excepciones.py:40` — currency no es ISO-4217 de 3 letras. */
  D4_MONEDA: "D4_MONEDA",
  /** `services/contable/excepciones.py:30` — falta cotizacion oficial del dia. */
  D1_FX_QUOTE: "D1_FX_QUOTE",
} as const;

export const MONEDA_ERROR_COPY: Record<string, string> = {
  [MONEDA_ERROR_CODES.FUNCTIONAL_CURRENCY_NOT_CONFIGURED]:
    "El tenant no tiene moneda funcional configurada. No se puede registrar un asiento hasta que la entidad legal la declare.",
  [MONEDA_ERROR_CODES.D4_MONEDA]: "La moneda debe ser un código ISO-4217 de tres letras.",
  [MONEDA_ERROR_CODES.D1_FX_QUOTE]:
    "No hay cotización oficial para esa moneda en esa fecha. Cargá la cotización o registrá el asiento en la moneda funcional.",
};

/** Mismo criterio que `_iso3` del backend: tres letras, nada mas. */
export function esIso4217(codigo: string | null | undefined): boolean {
  const valor = codigo?.trim().toUpperCase() ?? "";
  return valor.length === 3 && /^[A-Z]{3}$/.test(valor);
}

export function normalizaIso4217(codigo: string | null | undefined): string | null {
  const valor = codigo?.trim().toUpperCase() ?? "";
  return esIso4217(valor) ? valor : null;
}

/**
 * Decide que `currency` se envia.
 *
 * Vacio => `null`, y el llamador OMITE el campo para que el backend aplique la
 * moneda funcional. Es la unica forma de registrar en la moneda del tenant sin
 * que el frontend tenga que adivinarla.
 */
export function currencyParaEnviar(elegida: string | null | undefined): string | null {
  const valor = elegida?.trim() ?? "";
  if (!valor) return null;
  return normalizaIso4217(valor);
}

export type MonedaAsientoError = { codigo: string; copia: string } | null;

/** Traduce el codigo del backend a algo que el contable entienda. */
export function errorDeMoneda(detalle: unknown): MonedaAsientoError {
  const texto =
    typeof detalle === "string"
      ? detalle
      : detalle && typeof detalle === "object"
        ? JSON.stringify(detalle)
        : "";
  for (const codigo of Object.values(MONEDA_ERROR_CODES)) {
    if (texto.includes(codigo)) return { codigo, copia: MONEDA_ERROR_COPY[codigo] };
  }
  return null;
}

/**
 * Moneda funcional leida de un asiento que ya respondio el backend. Es la unica
 * via publicada hoy: solo `asientos_router` devuelve `functional_currency`, y
 * ningun GET la expone por si sola.
 */
export function monedaFuncionalDe(asiento: { functional_currency?: string | null } | null | undefined): string | null {
  return normalizaIso4217(asiento?.functional_currency);
}

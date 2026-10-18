import { DCC_TOKENS, type DccTokenKey } from "@/lib/dcc/tokens";

/** Tokens DCC del aviso «Acceso no autorizado»: texto sobre superficie propia (contraste AA en claro y oscuro, lib/dcc/tests/contraste.test.ts). */
export const TOKENS_AVISO_ACCESO: { titulo: DccTokenKey; detalle: DccTokenKey; fondo: DccTokenKey } = {
  titulo: "--dcc-fg",
  detalle: "--dcc-fg-muted",
  fondo: "--dcc-surface",
};

/** `var(--token, <valor en tema claro>)`: el fallback evita un aviso sin color si el tema DCC no esta montado. */
export function varDcc(token: DccTokenKey): string {
  return `var(${token}, ${DCC_TOKENS.light[token]})`;
}

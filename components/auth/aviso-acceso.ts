import type { DccTokenKey } from "@/lib/dcc/tokens";

/** Tokens DCC del aviso «Acceso no autorizado»: texto sobre superficie propia (contraste AA en claro y oscuro, lib/dcc/tests/contraste.test.ts). */
export const TOKENS_AVISO_ACCESO: { titulo: DccTokenKey; detalle: DccTokenKey; fondo: DccTokenKey } = {
  titulo: "--dcc-fg",
  detalle: "--dcc-fg-muted",
  fondo: "--dcc-surface",
};

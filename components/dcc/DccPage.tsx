"use client";

import { marcaDesdeBranding, type MarcaDcc } from "@/lib/dcc/marca";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { DccPageMarco, type DccPageProps } from "./DccPageMarco";

export { DccGrid, DccPageMarco } from "./DccPageMarco";

/**
 * Estructura de una pagina del DCC: raiz con tema, cabecera con la marca del
 * tenant y rejilla de tarjetas (ver `DccPageMarco`).
 *
 * `marca` es opcional. Sin ella la pagina lee el branding del dealer, como
 * siempre. Con ella no se llama al hook del dealer, que exige el AuthProvider
 * de `@/lib/auth-context` y lanzaria fuera de su shell. Quien no es dealer
 * puede importar `DccPageMarco` y no cargar este modulo.
 */
export function DccPage({ marca, ...props }: DccPageProps & { marca?: MarcaDcc }) {
  return marca ? <DccPageMarco marca={marca} {...props} /> : <DccPageDealer {...props} />;
}

function DccPageDealer(props: DccPageProps) {
  const branding = useDealerManagementBranding();
  return <DccPageMarco marca={marcaDesdeBranding(branding.data)} {...props} />;
}

/**
 * Rutas del crédito del concesionario dentro de Dealer OS (PR 2 de "una sola interfaz").
 *
 * Las pantallas de crédito del dealer vivían en /credit-hub/dealer/**, bajo el
 * GlobalForgeAppShell, cuyo DealerSuiteGate devuelve a /autos/dealer a todo usuario con
 * asignación de concesionario: el concesionario real no podía pedir crédito. Ahora se
 * pintan en /autos/dealer/credito/**, dentro de DealerShell, con los mismos componentes.
 *
 * Esta es la única fuente de las rutas nuevas. Los pasos del asistente conservan su id
 * interno en inglés (`applicant`, `consent`, ...) y aquí se traducen al segmento de la URL.
 * Las redirecciones 307 de next.config.js reproducen `DEALER_CREDIT_LEGACY_REDIRECTS`; un
 * test compara las dos listas.
 */

export const DEALER_CREDIT_BASE = "/autos/dealer/credito";

export const DEALER_CREDIT_PATHS = {
  inicio: DEALER_CREDIT_BASE,
  solicitudes: `${DEALER_CREDIT_BASE}/solicitudes`,
  nueva: `${DEALER_CREDIT_BASE}/solicitudes/nueva`,
  preaprobacion: `${DEALER_CREDIT_BASE}/preaprobacion`,
  notificaciones: `${DEALER_CREDIT_BASE}/notificaciones`,
  perfil: `${DEALER_CREDIT_BASE}/perfil`,
} as const;

/** Id interno del paso (el de siempre) -> segmento de la URL en Dealer OS. */
export const DEALER_WIZARD_URL_SEGMENTS = {
  applicant: "solicitante",
  "co-borrower": "codeudor",
  vehicle: "vehiculo",
  documents: "documentos",
  consent: "consentimiento",
  review: "revision",
  complete: "completa",
} as const;

export type DealerWizardStepId = keyof typeof DEALER_WIZARD_URL_SEGMENTS;

/** URL de un paso del asistente de nueva solicitud. */
export function dealerCreditWizardHref(step: DealerWizardStepId): string {
  return `${DEALER_CREDIT_PATHS.nueva}/${DEALER_WIZARD_URL_SEGMENTS[step]}`;
}

/** Id interno a partir del último segmento de la URL (acepta el segmento viejo en inglés). */
export function dealerWizardStepIdFromSegment(segment: string): DealerWizardStepId | null {
  for (const [id, seg] of Object.entries(DEALER_WIZARD_URL_SEGMENTS)) {
    if (segment === seg || segment === id) return id as DealerWizardStepId;
  }
  return null;
}

/** true en la pantalla final del asistente (la que no lleva el marco de pasos). */
export function isDealerWizardCompletePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname.endsWith(`/solicitudes/nueva/${DEALER_WIZARD_URL_SEGMENTS.complete}`) ||
    pathname.includes("/applications/new/complete")
  );
}

/** Detalle de una solicitud. */
export function dealerCreditApplicationHref(applicationId: string): string {
  return `${DEALER_CREDIT_PATHS.solicitudes}/${encodeURIComponent(applicationId.trim())}`;
}

/**
 * Rutas viejas -> nuevas, en el orden en que next.config.js las evalúa (la primera que
 * coincide gana). La query se conserva sola: Next.js la pasa al destino.
 */
export const DEALER_CREDIT_LEGACY_REDIRECTS: ReadonlyArray<{ source: string; destination: string }> = [
  { source: "/credit-hub/dealer/simulator", destination: DEALER_CREDIT_PATHS.preaprobacion },
  ...(Object.keys(DEALER_WIZARD_URL_SEGMENTS) as DealerWizardStepId[]).map((step) => ({
    source: `/credit-hub/dealer/applications/new/${step}`,
    destination: dealerCreditWizardHref(step),
  })),
  { source: "/credit-hub/dealer/applications/new", destination: DEALER_CREDIT_PATHS.nueva },
  { source: "/credit-hub/dealer/applications/:applicationId", destination: `${DEALER_CREDIT_PATHS.solicitudes}/:applicationId` },
  { source: "/credit-hub/dealer/applications", destination: DEALER_CREDIT_PATHS.solicitudes },
  { source: "/credit-hub/dealer/preapproval", destination: DEALER_CREDIT_PATHS.preaprobacion },
  { source: "/credit-hub/dealer/notifications", destination: DEALER_CREDIT_PATHS.notificaciones },
  { source: "/credit-hub/dealer/profile", destination: DEALER_CREDIT_PATHS.perfil },
  { source: "/credit-hub/dealer", destination: DEALER_CREDIT_PATHS.inicio },
];

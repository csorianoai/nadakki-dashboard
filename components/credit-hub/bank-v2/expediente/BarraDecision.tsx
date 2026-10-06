"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { useCreditHubActor } from "@/lib/credit-hub/hooks/useCreditHubActor";
import { useBankDecision } from "@/lib/credit-hub/hooks/useBankDecision";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { getOfferCompare } from "@/lib/credit-hub/api/bankExperienceClient";
import { CHApiError } from "@/lib/credit-hub/api/client";
import type { BankReviewPayload } from "@/lib/credit-hub/types/bank-views";
import type { BankReviewApplication } from "@/lib/credit-hub/types/bankDecision";
import { useAuth } from "@/hooks/useAuth";
import { ACCION, MOTIVOS_RECHAZO, bloqueoDecision, errorFormulario, esDuenoDelClaim, justificacion, prestamistas, terminosPorDefecto, type Accion } from "./decision";

const CAMPO = "h-9 w-full rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-2 text-sm";
const TERMINOS = [
  ["approved_amount", "Monto"],
  ["term_months", "Plazo (meses)"],
  ["interest_rate", "Tasa anual %"],
  ["down_payment_required", "Inicial"],
] as const;

function mensajeError(err: unknown): string {
  const texto = err instanceof Error ? err.message : "";
  if (/offer_room_closed/i.test(texto) || (err instanceof CHApiError && /offer_room_closed/i.test(String(err.detail)))) {
    return "La sala de ofertas está cerrada para esta solicitud: ya no se registran decisiones.";
  }
  if (err instanceof CHApiError && err.status === 409) return "Otro analista tiene esta solicitud. No puedes decidirla.";
  return "No pudimos registrar la decisión. Vuelve a intentarlo.";
}

/**
 * Barra de decision fija del expediente v2. Misma condicion para decidir que
 * el detalle actual (rol con create_decision, claim propio y sin decision
 * previa), misma mutacion (useBankDecision: claim + decide), mismos terminos
 * por defecto y mismo criterio de prestamista. Rechazar exige un motivo de
 * la lista, que viaja en la justificacion.
 */
export function BarraDecision({ application }: { application: BankReviewApplication }) {
  const { user } = useAuth();
  const { apiTenantId } = useTenant();
  const { can } = useCreditHubActor();
  const payload = application.application_payload as BankReviewPayload;
  const claim = application.bank_claim ?? payload.bank_claim ?? null;
  const esDueno = esDuenoDelClaim(claim, user?.id);
  const bloqueo = bloqueoDecision({ puedeRol: can("create_decision"), esDueno, yaDecidida: Boolean(payload.bank_decision) });
  const mutacion = useBankDecision(application.application_id);
  const ofertasQ = useQuery({
    queryKey: ["offer-compare", apiTenantId, application.application_id],
    queryFn: () => getOfferCompare({ tenantId: apiTenantId!, applicationId: application.application_id }),
    enabled: !!apiTenantId,
    retry: false,
  });
  const opciones = useMemo(
    () => prestamistas((ofertasQ.data?.offers_detail ?? []).map((o) => o.lender_code), payload.bank_claims_by_lender),
    [ofertasQ.data, payload.bank_claims_by_lender],
  );
  const [accion, setAccion] = useState<Accion | null>(null);
  const [texto, setTexto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [prestamista, setPrestamista] = useState("");
  const [terminos, setTerminos] = useState(() => terminosPorDefecto(payload));
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);
  const codigo = opciones.length === 1 ? opciones[0] : prestamista;

  const confirmar = async () => {
    if (!accion) return;
    const problema = errorFormulario(accion, texto, motivo, opciones.length > 1 && !prestamista);
    if (problema) return setError(problema);
    if (!user?.id) return setError("No pudimos identificar tu sesión. Recarga la página.");
    setError(null);
    try {
      await mutacion.mutateAsync({
        decision: ACCION[accion].decision,
        justification: justificacion(accion, texto, motivo).trim(),
        analyst_id: user.id,
        lender_code: codigo || undefined,
        terms: terminos,
      });
      setHecho(`${ACCION[accion].texto}: decisión registrada en la bitácora.`);
      setAccion(null);
    } catch (err) {
      setError(mensajeError(err));
    }
  };

  return (
    <section
      aria-label="Decisión"
      data-testid="barra-decision"
      className="sticky bottom-0 z-20 grid gap-3 rounded-[var(--dcc-radius)] border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] p-4 shadow-[var(--dcc-shadow)]"
    >
      {hecho ? (
        <p role="status" className="text-sm font-semibold text-[var(--dcc-ok-fg)]">
          {hecho}
        </p>
      ) : bloqueo ? (
        <p role="status" data-testid="decision-bloqueada" className={`text-sm ${DCC_CLASSES.muted}`}>
          {bloqueo}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className={`mr-auto text-sm ${DCC_CLASSES.muted}`}>Decide esta solicitud</span>
          {(Object.keys(ACCION) as Accion[]).map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={accion === a}
              onClick={() => {
                setAccion(a);
                setError(null);
              }}
              className={`${a === "approve" ? DCC_CLASSES.actionButton : DCC_CLASSES.quietButton} aria-pressed:ring-2 aria-pressed:ring-[var(--dcc-gold)] aria-pressed:ring-offset-2`}
            >
              {ACCION[a].texto}
            </button>
          ))}
        </div>
      )}
      {accion && !bloqueo && !hecho ? (
        <div className="grid gap-3 rounded-lg border border-[var(--dcc-border)] bg-[var(--dcc-surface-muted)] p-3 text-sm">
          {opciones.length > 1 ? (
            <label className="grid gap-1">
              Prestamista
              <select value={prestamista} onChange={(e) => setPrestamista(e.target.value)} className={CAMPO}>
                <option value="">Elegir prestamista…</option>
                {opciones.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {accion === "reject" ? (
            <label className="grid gap-1">
              Motivo de rechazo (obligatorio)
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={CAMPO}>
                <option value="">Elegir motivo…</option>
                {MOTIVOS_RECHAZO.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {TERMINOS.map(([k, etiqueta]) => (
                <label key={k} className="grid gap-1">
                  {etiqueta}
                  <input
                    inputMode="decimal"
                    value={terminos[k] ?? ""}
                    onChange={(e) => setTerminos((t) => ({ ...t, [k]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className={CAMPO}
                  />
                </label>
              ))}
            </div>
          )}
          <label className="grid gap-1">
            {accion === "reject" ? "Nota para la bitácora" : "Sustento de la decisión (obligatorio)"}
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} className={`${CAMPO} h-auto py-2`} />
          </label>
          {error ? (
            <p role="alert" className="text-[var(--dcc-error-fg)]">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={mutacion.isPending}
              onClick={() => void confirmar()}
              className={accion === "reject" ? `${DCC_CLASSES.quietButton} border-[var(--dcc-error-fg)] font-semibold text-[var(--dcc-error-fg)]` : DCC_CLASSES.actionButton}
            >
              {mutacion.isPending ? "Registrando…" : `Confirmar: ${ACCION[accion].texto.toLowerCase()}`}
            </button>
            <button type="button" onClick={() => setAccion(null)} className={DCC_CLASSES.quietButton}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

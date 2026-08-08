"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { useTenant } from "@/contexts/TenantContext";
import {
  getOfferCompareForOps,
  getStipulationsForOps,
  postCheckOfferExpiry,
  postClearStipulation,
  postIdentityLiveness,
  putOfferExpiry,
  type CheckExpiryResult,
  type LivenessResultPayload,
  type OfferCompareDetailRow,
  type StipulationRow,
} from "../_lib/ops-actions-api";

function isPendingStipulation(status: string | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "pending" || s === "uploaded";
}

function toIsoFromDatetimeLocal(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) throw new Error("Fecha inválida");
  return dt.toISOString();
}

function OfferExpirySection({
  tid,
  applicationId,
  offers,
  onOffersReload,
}: {
  tid: string;
  applicationId: string;
  offers: OfferCompareDetailRow[];
  onOffersReload: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckExpiryResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [expiryDraft, setExpiryDraft] = useState<Record<string, string>>({});
  const [confirmExpiryOfferId, setConfirmExpiryOfferId] = useState<string | null>(null);
  const [savingExpiry, setSavingExpiry] = useState(false);

  const runCheckExpiry = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const result = await postCheckOfferExpiry(tid, applicationId);
      setCheckResult(result);
      const count = result.expired_count ?? 0;
      forgeToast.success(count > 0 ? `${count} oferta(s) marcada(s) como vencida(s)` : "Sin ofertas vencidas");
      onOffersReload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo revisar vencimientos";
      setCheckError(msg);
      forgeToast.error(msg);
    } finally {
      setChecking(false);
    }
  };

  const confirmSetExpiry = async (offerId: string) => {
    const raw = expiryDraft[offerId];
    if (!raw?.trim()) {
      forgeToast.error("Seleccione una fecha de expiración");
      return;
    }
    setSavingExpiry(true);
    try {
      const iso = toIsoFromDatetimeLocal(raw);
      const result = await putOfferExpiry(tid, applicationId, offerId, iso);
      forgeToast.success(`Expiración actualizada · ${result.offer_expires_at ?? iso}`);
      setConfirmExpiryOfferId(null);
      setExpiryDraft((prev) => {
        const next = { ...prev };
        delete next[offerId];
        return next;
      });
      onOffersReload();
    } catch (err) {
      forgeToast.error(err instanceof Error ? err.message : "No se pudo ajustar la expiración");
    } finally {
      setSavingExpiry(false);
    }
  };

  return (
    <section className="ch-card p-4" data-testid="ops-offer-expiry-section">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="ch-serif" style={{ margin: 0, fontSize: 16 }}>
            Ofertas — vencimientos
          </h3>
          <p style={{ fontSize: 12.5, color: "var(--ch-text-3)", marginTop: 4 }}>
            Revisar ofertas vencidas y ajustar fechas de expiración por oferta.
          </p>
        </div>
        <button
          type="button"
          className="ch-btn ch-btn-secondary ch-btn-sm inline-flex items-center gap-2"
          disabled={checking}
          data-testid="check-offer-expiry-btn"
          onClick={() => void runCheckExpiry()}
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CalendarClock className="h-4 w-4" aria-hidden />}
          Revisar vencimientos
        </button>
      </div>

      {checkError ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {checkError}
        </p>
      ) : null}

      {checkResult ? (
        <div className="mt-3 rounded-lg border border-forgeGray-100 bg-forgeSurface-sunken p-3 text-sm" data-testid="check-expiry-result">
          <div>
            Ofertas vencidas detectadas: <strong>{checkResult.expired_count ?? 0}</strong>
          </div>
          {checkResult.checked_at ? (
            <div style={{ color: "var(--ch-text-3)", marginTop: 4 }}>Revisado: {checkResult.checked_at}</div>
          ) : null}
          {(checkResult.expired_offers ?? []).length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {checkResult.expired_offers!.map((o) => (
                <li key={o.offer_id ?? o.lender_code}>
                  {o.lender_code ?? "—"} · {o.offer_id ?? "—"}
                  {o.expired_at ? ` · venció ${o.expired_at}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {offers.length === 0 ? (
        <p className="mt-3 text-sm text-forgeGray-500">No hay ofertas disponibles para esta solicitud.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {offers.map((offer) => (
            <li key={offer.offer_id} className="rounded-lg border border-forgeGray-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <div style={{ fontWeight: 600 }}>{offer.lender_code ?? "Oferta"}</div>
                  <div style={{ color: "var(--ch-text-3)", fontSize: 12 }}>
                    ID {offer.offer_id}
                    {offer.offer_status ? ` · ${offer.offer_status}` : ""}
                    {offer.is_counteroffer ? " · contrapropuesta" : ""}
                  </div>
                </div>
                {confirmExpiryOfferId !== offer.offer_id ? (
                  <button
                    type="button"
                    className="ch-btn ch-btn-ghost ch-btn-sm"
                    data-testid={`adjust-expiry-btn-${offer.offer_id}`}
                    onClick={() => setConfirmExpiryOfferId(offer.offer_id)}
                  >
                    Ajustar expiración
                  </button>
                ) : null}
              </div>
              {confirmExpiryOfferId === offer.offer_id ? (
                <div className="mt-3 space-y-2 border-t border-forgeGray-100 pt-3" data-testid={`confirm-expiry-panel-${offer.offer_id}`}>
                  <label className="block text-xs font-medium text-forgeGray-600">
                    Nueva fecha de expiración
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded border border-forgeGray-200 px-2 py-1.5 text-sm"
                      value={expiryDraft[offer.offer_id] ?? ""}
                      onChange={(e) =>
                        setExpiryDraft((prev) => ({ ...prev, [offer.offer_id]: e.target.value }))
                      }
                      data-testid={`expiry-datetime-${offer.offer_id}`}
                    />
                  </label>
                  <p className="text-xs text-amber-800">
                    Esta acción modifica la fecha de expiración de una oferta real. Confirme solo si es correcto.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="ch-btn ch-btn-secondary ch-btn-sm"
                      disabled={savingExpiry}
                      data-testid={`confirm-adjust-expiry-${offer.offer_id}`}
                      onClick={() => void confirmSetExpiry(offer.offer_id)}
                    >
                      {savingExpiry ? "Guardando…" : "Confirmar ajuste de expiración"}
                    </button>
                    <button
                      type="button"
                      className="ch-btn ch-btn-ghost ch-btn-sm"
                      disabled={savingExpiry}
                      onClick={() => setConfirmExpiryOfferId(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StipulationsClearSection({
  tid,
  applicationId,
  rows,
  onReload,
}: {
  tid: string;
  applicationId: string;
  rows: StipulationRow[];
  onReload: () => void;
}) {
  const pending = rows.filter((s) => isPendingStipulation(s.status));
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);
  const [clearReason, setClearReason] = useState("");
  const [clearing, setClearing] = useState(false);

  const confirmClear = async (stipId: string) => {
    setClearing(true);
    try {
      await postClearStipulation(tid, applicationId, stipId, clearReason);
      forgeToast.success("Estipulación marcada como cumplida");
      setConfirmClearId(null);
      setClearReason("");
      onReload();
    } catch (err) {
      forgeToast.error(err instanceof Error ? err.message : "No se pudo marcar como cumplida");
    } finally {
      setClearing(false);
    }
  };

  return (
    <section className="ch-card p-4" data-testid="ops-stipulations-section">
      <h3 className="ch-serif" style={{ margin: 0, fontSize: 16 }}>
        Estipulaciones — cumplimiento
      </h3>
      <p style={{ fontSize: 12.5, color: "var(--ch-text-3)", marginTop: 4 }}>
        Marcar estipulaciones pendientes como cumplidas (override analista).
      </p>

      {pending.length === 0 ? (
        <p className="mt-3 text-sm text-forgeGray-500">No hay estipulaciones pendientes.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {pending.map((s) => (
            <li key={s.id} className="rounded-lg border border-forgeGray-100 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="text-sm">
                  <div style={{ fontWeight: 600 }}>{s.description ?? s.type ?? "Estipulación"}</div>
                  <div style={{ color: "var(--ch-text-3)", fontSize: 12 }}>
                    {s.type ? `${s.type} · ` : ""}Estado: {s.status ?? "—"}
                  </div>
                </div>
                {confirmClearId !== s.id ? (
                  <button
                    type="button"
                    className="ch-btn ch-btn-ghost ch-btn-sm inline-flex items-center gap-1"
                    data-testid={`mark-cleared-btn-${s.id}`}
                    onClick={() => setConfirmClearId(s.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Marcar cumplida
                  </button>
                ) : null}
              </div>
              {confirmClearId === s.id ? (
                <div className="mt-3 space-y-2 border-t border-forgeGray-100 pt-3" data-testid={`confirm-clear-panel-${s.id}`}>
                  <textarea
                    className="w-full rounded border border-forgeGray-200 p-2 text-sm"
                    placeholder="Motivo (opcional)"
                    value={clearReason}
                    onChange={(e) => setClearReason(e.target.value)}
                    data-testid={`clear-reason-${s.id}`}
                  />
                  <p className="text-xs text-amber-800">
                    Esta acción marca la estipulación como cumplida en la solicitud real. No se puede deshacer desde aquí.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="ch-btn ch-btn-secondary ch-btn-sm"
                      disabled={clearing}
                      data-testid={`confirm-mark-cleared-${s.id}`}
                      onClick={() => void confirmClear(s.id)}
                    >
                      {clearing ? "Marcando…" : "Confirmar marcar cumplida"}
                    </button>
                    <button
                      type="button"
                      className="ch-btn ch-btn-ghost ch-btn-sm"
                      disabled={clearing}
                      onClick={() => {
                        setConfirmClearId(null);
                        setClearReason("");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LivenessSection({ tid, applicationId }: { tid: string; applicationId: string }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LivenessResultPayload | null>(null);

  const runLiveness = async () => {
    setRunning(true);
    setError(null);
    try {
      const payload = await postIdentityLiveness(tid, applicationId);
      setResult(payload);
      forgeToast.success("Verificación de liveness completada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo ejecutar liveness";
      setError(msg);
      forgeToast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="ch-card p-4" data-testid="ops-liveness-section">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="ch-serif" style={{ margin: 0, fontSize: 16 }}>
            Identidad — liveness
          </h3>
          <p style={{ fontSize: 12.5, color: "var(--ch-text-3)", marginTop: 4 }}>
            Ejecutar verificación de vida (PAD) para esta solicitud.
          </p>
        </div>
        <button
          type="button"
          className="ch-btn ch-btn-secondary ch-btn-sm inline-flex items-center gap-2"
          disabled={running}
          data-testid="run-liveness-btn"
          onClick={() => void runLiveness()}
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
          Verificar identidad (liveness)
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2" data-testid="liveness-result">
          <div>
            <dt className="text-forgeGray-500">status</dt>
            <dd style={{ fontWeight: 600 }}>{result.status ?? "no disponible"}</dd>
          </div>
          <div>
            <dt className="text-forgeGray-500">pad_score</dt>
            <dd>{result.pad_score != null ? String(result.pad_score) : "no disponible"}</dd>
          </div>
          <div>
            <dt className="text-forgeGray-500">provider</dt>
            <dd>{result.provider ?? "no disponible"}</dd>
          </div>
          <div>
            <dt className="text-forgeGray-500">requires_manual_review</dt>
            <dd>{result.requires_manual_review != null ? String(result.requires_manual_review) : "no disponible"}</dd>
          </div>
          <div>
            <dt className="text-forgeGray-500">blocked</dt>
            <dd>{result.blocked != null ? String(result.blocked) : "no disponible"}</dd>
          </div>
          {result.detail ? (
            <div className="sm:col-span-2">
              <dt className="text-forgeGray-500">detail</dt>
              <dd>{result.detail}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}

export function BankApplicationOpsPanel({ applicationId }: { applicationId: string }) {
  const { tenantId } = useTenant();
  const tid = tenantId?.trim() ?? "";

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<OfferCompareDetailRow[]>([]);
  const [stipulations, setStipulations] = useState<StipulationRow[]>([]);

  const reload = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [compare, stips] = await Promise.all([
        getOfferCompareForOps(tid, applicationId),
        getStipulationsForOps(tid, applicationId),
      ]);
      setOffers(compare.offers_detail ?? []);
      setStipulations(stips);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar datos operativos");
    } finally {
      setLoading(false);
    }
  }, [tid, applicationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!tid) return null;

  return (
    <div className="mt-6 space-y-4" data-testid="bank-application-ops-panel">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 18 }}>
          Acciones operativas
        </h2>
      </div>

      {loadError ? (
        <div className="ch-card p-4 text-sm text-red-700" role="alert">
          {loadError}
          <button type="button" className="ch-btn ch-btn-ghost ch-btn-sm ml-3" onClick={() => void reload()}>
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <div className="ch-card p-4 text-sm text-forgeGray-500 inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Cargando contexto operativo…
        </div>
      ) : (
        <>
          <OfferExpirySection tid={tid} applicationId={applicationId} offers={offers} onOffersReload={() => void reload()} />
          <StipulationsClearSection
            tid={tid}
            applicationId={applicationId}
            rows={stipulations}
            onReload={() => void reload()}
          />
          <LivenessSection tid={tid} applicationId={applicationId} />
        </>
      )}
    </div>
  );
}

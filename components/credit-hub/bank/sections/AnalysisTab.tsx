"use client";

import { Car, DollarSign, FileText, Fingerprint, Gauge } from "lucide-react";
import { EvidenceGrid } from "@/components/credit-hub/primitives";
import { chMoney, chMoneyExact } from "@/lib/credit-hub/ch-base";
import type { BankFinancialPayload, BankReviewPayload } from "@/lib/credit-hub/types/bank-views";
import type { CreditAnalysisResult } from "@/lib/credit-hub/types/creditAnalysis";

function Factor({ text, positive }: { text: string; positive: boolean }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "8px 0" }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          flexShrink: 0,
          marginTop: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: positive ? "var(--ch-success-soft)" : "var(--ch-danger-soft)",
          color: positive ? "var(--ch-success)" : "var(--ch-danger)",
          fontSize: 11,
        }}
      >
        {positive ? "✓" : "−"}
      </div>
      <span style={{ fontSize: 13, color: "var(--ch-text-2)", lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ padding: "12px 14px", background: "var(--ch-surface-2)", borderRadius: "var(--ch-r-md)" }}>
      <div className="ch-eyebrow">{label}</div>
      <div className="ch-mono" style={{ fontSize: 19, fontWeight: 600, marginTop: 5 }}>
        {value}
      </div>
      {hint ? <div style={{ fontSize: 11, color: "var(--ch-text-3)", marginTop: 2 }}>{hint}</div> : null}
    </div>
  );
}

export function AnalysisTab({ payload }: { payload: BankReviewPayload }) {
  const an = payload.analysis;
  const financial = payload.financial ?? {};
  const applicant = payload.applicant ?? {};

  const m = an?.metrics;
  const positives = an?.positive_factors?.length ? an.positive_factors : an?.factors?.positive ?? [];
  const negatives = an?.negative_factors?.length ? an.negative_factors : an?.factors?.negative ?? [];

  // Helper function to display "No informado" for missing data
  const displayValue = (value: unknown, formatter?: (v: unknown) => string): string => {
    if (value == null || value === "" || (typeof value === "number" && isNaN(value))) {
      return "No informado";
    }
    return formatter ? formatter(value) : String(value);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* P4: RATIOS DESTACADOS - Señal de decisión al inicio */}
      <div className="ch-card" style={{ padding: 20, background: "var(--ch-surface-2)", border: "2px solid var(--ch-accent-line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Gauge className="h-5 w-5" style={{ color: "var(--ch-accent)" }} aria-hidden />
          <div className="ch-eyebrow" style={{ fontSize: 12.5, fontWeight: 600 }}>
            Ratios de decisión
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <div>
            <div className="ch-eyebrow">Deuda / Ingreso</div>
            <div style={{ fontSize: 10, color: "var(--ch-text-3)", marginTop: 2 }}>Total de deudas sobre el ingreso</div>
            <div className="ch-mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "var(--ch-accent)" }}>
              {an?.dti != null ? `${(an.dti * 100).toFixed(1)}%` : "No calculado"}
            </div>
          </div>
          <div>
            <div className="ch-eyebrow">Cuota / Ingreso</div>
            <div style={{ fontSize: 10, color: "var(--ch-text-3)", marginTop: 2 }}>Cuota mensual sobre el ingreso</div>
            <div className="ch-mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "var(--ch-accent)" }}>
              {an?.pti != null ? `${(an.pti * 100).toFixed(1)}%` : "No calculado"}
            </div>
          </div>
          <div>
            <div className="ch-eyebrow">Préstamo / Valor</div>
            <div style={{ fontSize: 10, color: "var(--ch-text-3)", marginTop: 2 }}>Monto del préstamo sobre el valor del vehículo</div>
            <div className="ch-mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "var(--ch-accent)" }}>
              {an?.ltv != null ? `${(an.ltv * 100).toFixed(1)}%` : "No calculado"}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "var(--ch-text-3)", marginTop: 12, fontStyle: "italic" }}>
          Calculados por el sistema de análisis
        </div>
      </div>

      {/* Análisis del motor (conditional - only if analysis exists) */}
      {an ? (
        <>
          <div className="ch-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="ch-eyebrow">Análisis del motor · {an.engine}</div>
              {an.confidence != null ? (
                <span className="ch-chip">Confianza {(an.confidence * 100).toFixed(0)}%</span>
              ) : (
                <span className="ch-chip" style={{ opacity: 0.6 }}>Confianza no disponible</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ch-text)" }}>{an.explanation}</p>
          </div>

          {/* Factores (only if analysis exists) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="ch-card" style={{ padding: 18 }}>
              <div className="ch-eyebrow" style={{ color: "var(--ch-success-text)", marginBottom: 4 }}>
                Factores a favor
              </div>
              {positives.slice(0, 8).map((t) => (
                <Factor key={t} text={t} positive />
              ))}
            </div>
            <div className="ch-card" style={{ padding: 18 }}>
              <div className="ch-eyebrow" style={{ color: "var(--ch-danger-text)", marginBottom: 4 }}>
                Factores en contra
              </div>
              {negatives.slice(0, 8).map((t) => (
                <Factor key={t} text={t} positive={false} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="ch-card" style={{ padding: 24, color: "var(--ch-text-3)" }}>
          Sin análisis del motor para esta solicitud. Los datos del solicitante y vehículo se muestran a continuación.
        </div>
      )}

      {/* P5: CAPACIDAD DE PAGO - Marcado como declarado por solicitante */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div className="ch-eyebrow">Capacidad de pago</div>
          <span style={{ fontSize: 10, color: "var(--ch-text-3)", fontStyle: "italic" }}>
            · Declarado por el solicitante
          </span>
        </div>
        <div className="ch-card" style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px 16px" }}>
            <div>
              <div className="ch-eyebrow">Ingreso mensual</div>
              <div className="ch-mono" style={{ fontSize: 14, marginTop: 4, fontFeatureSettings: "'tnum'" }}>
                {displayValue(applicant.monthly_income, (v) => chMoneyExact(Number(v)))}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Empleador</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(applicant.employment)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Puesto</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(applicant.job_title)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Antigüedad laboral</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(applicant.tenure_months, (v) => {
                  const months = Number(v);
                  const years = Math.floor(months / 12);
                  const remainingMonths = months % 12;
                  if (years > 0 && remainingMonths > 0) return `${years} año${years > 1 ? 's' : ''}, ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
                  if (years > 0) return `${years} año${years > 1 ? 's' : ''}`;
                  return `${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
                })}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Deudas vigentes</div>
              <div className="ch-mono" style={{ fontSize: 14, marginTop: 4, fontFeatureSettings: "'tnum'" }}>
                {displayValue(applicant.current_debts, (v) => chMoneyExact(Number(v)))}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Pago mensual de deudas</div>
              <div className="ch-mono" style={{ fontSize: 14, marginTop: 4, fontFeatureSettings: "'tnum'" }}>
                {displayValue(applicant.monthly_debt_payments, (v) => chMoneyExact(Number(v)))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: La operación */}
      <div>
        <div className="ch-eyebrow" style={{ marginBottom: 10 }}>
          La operación
        </div>
        <div className="ch-card" style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px 16px" }}>
            <div>
              <div className="ch-eyebrow">Monto solicitado</div>
              <div className="ch-mono" style={{ fontSize: 14, marginTop: 4, fontFeatureSettings: "'tnum'" }}>
                {displayValue(financial.requested_amount, (v) => chMoneyExact(Number(v)))}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Plazo</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(financial.term_months, (v) => `${v} meses`)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Enganche</div>
              <div className="ch-mono" style={{ fontSize: 14, marginTop: 4, fontFeatureSettings: "'tnum'" }}>
                {displayValue(financial.down_payment, (v) => chMoneyExact(Number(v)))}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Fuente del enganche</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(financial.down_payment_source)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Préstamo / Valor</div>
              <div style={{ fontSize: 10, color: "var(--ch-text-3)", marginTop: 2 }}>Monto del préstamo sobre el valor del vehículo</div>
              <div className="ch-mono" style={{ fontSize: 14, marginTop: 4, fontFeatureSettings: "'tnum'", color: "var(--ch-accent)" }}>
                {an?.ltv != null ? `${(an.ltv * 100).toFixed(1)}%` : "No calculado"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidencia verificada (existing, but moved after new sections) */}
      {an ? (
        <div>
          <div className="ch-eyebrow" style={{ marginBottom: 10 }}>
            Evidencia verificada
          </div>
          <EvidenceGrid
            items={[
              {
                icon: DollarSign,
                title: "Ingreso verificado",
                body: `${chMoneyExact(Number(applicant.monthly_income ?? 0))}/mes · ${String(applicant.employment ?? "—")}.`,
                source: "Entidad emisora · recibos de nomina",
                conf: "alto",
              },
              {
                icon: Gauge,
                title: "Buro de credito",
                body: "No consultado",
                source: "Este banco aun no tiene el buro conectado en la plataforma.",
                conf: null,
              },
              {
                icon: Car,
                title: "Vehiculo",
                body: `${String(payload.vehicle?.label ?? payload.vehicle?.make ?? "—")} · valor ${chMoney(Number(payload.vehicle?.value ?? 0))}.`,
                source: "Expediente dealer",
                conf: "medio",
              },
            ]}
            identity={payload.identity}
          />
        </div>
      ) : null}

      {/* Vehículo (existing, updated to show all fields from FASE 1) */}
      <div>
        <div className="ch-eyebrow" style={{ marginBottom: 10 }}>
          Vehículo · Detalles completos
        </div>
        <div className="ch-card" style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px 16px" }}>
            <div>
              <div className="ch-eyebrow">Marca</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(payload.vehicle?.make ?? payload.vehicle?.marca)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Modelo</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(payload.vehicle?.model ?? payload.vehicle?.modelo)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Año</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(payload.vehicle?.year ?? payload.vehicle?.ano)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Condición</div>
              <div style={{ fontSize: 13, marginTop: 4, textTransform: "capitalize" }}>
                {displayValue(payload.vehicle?.condition ?? payload.vehicle?.condicion)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">VIN / Chasis</div>
              <div className="ch-mono" style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(payload.vehicle?.vin_chasis ?? payload.vehicle?.vin)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Valuación</div>
              <div className="ch-mono" style={{ fontSize: 14, marginTop: 4, fontFeatureSettings: "'tnum'" }}>
                {displayValue(payload.vehicle?.value ?? payload.vehicle?.valuacion, (v) => chMoneyExact(Number(v)))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Co-firmante (existing - will show "No informado" if not present) */}
      <div>
        <div className="ch-eyebrow" style={{ marginBottom: 10 }}>
          Co-firmante / Garante
        </div>
        <div className="ch-card" style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px 16px" }}>
            <div>
              <div className="ch-eyebrow">Nombre</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(applicant.co_borrower_name)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Cédula</div>
              <div className="ch-mono" style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(applicant.co_borrower_cedula)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Ingreso mensual</div>
              <div className="ch-mono" style={{ fontSize: 14, marginTop: 4, fontFeatureSettings: "'tnum'" }}>
                {displayValue(applicant.co_borrower_monthly_income, (v) => chMoneyExact(Number(v)))}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Teléfono</div>
              <div className="ch-mono" style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(applicant.co_borrower_phone)}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Relación</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {displayValue(applicant.co_borrower_relationship)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referencias personales */}
      <div>
        <div className="ch-eyebrow" style={{ marginBottom: 10 }}>
          Referencias personales
          {applicant.referencias && applicant.referencias.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: "normal", color: "var(--ch-text-3)" }}>
              · {applicant.referencias.length} registrada(s)
            </span>
          )}
        </div>
        {applicant.referencias && applicant.referencias.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {applicant.referencias.slice(0, 3).map((ref, i) => (
              <div key={i} className="ch-card" style={{ padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: "12px 16px" }}>
                  <div>
                    <div className="ch-eyebrow">Nombre</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      {displayValue(ref.nombre_completo)}
                    </div>
                  </div>
                  <div>
                    <div className="ch-eyebrow">Relación</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      {displayValue(ref.relacion)}
                    </div>
                  </div>
                  <div>
                    <div className="ch-eyebrow">Teléfono</div>
                    <div className="ch-mono" style={{ fontSize: 13, marginTop: 4 }}>
                      {displayValue(ref.telefono)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ch-card" style={{ padding: 18, color: "var(--ch-text-3)" }}>
            No informado
          </div>
        )}
      </div>
    </div>
  );
}

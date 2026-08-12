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
  if (!an) {
    return <div className="ch-card" style={{ padding: 24, color: "var(--ch-text-3)" }}>Sin análisis del motor para esta solicitud.</div>;
  }

  const m = an.metrics;
  const positives = an.positive_factors?.length ? an.positive_factors : an.factors?.positive ?? [];
  const negatives = an.negative_factors?.length ? an.negative_factors : an.factors?.negative ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="ch-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="ch-eyebrow">Análisis del motor · {an.engine}</div>
          <span className="ch-chip">Confianza {(an.confidence * 100).toFixed(0)}%</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ch-text)" }}>{an.explanation}</p>
      </div>

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

      {m ? (
        <div>
          <div className="ch-eyebrow" style={{ marginBottom: 10 }}>
            Métricas clave
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <Metric label="DTI" value={`${((m.dti ?? 0) * 100).toFixed(0)}%`} hint="política ≤ 45%" />
            <Metric label="PTI" value={financial.pti != null ? `${(financial.pti * 100).toFixed(0)}%` : "—"} hint="payment to income" />
            <Metric label="LTV" value={`${((financial.ltv ?? 0) * 100).toFixed(0)}%`} hint={financial.down_payment ? `enganche ${chMoney(financial.down_payment)}` : undefined} />
            <Metric label="Capacidad" value={m.payment_capacity != null ? chMoneyExact(m.payment_capacity) : "—"} hint="cuota estimada" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 10 }}>
            <Metric label="Score buró" value={String(an.score)} hint={an.approval_band ?? undefined} />
            <Metric label="Deudas vigentes" value={applicant.monthly_debt_payments != null ? chMoneyExact(applicant.monthly_debt_payments) : "—"} hint={applicant.current_debts != null ? `${applicant.current_debts} cuenta(s)` : undefined} />
            <Metric label="Fuente enganche" value={financial.down_payment_source ?? "—"} />
            <div />
          </div>
        </div>
      ) : null}

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
              body: `Score ${an.score}. Nivel ${an.risk_level}.`,
              source: "Buro de credito",
              conf: "alto",
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

      <div>
        <div className="ch-eyebrow" style={{ marginBottom: 10 }}>
          Vehículo · Detalles completos
        </div>
        <div className="ch-card" style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px 16px" }}>
            <div>
              <div className="ch-eyebrow">VIN / Chasis</div>
              <div className="ch-mono" style={{ fontSize: 13, marginTop: 4 }}>
                {String(payload.vehicle?.vin_chasis ?? payload.vehicle?.vin ?? "—")}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Condición</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {String(payload.vehicle?.condicion ?? payload.vehicle?.condition ?? "—")}
              </div>
            </div>
            <div>
              <div className="ch-eyebrow">Valuación</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {chMoneyExact(Number(payload.vehicle?.value ?? 0))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {applicant.co_borrower_name ? (
        <div>
          <div className="ch-eyebrow" style={{ marginBottom: 10 }}>
            Co-firmante / Garante
          </div>
          <div className="ch-card" style={{ padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px 16px" }}>
              <div>
                <div className="ch-eyebrow">Nombre</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {String(applicant.co_borrower_name)}
                </div>
              </div>
              <div>
                <div className="ch-eyebrow">Cédula</div>
                <div className="ch-mono" style={{ fontSize: 13, marginTop: 4 }}>
                  {String(applicant.co_borrower_cedula ?? "—")}
                </div>
              </div>
              <div>
                <div className="ch-eyebrow">Ingreso mensual</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {applicant.co_borrower_monthly_income != null ? chMoneyExact(applicant.co_borrower_monthly_income) : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {applicant.referencias && applicant.referencias.length > 0 ? (
        <div>
          <div className="ch-eyebrow" style={{ marginBottom: 10 }}>
            Referencias personales · {applicant.referencias.length} registrada(s)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {applicant.referencias.slice(0, 3).map((ref, i) => (
              <div key={i} className="ch-card" style={{ padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: "12px 16px" }}>
                  <div>
                    <div className="ch-eyebrow">Nombre</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      {String(ref.nombre_completo ?? "—")}
                    </div>
                  </div>
                  <div>
                    <div className="ch-eyebrow">Teléfono</div>
                    <div className="ch-mono" style={{ fontSize: 13, marginTop: 4 }}>
                      {String(ref.telefono ?? "—")}
                    </div>
                  </div>
                  <div>
                    <div className="ch-eyebrow">Dirección</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      {String(ref.direccion ?? "—")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

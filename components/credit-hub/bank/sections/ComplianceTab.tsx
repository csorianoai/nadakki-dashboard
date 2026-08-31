"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { approveCompliance } from "@/lib/credit-hub/api/bankClient";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import type { ComplianceReport } from "@/lib/credit-hub/types/bankDecision";

const SEV: Record<string, [string, string]> = {
  alta: ["var(--ch-danger-text)", "var(--ch-danger-soft)"],
  media: ["var(--ch-warning-text)", "var(--ch-warning-soft)"],
  baja: ["var(--ch-text-3)", "var(--ch-surface-3)"],
  ALTA: ["var(--ch-danger-text)", "var(--ch-danger-soft)"],
  MEDIA: ["var(--ch-warning-text)", "var(--ch-warning-soft)"],
};

const ISSUE_TYPE_LABEL: Record<string, string> = {
  CONSENTIMIENTOS_INCOMPLETOS: "Consentimientos incompletos",
  MISSING_CONSENTS: "Consentimientos faltantes",
  MISSING_DOCUMENTS: "Documentos faltantes",
  KYC_PENDING: "KYC pendiente",
  AML_CHECK_PENDING: "Verificación AML pendiente",
  IDENTITY_VERIFICATION_FAILED: "Verificación de identidad fallida",
  CONSENT_DATA_PROCESSING: "Consentimiento de procesamiento de datos",
  CONSENT_BUREAU_AUTHORIZATION: "Autorización de buró de crédito",
  CONSENT_TERMS_ACCEPTED: "Aceptación de términos",
};

export function ComplianceTab({
  report,
  applicationId,
}: {
  report?: ComplianceReport;
  applicationId: string;
}) {
  const { tenantId } = useTenant();
  const [approving, setApproving] = useState(false);
  const ok = report?.ley_172_13_compliant === true;
  const [approved, setApproved] = useState(ok);

  useEffect(() => {
    setApproved(ok);
  }, [ok]);

  const handleApprove = async () => {
    if (!tenantId) return;
    setApproving(true);
    try {
      const result = await approveCompliance({ tenantId, applicationId });
      if (result.ok) setApproved(true);
    } finally {
      setApproving(false);
    }
  };

  if (!report) {
    return <div className="ch-card" style={{ padding: 24, color: "var(--ch-text-3)" }}>Sin informe de cumplimiento.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ch-card" style={{ padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: approved ? "var(--ch-success-soft)" : "var(--ch-warning-soft)",
              color: approved ? "var(--ch-success)" : "var(--ch-warning)",
            }}
          >
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Perfil regulatorio</div>
            <div style={{ fontSize: 12, color: "var(--ch-text-3)" }}>{approved ? "Conforme Ley 172-13" : "Pendiente de aprobación regulatoria"}</div>
          </div>
        </div>
        {!approved ? (
          <button type="button" className="ch-btn ch-btn-primary" disabled={approving} onClick={() => void handleApprove()}>
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Aprobar compliance
          </button>
        ) : null}
      </div>
      <div className="ch-card">
        <div className="ch-eyebrow" style={{ padding: "12px 18px", borderBottom: "1px solid var(--ch-line)" }}>
          Incidencias · {report.issues.length}
        </div>
        {report.issues.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ch-text-3)", fontSize: 13 }}>Sin incidencias regulatorias.</div>
        ) : (
          report.issues.map((iss, i) => {
            const [c, bg] = SEV[iss.severity] ?? SEV.baja!;
            return (
              <div key={`${iss.type}-${i}`} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 18px", borderTop: i ? "1px solid var(--ch-line)" : "none" }}>
                <span className="ch-pill" style={{ color: c, background: bg, height: 22, fontSize: 11, marginTop: 1 }}>
                  {iss.severity}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="ch-mono" style={{ fontSize: 11.5, fontWeight: 600 }}>
                    {ISSUE_TYPE_LABEL[iss.type] ?? iss.type}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ch-text-2)", marginTop: 2 }}>{iss.action_required}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { dealerDetailHref } from "@/lib/credit-hub/dealer/dealerFormat";

export function StepComplete() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id")?.trim() || searchParams.get("application_id")?.trim() || "";

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", padding: "32px 0" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "var(--ch-success-soft)",
          color: "var(--ch-success-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <CheckCircle2 className="h-8 w-8" aria-hidden />
      </div>
      <p className="ch-eyebrow" style={{ color: "var(--ch-persona-text)" }}>
        Solicitud recibida
      </p>
      <h1 className="ch-serif" style={{ margin: "8px 0 0", fontSize: 28, letterSpacing: "-0.02em" }}>
        Gracias por enviar la solicitud
      </h1>
      <p style={{ fontSize: 14, color: "var(--ch-text-3)", marginTop: 12 }}>
        ID:{" "}
        <span className="ch-mono" style={{ fontWeight: 600, color: "var(--ch-text)" }} data-testid="submitted-application-id">
          {applicationId || "—"}
        </span>
      </p>
      <p style={{ fontSize: 13, color: "var(--ch-text-3)", marginTop: 10, lineHeight: 1.6 }}>
        En cola de decisión · La institución ya fue notificada.
        <br />
        Te avisamos apenas haya respuesta.
      </p>
      {/* TODO(tenant-config): Read from tenantConfig.sla_commitment_hours when available */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28 }}>
        <Link
          href={applicationId ? dealerDetailHref(applicationId) : "/credit-hub/dealer/applications"}
          className="ch-btn ch-btn-persona min-h-[48px]"
          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          Ver estado
        </Link>
        <Link href="/credit-hub/dealer" className="ch-btn ch-btn-secondary min-h-[48px]" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          Volver al panel
        </Link>
      </div>
    </div>
  );
}

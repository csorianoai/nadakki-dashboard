"use client";

import Link from "next/link";
import { Car, Plus } from "lucide-react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function DealerCockpitHeader({
  institutionName,
  userName,
  showDemoBanner,
}: {
  institutionName: string;
  userName?: string;
  showDemoBanner?: boolean;
}) {
  const displayName = userName?.trim() || "Dealer";

  return (
    <header data-testid="dealer-cockpit-header" style={{ marginBottom: 22 }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "var(--ch-dealer-accent-soft, var(--ch-persona-soft))",
              border: "1px solid var(--ch-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Car className="h-5 w-5" style={{ color: "var(--ch-dealer-accent, var(--ch-persona))" }} aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="ch-serif" style={{ margin: 0, fontSize: "clamp(22px, 4vw, 28px)", letterSpacing: "-0.02em" }}>
                Cockpit del Dealer
              </h1>
              <span className="ch-chip" style={{ fontSize: 9, letterSpacing: "0.08em" }}>
                CRÉDITO AUTO
              </span>
              <DataTruthBadge level="REAL" />
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--ch-text-2)" }}>
              {institutionName} · Originación automotriz · Dealer → Bancos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/credit-hub/dealer/applications" className="ch-btn ch-btn-secondary ch-btn-sm" style={{ textDecoration: "none" }}>
            Tus solicitudes y tus bancos
          </Link>
          <Link href="/credit-hub/dealer/applications/new/applicant?new=1" className="ch-btn ch-btn-persona" style={{ textDecoration: "none" }}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva solicitud
          </Link>
          <div
            title={displayName}
            aria-label={displayName}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "var(--ch-dealer-accent, var(--ch-persona))",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initials(displayName)}
          </div>
        </div>
      </div>

      {showDemoBanner ? (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px dashed var(--ch-accent-line)",
            background: "var(--ch-accent-soft)",
            fontSize: 12,
            color: "var(--ch-accent-text)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
          }}
        >
          <DataTruthBadge level="DEMO" />
          Entorno de demostración — datos sembrados. Cualquier cifra sin fuente real de producción aparece marcada.
        </div>
      ) : null}

      <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--ch-text-3)" }}>
        <span style={{ color: "var(--ch-success)" }}>●</span> Subasta inversa · envías a varios bancos y eliges la mejor oferta
      </p>
    </header>
  );
}

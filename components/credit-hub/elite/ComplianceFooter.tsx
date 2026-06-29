"use client";

import { memo } from "react";
import { Shield } from "lucide-react";

export const ComplianceFooter = memo(function ComplianceFooter({ variant }: { variant: "dealer" | "bank" }) {
  return (
    <footer
      className="ch-card"
      style={{
        marginTop: 26,
        padding: "14px 16px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: "var(--ch-surface-2)",
        borderStyle: "dashed",
      }}
      data-testid="compliance-footer"
    >
      <Shield className="h-4 w-4 shrink-0" style={{ color: "var(--ch-success)", marginTop: 2 }} aria-hidden />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {variant === "bank" ? "Aislamiento activo" : "Subasta inversa multi-banco"}
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ch-text-2)", lineHeight: 1.45 }}>
          {variant === "bank"
            ? "Tu institución solo visualiza solicitudes asignadas. Las ofertas, tasas y decisiones de bancos competidores permanecen ocultas por diseño."
            : "Ves únicamente TUS solicitudes y las ofertas de los bancos a los que enviaste. Las solicitudes y la actividad de otros dealers permanecen ocultas por diseño."}
        </p>
      </div>
    </footer>
  );
});

"use client";

import { Building2 } from "lucide-react";

export default function InstitutionsPage() {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Building2 size={28} color="#0ea5e9" />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
          Instituciones
        </h1>
      </div>
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 32 }}>
        Gestion de instituciones financieras y entidades reguladas.
      </p>

      <div
        style={{
          padding: 32,
          borderRadius: 12,
          backgroundColor: "rgba(30, 41, 59, 0.7)",
          border: "1px solid rgba(51, 65, 85, 0.5)",
          textAlign: "center",
        }}
      >
        <Building2 size={48} color="#334155" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 16, color: "#64748b", margin: 0 }}>
          Modulo de instituciones — proximamente disponible.
        </p>
      </div>
    </div>
  );
}

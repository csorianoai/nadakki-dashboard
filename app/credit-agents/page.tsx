"use client";

import { TrendingUp } from "lucide-react";

export default function CreditAgentsPage() {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <TrendingUp size={28} color="#f59e0b" />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
          Agentes de Credito
        </h1>
      </div>
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 32 }}>
        Agentes especializados en analisis y evaluacion crediticia.
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
        <TrendingUp size={48} color="#334155" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 16, color: "#64748b", margin: 0 }}>
          Modulo de agentes de credito — proximamente disponible.
        </p>
      </div>
    </div>
  );
}

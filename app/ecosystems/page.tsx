"use client";

import { Globe } from "lucide-react";

export default function EcosystemsPage() {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Globe size={28} color="#14b8a6" />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
          Ecosistemas
        </h1>
      </div>
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 32 }}>
        Vista integral de ecosistemas financieros y tecnologicos conectados.
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
        <Globe size={48} color="#334155" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 16, color: "#64748b", margin: 0 }}>
          Modulo de ecosistemas — proximamente disponible.
        </p>
      </div>
    </div>
  );
}

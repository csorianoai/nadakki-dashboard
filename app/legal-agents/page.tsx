"use client";

import Link from "next/link";
import { Scale, BookOpen } from "lucide-react";

export default function LegalAgentsPage() {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Scale size={28} color="#C77DFF" />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
          Agentes Legales
        </h1>
      </div>
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 32 }}>
        Agentes de IA especializados en analisis legal y cumplimiento normativo.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        <Link href="/legal" style={{ textDecoration: "none" }}>
          <div
            style={{
              padding: 24,
              borderRadius: 12,
              backgroundColor: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(51, 65, 85, 0.5)",
              cursor: "pointer",
            }}
          >
            <div style={{ marginBottom: 12, color: "#C77DFF" }}>
              <BookOpen size={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", margin: "0 0 6px" }}>
              Legal AI Hub
            </h3>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
              Accede al catalogo completo de agentes legales.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

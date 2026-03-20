"use client";

import Link from "next/link";
import { Bot, PlayCircle, Activity } from "lucide-react";

const sections = [
  {
    title: "Ejecutar Agentes",
    description: "Lanza y configura agentes de IA bajo demanda.",
    href: "/agents/execute",
    icon: <PlayCircle size={28} />,
    color: "#8B5CF6",
  },
  {
    title: "Live Panel",
    description: "Monitorea agentes activos en tiempo real.",
    href: "/agents/live",
    icon: <Activity size={28} />,
    color: "#10b981",
  },
];

export default function AgentsPage() {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Bot size={28} color="#8B5CF6" />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
          Agentes
        </h1>
      </div>
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 32 }}>
        Centro de gestion y ejecucion de agentes de IA.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {sections.map((s) => (
          <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
            <div
              style={{
                padding: 24,
                borderRadius: 12,
                backgroundColor: "rgba(30, 41, 59, 0.7)",
                border: "1px solid rgba(51, 65, 85, 0.5)",
                cursor: "pointer",
              }}
            >
              <div style={{ marginBottom: 12, color: s.color }}>{s.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", margin: "0 0 6px" }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{s.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";

const WORKFLOWS = [
  { id: "campaign-optimization", name: "Campaign Optimization", icon: "🎯", desc: "Optimiza campañas con IA", agents: 5 },
  { id: "customer-acquisition-intelligence", name: "Customer Acquisition", icon: "👥", desc: "Adquisición inteligente de clientes", agents: 5 },
  { id: "customer-lifecycle-revenue", name: "Customer Lifecycle", icon: "💰", desc: "Maximiza el valor del cliente", agents: 5 },
  { id: "content-performance-engine", name: "Content Performance", icon: "📝", desc: "Optimiza rendimiento de contenido", agents: 5 },
  { id: "social-media-intelligence", name: "Social Intelligence", icon: "📱", desc: "Inteligencia de redes sociales", agents: 4 },
  { id: "email-automation-master", name: "Email Automation", icon: "📧", desc: "Automatización de email marketing", agents: 5 },
  { id: "multi-channel-attribution", name: "Attribution", icon: "📊", desc: "Atribución multi-canal", agents: 4 },
  { id: "competitive-intelligence-hub", name: "Competitive Intel", icon: "🔍", desc: "Inteligencia competitiva", agents: 4 },
  { id: "ab-testing-experimentation", name: "A/B Testing", icon: "🧪", desc: "Experimentación y testing", agents: 4 },
  { id: "influencer-partnership-engine", name: "Influencer Engine", icon: "⭐", desc: "Gestión de influencers", agents: 4 },
];

export default function WorkflowsPage() {
  return (
    <div style={{ padding: 40, backgroundColor: "#0a0f1c", minHeight: "100vh" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#f8fafc", margin: 0 }}>🚀 Marketing Workflows</h1>
        <p style={{ color: "#94a3b8", marginTop: 8 }}>10 workflows de automatización con IA</p>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {WORKFLOWS.map((wf) => (
          <Link key={wf.id} href={"/workflows/" + wf.id} style={{ textDecoration: "none" }}>
            <div style={{
              backgroundColor: "rgba(30,41,59,0.5)",
              border: "1px solid rgba(51,65,85,0.5)",
              borderRadius: 16,
              padding: 24,
              cursor: "pointer",
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 40 }}>{wf.icon}</span>
                <span style={{
                  backgroundColor: "rgba(34,197,94,0.2)",
                  color: "#22c55e",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600
                }}>{wf.agents} agentes</span>
              </div>
              <h3 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 600, margin: "16px 0 8px 0" }}>{wf.name}</h3>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{wf.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

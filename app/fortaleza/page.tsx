"use client";
import { useState } from "react";

const AGENTS = [
  { id: "fortaleza-analyzer", name: "Analizador de Fortaleza", desc: "Analiza la fortaleza financiera" },
  { id: "stress-tester", name: "Stress Tester", desc: "Pruebas de estres financiero" },
];

export default function FortalezaPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const executeAgent = async (agentId: string) => {
    setLoading(true);
    setShowModal(true);
    try {
      const url = "https://nadakki-ai-suite.onrender.com/agents/fortaleza/" + agentId + "/execute";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_data: { test: true }, tenant_id: "credicefi" })
      });
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, backgroundColor: "#0a0f1c", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f8fafc", marginBottom: 24 }}>Fortaleza Financiera</h1>
      <p style={{ color: "#94a3b8", marginBottom: 32 }}>Analisis de fortaleza y pruebas de estres</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {AGENTS.map((agent) => (
          <div key={agent.id} style={{ backgroundColor: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.5)", borderRadius: 16, padding: 24 }}>
            <h3 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 600, margin: "0 0 8px 0" }}>{agent.name}</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px 0" }}>{agent.desc}</p>
            <button onClick={() => executeAgent(agent.id)} disabled={loading} style={{
              width: "100%", padding: 12, backgroundColor: loading ? "#64748b" : "#8b5cf6",
              border: "none", borderRadius: 8, color: "white", fontWeight: 600, cursor: loading ? "wait" : "pointer"
            }}>{loading ? "Ejecutando..." : "Ejecutar"}</button>
          </div>
        ))}
      </div>
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 24, maxWidth: 600, width: "90%", maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "#f8fafc", marginBottom: 16 }}>Resultado</h3>
            <pre style={{ color: "#f8fafc", fontSize: 12, whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>
            <button onClick={() => setShowModal(false)} style={{ marginTop: 16, padding: "8px 16px", backgroundColor: "#64748b", border: "none", borderRadius: 6, color: "white", cursor: "pointer" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

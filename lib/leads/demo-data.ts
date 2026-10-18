/**
 * Datos de demostracion fijos de Lead Management. No hay endpoint del tenant
 * para leads/pipeline/scoring (PS-6-DEMO-LEADS), asi que todo lo que sale de
 * aqui se renderiza dentro de <DemoPanel> con badge DEMO (AGENT_CONTRACT §3).
 */
export const ROTULO_DEMO = "DEMO — datos de ejemplo, no son de tu cuenta";

export const DEMO_KPIS = [
  { key: "total", value: "1,234", label: "Total Leads", color: "#3b82f6" },
  { key: "hot", value: "234", label: "Hot Leads", color: "#ef4444" },
  { key: "conv", value: "87%", label: "Conversion", color: "#22c55e" },
  { key: "score", value: "4.2", label: "Avg Score", color: "#f59e0b" },
];

export const DEMO_STAGES = [
  { name: "Nuevo", count: 45, value: "$125K", color: "#3b82f6" },
  { name: "Contactado", count: 32, value: "$89K", color: "#8b5cf6" },
  { name: "Calificado", count: 18, value: "$67K", color: "#f59e0b" },
  { name: "Propuesta", count: 12, value: "$45K", color: "#ec4899" },
  { name: "Negociacion", count: 8, value: "$32K", color: "#22c55e" },
];

export const DEMO_LEADS = [
  { name: "Carlos Garcia", company: "Tech Solutions", score: 92, status: "hot" },
  { name: "Maria Lopez", company: "Startup Inc", score: 85, status: "warm" },
  { name: "Juan Perez", company: "Corp MX", score: 78, status: "warm" },
  { name: "Ana Martinez", company: "Fintech Pro", score: 95, status: "hot" },
  { name: "Roberto Silva", company: "Digital Agency", score: 65, status: "cold" },
];

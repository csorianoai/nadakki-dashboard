"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { name: "Hub", href: "/marketing", icon: "🚀", color: "#8b5cf6" },
  { name: "Templates", href: "/marketing/templates", icon: "📝", color: "#f59e0b" },
  { name: "Segmentos", href: "/marketing/segments", icon: "🎯", color: "#22c55e" },
  { name: "Journeys", href: "/marketing/journeys", icon: "🗺️", color: "#8b5cf6" },
  { name: "Analytics", href: "/marketing/analytics", icon: "📊", color: "#06b6d4" },
  { name: "Integraciones", href: "/marketing/integrations", icon: "🔌", color: "#14b8a6" },
  { name: "Campaigns", href: "/marketing/campaigns", icon: "📢", color: "#f59e0b" },
  {
    name: "A/B (beta)",
    href: "/marketing/ab-testing",
    icon: "🔬",
    color: "#64748b",
    title: "Beta local: solo este navegador, sin API de experimentos en backend",
  },
  { name: "Agentes", href: "/marketing/agents", icon: "🤖", color: "#ec4899" },
] as const;

export default function MarketingNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          backgroundColor: "rgba(100,116,139,0.2)", border: "1px solid rgba(100,116,139,0.3)",
          borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: 500,
        }}>
          <span style={{ fontSize: 16 }}>←</span> Atrás
        </button>
        <button onClick={() => router.forward()} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          backgroundColor: "rgba(100,116,139,0.2)", border: "1px solid rgba(100,116,139,0.3)",
          borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: 500,
        }}>
          Adelante <span style={{ fontSize: 16 }}>→</span>
        </button>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <button style={{
              padding: "8px 16px", backgroundColor: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8,
              color: "#3b82f6", cursor: "pointer", fontSize: 14, fontWeight: 500,
            }}>🏠 Dashboard</button>
          </Link>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const title = "title" in item ? item.title : undefined;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }} title={title}>
              <button style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                backgroundColor: isActive ? item.color : `${item.color}15`,
                border: `2px solid ${isActive ? item.color : item.color + "40"}`,
                borderRadius: 12, color: isActive ? "white" : item.color,
                cursor: "pointer", fontSize: 14, fontWeight: 600,
              }}>
                <span>{item.icon}</span> <span>{item.name}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

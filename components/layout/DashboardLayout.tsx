"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import AgentCountDisplay from "./AgentCountDisplay";

interface NavModule {
  id: string;
  icon: string;
  label: string;
  href: string;
  badge?: number | string;
}
interface NavCore {
  id: string;
  title: string;
  icon: string;
  color: string;
  gradient: string;
  modules: NavModule[];
}

const navigationStructure: NavCore[] = [
  {
    id: "system",
    title: "SISTEMA",
    icon: "🚀",
    color: "#00d4ff",
    gradient: "linear-gradient(135deg, #00d4ff, #0099cc)",
    modules: [
      { id: "dashboard", icon: "🏠", label: "Dashboard Principal", href: "/", badge: "∞" },
      { id: "tenants", icon: "🏢", label: "Multi-Tenant", href: "/tenants", badge: "NEW" },
      { id: "settings", icon: "⚙️", label: "Configuración", href: "/settings" },
      { id: "agents-execute", icon: "▶️", label: "Ejecutar Agentes", href: "/agents/execute", badge: "42" },
    ],
  },

  {
    id: "advertising",
    title: "PUBLICIDAD",
    icon: "📢",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    modules: [
      { id: "advertising-hub", icon: "📣", label: "Publicidad (Hub)", href: "/advertising" },
      { id: "google-ads", icon: "🔎", label: "Google Ads", href: "/advertising/google-ads", badge: "MVP" },
      { id: "meta-ads", icon: "📘", label: "Meta Ads", href: "/advertising/meta-ads" },
      { id: "tiktok-ads", icon: "🎵", label: "TikTok Ads", href: "/advertising/tiktok-ads" },
      { id: "linkedin-ads", icon: "💼", label: "LinkedIn Ads", href: "/advertising/linkedin-ads" },
    ],
  },

  {
    id: "workflows",
    title: "WORKFLOWS",
    icon: "🔄",
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg, #8B5CF6, #6366F1)",
    modules: [
      { id: "wf-all", icon: "📋", label: "Todos los Workflows", href: "/workflows", badge: "10" },
      { id: "wf-campaign", icon: "📢", label: "Campaign Optimization", href: "/workflows/campaign-optimization" },
      { id: "wf-acquisition", icon: "🎯", label: "Customer Acquisition", href: "/workflows/customer-acquisition-intelligence" },
      { id: "wf-lifecycle", icon: "♻️", label: "Customer Lifecycle", href: "/workflows/customer-lifecycle-revenue" },
      { id: "wf-content", icon: "📝", label: "Content Performance", href: "/workflows/content-performance-engine" },
      { id: "wf-social", icon: "📱", label: "Social Intelligence", href: "/workflows/social-media-intelligence" },
      { id: "wf-email", icon: "✉️", label: "Email Automation", href: "/workflows/email-automation-master" },
      { id: "wf-attribution", icon: "📊", label: "Multi-Channel Attribution", href: "/workflows/multi-channel-attribution" },
      { id: "wf-competitive", icon: "🔍", label: "Competitive Intel", href: "/workflows/competitive-intelligence-hub" },
      { id: "wf-abtesting", icon: "🧪", label: "A/B Testing", href: "/workflows/ab-testing-experimentation" },
      { id: "wf-influencer", icon: "⭐", label: "Influencer Engine", href: "/workflows/influencer-partnership-engine" },
    ],
  },

  {
    id: "marketing",
    title: "MARKETING",
    icon: "🎯",
    color: "#F97316",
    gradient: "linear-gradient(135deg, #F97316, #EA580C)",
    modules: [
      { id: "mkt-all", icon: "🎯", label: "Marketing Hub", href: "/marketing", badge: "42" },
      { id: "mkt-agents", icon: "🤖", label: "Agentes", href: "/marketing/agents" },
      { id: "mkt-campaigns", icon: "📢", label: "Campañas", href: "/marketing/campaigns" },
      { id: "mkt-leads", icon: "📈", label: "Lead Management", href: "/marketing/leads" },
      { id: "mkt-content", icon: "✍️", label: "Content Generation", href: "/marketing/content" },
      { id: "mkt-social", icon: "📱", label: "Social Media", href: "/marketing/social" },
      { id: "mkt-google-ads", icon: "📊", label: "Google Ads", href: "/marketing/google-ads" },
      { id: "mkt-attribution", icon: "🔗", label: "Attribution", href: "/marketing/attribution" },
      { id: "mkt-ab-testing", icon: "🧪", label: "A/B Testing", href: "/marketing/ab-testing" },
      { id: "mkt-predictive", icon: "🔮", label: "Predictive", href: "/marketing/predictive" },
      { id: "mkt-analytics", icon: "📊", label: "Analytics", href: "/marketing/analytics" },
    ],
  },

  {
    id: "admin",
    title: "ADMIN",
    icon: "🛠️",
    color: "#6366F1",
    gradient: "linear-gradient(135deg, #6366F1, #4F46E5)",
    modules: [
      { id: "admin-main", icon: "🛠️", label: "Panel Admin", href: "/admin" },
      { id: "admin-agents", icon: "🤖", label: "Gestión Agentes", href: "/admin/agents" },
      { id: "admin-logs", icon: "📜", label: "Logs", href: "/admin/logs" },
      { id: "admin-compliance", icon: "🛡️", label: "Compliance", href: "/compliance" },
      { id: "admin-testing", icon: "🧪", label: "Testing Lab", href: "/testing" },
    ],
  },
];

const colors = {
  bg: {
    primary: "#0a0f1c",
    sidebar: "rgba(26, 31, 46, 0.98)",
  },
  border: {
    subtle: "rgba(51, 65, 85, 0.5)",
  },
  text: {
    primary: "#f8fafc",
    secondary: "#94a3b8",
    muted: "#64748b",
  },
};

function NavItem({
  module,
  coreColor,
  isActive,
}: {
  module: NavModule;
  coreColor: string;
  isActive: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={module.href} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px 8px 20px",
          margin: "1px 6px",
          borderRadius: "8px",
          cursor: "pointer",
          backgroundColor: isActive
            ? `${coreColor}25`
            : isHovered
            ? "rgba(51, 65, 85, 0.4)"
            : "transparent",
          borderLeft: isActive ? `3px solid ${coreColor}` : "3px solid transparent",
        }}
      >
        <span style={{ fontSize: "14px" }}>{module.icon}</span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: isActive ? 600 : 400,
            color: isActive ? coreColor : colors.text.secondary,
            flex: 1,
          }}
        >
          {module.label}
        </span>
        {module.badge && (
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              padding: "2px 5px",
              borderRadius: "8px",
              backgroundColor: "rgba(255,255,255,0.08)",
              color: colors.text.muted,
            }}
          >
            {module.badge}
          </span>
        )}
      </div>
    </Link>
  );
}

function CoreSection({
  core,
  currentPath,
  isExpanded,
  onToggle,
}: {
  core: NavCore;
  currentPath: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hasActiveModule = core.modules.some(
    (m) => currentPath === m.href || (m.href !== "/" && currentPath.startsWith(m.href))
  );

  return (
    <div
      style={{
        margin: "3px 6px",
        borderRadius: "10px",
        backgroundColor: isExpanded ? `${core.color}08` : "transparent",
        border: `1px solid ${isExpanded ? `${core.color}25` : "transparent"}`,
      }}
    >
      <div
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          cursor: "pointer",
          backgroundColor: isHovered ? `${core.color}15` : "transparent",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background:
              isExpanded || hasActiveModule ? core.gradient : "rgba(51, 65, 85, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
          }}
        >
          {core.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: isExpanded ? core.color : colors.text.secondary,
              textTransform: "uppercase",
            }}
          >
            {core.title}
          </div>
        </div>
        <span
          style={{
            fontSize: "9px",
            color: colors.text.muted,
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        >
          ▼
        </span>
      </div>

      <div
        style={{
          maxHeight: isExpanded ? "600px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        {core.modules.map((module) => (
          <NavItem
            key={module.id}
            module={module}
            coreColor={core.color}
            isActive={
              currentPath === module.href ||
              (module.href !== "/" && currentPath.startsWith(module.href))
            }
          />
        ))}
      </div>
    </div>
  );
}

function TopNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment
      .charAt(0)
      .toUpperCase()
      .concat(segment.slice(1))
      .replace(/-/g, " ");
    return { href, label };
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        backgroundColor: "rgba(26, 31, 46, 0.8)",
        borderBottom: "1px solid rgba(51, 65, 85, 0.5)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            backgroundColor: "rgba(51, 65, 85, 0.5)",
            border: "1px solid rgba(51, 65, 85, 0.8)",
            color: "#94a3b8",
            cursor: "pointer",
          }}
          title="Retroceder"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => router.forward()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            backgroundColor: "rgba(51, 65, 85, 0.5)",
            border: "1px solid rgba(51, 65, 85, 0.8)",
            color: "#94a3b8",
            cursor: "pointer",
          }}
          title="Avanzar"
        >
          <ChevronRight size={20} />
        </button>

        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            backgroundColor: "rgba(51, 65, 85, 0.5)",
            border: "1px solid rgba(51, 65, 85, 0.8)",
            color: "#94a3b8",
            cursor: "pointer",
            textDecoration: "none",
          }}
          title="Ir al Home"
        >
          <Home size={20} />
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "12px" }}>
        {breadcrumbs.length === 0 ? (
          <span>Home</span>
        ) : (
          breadcrumbs.map((b, idx) => (
            <span key={b.href}>
              {idx > 0 ? " / " : ""}
              <Link href={b.href} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {b.label}
              </Link>
            </span>
          ))
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "11px", color: "#94a3b8" }}>Tenant: NADAKKI Demo</div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [expandedCores, setExpandedCores] = useState<string[]>(["system", "advertising", "workflows"]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleCore = (coreId: string) =>
    setExpandedCores((prev) =>
      prev.includes(coreId) ? prev.filter((id) => id !== coreId) : [...prev, coreId]
    );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: colors.bg.primary }}>
      <aside
        style={{
          width: sidebarOpen ? 280 : 0,
          
          pointerEvents: sidebarOpen ? "auto" : "none",
backgroundColor: colors.bg.sidebar,
          borderRight: `1px solid ${colors.border.subtle}`,
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s ease",
          zIndex: 40,
        }}
      >
        <div
          style={{
            padding: "16px 14px",
            borderBottom: `1px solid ${colors.border.subtle}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            🚀
          </div>
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 800,
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              NADAKKI AI
            </div>
            <div style={{ fontSize: "8px", color: colors.text.muted }}>Enterprise Suite</div>
          </div>
        </div>

        <div
          style={{
            padding: "8px 10px",
            margin: "10px",
            borderRadius: "8px",
            background: "rgba(139, 92, 246, 0.1)",
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#a78bfa" }}>
              <AgentCountDisplay />
            </div>
            <div style={{ fontSize: "7px", color: colors.text.muted }}>AGENTES</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#34d399" }}>20</div>
            <div style={{ fontSize: "7px", color: colors.text.muted }}>CORES</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#60a5fa" }}>10</div>
            <div style={{ fontSize: "7px", color: colors.text.muted }}>WORKFLOWS</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "2px 0", overflowY: "auto" }}>
          {navigationStructure.map((core) => (
            <CoreSection
              key={core.id}
              core={core}
              currentPath={pathname}
              isExpanded={expandedCores.includes(core.id)}
              onToggle={() => toggleCore(core.id)}
            />
          ))}
        </nav>

        <div style={{ padding: "10px", borderTop: `1px solid ${colors.border.subtle}` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 10px",
              borderRadius: "8px",
              background: "rgba(51, 65, 85, 0.3)",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              🧠
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: colors.text.primary }}>
                NADAKKI Demo
              </div>
              <div style={{ fontSize: "8px", color: colors.text.muted }}>Pro Plan</div>
            </div>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#26de81" }} />
          </div>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          paddingLeft: sidebarOpen ? 280 : 0,
          minHeight: "100vh",
          transition: "padding-left 0.3s ease",
        }}
      >
        <TopNavigation />
        <div style={{ minHeight: "calc(100vh - 61px)" }}>{children}</div>
      </main>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          backgroundColor: "#8B5CF6",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
          zIndex: 50,
        }}
        title="Abrir/cerrar menú"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}





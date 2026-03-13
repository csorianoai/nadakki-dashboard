"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Rocket,
  Building2,
  Settings,
  PlayCircle,
  ClipboardList,
  Inbox,
  FolderOpen,
  Upload,
  ScrollText,
  Megaphone,
  Search,
  BookOpen,
  Music,
  Briefcase,
  RefreshCw,
  Target,
  Recycle,
  PenLine,
  Smartphone,
  Mail,
  BarChart3,
  FlaskConical,
  Star,
  Bot,
  TrendingUp,
  Paintbrush,
  Link2,
  Wrench,
  Shield,
  CheckCircle,
  Brain,
  Activity,
  Eye,
  Users,
  FileBarChart,
  Lock,
} from "lucide-react";
import AgentCountDisplay from "./AgentCountDisplay";
import TenantSelector from "@/components/ui/TenantSelector";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

interface NavModule {
  id: string;
  icon: ReactNode;
  label: string;
  href: string;
  badge?: number | string;
}
interface NavCore {
  id: string;
  title: string;
  icon: ReactNode;
  color: string;
  gradient: string;
  modules: NavModule[];
}

const navigationStructure: NavCore[] = [
  {
    id: "system",
    title: "SISTEMA",
    icon: <Rocket size={14} />,
    color: "#00d4ff",
    gradient: "linear-gradient(135deg, #00d4ff, #0099cc)",
    modules: [
      { id: "dashboard", icon: <Home size={14} />, label: "Dashboard Principal", href: "/" },
      { id: "live-panel", icon: <Activity size={14} />, label: "Live Panel", href: "/agents/live" },
      { id: "tenants", icon: <Building2 size={14} />, label: "Multi-Tenant", href: "/tenants", badge: "NEW" },
      { id: "settings", icon: <Settings size={14} />, label: "Configuracion", href: "/settings" },
      { id: "agents-execute", icon: <PlayCircle size={14} />, label: "Ejecutar Agentes", href: "/agents/execute" },
    ],
  },

  {
    id: "sic",
    title: "SIC — RIESGO CREDITICIO",
    icon: <ClipboardList size={14} />,
    color: "#0ea5e9",
    gradient: "linear-gradient(135deg, #0ea5e9, #0284c7)",
    modules: [
      { id: "sic-home", icon: <Home size={14} />, label: "Inicio SIC", href: "/sic" },
      { id: "sic-metricas", icon: <BarChart3 size={14} />, label: "Metricas", href: "/sic/metricas" },
      { id: "sic-bandeja", icon: <Inbox size={14} />, label: "Bandeja", href: "/sic/bandeja" },
      { id: "sic-expedientes", icon: <FolderOpen size={14} />, label: "Expedientes", href: "/sic/expedientes" },
      { id: "sic-comite", icon: <Users size={14} />, label: "Comite", href: "/sic/comite" },
      { id: "sic-portafolio", icon: <Briefcase size={14} />, label: "Portafolio", href: "/sic/portafolio" },
      { id: "sic-reportes", icon: <FileBarChart size={14} />, label: "Reportes", href: "/sic/reportes" },
      { id: "sic-exportaciones", icon: <Upload size={14} />, label: "Exportaciones", href: "/sic/exportaciones" },
      { id: "sic-auditoria", icon: <ScrollText size={14} />, label: "Auditoria", href: "/sic/auditoria" },
      { id: "sic-auditoria-acceso", icon: <Lock size={14} />, label: "Auditoria Acceso", href: "/sic/auditoria-acceso" },
      { id: "sic-configuracion", icon: <Settings size={14} />, label: "Configuracion", href: "/sic/configuracion" },
      { id: "sic-demo", icon: <PlayCircle size={14} />, label: "Demo", href: "/sic/demo" },
    ],
  },

  {
    id: "advertising",
    title: "PUBLICIDAD",
    icon: <Megaphone size={14} />,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    modules: [
      { id: "advertising-hub", icon: <Megaphone size={14} />, label: "Publicidad (Hub)", href: "/advertising" },
      { id: "google-ads", icon: <Search size={14} />, label: "Google Ads", href: "/advertising/google-ads", badge: "MVP" },
      { id: "meta-ads", icon: <BookOpen size={14} />, label: "Meta Ads", href: "/advertising/meta-ads" },
      { id: "tiktok-ads", icon: <Music size={14} />, label: "TikTok Ads", href: "/advertising/tiktok-ads" },
      { id: "linkedin-ads", icon: <Briefcase size={14} />, label: "LinkedIn Ads", href: "/advertising/linkedin-ads" },
    ],
  },

  {
    id: "workflows",
    title: "WORKFLOWS",
    icon: <RefreshCw size={14} />,
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg, #8B5CF6, #6366F1)",
    modules: [
      { id: "wf-all", icon: <ClipboardList size={14} />, label: "Todos los Workflows", href: "/workflows", badge: "10" },
      { id: "wf-campaign", icon: <Megaphone size={14} />, label: "Campaign Optimization", href: "/workflows/campaign-optimization" },
      { id: "wf-acquisition", icon: <Target size={14} />, label: "Customer Acquisition", href: "/workflows/customer-acquisition-intelligence" },
      { id: "wf-lifecycle", icon: <Recycle size={14} />, label: "Customer Lifecycle", href: "/workflows/customer-lifecycle-revenue" },
      { id: "wf-content", icon: <PenLine size={14} />, label: "Content Performance", href: "/workflows/content-performance-engine" },
      { id: "wf-social", icon: <Smartphone size={14} />, label: "Social Intelligence", href: "/workflows/social-media-intelligence" },
      { id: "wf-email", icon: <Mail size={14} />, label: "Email Automation", href: "/workflows/email-automation-master" },
      { id: "wf-attribution", icon: <BarChart3 size={14} />, label: "Multi-Channel Attribution", href: "/workflows/multi-channel-attribution" },
      { id: "wf-competitive", icon: <Eye size={14} />, label: "Competitive Intel", href: "/workflows/competitive-intelligence-hub" },
      { id: "wf-abtesting", icon: <FlaskConical size={14} />, label: "A/B Testing", href: "/workflows/ab-testing-experimentation" },
      { id: "wf-influencer", icon: <Star size={14} />, label: "Influencer Engine", href: "/workflows/influencer-partnership-engine" },
    ],
  },

  {
    id: "marketing",
    title: "MARKETING",
    icon: <Target size={14} />,
    color: "#F97316",
    gradient: "linear-gradient(135deg, #F97316, #EA580C)",
    modules: [
      { id: "mkt-all", icon: <Target size={14} />, label: "Marketing Hub", href: "/marketing" },
      { id: "mkt-agents", icon: <Bot size={14} />, label: "Agentes", href: "/marketing/agents" },
      { id: "mkt-campaigns", icon: <Megaphone size={14} />, label: "Campanas", href: "/marketing/campaigns" },
      { id: "mkt-leads", icon: <TrendingUp size={14} />, label: "Lead Management", href: "/marketing/leads" },
      { id: "mkt-content", icon: <Paintbrush size={14} />, label: "Content Generation", href: "/marketing/content" },
      { id: "mkt-social", icon: <Smartphone size={14} />, label: "Social Media", href: "/marketing/social" },
      { id: "mkt-google-ads", icon: <BarChart3 size={14} />, label: "Google Ads", href: "/marketing/google-ads" },
      { id: "mkt-social-connections", icon: <Link2 size={14} />, label: "Social Connections", href: "/marketing/social-connections" },
      { id: "mkt-attribution", icon: <Link2 size={14} />, label: "Attribution", href: "/marketing/attribution" },
      { id: "mkt-ab-testing", icon: <FlaskConical size={14} />, label: "A/B Testing", href: "/marketing/ab-testing" },
      { id: "mkt-predictive", icon: <Brain size={14} />, label: "Predictive", href: "/marketing/predictive" },
      { id: "mkt-analytics", icon: <BarChart3 size={14} />, label: "Analytics", href: "/marketing/analytics" },
    ],
  },

  {
    id: "admin",
    title: "ADMIN",
    icon: <Wrench size={14} />,
    color: "#6366F1",
    gradient: "linear-gradient(135deg, #6366F1, #4F46E5)",
    modules: [
      { id: "admin-main", icon: <Wrench size={14} />, label: "Panel Admin", href: "/admin" },
      { id: "admin-agents", icon: <Bot size={14} />, label: "Gestion Agentes", href: "/admin/agents" },
      { id: "admin-logs", icon: <ScrollText size={14} />, label: "Logs", href: "/admin/logs" },
      { id: "admin-compliance", icon: <Shield size={14} />, label: "Compliance", href: "/compliance" },
      { id: "admin-testing", icon: <FlaskConical size={14} />, label: "Testing Lab", href: "/testing" },
      { id: "admin-qa", icon: <CheckCircle size={14} />, label: "QA Piloto", href: "/admin/qa" },
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
        <TenantSelector />
      </div>
    </div>
  );
}

/* Paths that work without global tenant (e.g. Live Panel has own tenant selector). live-panel same visibility as agents-execute. */
const NO_TENANT_PATHS = ["/tenants", "/agents/live"];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { tenantId } = useTenant();
  const { logout } = useAuth();
  const [expandedCores, setExpandedCores] = useState<string[]>(["system", "sic", "advertising", "workflows"]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const needsTenant = !NO_TENANT_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const blocked = needsTenant && !tenantId;

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
            <Rocket size={18} color="#fff" />
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
              <Brain size={14} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <TenantSelector />
              <div style={{ fontSize: "8px", color: colors.text.muted }}>Pro Plan</div>
              <button
                onClick={logout}
                style={{ marginTop: "4px", fontSize: "10px", color: "#94a3b8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Cerrar sesion
              </button>
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
        <div style={{ minHeight: "calc(100vh - 61px)" }}>
          {blocked ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "calc(100vh - 61px)",
                padding: "24px",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "16px", marginBottom: "8px" }}>
                Selecciona un tenant para continuar
              </p>
              <p style={{ fontSize: "12px" }}>
                Usa el selector de tenant en la barra superior o en el menu lateral.
              </p>
              <Link
                href="/tenants"
                style={{
                  marginTop: "16px",
                  color: "#8b5cf6",
                  textDecoration: "underline",
                  fontSize: "14px",
                }}
              >
                Ir a Multi-Tenant
              </Link>
            </div>
          ) : (
            children
          )}
        </div>
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
        title="Abrir/cerrar menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}





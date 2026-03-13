"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import AgentCountDisplay from "@/components/layout/AgentCountDisplay";
import {
  LayoutDashboard,
  Building2,
  Bot,
  PlayCircle,
  FileText,
  Megaphone,
  PenSquare,
  Share2,
  Link2,
  Briefcase,
  Inbox,
  FolderOpen,
  Users2,
  BarChart3,
  Download,
  Shield,
  Settings,
  Presentation,
  BadgeDollarSign,
  UserCog,
  CreditCard,
  Activity,
  KeyRound,
  Server,
} from "lucide-react";

interface NavModule {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
  isNew?: boolean;
}

interface NavCore {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  modules: NavModule[];
}

const NAV: NavCore[] = [
  {
    id: "system",
    title: "SISTEMA",
    icon: <Settings size={18} />,
    color: "#00d4ff",
    modules: [
      { id: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard Principal", href: "/" },
      { id: "tenants", icon: <Building2 size={16} />, label: "Multi-Tenant", href: "/tenants" },
      { id: "agents", icon: <Bot size={16} />, label: "Agentes IA", href: "/agents" },
      { id: "agents-execute", icon: <PlayCircle size={16} />, label: "Ejecutar Agentes", href: "/agents/execute" },
      { id: "reports", icon: <FileText size={16} />, label: "Reports", href: "/reports" },
    ],
  },
  {
    id: "marketing",
    title: "MARKETING",
    icon: <Megaphone size={18} />,
    color: "#10b981",
    modules: [
      { id: "marketing-hub", icon: <Megaphone size={16} />, label: "Marketing", href: "/marketing" },
      { id: "advertising", icon: <Megaphone size={16} />, label: "Publicidad", href: "/advertising" },
      { id: "content", icon: <PenSquare size={16} />, label: "Contenido", href: "/content" },
      { id: "social", icon: <Share2 size={16} />, label: "Redes Sociales", href: "/social" },
      { id: "marketing-social-connections", icon: <Link2 size={16} />, label: "Social Connections", href: "/marketing/social-connections" },
    ],
  },
  {
    id: "sic",
    title: "SIC",
    icon: <Briefcase size={18} />,
    color: "#2563eb",
    modules: [
      { id: "sic-home", icon: <Briefcase size={16} />, label: "SIC Inicio", href: "/sic" },
      { id: "sic-bandeja", icon: <Inbox size={16} />, label: "Bandeja", href: "/sic/bandeja" },
      { id: "sic-expedientes", icon: <FolderOpen size={16} />, label: "Expedientes", href: "/sic/expedientes" },
      { id: "sic-comite", icon: <Users2 size={16} />, label: "Comite", href: "/sic/comite" },
      { id: "sic-metricas", icon: <BarChart3 size={16} />, label: "Metricas", href: "/sic/metricas" },
      { id: "sic-portafolio", icon: <Briefcase size={16} />, label: "Portafolio", href: "/sic/portafolio" },
      { id: "sic-exportaciones", icon: <Download size={16} />, label: "Exportaciones", href: "/sic/exportaciones" },
      { id: "sic-auditoria", icon: <Shield size={16} />, label: "Auditoria", href: "/sic/auditoria" },
      { id: "sic-configuracion", icon: <Settings size={16} />, label: "Configuracion", href: "/sic/configuracion" },
      { id: "sic-demo", icon: <Presentation size={16} />, label: "Demo", href: "/sic/demo" },
    ],
  },
  {
    id: "sales",
    title: "VENTAS",
    icon: <BadgeDollarSign size={18} />,
    color: "#f59e0b",
    modules: [
      { id: "crm", icon: <Building2 size={16} />, label: "CRM", href: "/sales/crm" },
      { id: "leads", icon: <Users2 size={16} />, label: "Leads", href: "/sales/leads" },
    ],
  },
  {
    id: "admin",
    title: "ADMIN",
    icon: <UserCog size={18} />,
    color: "#8b5cf6",
    modules: [
      { id: "admin-gates", icon: <Shield size={16} />, label: "Gates", href: "/admin/gates" },
      { id: "admin-config", icon: <Settings size={16} />, label: "Config", href: "/admin/config" },
      { id: "admin-billing", icon: <CreditCard size={16} />, label: "Billing", href: "/admin/billing" },
      { id: "admin-usage", icon: <Activity size={16} />, label: "Usage", href: "/admin/usage" },
      { id: "admin-api-keys", icon: <KeyRound size={16} />, label: "API Keys", href: "/admin/api-keys" },
      { id: "admin-system", icon: <Server size={16} />, label: "System", href: "/admin/system" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-text">NADAKKI AI</span>
      </div>

      <AgentCountDisplay showLabel={true} className="px-4 py-2" />

      <nav className="sidebar-nav">
        {NAV.map((core) => (
          <div key={core.id} className="nav-section">
            <div className="nav-section-header" style={{ color: core.color }}>
              <span>{core.icon}</span>
              <span>{core.title}</span>
            </div>

            {core.modules.map((mod) => (
              <Link
                key={mod.id}
                href={mod.href}
                className={`nav-item ${isActive(mod.href) ? "active" : ""}`}
              >
                <span className="nav-icon">{mod.icon}</span>
                <span className="nav-label">{mod.label}</span>
                {mod.badge && <span className="nav-badge">{mod.badge}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <ThemeSwitcher />
    </aside>
  );
}
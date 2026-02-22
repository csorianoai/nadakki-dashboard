"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";

interface NavModule { id: string; icon: string; label: string; href: string; badge?: string; isNew?: boolean; }
interface NavCore { id: string; title: string; icon: string; color: string; modules: NavModule[]; }

const NAV: NavCore[] = [
  { id: "system", title: "SISTEMA", icon: "[SYS]", color: "#00d4ff", modules: [
    { id: "dashboard", icon: "[D]", label: "Dashboard Principal", href: "/" },
    { id: "tenants", icon: "[T]", label: "Multi-Tenant", href: "/tenants" },
    { id: "agents", icon: "[A]", label: "Agentes IA", href: "/agents" },
    { id: "agents-execute", icon: "[E]", label: "Ejecutar Agentes", href: "/agents/execute" },
    { id: "reports", icon: "[R]", label: "Reports", href: "/reports" },
  ]},
  { id: "marketing", title: "MARKETING", icon: "[MKT]", color: "#10b981", modules: [
    { id: "marketing-hub", icon: "[M]", label: "Marketing", href: "/marketing" },
    { id: "advertising", icon: "[Ad]", label: "Publicidad", href: "/advertising" },
    { id: "content", icon: "[C]", label: "Contenido", href: "/content" },
    { id: "social", icon: "[S]", label: "Redes Sociales", href: "/social" },
    { id: "marketing-social-connections", icon: "[SC]", label: "Social Connections", href: "/marketing/social-connections" },
  ]},
  { id: "sales", title: "VENTAS", icon: "[VTA]", color: "#f59e0b", modules: [
    { id: "crm", icon: "[CRM]", label: "CRM", href: "/sales/crm" },
    { id: "leads", icon: "[L]", label: "Leads", href: "/sales/leads" },
  ]},
  { id: "admin", title: "ADMIN", icon: "[ADM]", color: "#8b5cf6", modules: [
    { id: "admin-gates", icon: "[G]", label: "Gates", href: "/admin/gates" },
    { id: "admin-config", icon: "[CF]", label: "Config", href: "/admin/config" },
    { id: "admin-billing", icon: "[B]", label: "Billing", href: "/admin/billing" },
    { id: "admin-usage", icon: "[U]", label: "Usage", href: "/admin/usage" },
    { id: "admin-api-keys", icon: "[K]", label: "API Keys", href: "/admin/api-keys" },
    { id: "admin-system", icon: "[SY]", label: "System", href: "/admin/system" },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo"><span className="logo-text">NADAKKI AI</span></div>
      <nav className="sidebar-nav">
        {NAV.map((core) => (
          <div key={core.id} className="nav-section">
            <div className="nav-section-header" style={{ color: core.color }}>
              <span>{core.icon}</span><span>{core.title}</span>
            </div>
            {core.modules.map((mod) => (
              <Link key={mod.id} href={mod.href} className={`nav-item ${pathname === mod.href ? "active" : ""}`}>
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
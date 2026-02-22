"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgents } from "@/app/hooks/useAgents";
import TenantSwitcher from "@/components/ui/TenantSwitcher";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import { useTheme } from "@/components/providers/ThemeProvider";
import AgentCountDisplay from "@/components/dashboard/AgentCountDisplay";

interface NavModule {
  id: string;
  icon: string;
  label: string;
  href: string;
  badge?: string;
  isNew?: boolean;
}

interface NavCore {
  id: string;
  title: string;
  icon: string;
  color: string;
  modules: NavModule[];
}

const navigationStructure: NavCore[] = [
  {
    id: "system",
    title: "SISTEMA",
    icon: "Ã°Å¸Å¡â¬",
    color: "#00d4ff",
    modules: [
      { id: "dashboard", icon: "Ã°Å¸âÅ ", label: "Dashboard Principal", href: "/" },
      { id: "tenants", icon: "Ã°Å¸âÂ¥", label: "Multi-Tenant", href: "/tenants" },
      { id: "agents", icon: "Ã°Å¸Â¤â", label: "Agentes IA", href: "/agents" },
      { id: "agents-execute", icon: "Ã¢Å¡â¢Ã¯Â¸Â", label: "Ejecutar Agentes", href: "/agents/execute" },
      { id: "reports", icon: "📊", label: "Reports", href: "/reports" },
    ],
  },
  {
    id: "marketing",
    title: "MARKETING",
    icon: "Ã°Å¸âË",
    color: "#10b981",
    modules: [
      { id: "marketing-hub", icon: "Ã°Å¸âÂ¢", label: "Marketing", href: "/marketing" },
      { id: "advertising", icon: "Ã°Å¸"Â¢", label: "Publicidad", href: "/advertising" },
      { id: "content", icon: "Ã°Å¸âÂ", label: "Contenido", href: "/content" },
      { id: "social", icon: "Ã°Å¸âÂ¬", label: "Redes Sociales", href: "/social" },
      { id: "marketing-social-connections", icon: "Ã°Å¸ââ", label: "Social Connections", href: "/marketing/social-connections" },
    ],
  },
  {
    id: "sales",
    title: "VENTAS",
    icon: "Ã°Å¸âÂ°",
    color: "#f59e0b",
    modules: [
      { id: "crm", icon: "Ã°Å¸âÅ¾", label: "CRM", href: "/sales/crm" },
      { id: "leads", icon: "Ã°Å¸Å½Â¯", label: "Leads", href: "/sales/leads" },
    ],
  },
  {
    id: "admin",
    title: "ADMIN",
    icon: "⚙️",
    color: "#8b5cf6",
    modules: [
      { id: "admin-gates", icon: "ð§", label: "Gates", href: "/admin/gates" },
      { id: "admin-config", icon: "⚙️", label: "Config", href: "/admin/config" },
      { id: "admin-db", icon: "ðï¸", label: "Database", href: "/admin/db" },
      { id: "admin-billing", icon: "ð³", label: "Billing", href: "/admin/billing" },
      { id: "admin-usage", icon: "📊", label: "Usage", href: "/admin/usage" },
      { id: "admin-api-keys", icon: "ð", label: "API Keys", href: "/admin/api-keys" },
      { id: "admin-system", icon: "ð¥ï¸", label: "System Info", href: "/admin/system" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  // Theme puede ser objeto o string segÃÂºn implementaciÃÂ³n.
  // NO comparamos Theme tipado con string directamente.
  const isDark =
    (typeof theme === "string" && theme === "dark") ||
    ((theme as any)?.mode === "dark") ||
    ((theme as any)?.name === "dark") ||
    ((theme as any)?.id === "dark");
const { agents, loading: isLoading } = useAgents();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeCore = navigationStructure.find((core) =>
    core.modules.some((module) => pathname?.startsWith(module.href))
  );

  return (
    <aside
      className={`fixed left-0 top-0 h-screen overflow-y-auto border-r transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } ${
        isDark
          ? "border-gray-800 bg-gradient-to-b from-gray-950 via-gray-900 to-black"
          : "border-gray-200 bg-gradient-to-b from-white to-gray-50"
      } p-4`}
    >
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600" />
              <h1 className="text-xl font-bold tracking-tight">NADAKKI</h1>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto rounded-lg p-2 hover:bg-gray-800"
            aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? "ÃÂ»" : "ÃÂ«"}
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Agent Count */}
            <div
              className={`rounded-lg p-3 ${
                isDark ? "bg-gray-900" : "bg-gray-100"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  <span className="text-sm text-gray-400">Cargando agentes...</span>
                </div>
              ) : (
                <AgentCountDisplay count={agents?.length || 0} />
              )}
            </div>

            {/* Tenant Switcher */}
            <TenantSwitcher />
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-4">
        {navigationStructure.map((core) => (
          <div key={core.id}>
            {!isCollapsed && (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {core.title}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {core.modules.map((module) => {
                const isActive = pathname === module.href;
                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 text-white"
                        : "hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-lg">{module.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{module.label}</span>
                        {module.badge && (
                          <span className="rounded-full bg-red-500 px-2 py-1 text-xs">
                            {module.badge}
                          </span>
                        )}
                        {module.isNew && (
                          <span className="rounded-full bg-green-500 px-2 py-1 text-xs">
                            Nuevo
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-3">
            <ThemeSwitcher />
          </div>
          <div className="text-xs text-gray-500">
            <div className="truncate">v1.0.0 Ã¢â¬Â¢ {agents?.length || 0} agentes activos</div>
          </div>
        </div>
      )}
    </aside>
  );
}




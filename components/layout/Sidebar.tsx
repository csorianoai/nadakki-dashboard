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
    icon: "🚀",
    color: "#00d4ff",
    modules: [
      { id: "dashboard", icon: "📊", label: "Dashboard Principal", href: "/" },
      { id: "tenants", icon: "👥", label: "Multi-Tenant", href: "/tenants" },
      { id: "agents", icon: "🤖", label: "Agentes IA", href: "/agents" },
    ],
  },
  {
    id: "marketing",
    title: "MARKETING",
    icon: "📈",
    color: "#10b981",
    modules: [
      { id: "advertising", icon: "📢", label: "Publicidad", href: "/advertising" },
      { id: "content", icon: "📝", label: "Contenido", href: "/content" },
      { id: "social", icon: "💬", label: "Redes Sociales", href: "/social" },
    ],
  },
  {
    id: "sales",
    title: "VENTAS",
    icon: "💰",
    color: "#f59e0b",
    modules: [
      { id: "crm", icon: "📞", label: "CRM", href: "/sales/crm" },
      { id: "leads", icon: "🎯", label: "Leads", href: "/sales/leads" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { data: agents, isLoading } = useAgents();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeCore = navigationStructure.find((core) =>
    core.modules.some((module) => pathname?.startsWith(module.href))
  );

  return (
    <aside
      className={`fixed left-0 top-0 h-screen overflow-y-auto border-r transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } ${
        theme === "dark"
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
            {isCollapsed ? "»" : "«"}
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Agent Count */}
            <div
              className={`rounded-lg p-3 ${
                theme === "dark" ? "bg-gray-900" : "bg-gray-100"
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
            <div className="truncate">v1.0.0 • {agents?.length || 0} agentes activos</div>
          </div>
        </div>
      )}
    </aside>
  );
}

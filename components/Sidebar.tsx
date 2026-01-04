"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Target, Bot, Workflow, BarChart3,
  Settings, Users, FileText, Shield, Scale, Banknote,
  Calculator, PhoneCall, Vault, Package, Truck,
  Brain, UserCircle, ChevronDown, ChevronRight,
  Sparkles, Building2, Menu, X
} from "lucide-react";

const MENU_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Marketing Hub", href: "/marketing", icon: Target, badge: "35" },
  { name: "AI Studio", href: "/ai-studio", icon: Sparkles },
  { name: "Workflows", href: "/workflows", icon: Workflow, badge: "10" },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  {
    name: "AI Cores",
    icon: Bot,
    children: [
      { name: "Originación", href: "/originacion", icon: Banknote },
      { name: "Decisión", href: "/decision", icon: Brain },
      { name: "Cobranza", href: "/cobranza", icon: PhoneCall },
      { name: "Contabilidad", href: "/contabilidad", icon: Calculator },
      { name: "Tesorería", href: "/tesoreria", icon: Vault },
      { name: "Legal", href: "/legal", icon: Scale },
      { name: "Compliance", href: "/compliance", icon: Shield },
      { name: "RRHH", href: "/rrhh", icon: Users },
      { name: "Logística", href: "/logistica", icon: Truck },
      { name: "Clientes", href: "/clientes", icon: UserCircle },
      { name: "Productos", href: "/productos", icon: Package },
    ]
  },
  {
    name: "Admin",
    icon: Settings,
    children: [
      { name: "Panel Admin", href: "/admin", icon: Settings },
      { name: "Agentes", href: "/admin/agents", icon: Bot },
      { name: "Logs", href: "/admin/logs", icon: FileText },
      { name: "Tenants", href: "/tenants", icon: Building2 },
      { name: "Configuración", href: "/settings", icon: Settings },
    ]
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["AI Cores"]);

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => 
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      className="h-screen bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed left-0 top-0 z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">NADAKKI</h1>
                <p className="text-xs text-gray-500">AI Suite v3.2</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5 text-gray-400" /> : <X className="w-5 h-5 text-gray-400" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {MENU_ITEMS.map((item) => (
          <div key={item.name} className="mb-1">
            {item.children ? (
              <>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    expandedMenus.includes(item.name) ? "bg-white/5 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{item.name}</span>
                      {expandedMenus.includes(item.name) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>
                <AnimatePresence>
                  {expandedMenus.includes(item.name) && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden ml-4 mt-1 space-y-1"
                    >
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href}>
                          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive(child.href) 
                              ? "bg-purple-500/20 text-purple-400 border-l-2 border-purple-500" 
                              : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                          }`}>
                            <child.icon className="w-4 h-4" />
                            <span>{child.name}</span>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive(item.href) 
                    ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white border border-purple-500/30" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}>
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.name}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
              C
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">CrediCefi</p>
              <p className="text-xs text-gray-500">Enterprise</p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

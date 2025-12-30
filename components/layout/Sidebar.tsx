'use client';

// components/layout/Sidebar.tsx - Enhanced with Enterprise Navigation
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CORES_CONFIG, CORE_CATEGORIES } from '@/config/cores';
import { cn } from '@/lib/utils';
import TenantSwitcher from '@/components/ui/TenantSwitcher';
import { useTenant } from '@/context/TenantContext';

// Enterprise navigation items
const ENTERPRISE_NAV = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊', href: '/' },
  { id: 'workflows', name: 'Workflows', icon: '🚀', href: '/workflows' },
  { id: 'decisions', name: 'Decisions', icon: '📋', href: '/decisions' },
  { id: 'admin', name: 'Admin', icon: '⚙️', href: '/admin', requiresAdmin: true },
];

// Category colors mapping (Tailwind-safe)
const CATEGORY_COLORS: Record<string, string> = {
  financial: 'bg-emerald-500',
  risk: 'bg-red-500',
  operational: 'bg-blue-500',
  intelligence: 'bg-purple-500',
  default: 'bg-gray-500',
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { isAdmin } = useTenant();

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 h-screen glass border-r border-glass-border z-50 transition-all duration-500',
        collapsed ? 'w-20' : 'w-80'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-6 -right-4 w-8 h-8 rounded-full glass border border-glass-border flex items-center justify-center hover:border-core-financial transition-colors z-50"
      >
        <span className={cn('transition-transform', collapsed ? 'rotate-180' : '')}>
          ←
        </span>
      </button>

      {/* Brand Header */}
      <div className="p-6 border-b border-glass-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-core-financial to-core-regtech flex items-center justify-center text-2xl">
            🧠
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-quantum text-xl font-bold gradient-text">NADAKKI</h1>
              <p className="text-xs text-gray-400 font-mono">CONSCIOUSNESS v5000</p>
            </div>
          )}
        </div>
      </div>

      {/* Tenant Switcher */}
      {!collapsed && <TenantSwitcher />}

      {/* Navigation */}
      <div className="overflow-y-auto h-[calc(100vh-280px)] py-4">
        {/* ENTERPRISE Section */}
        <div className="mb-6">
          {!collapsed && (
            <div className="px-6 py-2 text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
              Enterprise
            </div>
          )}
          {ENTERPRISE_NAV.map((item) => {
            // Skip admin if not authenticated
            if (item.requiresAdmin && !isAdmin) return null;
            
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-6 py-3 mx-2 rounded-lg transition-all',
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:bg-glass-bg hover:text-white'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-6 my-4 border-t border-glass-border"></div>

        {/* AI CORES Section */}
        {Object.entries(CORE_CATEGORIES).map(([categoryId, category]) => (
          <div key={categoryId} className="mb-6">
            {!collapsed && (
              <div className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.default)}></span>
                {category.name}
              </div>
            )}
            {category.cores?.map((coreId: string) => {
              const core = CORES_CONFIG[coreId];
              if (!core) return null;
              
              const isActive = pathname === `/${coreId}`;
              
              return (
                <Link
                  key={coreId}
                  href={`/${coreId}`}
                  className={cn(
                    'flex items-center gap-3 px-6 py-2.5 mx-2 rounded-lg transition-all group',
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-gray-400 hover:bg-glass-bg hover:text-white'
                  )}
                >
                  <span className="text-lg">{core.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{core.displayName || core.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-glass-bg text-gray-500 group-hover:text-gray-400">
                        {core.agentCount || 0}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-glass-border bg-quantum-void/50">
          <div className="flex justify-between text-xs">
            <div className="text-center">
              <div className="text-cyan-400 font-bold font-mono">247</div>
              <div className="text-gray-500">Agentes</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold font-mono">99.7%</div>
              <div className="text-gray-500">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-bold font-mono">20</div>
              <div className="text-gray-500">Cores</div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}


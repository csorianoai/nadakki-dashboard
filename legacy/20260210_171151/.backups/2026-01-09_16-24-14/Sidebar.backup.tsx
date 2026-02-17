'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CORES_CONFIG, CORE_CATEGORIES } from '@/config/cores';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

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

      {/* Navigation */}
      <div className="overflow-y-auto h-[calc(100vh-120px)] py-4">
        {Object.entries(CORE_CATEGORIES).map(([categoryId, category]) => (
          <div key={categoryId} className="mb-6">
            {!collapsed && (
              <div className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                {category.name}
              </div>
            )}
            
            {category.cores.map((coreId) => {
              const core = CORES_CONFIG[coreId];
              if (!core) return null;
              
              const isActive = pathname?.includes(`/${coreId}`);
              
              return (
                <Link
                  key={coreId}
                  href={`/${coreId}`}
                  className={cn(
                    'mx-3 my-1 px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300',
                    'hover:bg-glass-hover hover:translate-x-1',
                    isActive && 'bg-glass-secondary border border-glass-border translate-x-2'
                  )}
                  style={isActive ? { borderColor: core.color, boxShadow: `0 0 20px ${core.color}40` } : {}}
                >
                  <span className="text-xl">{core.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 font-medium truncate">{core.displayName}</span>
                      <span className="px-2 py-1 text-xs rounded-full bg-white/10 font-mono">
                        {core.agentCount}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* System Section */}
        <div className="mt-8 pt-4 border-t border-glass-border">
          {!collapsed && (
            <div className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              🚀 SISTEMA
            </div>
          )}
          <Link
            href="/settings"
            className="mx-3 my-1 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-glass-hover transition-all"
          >
            <span className="text-xl">⚙️</span>
            {!collapsed && <span className="font-medium">Configuración</span>}
          </Link>
        </div>
      </div>

      {/* System Stats */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-glass-border bg-quantum-void/80">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-core-financial">247</div>
              <div className="text-xs text-gray-500">Agentes</div>
            </div>
            <div>
              <div className="text-lg font-bold text-core-ops">99.7%</div>
              <div className="text-xs text-gray-500">Uptime</div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}


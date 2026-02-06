'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TenantSwitcher from '@/components/ui/TenantSwitcher';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import { useTheme } from '@/components/providers/ThemeProvider';

interface NavModule { id: string; icon: string; label: string; href: string; badge?: string; isNew?: boolean; }
interface NavCore { id: string; title: string; icon: string; color: string; modules: NavModule[]; }

const navigationStructure: NavCore[] = [
  { id: 'system', title: 'SISTEMA', icon: '🚀', color: '#00d4ff', modules: [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard Principal', href: '/' },
    { id: 'tenants', icon: '🏢', label: 'Multi-Tenant', href: '/tenants' },
    { id: 'admin', icon: '⚙️', label: 'Administración', href: '/admin' },
    { id: 'settings', icon: '🔧', label: 'Configuración', href: '/settings' },
  ]},
  { id: 'workflows', title: 'WORKFLOWS', icon: '⚡', color: '#06B6D4', modules: [
    { id: 'all-workflows', icon: '📋', label: 'Todos los Workflows', href: '/workflows', badge: '10' },
  ]},
  { id: 'marketing', title: 'MARKETING', icon: '🎯', color: '#F97316', modules: [
    { id: 'mkt-hub', icon: '🚀', label: 'Marketing Hub', href: '/marketing', badge: '15' },
    { id: 'mkt-agents', icon: '🤖', label: 'Agentes', href: '/marketing/agents' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [expandedCore, setExpandedCore] = useState<string>('system');

  return (
    <aside className="sidebar">
      {navigationStructure.map(core => (
        <div key={core.id} className="core-section">
          <h2 style={{ color: core.color }}>{core.icon} {core.title}</h2>
          {core.modules.map(module => (
            <Link key={module.id} href={module.href}>
              <span>{module.icon} {module.label}</span>
              {module.badge && <span className="badge">{module.badge}</span>}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}

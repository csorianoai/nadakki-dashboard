'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TenantSwitcher from '@/components/ui/TenantSwitcher';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
  Rocket,
  Home,
  Building2,
  Settings,
  Zap,
  BarChart3,
  Users,
  MessageSquare,
  Megaphone,
  Globe,
  Mail,
  Target,
  TrendingUp,
  Sparkles,
  Share2,
  Calendar,
  Brain,
  FileText,
  Layers,
  PieChart,
} from 'lucide-react';

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

const navigationStructure: NavCore[] = [
  {
    id: 'system',
    title: 'SISTEMA',
    icon: <Rocket size={20} />,
    color: '#00d4ff',
    modules: [
      {
        id: 'dashboard',
        icon: <Home size={16} />,
        label: 'Dashboard Principal',
        href: '/',
      },
      {
        id: 'tenants',
        icon: <Building2 size={16} />,
        label: 'Multi-Tenant',
        href: '/tenants',
      },
      {
        id: 'admin',
        icon: <Settings size={16} />,
        label: 'Administración',
        href: '/admin',
      },
      {
        id: 'settings',
        icon: <Settings size={16} />,
        label: 'Configuración',
        href: '/settings',
      },
    ],
  },
  {
    id: 'workflows',
    title: 'WORKFLOWS',
    icon: <Zap size={20} />,
    color: '#06B6D4',
    modules: [
      {
        id: 'all-workflows',
        icon: <Layers size={16} />,
        label: 'Todos los Workflows',
        href: '/workflows',
        badge: '10',
      },
    ],
  },
  {
    id: 'marketing',
    title: 'MARKETING',
    icon: <Megaphone size={20} />,
    color: '#F97316',
    modules: [
      {
        id: 'mkt-overview',
        icon: <BarChart3 size={16} />,
        label: 'Overview',
        href: '/marketing/overview',
        isNew: true,
      },
      {
        id: 'mkt-hub',
        icon: <Globe size={16} />,
        label: 'Marketing Hub',
        href: '/marketing',
        badge: '15',
      },
      {
        id: 'mkt-campaigns',
        icon: <Target size={16} />,
        label: 'Campaigns',
        href: '/marketing/campaigns',
        isNew: true,
      },
      {
        id: 'mkt-journeys',
        icon: <Share2 size={16} />,
        label: 'Customer Journeys',
        href: '/marketing/journeys',
        isNew: true,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [expandedCore, setExpandedCore] = useState<string>('system');

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>NADAKKI AI</h1>
        <p>Enterprise Suite v4.0.1</p>
      </div>

      <div className="sidebar-stats">
        <div className="stat">
          <div className="stat-value">239</div>
          <div className="stat-label">AGENTES</div>
        </div>
        <div className="stat">
          <div className="stat-value">20</div>
          <div className="stat-label">CORES</div>
        </div>
        <div className="stat">
          <div className="stat-value">10</div>
          <div className="stat-label">WORKFLOWS</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigationStructure.map((core) => (
          <div key={core.id} className="nav-section">
            <button
              onClick={() =>
                setExpandedCore(expandedCore === core.id ? '' : core.id)
              }
              className="nav-button"
              style={{ color: core.color }}
            >
              {core.icon}
              <span>{core.title}</span>
            </button>

            {expandedCore === core.id && (
              <div className="nav-items">
                {core.modules.map((module) => (
                  <Link
                    key={module.id}
                    href={module.href}
                    className={`nav-item ${isActive(module.href) ? 'active' : ''}`}
                  >
                    {module.icon}
                    <span>{module.label}</span>
                    {module.badge && <span className="badge">{module.badge}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <TenantSwitcher />
        <ThemeSwitcher />
      </div>
    </aside>
  );
}
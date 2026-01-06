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
  { id: 'marketing', title: 'MARKETING', icon: '🎯', color: '#F97316', modules: [
    { id: 'mkt-overview', icon: '📊', label: 'Overview', href: '/marketing/overview', isNew: true },
    { id: 'mkt-hub', icon: '🚀', label: 'Marketing Hub', href: '/marketing', badge: '15' },
    { id: 'mkt-campaigns', icon: '📢', label: 'Campaigns', href: '/marketing/campaigns', isNew: true },
    { id: 'mkt-journeys', icon: '🗺️', label: 'Customer Journeys', href: '/marketing/journeys', isNew: true },
    { id: 'mkt-segments', icon: '👥', label: 'Segmentación', href: '/marketing/segments' },
    { id: 'mkt-templates', icon: '📝', label: 'Templates', href: '/marketing/templates' },
    { id: 'mkt-ab', icon: '🔬', label: 'A/B Testing', href: '/marketing/ab-testing' },
    { id: 'mkt-predictive', icon: '🔮', label: 'Predictive AI', href: '/marketing/predictive' },
    { id: 'mkt-integrations', icon: '🔗', label: 'Integraciones', href: '/marketing/integrations' },
  ]},
  { id: 'marketing-tools', title: 'HERRAMIENTAS MKT', icon: '🛠️', color: '#EC4899', modules: [
    { id: 'mkt-email-builder', icon: '✉️', label: 'Email Builder', href: '/marketing/email-builder', isNew: true },
    { id: 'mkt-audience', icon: '🎯', label: 'Audience Builder', href: '/marketing/audience-builder', isNew: true },
    { id: 'mkt-content', icon: '✍️', label: 'Content Studio', href: '/marketing/content' },
    { id: 'mkt-social', icon: '📱', label: 'Social Media', href: '/marketing/social' },
    { id: 'mkt-analytics', icon: '📈', label: 'Analytics', href: '/marketing/analytics' },
    { id: 'mkt-agents', icon: '🤖', label: 'AI Agents', href: '/marketing/agents' },
    { id: 'mkt-leads', icon: '📊', label: 'Lead Scoring', href: '/marketing/leads' },
  ]},
  { id: 'ai-studio', title: 'AI STUDIO', icon: '✨', color: '#06B6D4', modules: [
    { id: 'ai-hub', icon: '🧠', label: 'AI Studio Hub', href: '/ai-studio' },
    { id: 'ai-generate', icon: '⚡', label: 'Generar Contenido', href: '/ai-studio/generate' },
    { id: 'ai-templates', icon: '📋', label: 'Templates IA', href: '/ai-studio/templates' },
    { id: 'ai-agents', icon: '🤖', label: 'Agentes IA', href: '/ai-studio/agents' },
    { id: 'ai-history', icon: '📜', label: 'Historial', href: '/ai-studio/history' },
  ]},
  { id: 'social', title: 'SOCIAL MEDIA', icon: '📱', color: '#22C55E', modules: [
    { id: 'social-hub', icon: '🌐', label: 'Social Hub', href: '/social' },
    { id: 'social-scheduler', icon: '📅', label: 'Scheduler', href: '/social/scheduler' },
    { id: 'social-inbox', icon: '📥', label: 'Inbox', href: '/social/inbox' },
    { id: 'social-analytics', icon: '📊', label: 'Analytics', href: '/social/analytics' },
    { id: 'social-connections', icon: '🔗', label: 'Conexiones', href: '/social/connections' },
  ]},
  { id: 'workflows', title: 'WORKFLOWS', icon: '🔄', color: '#8B5CF6', modules: [
    { id: 'wf-all', icon: '🚀', label: 'Ver Workflows', href: '/workflows', badge: '10' },
    { id: 'wf-campaign', icon: '📢', label: 'Campaign Optimization', href: '/workflows/campaign-optimization' },
    { id: 'wf-acquisition', icon: '🎯', label: 'Customer Acquisition', href: '/workflows/customer-acquisition-intelligence' },
  ]},
  { id: 'analytics', title: 'ANALYTICS', icon: '📊', color: '#F59E0B', modules: [
    { id: 'analytics-hub', icon: '📈', label: 'Analytics Hub', href: '/analytics' },
    { id: 'analytics-campaigns', icon: '📢', label: 'Campañas', href: '/analytics/campaigns' },
    { id: 'analytics-reports', icon: '📋', label: 'Reportes', href: '/analytics/reports' },
  ]},
  { id: 'finanzas', title: 'FINANZAS', icon: '🏦', color: '#EC4899', modules: [
    { id: 'originacion', icon: '📝', label: 'Originación', href: '/originacion', badge: '10' },
    { id: 'decision', icon: '⚖️', label: 'Decisión', href: '/decision', badge: '5' },
    { id: 'contabilidad', icon: '📊', label: 'Contabilidad', href: '/contabilidad', badge: '22' },
    { id: 'presupuesto', icon: '💰', label: 'Presupuesto', href: '/presupuesto', badge: '13' },
  ]},
  { id: 'legal', title: 'LEGAL & COMPLIANCE', icon: '⚖️', color: '#A855F7', modules: [
    { id: 'legal-all', icon: '⚖️', label: 'Legal AI System', href: '/legal', badge: '32' },
    { id: 'compliance', icon: '✅', label: 'Compliance', href: '/compliance', badge: '5' },
    { id: 'regtech', icon: '📋', label: 'RegTech', href: '/regtech', badge: '8' },
  ]},
  { id: 'operaciones', title: 'OPERACIONES', icon: '⚙️', color: '#14B8A6', modules: [
    { id: 'rrhh', icon: '👥', label: 'RRHH', href: '/rrhh', badge: '10' },
    { id: 'logistica', icon: '🚚', label: 'Logística', href: '/logistica', badge: '23' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [expandedCores, setExpandedCores] = useState<string[]>(['system', 'marketing']);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCore = (coreId: string) => {
    setExpandedCores(prev => prev.includes(coreId) ? prev.filter(id => id !== coreId) : [...prev, coreId]);
  };

  if (collapsed) {
    return (
      <nav 
        className="fixed top-0 left-0 h-screen w-20 z-50 flex flex-col"
        style={{ 
          backgroundColor: theme.colors.sidebarBg,
          borderRight: `1px solid ${theme.colors.sidebarBorder}`
        }}
      >
        <button 
          onClick={() => setCollapsed(false)} 
          className="w-full p-4 text-center text-xl transition-colors"
          style={{ color: theme.colors.textPrimary }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.sidebarHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          →
        </button>
        <div className="flex-1 overflow-y-auto py-2">
          {navigationStructure.map(core => (
            <Link 
              key={core.id} 
              href={core.modules[0]?.href || '/'} 
              className="block p-3 text-center text-xl transition-colors" 
              title={core.title}
              style={{ color: theme.colors.textPrimary }}
            >
              {core.icon}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav 
      className="fixed top-0 left-0 h-screen w-80 z-50 flex flex-col"
      style={{ 
        backgroundColor: theme.colors.sidebarBg,
        borderRight: `1px solid ${theme.colors.sidebarBorder}`
      }}
    >
      <button 
        onClick={() => setCollapsed(true)} 
        className="absolute top-4 -right-3 w-6 h-6 rounded-full text-xs flex items-center justify-center transition-colors"
        style={{ 
          backgroundColor: theme.colors.bgTertiary,
          border: `1px solid ${theme.colors.borderPrimary}`,
          color: theme.colors.textMuted
        }}
      >
        ←
      </button>

      {/* Logo */}
      <div className="p-4" style={{ borderBottom: `1px solid ${theme.colors.sidebarBorder}` }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary})`,
              boxShadow: `0 4px 12px ${theme.colors.accentPrimary}30`
            }}
          >
            🧠
          </div>
          <div>
            <h1 
              className="text-lg font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${theme.colors.accentSecondary}, ${theme.colors.accentPrimary})` }}
            >
              NADAKKI AI
            </h1>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>Enterprise Suite v2.0</p>
          </div>
        </div>
      </div>

      {/* Tenant Switcher */}
      <TenantSwitcher />

      {/* Theme Switcher */}
      <div className="px-3 py-2">
        <ThemeSwitcher />
      </div>

      {/* Stats */}
      <div 
        className="p-3 mx-3 my-2 rounded-lg"
        style={{ 
          background: `linear-gradient(135deg, ${theme.colors.accentPrimary}10, ${theme.colors.accentSecondary}10)`,
          border: `1px solid ${theme.colors.accentPrimary}20`
        }}
      >
        <div className="flex justify-around text-center">
          <div>
            <div className="text-sm font-bold" style={{ color: theme.colors.accentPrimary }}>225</div>
            <div className="text-[10px]" style={{ color: theme.colors.textMuted }}>AGENTES</div>
          </div>
          <div className="w-px" style={{ backgroundColor: theme.colors.borderPrimary }} />
          <div>
            <div className="text-sm font-bold" style={{ color: theme.colors.success }}>20</div>
            <div className="text-[10px]" style={{ color: theme.colors.textMuted }}>CORES</div>
          </div>
          <div className="w-px" style={{ backgroundColor: theme.colors.borderPrimary }} />
          <div>
            <div className="text-sm font-bold" style={{ color: theme.colors.accentSecondary }}>116</div>
            <div className="text-[10px]" style={{ color: theme.colors.textMuted }}>PÁGINAS</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {navigationStructure.map(core => {
          const isExpanded = expandedCores.includes(core.id);
          const hasActive = core.modules.some(m => pathname === m.href || (m.href !== '/' && pathname.startsWith(m.href)));

          return (
            <div key={core.id} className="mx-2 my-1">
              <button 
                onClick={() => toggleCore(core.id)} 
                className="w-full flex items-center gap-2 p-2 rounded-lg transition-all"
                style={{
                  backgroundColor: isExpanded ? theme.colors.bgTertiary : 'transparent',
                  border: hasActive ? `1px solid ${theme.colors.accentPrimary}30` : '1px solid transparent'
                }}
              >
                <span 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
                  style={{
                    background: hasActive || isExpanded 
                      ? `linear-gradient(135deg, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary})`
                      : theme.colors.bgCard,
                    boxShadow: hasActive || isExpanded ? `0 2px 8px ${theme.colors.accentPrimary}30` : 'none'
                  }}
                >
                  {core.icon}
                </span>
                <span 
                  className="flex-1 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: isExpanded ? theme.colors.textPrimary : theme.colors.textSecondary }}
                >
                  {core.title}
                </span>
                <span 
                  className="text-[10px] transition-transform duration-200"
                  style={{ 
                    color: theme.colors.textMuted,
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  ▼
                </span>
              </button>

              {isExpanded && (
                <div className="mt-1 ml-2" style={{ borderLeft: `1px solid ${theme.colors.borderPrimary}` }}>
                  {core.modules.map(mod => {
                    const isActive = pathname === mod.href || (mod.href !== '/' && pathname.startsWith(mod.href));
                    return (
                      <Link 
                        key={mod.id} 
                        href={mod.href} 
                        className="flex items-center gap-2 px-3 py-2 mx-1 rounded-md text-sm transition-all"
                        style={{
                          background: isActive 
                            ? `linear-gradient(90deg, ${theme.colors.accentPrimary}20, ${theme.colors.accentSecondary}20)`
                            : 'transparent',
                          color: isActive ? theme.colors.accentSecondary : theme.colors.textSecondary,
                          borderLeft: isActive ? `2px solid ${theme.colors.accentSecondary}` : '2px solid transparent',
                          fontWeight: isActive ? 500 : 400
                        }}
                      >
                        <span className="text-base">{mod.icon}</span>
                        <span className="flex-1 truncate">{mod.label}</span>
                        {mod.isNew && (
                          <span 
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                            style={{ backgroundColor: `${theme.colors.success}20`, color: theme.colors.success }}
                          >
                            NEW
                          </span>
                        )}
                        {mod.badge && !mod.isNew && (
                          <span 
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: theme.colors.bgCard, color: theme.colors.textMuted }}
                          >
                            {mod.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: `1px solid ${theme.colors.sidebarBorder}`, backgroundColor: theme.colors.bgPrimary }}>
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: theme.colors.success }}
            />
            <span style={{ color: theme.colors.textSecondary }}>Sistema Operativo</span>
          </div>
          <span className="font-bold" style={{ color: theme.colors.success }}>99.7%</span>
        </div>
      </div>
    </nav>
  );
}


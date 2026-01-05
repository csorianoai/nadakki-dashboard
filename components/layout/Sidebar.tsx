'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TenantSwitcher from '@/components/ui/TenantSwitcher';

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
  { id: 'marketing-advanced', title: 'AVANZADO MKT', icon: '⚡', color: '#8B5CF6', modules: [
    { id: 'mkt-attribution', icon: '📍', label: 'Attribution', href: '/marketing/attribution' },
    { id: 'mkt-competitive', icon: '🔍', label: 'Competitive Intel', href: '/marketing/competitive' },
    { id: 'mkt-command', icon: '🎛️', label: 'Command Center', href: '/marketing/command-center' },
  ]},
  { id: 'ai-studio', title: 'AI STUDIO', icon: '✨', color: '#06B6D4', modules: [
    { id: 'ai-hub', icon: '🧠', label: 'AI Studio Hub', href: '/ai-studio' },
    { id: 'ai-generate', icon: '⚡', label: 'Generar Contenido', href: '/ai-studio/generate' },
    { id: 'ai-templates', icon: '📋', label: 'Templates IA', href: '/ai-studio/templates' },
    { id: 'ai-agents', icon: '🤖', label: 'Agentes IA', href: '/ai-studio/agents' },
    { id: 'ai-history', icon: '📜', label: 'Historial', href: '/ai-studio/history' },
    { id: 'ai-settings', icon: '⚙️', label: 'Configuración IA', href: '/ai-studio/settings' },
  ]},
  { id: 'social', title: 'SOCIAL MEDIA', icon: '📱', color: '#22C55E', modules: [
    { id: 'social-hub', icon: '🌐', label: 'Social Hub', href: '/social' },
    { id: 'social-scheduler', icon: '📅', label: 'Scheduler', href: '/social/scheduler' },
    { id: 'social-inbox', icon: '📥', label: 'Inbox', href: '/social/inbox' },
    { id: 'social-analytics', icon: '📊', label: 'Analytics', href: '/social/analytics' },
    { id: 'social-connections', icon: '🔗', label: 'Conexiones', href: '/social/connections' },
    { id: 'social-monitoring', icon: '👁️', label: 'Monitoring', href: '/social/monitoring' },
  ]},
  { id: 'workflows', title: 'WORKFLOWS', icon: '🔄', color: '#8B5CF6', modules: [
    { id: 'wf-all', icon: '🚀', label: 'Ver Workflows', href: '/workflows', badge: '10' },
    { id: 'wf-campaign', icon: '📢', label: 'Campaign Optimization', href: '/workflows/campaign-optimization' },
    { id: 'wf-acquisition', icon: '🎯', label: 'Customer Acquisition', href: '/workflows/customer-acquisition-intelligence' },
    { id: 'wf-lifecycle', icon: '♻️', label: 'Customer Lifecycle', href: '/workflows/customer-lifecycle-revenue' },
    { id: 'wf-content', icon: '📝', label: 'Content Performance', href: '/workflows/content-performance-engine' },
    { id: 'wf-social', icon: '📱', label: 'Social Intelligence', href: '/workflows/social-media-intelligence' },
  ]},
  { id: 'analytics', title: 'ANALYTICS', icon: '📊', color: '#F59E0B', modules: [
    { id: 'analytics-hub', icon: '📈', label: 'Analytics Hub', href: '/analytics' },
    { id: 'analytics-campaigns', icon: '📢', label: 'Campañas', href: '/analytics/campaigns' },
    { id: 'analytics-agents', icon: '🤖', label: 'Agentes', href: '/analytics/agents' },
    { id: 'analytics-conversions', icon: '💰', label: 'Conversiones', href: '/analytics/conversions' },
    { id: 'analytics-roi', icon: '📊', label: 'ROI', href: '/analytics/roi' },
    { id: 'analytics-reports', icon: '📋', label: 'Reportes', href: '/analytics/reports' },
  ]},
  { id: 'finanzas', title: 'FINANZAS', icon: '🏦', color: '#EC4899', modules: [
    { id: 'originacion', icon: '📝', label: 'Originación', href: '/originacion', badge: '10' },
    { id: 'decision', icon: '⚖️', label: 'Decisión', href: '/decision', badge: '5' },
    { id: 'contabilidad', icon: '📊', label: 'Contabilidad', href: '/contabilidad', badge: '22' },
    { id: 'presupuesto', icon: '💰', label: 'Presupuesto', href: '/presupuesto', badge: '13' },
    { id: 'recuperacion', icon: '💳', label: 'Recuperación', href: '/recuperacion', badge: '5' },
  ]},
  { id: 'legal', title: 'LEGAL & COMPLIANCE', icon: '⚖️', color: '#A855F7', modules: [
    { id: 'legal-all', icon: '⚖️', label: 'Legal AI System', href: '/legal', badge: '32' },
    { id: 'regtech', icon: '📋', label: 'RegTech', href: '/regtech', badge: '8' },
    { id: 'compliance', icon: '✅', label: 'Compliance', href: '/compliance', badge: '5' },
    { id: 'vigilancia', icon: '👁️', label: 'Vigilancia', href: '/vigilancia', badge: '4' },
    { id: 'fortaleza', icon: '🏰', label: 'Fortaleza', href: '/fortaleza', badge: '5' },
  ]},
  { id: 'operaciones', title: 'OPERACIONES', icon: '⚙️', color: '#14B8A6', modules: [
    { id: 'rrhh', icon: '👥', label: 'RRHH', href: '/rrhh', badge: '10' },
    { id: 'logistica', icon: '🚚', label: 'Logística', href: '/logistica', badge: '23' },
    { id: 'operacional', icon: '⚙️', label: 'Operacional', href: '/operacional', badge: '5' },
  ]},
  { id: 'otros', title: 'ESPECIALIDADES', icon: '🎓', color: '#64748B', modules: [
    { id: 'ventascrm', icon: '🤝', label: 'Ventas CRM', href: '/ventascrm', badge: '9' },
    { id: 'experiencia', icon: '😊', label: 'Experiencia', href: '/experiencia', badge: '5' },
    { id: 'inteligencia', icon: '🧠', label: 'Inteligencia', href: '/inteligencia', badge: '5' },
    { id: 'investigacion', icon: '🔬', label: 'Investigación', href: '/investigacion', badge: '9' },
    { id: 'educacion', icon: '🎓', label: 'Educación', href: '/educacion', badge: '5' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedCores, setExpandedCores] = useState<string[]>(['system', 'marketing']);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCore = (coreId: string) => {
    setExpandedCores(prev => prev.includes(coreId) ? prev.filter(id => id !== coreId) : [...prev, coreId]);
  };

  if (collapsed) {
    return (
      <nav className="fixed top-0 left-0 h-screen w-20 bg-slate-900/95 border-r border-slate-700/50 z-50 flex flex-col">
        <button onClick={() => setCollapsed(false)} className="w-full p-4 text-center text-xl hover:bg-slate-800 transition-colors">→</button>
        <div className="flex-1 overflow-y-auto py-2">
          {navigationStructure.map(core => (
            <Link key={core.id} href={core.modules[0]?.href || '/'} 
              className="block p-3 text-center text-xl hover:bg-slate-800 transition-colors" title={core.title}>
              {core.icon}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 h-screen w-80 bg-slate-900/95 border-r border-slate-700/50 z-50 flex flex-col">
      <button onClick={() => setCollapsed(true)} 
        className="absolute top-4 -right-3 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full text-xs hover:bg-slate-700 transition-colors flex items-center justify-center">
        ←
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">
            🧠
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">NADAKKI AI</h1>
            <p className="text-xs text-slate-500">Enterprise Suite v2.0</p>
          </div>
        </div>
      </div>

      {/* Tenant Switcher */}
      <TenantSwitcher />

      {/* Stats */}
      <div className="p-3 mx-3 my-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-sm font-bold text-purple-400">225</div>
            <div className="text-[10px] text-slate-500">AGENTES</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div>
            <div className="text-sm font-bold text-green-400">20</div>
            <div className="text-[10px] text-slate-500">CORES</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div>
            <div className="text-sm font-bold text-cyan-400">116</div>
            <div className="text-[10px] text-slate-500">PÁGINAS</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {navigationStructure.map(core => {
          const isExpanded = expandedCores.includes(core.id);
          const hasActive = core.modules.some(m => pathname === m.href || (m.href !== '/' && pathname.startsWith(m.href)));

          return (
            <div key={core.id} className="mx-2 my-1">
              <button 
                onClick={() => toggleCore(core.id)} 
                className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all ${
                  isExpanded ? 'bg-slate-800/70' : 'hover:bg-slate-800/30'
                } ${hasActive ? 'ring-1 ring-purple-500/30' : ''}`}
              >
                <span 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all ${
                    hasActive || isExpanded 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/30' 
                      : 'bg-slate-700/50'
                  }`}
                >
                  {core.icon}
                </span>
                <span className={`flex-1 text-left text-xs font-semibold uppercase tracking-wide ${
                  isExpanded ? 'text-white' : 'text-slate-400'
                }`}>
                  {core.title}
                </span>
                <span className={`text-[10px] text-slate-500 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}>
                  ▼
                </span>
              </button>

              {isExpanded && (
                <div className="mt-1 ml-2 border-l border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
                  {core.modules.map(mod => {
                    const isActive = pathname === mod.href || (mod.href !== '/' && pathname.startsWith(mod.href));
                    return (
                      <Link 
                        key={mod.id} 
                        href={mod.href} 
                        className={`flex items-center gap-2 px-3 py-2 mx-1 rounded-md text-sm transition-all ${
                          isActive 
                            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-l-2 border-cyan-400 font-medium' 
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{mod.icon}</span>
                        <span className="flex-1 truncate">{mod.label}</span>
                        {mod.isNew && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">NEW</span>
                        )}
                        {mod.badge && !mod.isNew && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{mod.badge}</span>
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
      <div className="p-3 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-400">Sistema Operativo</span>
          </div>
          <span className="text-green-400 font-bold">99.7%</span>
        </div>
      </div>
    </nav>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TenantSwitcher from '@/components/ui/TenantSwitcher';

interface NavModule { id: string; icon: string; label: string; href: string; badge?: string; }
interface NavCore { id: string; title: string; icon: string; color: string; modules: NavModule[]; }

const navigationStructure: NavCore[] = [
  { id: 'system', title: 'SISTEMA', icon: '🚀', color: '#00d4ff', modules: [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard Principal', href: '/' },
    { id: 'tenants', icon: '🏢', label: 'Multi-Tenant', href: '/tenants', badge: 'NEW' },
  ]},
  { id: 'workflows', title: 'WORKFLOWS', icon: '🔄', color: '#8B5CF6', modules: [
    { id: 'wf-all', icon: '🚀', label: 'Ver 10 Workflows', href: '/workflows', badge: '10' },
    { id: 'wf-campaign', icon: '📢', label: 'Campaign Optimization', href: '/workflows/campaign-optimization' },
    { id: 'wf-acquisition', icon: '🎯', label: 'Customer Acquisition', href: '/workflows/customer-acquisition-intelligence' },
    { id: 'wf-lifecycle', icon: '♻️', label: 'Customer Lifecycle', href: '/workflows/customer-lifecycle-revenue' },
    { id: 'wf-content', icon: '📝', label: 'Content Performance', href: '/workflows/content-performance-engine' },
    { id: 'wf-social', icon: '📱', label: 'Social Intelligence', href: '/workflows/social-media-intelligence' },
  ]},
  { id: 'marketing', title: 'MARKETING', icon: '🎯', color: '#F97316', modules: [
    { id: 'mkt-hub', icon: '🚀', label: 'Marketing Hub', href: '/marketing', badge: '35' },
    { id: 'mkt-leads', icon: '📊', label: 'Lead Management', href: '/marketing/leads', badge: '3' },
    { id: 'mkt-content', icon: '✍️', label: 'Content Generation', href: '/marketing/content', badge: '4' },
    { id: 'mkt-social', icon: '📱', label: 'Social Media', href: '/marketing/social', badge: '4' },
    { id: 'mkt-analytics', icon: '📈', label: 'Analytics', href: '/marketing/analytics', badge: '4' },
    { id: 'mkt-agents', icon: '🤖', label: 'Ver 35 Agentes', href: '/marketing/agents', badge: '35' },
  ]},
  { id: 'legal', title: 'LEGAL', icon: '⚖️', color: '#A855F7', modules: [
    { id: 'legal-all', icon: '⚖️', label: 'Legal AI System', href: '/legal', badge: '32' },
  ]},
  { id: 'finanzas', title: 'FINANZAS', icon: '🏦', color: '#EC4899', modules: [
    { id: 'originacion', icon: '📝', label: 'Originacion', href: '/originacion', badge: '10' },
    { id: 'decision', icon: '⚖️', label: 'Decision', href: '/decision', badge: '5' },
    { id: 'contabilidad', icon: '📊', label: 'Contabilidad', href: '/contabilidad', badge: '22' },
    { id: 'presupuesto', icon: '💰', label: 'Presupuesto', href: '/presupuesto', badge: '13' },
    { id: 'recuperacion', icon: '💳', label: 'Recuperacion', href: '/recuperacion', badge: '5' },
  ]},
  { id: 'compliance', title: 'COMPLIANCE', icon: '🛡️', color: '#EF4444', modules: [
    { id: 'regtech', icon: '📋', label: 'RegTech', href: '/regtech', badge: '8' },
    { id: 'compliance', icon: '✅', label: 'Compliance', href: '/compliance', badge: '5' },
    { id: 'vigilancia', icon: '👁️', label: 'Vigilancia', href: '/vigilancia', badge: '4' },
    { id: 'fortaleza', icon: '🏰', label: 'Fortaleza', href: '/fortaleza', badge: '5' },
  ]},
  { id: 'operaciones', title: 'OPERACIONES', icon: '⚙️', color: '#14B8A6', modules: [
    { id: 'rrhh', icon: '👥', label: 'RRHH', href: '/rrhh', badge: '10' },
    { id: 'logistica', icon: '🚚', label: 'Logistica', href: '/logistica', badge: '23' },
    { id: 'operaciones', icon: '⚙️', label: 'Operaciones', href: '/operaciones', badge: '5' },
  ]},
  { id: 'otros', title: 'ESPECIALIDADES', icon: '🎓', color: '#64748B', modules: [
    { id: 'ventascrm', icon: '🤝', label: 'Ventas CRM', href: '/ventascrm', badge: '9' },
    { id: 'experiencia', icon: '😊', label: 'Experiencia', href: '/experiencia', badge: '5' },
    { id: 'inteligencia', icon: '🧠', label: 'Inteligencia', href: '/inteligencia', badge: '5' },
    { id: 'investigacion', icon: '🔬', label: 'Investigacion', href: '/investigacion', badge: '9' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedCores, setExpandedCores] = useState<string[]>(['system', 'marketing', 'workflows']);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCore = (coreId: string) => {
    setExpandedCores(prev => prev.includes(coreId) ? prev.filter(id => id !== coreId) : [...prev, coreId]);
  };

  if (collapsed) {
    return (
      <nav className="fixed top-0 left-0 h-screen w-20 bg-slate-900/95 border-r border-slate-700/50 z-50">
        <button onClick={() => setCollapsed(false)} className="w-full p-4 text-center text-2xl hover:bg-slate-800">→</button>
        {navigationStructure.map(core => (
          <Link key={core.id} href={core.modules[0]?.href || '/'} className="block p-4 text-center text-xl hover:bg-slate-800">{core.icon}</Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 h-screen w-80 bg-slate-900/95 border-r border-slate-700/50 z-50 flex flex-col">
      <button onClick={() => setCollapsed(true)} className="absolute top-4 -right-3 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full text-xs hover:bg-slate-700">←</button>
      
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">🧠</div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">NADAKKI AI</h1>
            <p className="text-xs text-slate-500">Enterprise Suite</p>
          </div>
        </div>
      </div>

      <TenantSwitcher />

      <div className="p-3 mx-3 my-2 rounded-lg bg-purple-500/10 flex justify-around text-center">
        <div><div className="text-sm font-bold text-purple-400">225</div><div className="text-[10px] text-slate-500">AGENTES</div></div>
        <div><div className="text-sm font-bold text-green-400">20</div><div className="text-[10px] text-slate-500">CORES</div></div>
        <div><div className="text-sm font-bold text-cyan-400">10</div><div className="text-[10px] text-slate-500">WORKFLOWS</div></div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {navigationStructure.map(core => {
          const isExpanded = expandedCores.includes(core.id);
          const hasActive = core.modules.some(m => pathname === m.href || (m.href !== '/' && pathname.startsWith(m.href)));
          
          return (
            <div key={core.id} className="mx-2 my-1">
              <button onClick={() => toggleCore(core.id)} className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${isExpanded ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}`}>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${hasActive || isExpanded ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-slate-700/50'}`}>{core.icon}</span>
                <span className={`flex-1 text-left text-xs font-semibold uppercase ${isExpanded ? 'text-white' : 'text-slate-400'}`}>{core.title}</span>
                <span className={`text-[10px] text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {isExpanded && (
                <div className="mt-1 ml-2 border-l border-slate-700/50">
                  {core.modules.map(mod => {
                    const isActive = pathname === mod.href || (mod.href !== '/' && pathname.startsWith(mod.href));
                    return (
                      <Link key={mod.id} href={mod.href} className={`flex items-center gap-2 px-3 py-2 mx-1 rounded-md text-sm transition-colors ${isActive ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
                        <span>{mod.icon}</span>
                        <span className="flex-1 truncate">{mod.label}</span>
                        {mod.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{mod.badge}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-700/50">
        <div className="flex justify-between text-xs text-center">
          <div><div className="text-cyan-400 font-bold">225</div><div className="text-slate-500">Agentes</div></div>
          <div><div className="text-green-400 font-bold">99.7%</div><div className="text-slate-500">Uptime</div></div>
          <div><div className="text-yellow-400 font-bold">20</div><div className="text-slate-500">Cores</div></div>
        </div>
      </div>
    </nav>
  );
}

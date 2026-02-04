'use client';
import React, { useState, ReactNode } from 'react';
import { AgentCountDisplay } from './AgentCountDisplay';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

interface NavModule { id: string; icon: string; label: string; href: string; badge?: number | string; }
interface NavCore { id: string; title: string; icon: string; color: string; gradient: string; modules: NavModule[]; }

const navigationStructure: NavCore[] = [
  { id: 'system', title: 'SISTEMA', icon: 'ðŸš€', color: '#00d4ff', gradient: 'linear-gradient(135deg, #00d4ff, #0099cc)', modules: [
    { id: 'dashboard', icon: 'ðŸ ', label: 'Dashboard Principal', href: '/', badge: 'âˆž' },
    { id: 'tenants', icon: 'ðŸ¢', label: 'Multi-Tenant', href: '/tenants', badge: 'NEW' },
    { id: 'settings', icon: 'âš™ï¸', label: 'ConfiguraciÃ³n', href: '/settings' },
  ]},
  { id: 'workflows', title: 'WORKFLOWS', icon: 'ðŸ”„', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)', modules: [
    { id: 'wf-all', icon: 'ðŸ“‹', label: 'Todos los Workflows', href: '/workflows', badge: '10' },
    { id: 'wf-campaign', icon: 'ðŸ“¢', label: 'Campaign Optimization', href: '/workflows/campaign-optimization' },
    { id: 'wf-acquisition', icon: 'ðŸŽ¯', label: 'Customer Acquisition', href: '/workflows/customer-acquisition-intelligence' },
    { id: 'wf-lifecycle', icon: 'â™»ï¸', label: 'Customer Lifecycle', href: '/workflows/customer-lifecycle-revenue' },
    { id: 'wf-content', icon: 'ðŸ“', label: 'Content Performance', href: '/workflows/content-performance-engine' },
    { id: 'wf-social', icon: 'ðŸ“±', label: 'Social Intelligence', href: '/workflows/social-media-intelligence' },
    { id: 'wf-email', icon: 'âœ‰ï¸', label: 'Email Automation', href: '/workflows/email-automation-master' },
    { id: 'wf-attribution', icon: 'ðŸ“Š', label: 'Multi-Channel Attribution', href: '/workflows/multi-channel-attribution' },
    { id: 'wf-competitive', icon: 'ðŸ”', label: 'Competitive Intel', href: '/workflows/competitive-intelligence-hub' },
    { id: 'wf-abtesting', icon: 'ðŸ§ª', label: 'A/B Testing', href: '/workflows/ab-testing-experimentation' },
    { id: 'wf-influencer', icon: 'â­', label: 'Influencer Engine', href: '/workflows/influencer-partnership-engine' },
  ]},
  { id: 'marketing', title: 'MARKETING', icon: 'ðŸŽ¯', color: '#F97316', gradient: 'linear-gradient(135deg, #F97316, #EA580C)', modules: [
    { id: 'mkt-all', icon: 'ðŸŽ¯', label: 'Marketing Hub', href: '/marketing', badge: '35' },
    { id: 'mkt-agents', icon: 'ðŸ¤–', label: 'Agentes', href: '/marketing/agents' },
    { id: 'mkt-campaigns', icon: 'ðŸ“¢', label: 'CampaÃ±as', href: '/marketing/campaigns' },
    { id: 'mkt-leads', icon: 'ðŸ“Š', label: 'Lead Management', href: '/marketing/leads' },
    { id: 'mkt-content', icon: 'âœï¸', label: 'Content Generation', href: '/marketing/content' },
    { id: 'mkt-social', icon: 'ðŸ“±', label: 'Social Media', href: '/marketing/social' },
    { id: 'mkt-analytics', icon: 'ðŸ“ˆ', label: 'Analytics', href: '/marketing/analytics' },
  ]},
  { id: 'analytics', title: 'ANALYTICS', icon: 'ðŸ“Š', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)', modules: [
    { id: 'analytics-main', icon: 'ðŸ“Š', label: 'Dashboard Analytics', href: '/analytics' },
    { id: 'analytics-reports', icon: 'ðŸ“‘', label: 'Reportes', href: '/analytics/reports' },
    { id: 'analytics-roi', icon: 'ðŸ’°', label: 'ROI', href: '/analytics/roi' },
  ]},
  { id: 'finanzas', title: 'FINANZAS', icon: 'ðŸ¦', color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #DB2777)', modules: [
    { id: 'originacion', icon: 'ðŸ“', label: 'OriginaciÃ³n', href: '/originacion', badge: '10' },
    { id: 'decision', icon: 'âš–ï¸', label: 'DecisiÃ³n', href: '/decision', badge: '5' },
    { id: 'recuperacion', icon: 'ðŸ’³', label: 'RecuperaciÃ³n', href: '/recuperacion', badge: '5' },
    { id: 'contabilidad', icon: 'ðŸ“Š', label: 'Contabilidad', href: '/contabilidad', badge: '22' },
    { id: 'presupuesto', icon: 'ðŸ’°', label: 'Presupuesto', href: '/presupuesto', badge: '13' },
  ]},
  { id: 'compliance', title: 'COMPLIANCE', icon: 'ðŸ›¡ï¸', color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)', modules: [
    { id: 'regtech', icon: 'ðŸ“‹', label: 'RegTech', href: '/regtech', badge: '8' },
    { id: 'compliance', icon: 'âœ…', label: 'Compliance', href: '/compliance', badge: '5' },
    { id: 'legal', icon: 'âš–ï¸', label: 'Legal', href: '/legal', badge: '32' },
    { id: 'vigilancia', icon: 'ðŸ‘ï¸', label: 'Vigilancia', href: '/vigilancia', badge: '4' },
  ]},
  { id: 'operaciones', title: 'OPERACIONES', icon: 'âš™ï¸', color: '#14B8A6', gradient: 'linear-gradient(135deg, #14B8A6, #0D9488)', modules: [
    { id: 'operacional', icon: 'âš™ï¸', label: 'Operacional', href: '/operacional', badge: '5' },
    { id: 'rrhh', icon: 'ðŸ‘¥', label: 'RRHH', href: '/rrhh', badge: '10' },
    { id: 'logistica', icon: 'ðŸšš', label: 'LogÃ­stica', href: '/logistica', badge: '23' },
    { id: 'orchestration', icon: 'ðŸŽ›ï¸', label: 'Orchestration', href: '/orchestration', badge: '5' },
  ]},
  { id: 'otros', title: 'ESPECIALIDADES', icon: 'ðŸŽ“', color: '#64748B', gradient: 'linear-gradient(135deg, #64748B, #475569)', modules: [
    { id: 'ventascrm', icon: 'ðŸ¤', label: 'Ventas CRM', href: '/ventascrm', badge: '9' },
    { id: 'educacion', icon: 'ðŸŽ“', label: 'EducaciÃ³n', href: '/educacion', badge: '9' },
    { id: 'experiencia', icon: 'ðŸ˜Š', label: 'Experiencia', href: '/experiencia', badge: '5' },
    { id: 'inteligencia', icon: 'ðŸ§ ', label: 'Inteligencia', href: '/inteligencia', badge: '5' },
    { id: 'investigacion', icon: 'ðŸ”¬', label: 'InvestigaciÃ³n', href: '/investigacion', badge: '9' },
    { id: 'fortaleza', icon: 'ðŸ°', label: 'Fortaleza', href: '/fortaleza', badge: '5' },
  ]},
  { id: 'admin', title: 'ADMIN', icon: 'ðŸ”§', color: '#6366F1', gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)', modules: [
    { id: 'admin-main', icon: 'ðŸ”§', label: 'Panel Admin', href: '/admin' },
    { id: 'admin-agents', icon: 'ðŸ¤–', label: 'GestiÃ³n Agentes', href: '/admin/agents' },
    { id: 'admin-logs', icon: 'ðŸ“œ', label: 'Logs', href: '/admin/logs' },
  ]},
];

const colors = { 
  bg: { primary: '#0a0f1c', sidebar: 'rgba(26, 31, 46, 0.98)', tertiary: '#252b3f' }, 
  border: { subtle: 'rgba(51, 65, 85, 0.5)' }, 
  text: { primary: '#f8fafc', secondary: '#94a3b8', muted: '#64748b' }, 
  neon: { blue: '#00d4ff', purple: '#a55eea', green: '#26de81' } 
};

function NavItem({ module, coreColor, isActive }: { module: NavModule; coreColor: string; isActive: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Link href={module.href} style={{ textDecoration: 'none' }}>
      <div 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)} 
        style={{ 
          display: 'flex', alignItems: 'center', gap: '10px', 
          padding: '8px 12px 8px 20px', margin: '1px 6px', borderRadius: '8px', cursor: 'pointer', 
          backgroundColor: isActive ? `${coreColor}25` : isHovered ? 'rgba(51, 65, 85, 0.4)' : 'transparent', 
          borderLeft: isActive ? `3px solid ${coreColor}` : '3px solid transparent' 
        }}
      >
        <span style={{ fontSize: '14px' }}>{module.icon}</span>
        <span style={{ fontSize: '12px', fontWeight: isActive ? 600 : 400, color: isActive ? coreColor : colors.text.secondary, flex: 1 }}>{module.label}</span>
        {module.badge && (
          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.08)', color: colors.text.muted }}>{module.badge}</span>
        )}
      </div>
    </Link>
  );
}

function CoreSection({ core, currentPath, isExpanded, onToggle }: { core: NavCore; currentPath: string; isExpanded: boolean; onToggle: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const hasActiveModule = core.modules.some(m => currentPath === m.href || (m.href !== '/' && currentPath.startsWith(m.href)));
  
  return (
    <div style={{ margin: '3px 6px', borderRadius: '10px', backgroundColor: isExpanded ? `${core.color}08` : 'transparent', border: `1px solid ${isExpanded ? `${core.color}25` : 'transparent'}` }}>
      <div 
        onClick={onToggle} 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)} 
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', cursor: 'pointer', 
          backgroundColor: isHovered ? `${core.color}15` : 'transparent', borderRadius: '8px' 
        }}
      >
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isExpanded || hasActiveModule ? core.gradient : 'rgba(51, 65, 85, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{core.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: isExpanded ? core.color : colors.text.secondary, textTransform: 'uppercase' }}>{core.title}</div>
        </div>
        <span style={{ fontSize: '9px', color: colors.text.muted, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>â–¼</span>
      </div>
      <div style={{ maxHeight: isExpanded ? '600px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        {core.modules.map((module) => (
          <NavItem key={module.id} module={module} coreColor={core.color} isActive={currentPath === module.href || (module.href !== '/' && currentPath.startsWith(module.href))} />
        ))}
      </div>
    </div>
  );
}

// Componente de navegaciÃ³n superior
function TopNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Generar breadcrumbs
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { href, label };
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      backgroundColor: 'rgba(26, 31, 46, 0.8)',
      borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      {/* Botones de navegaciÃ³n */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '8px',
            backgroundColor: 'rgba(51, 65, 85, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            color: '#94a3b8', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.3)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'; e.currentTarget.style.color = '#94a3b8'; }}
          title="Retroceder"
        >
          <ChevronLeft size={20} />
        </button>
        
        <button
          onClick={() => router.forward()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '8px',
            backgroundColor: 'rgba(51, 65, 85, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            color: '#94a3b8', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.3)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'; e.currentTarget.style.color = '#94a3b8'; }}
          title="Avanzar"
        >
          <ChevronRight size={20} />
        </button>
        
        <Link
          href="/"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '8px',
            backgroundColor: 'rgba(51, 65, 85, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            color: '#94a3b8', cursor: 'pointer',
            transition: 'all 0.2s ease',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.3)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'; e.currentTarget.style.color = '#94a3b8'; }}
          title="Ir al Home"
        >
          <Home size={20} />
        </Link>
      </div>

      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, marginLeft: '24px' }}>
        <Link href="/" style={{ color: '#00d4ff', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          Home
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <span style={{ color: '#64748b' }}>/</span>
            {index === breadcrumbs.length - 1 ? (
              <span style={{ color: '#f8fafc', fontSize: '14px', fontWeight: 600 }}>{crumb.label}</span>
            ) : (
              <Link href={crumb.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Indicador de ruta actual */}
      <div style={{ fontSize: '12px', color: '#64748b' }}>
        {pathname}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [expandedCores, setExpandedCores] = useState<string[]>(['system', 'workflows']);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const toggleCore = (coreId: string) => setExpandedCores(prev => prev.includes(coreId) ? prev.filter(id => id !== coreId) : [...prev, coreId]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Sidebar */}
      <aside style={{ 
        width: sidebarOpen ? 280 : 0, 
        backgroundColor: colors.bg.sidebar, 
        borderRight: `1px solid ${colors.border.subtle}`, 
        position: 'fixed', left: 0, top: 0, height: '100vh', 
        overflowY: 'auto', overflowX: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 14px', borderBottom: `1px solid ${colors.border.subtle}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>ðŸš€</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NADAKKI AI</div>
            <div style={{ fontSize: '8px', color: colors.text.muted }}>Enterprise Suite v4.0.1</div>
          </div>
        </div>
        
        {/* Stats */}
        <div style={{ padding: '8px 10px', margin: '10px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 800, color: colors.neon.purple }}><AgentCountDisplay /></div><div style={{ fontSize: '7px', color: colors.text.muted }}>AGENTES</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 800, color: colors.neon.green }}>20</div><div style={{ fontSize: '7px', color: colors.text.muted }}>CORES</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 800, color: colors.neon.blue }}>10</div><div style={{ fontSize: '7px', color: colors.text.muted }}>WORKFLOWS</div></div>
        </div>
        
        {/* Navigation */}
        <nav style={{ flex: 1, padding: '2px 0', overflowY: 'auto' }}>
          {navigationStructure.map((core) => (
            <CoreSection key={core.id} core={core} currentPath={pathname} isExpanded={expandedCores.includes(core.id)} onToggle={() => toggleCore(core.id)} />
          ))}
        </nav>
        
        {/* Footer */}
        <div style={{ padding: '10px', borderTop: `1px solid ${colors.border.subtle}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(51, 65, 85, 0.3)' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>ðŸ¦</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: '11px', fontWeight: 600, color: colors.text.primary }}>NADAKKI Demo</div><div style={{ fontSize: '8px', color: colors.text.muted }}>Pro Plan</div></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#26de81' }} />
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: sidebarOpen ? 280 : 0, minHeight: '100vh', transition: 'margin-left 0.3s ease' }}>
        <TopNavigation />
        <div style={{ minHeight: 'calc(100vh - 61px)' }}>
          {children}
        </div>
      </main>
      
      {/* Mobile menu toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '50px', height: '50px', borderRadius: '50%',
          backgroundColor: '#8B5CF6', border: 'none',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
          zIndex: 50,
        }}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}


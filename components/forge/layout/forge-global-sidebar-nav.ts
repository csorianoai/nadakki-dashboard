import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Banknote,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Cloud,
  Cog,
  Cpu,
  Database,
  FileText,
  FolderKanban,
  Gavel,
  GitBranch,
  Globe,
  Home,
  Key,
  Landmark,
  Layers,
  LayoutDashboard,
  LineChart,
  Link2,
  Megaphone,
  Palette,
  Scale,
  ScrollText,
  Settings,
  Shield,
  Users,
  Webhook,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import type { RoleInfo } from "@/lib/api/auth-v2";

export type NavBadge = "NEW" | "BETA" | "POPULAR";

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  badge?: NavBadge;
  icon?: LucideIcon;
  children?: NavItem[];
  /** Hidden unless the user has `platform_superadmin`. */
  superAdminOnly?: boolean;
};

export type NavSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  coreMatchers: string[];
  children: NavItem[];
};

type CoreNav = {
  id: string;
  coreMatchers: string[];
};

export function userCanAccessAdminNav(allRoles: { core_name: string; role_key: string }[]): boolean {
  return allRoles.some(
    (r) =>
      r.role_key === "tenant_admin" ||
      r.role_key === "platform_superadmin" ||
      (r.core_name === "platform" && r.role_key === "support_agent"),
  );
}

function hasCoreAccess(
  core: CoreNav,
  allRoles: { core_name: string }[],
  subscribed: string[] | undefined,
): boolean {
  const roleHit = allRoles.some((r) => core.coreMatchers.includes(r.core_name));
  if (roleHit) return true;

  const hasSubscriptionList = subscribed && subscribed.length > 0;
  const subHit = (subscribed ?? []).some((c) => core.coreMatchers.includes(c));
  if (!hasSubscriptionList) return true;
  return subHit;
}

export function isPlatformSuperAdmin(allRoles: { role_key: string }[]): boolean {
  return allRoles.some((r) => r.role_key === "platform_superadmin");
}

export function isHrefActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function filterNavItems(items: NavItem[], isSuperAdmin: boolean): NavItem[] {
  return items
    .filter((i) => !i.superAdminOnly || isSuperAdmin)
    .map((i) => ({
      ...i,
      children: i.children ? filterNavItems(i.children, isSuperAdmin) : undefined,
    }))
    .filter((i) => i.href || (i.children?.length ?? 0) > 0);
}

export function filterSectionsForUser(
  sections: NavSection[],
  allRoles: RoleInfo[],
  subscribed: string[] | undefined,
  showAdmin: boolean,
): NavSection[] {
  const isSuper = isPlatformSuperAdmin(allRoles);

  return sections
    .filter((sec) => {
      if (sec.id === "admin") return showAdmin;
      if (isSuper) return true;
      const synthetic: CoreNav = { id: sec.id, coreMatchers: sec.coreMatchers };
      return hasCoreAccess(synthetic, allRoles, subscribed);
    })
    .map((sec) => ({
      ...sec,
      children: filterNavItems(sec.children, isSuper),
    }));
}

export function collectExpandIdsForPath(sections: NavSection[], pathname: string | null): Set<string> {
  const need = new Set<string>();
  if (!pathname) return need;

  function walkItems(items: NavItem[], parentIds: string[]): boolean {
    let any = false;
    for (const item of items) {
      const selfHit = Boolean(item.href && isHrefActive(item.href, pathname));
      const childHit = item.children ? walkItems(item.children, [...parentIds, item.id]) : false;
      if (selfHit || childHit) {
        parentIds.forEach((id) => need.add(id));
        need.add(item.id);
        any = true;
      }
    }
    return any;
  }

  for (const sec of sections) {
    if (walkItems(sec.children, [sec.id])) {
      need.add(sec.id);
    }
  }
  return need;
}

/** Full navigation tree — filter with `filterSectionsForUser` at runtime. */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "credit-hub",
    label: "Credit Hub",
    icon: Landmark,
    coreMatchers: ["credit"],
    children: [
      { id: "credit-dashboard", label: "Panel", href: "/credit-hub", icon: LayoutDashboard },
      { id: "credit-bank", label: "Banca", href: "/credit-hub/bank", icon: Banknote },
      { id: "credit-dealer", label: "Dealer", href: "/credit-hub/dealer", icon: Building2 },
      {
        id: "credit-apps-group",
        label: "Solicitudes",
        icon: FolderKanban,
        children: [
          { id: "credit-bank-apps", label: "Banca — listado", href: "/credit-hub/bank/applications" },
          { id: "credit-dealer-apps", label: "Dealer — listado", href: "/credit-hub/dealer/applications" },
        ],
      },
      {
        id: "credit-new",
        label: "Nueva solicitud",
        href: "/credit-hub/dealer/applications/new",
        badge: "NEW",
        icon: Zap,
      },
      { id: "credit-preapproval", label: "Preaprobación", href: "/credit-hub/dealer/preapproval", icon: Activity },
      { id: "credit-analytics", label: "Analítica / reportes", href: "/credit-hub/bank/analytics", icon: BarChart3 },
      { id: "credit-compliance", label: "Cumplimiento", href: "/credit-hub/bank/compliance", icon: Shield },
      { id: "credit-audit-ch", label: "Auditoría (hub)", href: "/credit-hub/bank/audit", icon: ScrollText },
      {
        id: "credit-legacy-group",
        label: "Legacy / gateway",
        icon: Link2,
        children: [
          { id: "credit-legacy", label: "Crédito (legacy)", href: "/credit" },
          { id: "credit-legacy-new", label: "Nuevo (legacy)", href: "/credit/new" },
        ],
      },
      { id: "credit-decisioning", label: "Decisioning", href: "/decision", icon: Cpu },
      { id: "credit-components", label: "Componentes UI", href: "/credit-hub/components", icon: Layers },
      { id: "credit-preview", label: "Preview", href: "/credit-hub/preview", icon: Globe },
      { id: "credit-agents-legacy", label: "Agentes crédito", href: "/credit-agents", icon: Bot },
    ],
  },
  {
    id: "legal-hub",
    label: "Legal Hub",
    icon: Scale,
    coreMatchers: ["legal"],
    children: [
      { id: "legal-home", label: "Inicio", href: "/legal", icon: Home },
      { id: "legal-hub-entry", label: "Legal Hub", href: "/legal-hub", icon: LayoutDashboard },
      { id: "legal-cases", label: "Expedientes", href: "/legal/cases", icon: Briefcase },
      { id: "legal-cases-new", label: "Nuevo expediente", href: "/legal/cases/new", icon: FileText },
      { id: "legal-contracts", label: "Contratos", href: "/legal/contracts", icon: ScrollText },
      { id: "legal-research", label: "Investigación", href: "/legal/research", icon: LineChart },
      { id: "legal-audit", label: "Auditoría", href: "/legal/audit", icon: Gavel },
      { id: "legal-config", label: "Configuración", href: "/legal/config", icon: Cog },
      { id: "legal-strategies-hist", label: "Estrategias históricas", href: "/legal/strategies/historical", icon: GitBranch },
    ],
  },
  {
    id: "marketing-hub",
    label: "Marketing Hub",
    icon: Megaphone,
    coreMatchers: ["marketing"],
    children: [
      {
        id: "m-suite",
        label: "Suite",
        icon: LayoutDashboard,
        children: [
          { id: "m-root", label: "Overview", href: "/marketing" },
          { id: "m-hub-entry", label: "Marketing Hub", href: "/marketing-hub" },
          { id: "m-overview", label: "Panorama", href: "/marketing/overview" },
          { id: "m-command", label: "Command Center", href: "/marketing/command-center", badge: "POPULAR" },
          { id: "m-calendar", label: "Calendario", href: "/marketing/calendar" },
          { id: "m-onboarding", label: "Onboarding", href: "/marketing/onboarding" },
        ],
      },
      {
        id: "m-campaigns",
        label: "Campañas",
        icon: Megaphone,
        children: [
          { id: "m-campaigns-list", label: "Listado", href: "/marketing/campaigns" },
          { id: "m-campaigns-new", label: "Nueva campaña", href: "/marketing/campaigns/new" },
          { id: "m-campaigns-editor", label: "Editor", href: "/marketing/campaigns/editor" },
          { id: "m-ab", label: "A/B Testing", href: "/marketing/ab-testing" },
        ],
      },
      {
        id: "m-ads",
        label: "Publicidad",
        icon: Globe,
        children: [
          { id: "adv-google", label: "Google Ads", href: "/advertising/google-ads", badge: "POPULAR" },
          { id: "adv-meta", label: "Meta Ads", href: "/advertising/meta-ads" },
          { id: "adv-linkedin", label: "LinkedIn Ads", href: "/advertising/linkedin-ads" },
          { id: "adv-tiktok", label: "TikTok Ads", href: "/advertising/tiktok-ads" },
          { id: "adv-unified", label: "Unified", href: "/advertising/unified" },
          { id: "adv-landing", label: "Landing readiness", href: "/advertising/landing-readiness" },
          { id: "m-google-legacy", label: "Google (marketing)", href: "/marketing/google-ads" },
        ],
      },
      {
        id: "m-engagement",
        label: "Engagement",
        icon: Users,
        children: [
          { id: "m-journeys", label: "Customer Journeys", href: "/marketing/journeys" },
          { id: "m-journeys-new", label: "Nuevo journey", href: "/marketing/journeys/new" },
          { id: "m-email", label: "Email builder", href: "/marketing/email-builder" },
          { id: "m-wa", label: "WhatsApp", href: "/marketing/whatsapp" },
          { id: "m-social-conn", label: "Social connections", href: "/marketing/social-connections" },
          { id: "m-templates", label: "Plantillas IA", href: "/marketing/templates" },
          { id: "m-templates-create", label: "Nueva plantilla", href: "/marketing/templates/create", badge: "NEW" },
          { id: "m-booking", label: "Booking", href: "/marketing/booking" },
          { id: "m-content", label: "Contenido", href: "/marketing/content" },
          { id: "m-social", label: "Social", href: "/marketing/social" },
        ],
      },
      {
        id: "m-intel",
        label: "Inteligencia",
        icon: LineChart,
        children: [
          { id: "m-analytics", label: "Analytics", href: "/marketing/analytics" },
          { id: "m-attrib", label: "Atribución", href: "/marketing/attribution" },
          { id: "m-predict", label: "Predictive AI", href: "/marketing/predictive", badge: "BETA" },
          { id: "m-compete", label: "Competencia", href: "/marketing/competitive" },
          { id: "m-audience", label: "Audience builder", href: "/marketing/audience-builder" },
          { id: "m-segments", label: "Segmentos", href: "/marketing/segments" },
          { id: "m-leads", label: "Leads & scoring", href: "/marketing/leads" },
        ],
      },
      {
        id: "m-agents",
        label: "Agentes & automatización",
        icon: Bot,
        children: [
          { id: "m-agents-list", label: "Agentes marketing", href: "/marketing/agents" },
          { id: "m-autopilot", label: "Autopilot", href: "/autopilot", badge: "BETA" },
          { id: "m-ame", label: "AME (autónomo)", href: "/ame", badge: "NEW" },
          { id: "m-run", label: "Ejecutar", href: "/marketing/run" },
          { id: "m-integrations", label: "Integraciones", href: "/marketing/integrations" },
        ],
      },
    ],
  },
  {
    id: "sic-hub",
    label: "SIC (Cobros)",
    icon: Shield,
    coreMatchers: ["sic", "platform"],
    children: [
      { id: "sic-dash", label: "Dashboard", href: "/sic", icon: LayoutDashboard },
      { id: "sic-expedientes", label: "Expedientes", href: "/sic/expedientes", icon: FolderKanban },
      { id: "sic-bandeja", label: "Bandeja", href: "/sic/bandeja", icon: Briefcase },
      { id: "sic-nuevo", label: "Nuevo análisis", href: "/sic/nuevo-analisis", icon: Zap },
      { id: "sic-reportes", label: "Reportes", href: "/sic/reportes", icon: BarChart3 },
      { id: "sic-metricas", label: "Métricas", href: "/sic/metricas", icon: Activity },
      { id: "sic-portafolio", label: "Portafolio", href: "/sic/portafolio", icon: LineChart },
      { id: "sic-comite", label: "Comité", href: "/sic/comite", icon: Users },
      { id: "sic-sesiones", label: "Sesiones comité", href: "/sic/comite/sesiones", icon: ScrollText },
      { id: "sic-export", label: "Exportaciones", href: "/sic/exportaciones", icon: Database },
      { id: "sic-audit", label: "Auditoría", href: "/sic/auditoria", icon: Gavel },
      { id: "sic-audit-acceso", label: "Auditoría de acceso", href: "/sic/auditoria-acceso", icon: Key },
      { id: "sic-config", label: "Configuración", href: "/sic/configuracion", icon: Cog },
      { id: "sic-mt", label: "Multi-tenant config", href: "/sic/multitenant-config", icon: Webhook },
      { id: "sic-demo", label: "Modo demo", href: "/sic/demo", icon: Palette },
      { id: "sic-list", label: "Listado (legacy)", href: "/sic/list", icon: FileText },
      { id: "sic-upload", label: "Carga", href: "/sic/upload", icon: Cloud },
    ],
  },
  {
    id: "workflows",
    label: "Workflows",
    icon: Workflow,
    coreMatchers: ["marketing", "credit", "legal", "sic", "platform"],
    children: [
      { id: "wf-all", label: "Todos los workflows", href: "/workflows", icon: Workflow },
      { id: "wf-ab", label: "A/B Testing", href: "/workflows/ab-testing-experimentation" },
      { id: "wf-campaign-opt", label: "Campaign optimization", href: "/workflows/campaign-optimization" },
      { id: "wf-compete", label: "Competitive intelligence", href: "/workflows/competitive-intelligence-hub" },
      { id: "wf-content", label: "Content performance", href: "/workflows/content-performance-engine" },
      { id: "wf-acq", label: "Customer acquisition", href: "/workflows/customer-acquisition-intelligence" },
      { id: "wf-lifecycle", label: "Customer lifecycle", href: "/workflows/customer-lifecycle-revenue" },
      { id: "wf-email", label: "Email automation", href: "/workflows/email-automation-master" },
      { id: "wf-influencer", label: "Influencer partnership", href: "/workflows/influencer-partnership-engine" },
      { id: "wf-mca", label: "Multi-channel attribution", href: "/workflows/multi-channel-attribution" },
      { id: "wf-social", label: "Social media intelligence", href: "/workflows/social-media-intelligence" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: Settings,
    coreMatchers: [],
    children: [
      {
        id: "adm-platform",
        label: "Plataforma",
        icon: Building2,
        children: [
          { id: "adm-home", label: "Panel admin", href: "/admin" },
          { id: "adm-tenants", label: "Tenants", href: "/tenants" },
          { id: "adm-activation", label: "Activación", href: "/admin/activation" },
          { id: "adm-gates", label: "Gates / roles", href: "/admin/gates" },
          { id: "adm-billing", label: "Billing", href: "/admin/billing" },
          { id: "adm-flags", label: "Feature flags", href: "/feature-flags", superAdminOnly: true },
          { id: "adm-logs", label: "Audit logs", href: "/admin/logs" },
          { id: "adm-keys", label: "API keys", href: "/admin/api-keys", superAdminOnly: true },
          { id: "adm-usage", label: "Uso", href: "/admin/usage" },
          { id: "adm-whatsapp", label: "WhatsApp admin", href: "/admin/whatsapp" },
        ],
      },
      {
        id: "adm-settings",
        label: "Configuración",
        icon: Wrench,
        children: [
          { id: "adm-system", label: "Sistema", href: "/admin/system", superAdminOnly: true },
          { id: "adm-config", label: "Config", href: "/admin/config" },
          { id: "adm-branding", label: "Branding (admin)", href: "/admin/branding" },
          { id: "adm-db", label: "Base de datos", href: "/admin/db", superAdminOnly: true },
          { id: "adm-qa", label: "QA", href: "/admin/qa" },
          { id: "set-integrations", label: "Integraciones (cuenta)", href: "/settings/integrations" },
          { id: "set-notify", label: "Notificaciones", href: "/settings/notifications" },
          { id: "set-branding", label: "Branding (cuenta)", href: "/settings/branding" },
          { id: "set-ia", label: "IA (cuenta)", href: "/settings/ia" },
          { id: "set-home", label: "Ajustes", href: "/settings" },
        ],
      },
      {
        id: "adm-agents",
        label: "Agentes",
        icon: Bot,
        children: [
          { id: "adm-agents-all", label: "Todos (admin)", href: "/admin/agents" },
          { id: "adm-gads-agent", label: "Google Ads agent", href: "/admin/google-ads-agent" },
          { id: "adm-credit-agents", label: "Credit agents", href: "/credit-agents" },
          { id: "adm-mkt-agents", label: "Marketing agents", href: "/marketing/agents" },
          { id: "adm-readiness", label: "Readiness", href: "/admin/readiness" },
          { id: "adm-onboarding", label: "Onboarding", href: "/admin/onboarding" },
          { id: "adm-sales-scripts", label: "Sales scripts", href: "/admin/sales-scripts" },
        ],
      },
    ],
  },
];

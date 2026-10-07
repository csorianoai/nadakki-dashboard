import { ACCESS_UNVERIFIED_MESSAGE, isAccessUnverified } from "@/lib/access/reason-codes";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Banknote,
  BarChart3,
  BookOpen,
  BookOpenText,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  Cloud,
  Cog,
  Cpu,
  Database,
  FilePlus,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Gavel,
  GitBranch,
  Globe,
  Grid3x3,
  Home,
  Key,
  Landmark,
  Layers,
  LayoutDashboard,
  LineChart,
  Link2,
  ListTree,
  Megaphone,
  Palette,
  Scale,
  ScrollText,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Webhook,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import type { RoleInfo } from "@/lib/api/auth-v2";
import { isForgeMonetizacionEnabled } from "@/lib/env/feature-forge-monetizacion";
import { RUTA_V2_POR_RUTA_BANCO, aplicaPanelBancoV2 } from "@/lib/credit-hub/bank/panel-v2-por-defecto";
import { COCKPIT_CONSOLIDATION_FLAGS } from "@/lib/cockpit/finance-v3/flags";

export type NavBadge = "NEW" | "BETA" | "POPULAR";

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  badge?: NavBadge;
  icon?: LucideIcon;
  /** Visual group header inside large cores (render-only). */
  groupLabel?: string;
  children?: NavItem[];
  /** Hidden unless the user has `platform_superadmin`. */
  superAdminOnly?: boolean;
  /** Hidden unless matching env feature flag is ON (build-time NEXT_PUBLIC_*). */
  featureFlag?: "forge-monetizacion" | "cockpit-consolidation";
};

export type NavSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: NavBadge;
  coreMatchers: string[];
  children: NavItem[];
  /** v2: cores are always rendered in the sidebar. */
  alwaysVisible?: boolean;
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
  // Fail-closed, y el ROL NO abre el core.
  //
  // Dos ramas permisivas, no una. La primera, `if (!hasSubscriptionList) return
  // true`, concedia todos los hubs cuando `subscribed_cores` venia vacia; esta
  // documentada como "permissive" en SIDEBAR_NAV_MAP.md y es la que produjo el
  // hallazgo de cajamapaal: un usuario de caja viendo todos los cores. La
  // segunda, `if (roleHit) return true`, dejaba que un rol que nombra un core
  // pintara el hub aunque el tenant no lo tuviera suscrito. Quitar solo la
  // primera deja el frontend concediendo igual, por el otro camino.
  //
  // La unica autoridad es el entitlement del tenant: el core tiene que estar en
  // `subscribed_cores`. El rol restringe DENTRO de un core ya habilitado, no lo
  // habilita. Los administradores conservan su bypass explicito en
  // `userSeesAllForgeHubSections`, que `filterSectionsForUser` evalua ANTES de
  // llamar aqui, asi que no dependen de esta rama.
  //
  // `allRoles` se conserva en la firma porque los llamadores la pasan y porque
  // el rol volvera a usarse cuando filtre dentro del core; aqui no concede.
  void allRoles;
  return (subscribed ?? []).some((c) => core.coreMatchers.includes(c));
}

export { ACCESS_UNVERIFIED_MESSAGE, isAccessUnverified } from "@/lib/access/reason-codes";
/**
 * Claves con las que el sidebar PREGUNTA si el acceso se puede verificar.
 *
 * No deciden que hub se ve --eso sale de `subscribed_cores` y de nada mas--. Son
 * una sonda: se piden al batch para leer los `reason_code` de la RESPUESTA y
 * saber si el motor pudo evaluar. Deducirlo en el cliente seria adivinar.
 *
 * Las cinco existen en `MIGRATION_097_CAPABILITY_KEYS` (lib/dealer/core-status.ts)
 * y las cinco ya se usan en el repo, asi que no se inventa ninguna:
 *
 *   credit.applications.view    DEALER_CORE_STATUS_ROWS, fila Dealer-Bank
 *   legal.cases.view            DEALER_CORE_STATUS_ROWS, fila Legal
 *   marketing.social.publish    DEALER_CORE_STATUS_ROWS, fila Marketing
 *   accounting.invoices.view    DEALER_CORE_STATUS_ROWS, fila Contable
 *   autos.inventory.list        dealer-nav.ts, Inventario
 *
 * El catalogo 097 solo cubre cinco cores: autos, marketing, legal, credit y
 * accounting. Los hubs cuyos `coreMatchers` son `nauta`, `sic`, `platform`,
 * `projects` o `admin` NO tienen clave en el catalogo y por eso no entran en la
 * sonda. No se inventa una para ellos: la sonda no necesita cubrir todos los
 * cores --un solo `reason_code` basta para saber si el motor pudo evaluar-- y la
 * visibilidad de esos hubs no cambia.
 */
export const SUITE_ACCESS_PROBE_CAPABILITIES = [
  "credit.applications.view",
  "legal.cases.view",
  "marketing.social.publish",
  "accounting.invoices.view",
  "autos.inventory.list",
] as const;


export type EmptyCoreReason = "plan" | "role" | "unverified";

/**
 * Why a core has no visible sub-items after RBAC filtering.
 *
 * `accessReasonCode` gana a todo lo demas: si el acceso no se pudo verificar, no
 * se sabe si el core esta en el plan, asi que decir "no disponible en tu plan"
 * seria una afirmacion que nadie ha medido.
 */
export function getEmptyCoreReason(
  section: NavSection,
  allRoles: RoleInfo[],
  subscribed: string[] | undefined,
  showAdmin: boolean,
  accessReasonCode?: string | null,
): EmptyCoreReason {
  if (isAccessUnverified(accessReasonCode)) {
    return "unverified";
  }
  if (section.id === "admin") {
    return "role";
  }

  const subHit = (subscribed ?? []).some((c) => section.coreMatchers.includes(c));

  // Sin el core en `subscribed_cores` el motivo es el plan, tambien cuando la
  // lista viene vacia y tambien cuando el usuario tiene el rol del core: desde
  // que el rol ya no habilita, tener el rol y no la suscripcion sigue siendo un
  // problema de plan. Decir "no tienes permisos" mandaria al usuario a pedir un
  // rol que no arregla nada.
  if (!subHit) {
    return "plan";
  }
  return "role";
}

export function getEmptyCoreMessage(reason: EmptyCoreReason): string {
  if (reason === "unverified") {
    return `${ACCESS_UNVERIFIED_MESSAGE}. No es que no tengas el módulo: no se pudo comprobar. Reintentá o avisá a soporte.`;
  }
  if (reason === "plan") {
    return "Módulo no disponible en tu plan. Contacta a tu administrador para upgrade.";
  }
  return "No tienes permisos para acceder a este módulo. Contacta a tu administrador.";
}

/** Count leaf links in a nav subtree (for grouped rendering threshold). */
export function countNavLeaves(items: NavItem[]): number {
  let n = 0;
  for (const item of items) {
    if (item.href) n += 1;
    if (item.children) n += countNavLeaves(item.children);
  }
  return n;
}

export const LARGE_CORE_LEAF_THRESHOLD = 15;

export function isPlatformSuperAdmin(allRoles: { role_key: string }[]): boolean {
  return allRoles.some((r) => r.role_key === "platform_superadmin");
}

/**
 * Bypass hub visibility rules (subscriptions + matcher roles) so admins can navigate every Forge core.
 * Navigation only — API authorization remains on the backend.
 */
export function userSeesAllForgeHubSections(allRoles: RoleInfo[]): boolean {
  if (isPlatformSuperAdmin(allRoles)) return true;
  return allRoles.some((r) => r.role_key === "tenant_admin");
}

export function isHrefActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavItemFeatureEnabled(item: NavItem): boolean {
  if (item.featureFlag === "forge-monetizacion") {
    return isForgeMonetizacionEnabled();
  }
  if (item.featureFlag === "cockpit-consolidation") {
    return COCKPIT_CONSOLIDATION_FLAGS.COCKPIT_CONSOLIDATION_ENABLED;
  }
  return true;
}

function filterNavItems(items: NavItem[], isSuperAdmin: boolean): NavItem[] {
  return items
    .filter((i) => !i.superAdminOnly || isSuperAdmin)
    .filter((i) => isNavItemFeatureEnabled(i))
    .map((i) => ({
      ...i,
      children: i.children ? filterNavItems(i.children, isSuperAdmin) : undefined,
    }))
    .filter((i) => i.href || (i.children?.length ?? 0) > 0);
}

function filterNavItemsForCoreAccess(
  items: NavItem[],
  isSuperAdmin: boolean,
  allRoles: RoleInfo[],
  subscribed: string[] | undefined,
  coreMatchers: string[],
  seesAllHubs: boolean,
): NavItem[] {
  const synthetic: CoreNav = { id: "", coreMatchers };
  const coreAllowed =
    seesAllHubs || hasCoreAccess(synthetic, allRoles, subscribed);

  return items
    .filter((i) => !i.superAdminOnly || isSuperAdmin)
    .filter((i) => isNavItemFeatureEnabled(i))
    .map((i) => ({
      ...i,
      children: i.children
        ? filterNavItemsForCoreAccess(
            i.children,
            isSuperAdmin,
            allRoles,
            subscribed,
            coreMatchers,
            seesAllHubs,
          )
        : undefined,
    }))
    .filter((i) => {
      if (i.children && i.children.length > 0) return true;
      if (i.href) return coreAllowed;
      return false;
    });
}

/** Cambia los href del panel actual del banco por los de bank-v2; el resto queda igual. */
function aRutasBancoV2(items: NavItem[]): NavItem[] {
  return items.map((i) => ({
    ...i,
    href: i.href ? (RUTA_V2_POR_RUTA_BANCO[i.href] ?? i.href) : i.href,
    children: i.children ? aRutasBancoV2(i.children) : undefined,
  }));
}

/** v2: all cores always visible; sub-items filtered by role, subscription, and super-admin flags. */
export function filterSectionsForUser(
  sections: NavSection[],
  allRoles: RoleInfo[],
  subscribed: string[] | undefined,
  showAdmin: boolean,
): NavSection[] {
  const isSuper = isPlatformSuperAdmin(allRoles);
  const seesAllHubs = userSeesAllForgeHubSections(allRoles);
  const panelBancoV2 = aplicaPanelBancoV2(allRoles);

  return sections.map((sec) => {
    if (sec.id === "admin") {
      return {
        ...sec,
        children: showAdmin ? filterNavItems(sec.children, isSuper) : [],
      };
    }
    const children = filterNavItemsForCoreAccess(
      sec.children,
      isSuper,
      allRoles,
      subscribed,
      sec.coreMatchers,
      seesAllHubs,
    );
    // BANK-V2-DEFAULT: solo con el interruptor encendido y un usuario de banco
    // (nunca superadmin ni dealer) el menu del banco apunta a bank-v2.
    return {
      ...sec,
      children: sec.id === "credit-hub" && panelBancoV2 ? aRutasBancoV2(children) : children,
    };
  });
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
    id: "marketing-hub",
    label: "Marketing Hub",
    icon: Megaphone,
    coreMatchers: ["marketing"],
    alwaysVisible: true,
    children: [
      {
        id: "m-comando",
        groupLabel: "Comando",
        label: "Comando",
        icon: LayoutDashboard,
        children: [
          { id: "m-root", label: "Overview", href: "/marketing" },
          { id: "m-hub-entry", label: "Marketing Hub", href: "/marketing-hub" },
          { id: "m-overview", label: "Panorama", href: "/marketing/overview" },
          { id: "m-command", label: "Command Center", href: "/marketing/command-center", badge: "POPULAR" },
          { id: "m-run", label: "Run", href: "/marketing/run" },
          { id: "m-calendar", label: "Calendario", href: "/marketing/calendar" },
          { id: "m-onboarding", label: "Onboarding", href: "/marketing/onboarding" },
        ],
      },
      {
        id: "m-campaigns",
        groupLabel: "Campañas",
        label: "Campañas",
        icon: Megaphone,
        children: [
          { id: "m-campaigns-list", label: "Listado", href: "/marketing/campaigns" },
          { id: "m-campaigns-new", label: "Nueva campaña", href: "/marketing/campaigns/new" },
          { id: "m-campaigns-editor", label: "Editor", href: "/marketing/campaigns/editor" },
          { id: "m-campaigns-root", label: "Campañas (root)", href: "/campaigns" },
          { id: "m-campaigns-active", label: "Activas (root)", href: "/campaigns/active" },
          { id: "m-campaigns-autogen", label: "Autogen (root)", href: "/campaigns/autogen" },
          { id: "m-campaigns-history", label: "Historial (root)", href: "/campaigns/history" },
          { id: "m-campaigns-new-root", label: "Nueva (root)", href: "/campaigns/new" },
        ],
      },
      {
        id: "m-contenido",
        groupLabel: "Contenido",
        label: "Contenido",
        icon: FileText,
        children: [
          { id: "m-templates", label: "Plantillas IA", href: "/marketing/templates" },
          { id: "m-templates-create", label: "Nueva plantilla", href: "/marketing/templates/create", badge: "NEW" },
          { id: "m-email", label: "Email builder", href: "/marketing/email-builder" },
          { id: "m-content", label: "Contenido", href: "/marketing/content" },
          { id: "m-content-root", label: "Content hub", href: "/content" },
          { id: "m-content-cal", label: "Content calendar", href: "/content/calendar" },
          { id: "m-content-studio", label: "Content studio", href: "/content/studio" },
          { id: "m-library", label: "Library", href: "/library" },
          { id: "m-library-assets", label: "Library assets", href: "/library/assets" },
          { id: "m-library-prompts", label: "Library prompts", href: "/library/prompts" },
        ],
      },
      {
        id: "m-audiencias",
        groupLabel: "Audiencias y Leads",
        label: "Audiencias y Leads",
        icon: Users,
        children: [
          { id: "m-audience", label: "Audience builder", href: "/marketing/audience-builder" },
          { id: "m-segments", label: "Segmentos", href: "/marketing/segments" },
          { id: "m-leads", label: "Leads & scoring", href: "/marketing/leads" },
          { id: "m-segments-root", label: "Segmentos (root)", href: "/segments" },
          { id: "m-segments-builder", label: "Segment builder", href: "/segments/builder" },
          { id: "m-segments-insights", label: "Segment insights", href: "/segments/insights" },
          { id: "m-leads-root", label: "Leads (root)", href: "/leads" },
          { id: "m-leads-pipeline", label: "Leads pipeline", href: "/leads/pipeline" },
          { id: "m-leads-scoring", label: "Leads scoring", href: "/leads/scoring" },
          { id: "m-audiences", label: "Audiences", href: "/audiences" },
          { id: "m-audiences-mgr", label: "Audience manager", href: "/audiences/manager" },
        ],
      },
      {
        id: "m-canales",
        groupLabel: "Canales",
        label: "Canales",
        icon: Globe,
        children: [
          { id: "m-journeys", label: "Customer Journeys", href: "/marketing/journeys" },
          { id: "m-journeys-new", label: "Nuevo journey", href: "/marketing/journeys/new" },
          { id: "m-wa", label: "WhatsApp", href: "/marketing/whatsapp" },
          { id: "m-social-conn", label: "Social connections", href: "/marketing/social-connections" },
          { id: "m-social", label: "Social", href: "/marketing/social" },
          { id: "m-social-root", label: "Social hub", href: "/social" },
          { id: "m-social-analytics", label: "Social analytics", href: "/social/analytics" },
          { id: "m-social-inbox", label: "Social inbox", href: "/social/inbox" },
          { id: "m-email-root", label: "Email (root)", href: "/email" },
          { id: "m-email-campaigns", label: "Email campañas", href: "/email/campaigns" },
          { id: "m-email-templates", label: "Email plantillas", href: "/email/templates" },
          { id: "m-booking", label: "Booking", href: "/marketing/booking" },
        ],
      },
      {
        id: "m-analytics-group",
        groupLabel: "Analytics",
        label: "Analytics",
        icon: LineChart,
        children: [
          { id: "m-analytics", label: "Analytics", href: "/marketing/analytics" },
          { id: "m-attrib", label: "Atribución", href: "/marketing/attribution" },
          { id: "m-predict", label: "Predictive AI", href: "/marketing/predictive", badge: "BETA" },
          { id: "m-compete", label: "Competencia", href: "/marketing/competitive" },
          { id: "m-ab", label: "A/B Testing", href: "/marketing/ab-testing" },
          { id: "m-analytics-root", label: "Analytics (global)", href: "/analytics" },
          { id: "m-analytics-agents", label: "Analytics agentes", href: "/analytics/agents" },
          { id: "m-analytics-campaigns", label: "Analytics campañas", href: "/analytics/campaigns" },
          { id: "m-analytics-conversions", label: "Analytics conversiones", href: "/analytics/conversions" },
          { id: "m-analytics-reports", label: "Analytics reportes", href: "/analytics/reports" },
          { id: "m-analytics-roi", label: "Analytics ROI", href: "/analytics/roi" },
          { id: "m-intelligence", label: "Intelligence", href: "/intelligence" },
          { id: "m-intelligence-brand", label: "Brand intelligence", href: "/intelligence/brand" },
          { id: "m-intelligence-comp", label: "Competitors", href: "/intelligence/competitors" },
          { id: "m-competitor", label: "Competitor research", href: "/competitor-research" },
        ],
      },
      {
        id: "m-automation",
        groupLabel: "Automatización",
        label: "Automatización",
        icon: Bot,
        children: [
          { id: "m-agents-list", label: "Agentes marketing", href: "/marketing/agents" },
          { id: "m-autopilot", label: "Autopilot", href: "/autopilot", badge: "BETA" },
          { id: "m-ame", label: "AME (autónomo)", href: "/ame", badge: "NEW" },
          { id: "m-integrations", label: "Integraciones", href: "/marketing/integrations" },
          { id: "m-automations", label: "Automations", href: "/automations" },
          { id: "m-automations-rules", label: "Automation rules", href: "/automations/rules" },
          { id: "m-orchestration", label: "Orchestration", href: "/orchestration" },
          { id: "m-scheduler", label: "Scheduler", href: "/scheduler" },
          { id: "m-scheduler-jobs", label: "Scheduler jobs", href: "/scheduler/jobs" },
          { id: "m-scheduler-new", label: "Nuevo job", href: "/scheduler/new-job" },
        ],
      },
      {
        id: "m-workflows",
        groupLabel: "Workflows",
        label: "Workflows",
        icon: Workflow,
        children: [
          { id: "wf-all", label: "Todos los workflows", href: "/workflows" },
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
    ],
  },
  {
    id: "credit-hub",
    label: "Credit Hub",
    icon: Landmark,
    coreMatchers: ["credit"],
    alwaysVisible: true,
    children: [
      {
        id: "credit-acceso",
        groupLabel: "Acceso",
        label: "Acceso",
        icon: LayoutDashboard,
        children: [
          { id: "credit-bank", label: "Mesa de decisiones", href: "/credit-hub/bank" },
          { id: "credit-dealer", label: "Dealer", href: "/credit-hub/dealer" },
          {
            id: "credit-new",
            label: "Nueva solicitud",
            href: "/credit-hub/dealer/applications/new?new=1",
            badge: "NEW",
          },
          { id: "credit-preapproval", label: "Preaprobación", href: "/credit-hub/dealer/preapproval" },
        ],
      },
      {
        id: "credit-apps-group",
        groupLabel: "Solicitudes",
        label: "Solicitudes",
        icon: FolderKanban,
        children: [
          { id: "credit-bank-apps", label: "Bandeja", href: "/credit-hub/bank/applications" },
          { id: "credit-dealer-apps", label: "Dealer — listado", href: "/credit-hub/dealer/applications" },
        ],
      },
      {
        id: "credit-config-group",
        groupLabel: "Configuración",
        label: "Configuración",
        icon: Cog,
        children: [
          {
            id: "credit-pool-filters",
            label: "Filtros de pool",
            href: "/credit/pool-filters",
          },
        ],
      },
      {
        id: "credit-analytics-group",
        groupLabel: "Analítica y cumplimiento",
        label: "Analítica y cumplimiento",
        icon: BarChart3,
        children: [
          { id: "credit-bank-kpis", label: "KPIs de banco", href: "/credit/bank/kpis" },
          { id: "credit-vehicle-anomalies", label: "Historial de vehículos", href: "/credit-hub/bank/vehicles" },
          { id: "credit-analytics", label: "Analítica / reportes", href: "/credit-hub/bank/analytics" },
          { id: "credit-compliance", label: "Cumplimiento", href: "/credit-hub/bank/compliance" },
          { id: "credit-audit-ch", label: "Auditoría (hub)", href: "/credit-hub/bank/audit" },
          { id: "credit-compliance-root", label: "Compliance (root)", href: "/compliance" },
        ],
      },
      {
        id: "credit-monetizacion-group",
        groupLabel: "Monetización",
        label: "Monetización",
        icon: Banknote,
        children: [
          {
            id: "credit-monetizacion",
            label: "Métricas y facturación",
            href: "/credit-hub/monetizacion/dashboard",
            badge: "BETA",
            featureFlag: "forge-monetizacion",
          },
        ],
      },
      {
        id: "credit-legacy-group",
        groupLabel: "Legacy y herramientas",
        label: "Legacy y herramientas",
        icon: Link2,
        children: [
          { id: "credit-legacy", label: "Crédito (legacy)", href: "/credit" },
          { id: "credit-legacy-new", label: "Nuevo (legacy)", href: "/credit/new" },
          { id: "credit-decisioning", label: "Decisioning", href: "/decision" },
          { id: "credit-components", label: "Componentes UI", href: "/credit-hub/components" },
          { id: "credit-preview", label: "Preview", href: "/credit-hub/preview" },
          { id: "credit-agents-legacy", label: "Agentes crédito", href: "/credit-agents" },
        ],
      },
    ],
  },
  {
    id: "market-intel-hub",
    label: "Inteligencia de Mercado",
    icon: TrendingUp,
    badge: "BETA",
    coreMatchers: ["credit"],
    alwaysVisible: true,
    children: [
      {
        id: "market-intel-investigations",
        label: "Investigaciones",
        href: "/market-intel",
        icon: Search,
      },
    ],
  },
  {
    id: "legal-hub",
    label: "Legal Hub",
    icon: Scale,
    coreMatchers: ["legal"],
    alwaysVisible: true,
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
      { id: "legal-onboarding", label: "Onboarding", href: "/legal/onboarding", icon: Zap },
    ],
  },
  {
    id: "nauta-hub",
    label: "Nauta — Empleados Digitales",
    icon: Bot,
    coreMatchers: ["nauta"],
    alwaysVisible: true,
    children: [
      { id: "nauta-cockpit", label: "Piso de operaciones", href: "/nauta", icon: LayoutDashboard },
      { id: "nauta-planes", label: "Nómina y planes", href: "/nauta?mode=planes", icon: LayoutDashboard },
    ],
  },
  {
    id: "sic-hub",
    label: "SIC Hub",
    icon: FileSpreadsheet,
    coreMatchers: ["sic", "platform"],
    alwaysVisible: true,
    children: [
      {
        id: "sic-ops-group",
        groupLabel: "Operación",
        label: "Operación",
        icon: Briefcase,
        children: [
          { id: "sic-dash", label: "Dashboard", href: "/sic" },
          { id: "sic-expedientes", label: "Expedientes", href: "/sic/expedientes" },
          { id: "sic-bandeja", label: "Bandeja", href: "/sic/bandeja" },
          { id: "sic-nuevo", label: "Nuevo análisis", href: "/sic/nuevo-analisis" },
          { id: "sic-upload", label: "Carga", href: "/sic/upload" },
          { id: "sic-list", label: "Listado (legacy)", href: "/sic/list" },
        ],
      },
      {
        id: "sic-reportes-group",
        groupLabel: "Reportes",
        label: "Reportes",
        icon: BarChart3,
        children: [
          { id: "sic-reportes", label: "Reportes", href: "/sic/reportes" },
          { id: "sic-metricas", label: "Métricas", href: "/sic/metricas" },
          { id: "sic-portafolio", label: "Portafolio", href: "/sic/portafolio" },
          { id: "sic-export", label: "Exportaciones", href: "/sic/exportaciones" },
        ],
      },
      {
        id: "sic-comite-group",
        groupLabel: "Comité",
        label: "Comité",
        icon: Users,
        children: [
          { id: "sic-comite", label: "Comité", href: "/sic/comite" },
          { id: "sic-sesiones", label: "Sesiones comité", href: "/sic/comite/sesiones" },
        ],
      },
      {
        id: "sic-sistema-group",
        groupLabel: "Sistema",
        label: "Sistema",
        icon: Cog,
        children: [
          { id: "sic-audit", label: "Auditoría", href: "/sic/auditoria" },
          { id: "sic-audit-acceso", label: "Auditoría de acceso", href: "/sic/auditoria-acceso" },
          { id: "sic-config", label: "Configuración", href: "/sic/configuracion" },
          { id: "sic-mt", label: "Multi-tenant config", href: "/sic/multitenant-config" },
          { id: "sic-demo", label: "Modo demo", href: "/sic/demo" },
        ],
      },
    ],
  },
  {
    id: "projects-hub",
    label: "Proyectos",
    icon: Building2,
    coreMatchers: ["projects"],
    alwaysVisible: true,
    children: [
      { id: "projects-dash", label: "Panel", href: "/proyectos", icon: LayoutDashboard },
      { id: "projects-portfolio", label: "Portafolio", href: "/proyectos/portafolio", icon: FolderKanban },
      {
        id: "projects-dashboards-group",
        label: "Dashboards",
        icon: BarChart3,
        children: [
          { id: "projects-dash-ceo", label: "CEO", href: "/proyectos/dashboards/ceo" },
          { id: "projects-dash-pm", label: "PM", href: "/proyectos/dashboards/pm" },
          { id: "projects-dash-inv", label: "Inversionista", href: "/proyectos/dashboards/inversionista" },
        ],
      },
      { id: "projects-new", label: "Nuevo proyecto", href: "/proyectos/new", icon: Zap },
    ],
  },
  {
    id: "contable-hub",
    label: "Contabilidad",
    icon: BookOpen,
    badge: "NEW" as const,
    coreMatchers: ["platform", "projects"],
    alwaysVisible: true,
    children: [
      {
        id: "contable-overview-group",
        groupLabel: "General",
        label: "General",
        icon: LayoutDashboard,
        children: [
          { id: "contable-resumen", label: "Resumen", href: "/contable/resumen", icon: LayoutDashboard },
          { id: "contable-plan", label: "Plan de Cuentas", href: "/contable/plan-cuentas", icon: ListTree },
          { id: "contable-periodos", label: "Períodos", href: "/contable/periodos", icon: Calendar },
        ],
      },
      {
        id: "contable-operacion-group",
        groupLabel: "Operación",
        label: "Operación",
        icon: FilePlus,
        children: [
          { id: "contable-asiento", label: "Nuevo Asiento", href: "/contable/asientos/nuevo", icon: FilePlus, badge: "NEW" as const },
          { id: "contable-mayor", label: "Libro Mayor", href: "/contable/libro-mayor", icon: BookOpenText },
          { id: "contable-balance", label: "Balance Comprobación", href: "/contable/balance-comprobacion", icon: Scale },
        ],
      },
      {
        id: "contable-reportes-group",
        groupLabel: "Reportes Financieros",
        label: "Reportes Financieros",
        icon: BarChart3,
        children: [
          { id: "contable-estado-resultados", label: "Estado de Resultados", href: "/contable/estado-resultados", icon: TrendingUp },
          { id: "contable-situacion", label: "Situación Financiera", href: "/contable/situacion-financiera", icon: Layers },
          { id: "contable-monitor", label: "Monitor de Gastos", href: "/contable/monitor-gastos", icon: Activity },
          { id: "contable-ejecutivo", label: "Dashboard Ejecutivo", href: "/contable/ejecutivo", icon: LineChart, badge: "NEW" as const },
        ],
      },
      {
        id: "contable-ia-group",
        groupLabel: "Inteligencia Artificial",
        label: "Inteligencia Artificial",
        icon: Sparkles,
        children: [
          { id: "contable-agente-ia", label: "Consultor IA", href: "/contable/agente-ia", icon: Sparkles },
        ],
      },
    ],
  },
  {
    id: "ai-studio-hub",
    label: "AI Studio",
    icon: Sparkles,
    coreMatchers: ["marketing", "platform"],
    alwaysVisible: true,
    children: [
      { id: "ai-home", label: "Inicio", href: "/ai-studio", icon: LayoutDashboard },
      { id: "ai-agents", label: "Agentes", href: "/ai-studio/agents", icon: Bot },
      { id: "ai-generate", label: "Generar", href: "/ai-studio/generate", icon: Zap },
      { id: "ai-history", label: "Historial", href: "/ai-studio/history", icon: ScrollText },
      { id: "ai-templates", label: "Plantillas", href: "/ai-studio/templates", icon: FileText },
      { id: "ai-settings", label: "Configuración", href: "/ai-studio/settings", icon: Cog },
      { id: "ai-agents-global", label: "Agentes (global)", href: "/agents", icon: Bot },
      { id: "ai-execute", label: "Ejecutar", href: "/agents/execute", icon: Zap },
      { id: "ai-live", label: "Live", href: "/agents/live", icon: Activity },
      { id: "ai-execute-root", label: "Execute (root)", href: "/execute", icon: Cpu },
    ],
  },
  {
    id: "advertising-hub",
    label: "Advertising Hub",
    icon: Target,
    coreMatchers: ["marketing"],
    alwaysVisible: true,
    children: [
      { id: "adv-home", label: "Resumen", href: "/advertising", icon: LayoutDashboard },
      { id: "adv-google", label: "Google Ads", href: "/advertising/google-ads", badge: "POPULAR" },
      { id: "adv-google-flow", label: "Google Ads Flow", href: "/advertising/google-ads/flow" },
      { id: "adv-meta", label: "Meta Ads", href: "/advertising/meta-ads" },
      { id: "adv-linkedin", label: "LinkedIn Ads", href: "/advertising/linkedin-ads" },
      { id: "adv-tiktok", label: "TikTok Ads", href: "/advertising/tiktok-ads" },
      { id: "adv-unified", label: "Unified", href: "/advertising/unified" },
      { id: "adv-landing", label: "Landing readiness", href: "/advertising/landing-readiness" },
      { id: "adv-google-legacy", label: "Google (marketing)", href: "/marketing/google-ads" },
    ],
  },
  {
    id: "governance-hub",
    label: "Governance",
    icon: ShieldCheck,
    coreMatchers: ["admin", "platform"],
    alwaysVisible: false,
    children: [
      {
        id: "governance-system-health",
        label: "System Health",
        href: "/admin/governance",
        icon: Activity,
        superAdminOnly: true,
      },
    ],
  },
  {
    id: "admin",
    label: "Administración",
    icon: Settings,
    coreMatchers: [],
    alwaysVisible: true,
    children: [
      {
        id: "adm-platform",
        groupLabel: "Plataforma",
        label: "Plataforma",
        icon: Building2,
        children: [
          { id: "adm-home", label: "Panel admin", href: "/admin" },
          {
            id: "adm-network-cockpit",
            label: "Network Cockpit",
            href: "/cockpit",
            icon: Grid3x3,
            superAdminOnly: true,
            featureFlag: "cockpit-consolidation",
          },
          { id: "adm-dashboard", label: "Dashboard", href: "/dashboard" },
          { id: "adm-activation", label: "Activación", href: "/admin/activation" },
          { id: "adm-gates", label: "Gates / roles", href: "/admin/gates" },
          { id: "adm-billing", label: "Billing", href: "/admin/billing" },
          { id: "adm-billing-root", label: "Billing (root)", href: "/billing" },
          { id: "adm-flags", label: "Feature flags", href: "/feature-flags", superAdminOnly: true },
          { id: "adm-logs", label: "Audit logs", href: "/admin/logs" },
          { id: "adm-audit", label: "Auditoría", href: "/admin/audit" },
          { id: "adm-keys", label: "API keys", href: "/admin/api-keys", superAdminOnly: true },
          { id: "adm-usage", label: "Uso", href: "/admin/usage" },
          { id: "adm-whatsapp", label: "WhatsApp admin", href: "/admin/whatsapp" },
          { id: "adm-obs-dash", label: "Observability", href: "/admin/observability/dashboard" },
          { id: "adm-obs-audit", label: "Audit trail", href: "/admin/observability/audit-trail" },
          { id: "adm-obs-sla", label: "SLA monitoring", href: "/admin/observability/sla-monitoring" },
        ],
      },
      {
        id: "adm-settings",
        groupLabel: "Configuración",
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
        groupLabel: "Agentes",
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

/** Alias for v2 documentation — same tree as {@link NAV_SECTIONS}. */
export const NAV_CORES = NAV_SECTIONS;
